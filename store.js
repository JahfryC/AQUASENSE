// store.js — persistencia de datos del usuario.
// Capa 1: localStorage (siempre activa — los datos sobreviven al recargar y
//         cerrar el navegador, por dispositivo).
// Capa 2: nube vía window.CLOUD (Firebase) cuando está configurada — los
//         mismos datos se sincronizan entre dispositivos con tu cuenta Google.
window.AquaStore = (() => {
  const KEY = "aqua:userdata:v1";
  const A = window.AQUA;

  let ud = {
    ownerUid: null,            // uid del dueño de estos datos (null = local/invitado)
    activeTankId: "tank-001",  // selected tank
    tankConfig: null,          // ajustes del tanque por defecto (nombre, tipo, volumen…)
    readings: null,            // snapshot de HISTORY
    params: null,              // snapshot de CURRENT_PARAMETERS (valor/estado/tendencia/nota)
    dismissedAlerts: [],
    customAlerts: [],          // creadas por el usuario vía Aqua Buddy
    routinesDone: {},
    customRoutines: [],
    customInhabitants: [],     // [{ kind, item }]
    inhabitantUpdates: {},     // { id: { status, note, care } }
    inhabitantLogs: {},        // { id: [{ ts, note, status, photo }] } — seguimiento
    removedInhabitants: [],    // ids of seed inhabitants the user deleted
    customTanks: [],           // tanks added by the user
    supplements: [],           // [{ id, name, category, schedule, amount, unit, note }]
    lightingWeek: null,
    lightFixture: null,        // { name, brand, wattage, type }
    photos: {},                // { slotId: dataURL }
    updatedAt: 0,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") ud = Object.assign(ud, saved);
  } catch (e) { /* datos corruptos → empezar limpio */ }

  // ---- hidratación síncrona de AQUA antes del primer render ----
  if (ud.readings) Object.keys(ud.readings).forEach((k) => { if (A.HISTORY[k]) A.HISTORY[k] = ud.readings[k]; });
  if (ud.params) Object.keys(ud.params).forEach((k) => { if (A.CURRENT_PARAMETERS[k]) Object.assign(A.CURRENT_PARAMETERS[k], ud.params[k]); });
  (ud.customRoutines || []).forEach((r) => A.ROUTINES.push(r));
  (ud.customInhabitants || []).forEach(({ kind, item }) => { (A.INHABITANTS[kind] || A.INHABITANTS.fish).push(item); });
  (ud.customTanks || []).forEach((t) => { if (!A.ALL_TANKS.find((x) => x.id === t.id)) A.ALL_TANKS.push(t); });
  // Restore the default tank's own settings (name/type/volume/brand typed during
  // onboarding). Without this they revert to the seed placeholder on every reload.
  if (ud.tankConfig) {
    Object.assign(A.TANK_CONFIG, ud.tankConfig);
    const seed = A.ALL_TANKS.find((t) => t.id === "tank-001");
    if (seed) Object.assign(seed, ud.tankConfig);
  }
  // Restore the active tank into TANK_CONFIG on load — otherwise a reload
  // reverts the dashboard/hero to the default "Mi Acuario" placeholder
  if (ud.activeTankId && ud.activeTankId !== "tank-001") {
    const activeT = A.ALL_TANKS.find((t) => t.id === ud.activeTankId);
    if (activeT) Object.assign(A.TANK_CONFIG, activeT);
  }
  Object.entries(ud.inhabitantUpdates || {}).forEach(([id, patch]) => {
    for (const kind of ["fish", "corals", "cuc"]) {
      const it = A.INHABITANTS[kind].find((x) => x.id === id);
      if (it) Object.assign(it, patch);
    }
  });
  // Remove any seed inhabitants the user deleted
  (ud.removedInhabitants || []).forEach((id) => {
    for (const kind of ["fish", "corals", "cuc"]) {
      const i = A.INHABITANTS[kind].findIndex((x) => x.id === id);
      if (i >= 0) A.INHABITANTS[kind].splice(i, 1);
    }
  });

  // Load user's own AI key — no shared/fallback key to avoid rate-limit confusion
  (function () {
    const storedKey = localStorage.getItem("aqua:ai_key");
    window.AQUAMIND_AI_KEY = storedKey || null;
  })();

  const TT = (es, en) => (window.T || ((a) => a))(es, en);

  // Escribe en localStorage. Si la cuota está llena, va liberando espacio
  // (fotos antiguas del seguimiento primero) en vez de dejar de guardar TODO
  // en silencio, que era el comportamiento anterior.
  function writeLocal() {
    try {
      localStorage.setItem(KEY, JSON.stringify(ud));
      return true;
    } catch (e) {
      let freed = 0;
      // 1) soltar fotos de entradas de seguimiento, de la más antigua a la más nueva
      const logIds = Object.keys(ud.inhabitantLogs || {});
      const withPhotos = [];
      logIds.forEach((id) => (ud.inhabitantLogs[id] || []).forEach((l) => { if (l.photo) withPhotos.push(l); }));
      withPhotos.sort((a, b) => a.ts - b.ts);
      for (const entry of withPhotos) {
        delete entry.photo;
        freed++;
        try { localStorage.setItem(KEY, JSON.stringify(ud)); }
        catch (_) { continue; }
        window.toast?.(
          TT(`Almacenamiento lleno — liberé ${freed} foto(s) antigua(s) del seguimiento para poder guardar`,
             `Storage full — freed ${freed} old tracking photo(s) so your data could be saved`),
          { tone: "warn", icon: "AlertTriangle" }
        );
        return true;
      }
      // 2) nada más que soltar: avisar de verdad y marcar el estado
      ud._storageFull = true;
      window.toast?.(
        TT("No se pudo guardar: almacenamiento lleno. Borra fotos de habitantes para liberar espacio.",
           "Couldn't save: storage is full. Delete inhabitant photos to free space."),
        { tone: "warn", icon: "AlertTriangle", duration: 8000 }
      );
      return false;
    }
  }

  let saveTimer = null;
  function persist() {
    ud.updatedAt = Date.now();
    ud.readings = A.HISTORY;
    ud.params = {};
    Object.keys(A.CURRENT_PARAMETERS).forEach((k) => {
      const p = A.CURRENT_PARAMETERS[k];
      ud.params[k] = { value: p.value, status: p.status, trend: p.trend, note: p.note };
    });
    // Guardar los ajustes propios del tanque por defecto (los que se escriben
    // en el onboarding). Sin esto se perdían en cada recarga.
    if ((ud.activeTankId || "tank-001") === "tank-001") {
      const c = A.TANK_CONFIG;
      ud.tankConfig = {
        name: c.name, type: c.type, displayVolume: c.displayVolume,
        realVolume: c.realVolume, brand: c.brand, filtration: c.filtration,
        dims: c.dims, setupDate: c.setupDate, owner: c.owner,
      };
      // TANK_CONFIG ya no es el mismo objeto que ALL_TANKS[0]: mantener el
      // tanque de la lista al día para que el selector muestre el nombre real.
      const seed = (A.ALL_TANKS || []).find((t) => t.id === "tank-001");
      if (seed) Object.assign(seed, ud.tankConfig);
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 250);
  }
  // Escritura inmediata — usada por persist (con debounce) y al cerrar la app
  function flush() {
    clearTimeout(saveTimer);
    saveTimer = null;
    writeLocal();
    window.CLOUD?.push(ud);
  }
  function touch() {
    persist();
    window.dispatchEvent(new Event("aqua:data"));
  }

  // No perder los últimos 250 ms de cambios al cerrar pestaña o mandar la app
  // a segundo plano (crítico en iOS, donde 'unload' no es fiable).
  window.addEventListener("pagehide", () => { if (saveTimer) flush(); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && saveTimer) flush();
  });

  const SEV_RANK = { danger: 0, warn: 1, info: 2 };

  return {
    get ud() { return ud; },
    persist,
    flush,
    touch,

    // ---- alertas ----
    activeAlerts() {
      const base = A.ALERTS.filter((a) => !ud.dismissedAlerts.includes(a.id));
      return [...ud.customAlerts, ...base].sort((a, b) => (SEV_RANK[a.severity] ?? 3) - (SEV_RANK[b.severity] ?? 3));
    },
    dismissAlert(id) {
      if (ud.customAlerts.some((a) => a.id === id)) ud.customAlerts = ud.customAlerts.filter((a) => a.id !== id);
      else if (!ud.dismissedAlerts.includes(id)) ud.dismissedAlerts.push(id);
      touch();
    },
    addAlert(a) { ud.customAlerts.unshift(a); touch(); },

    // ---- rutinas ----
    toggleRoutine(id) { ud.routinesDone[id] = !ud.routinesDone[id]; touch(); return ud.routinesDone[id]; },
    addRoutine(r) { A.ROUTINES.push(r); ud.customRoutines.push(r); touch(); },

    // ---- habitantes ----
    addInhabitant(kind, item) {
      (A.INHABITANTS[kind] || A.INHABITANTS.fish).push(item);
      ud.customInhabitants.push({ kind, item });
      touch();
    },
    updateInhabitant(id, patch) {
      for (const kind of ["fish", "corals", "cuc"]) {
        const it = A.INHABITANTS[kind].find((x) => x.id === id);
        if (it) {
          Object.assign(it, patch);
          ud.inhabitantUpdates[id] = Object.assign(ud.inhabitantUpdates[id] || {}, patch);
          touch();
          return it;
        }
      }
      return null;
    },
    removeInhabitant(id) {
      let kindFound = null;
      for (const kind of ["fish", "corals", "cuc"]) {
        const i = A.INHABITANTS[kind].findIndex((x) => x.id === id);
        if (i >= 0) { A.INHABITANTS[kind].splice(i, 1); kindFound = kind; }
      }
      // Drop from user-added list; if it was a seed, remember the deletion
      const wasCustom = (ud.customInhabitants || []).some(({ item }) => item.id === id);
      ud.customInhabitants = (ud.customInhabitants || []).filter(({ item }) => item.id !== id);
      if (!wasCustom && kindFound) ud.removedInhabitants = [...(ud.removedInhabitants || []), id];
      // Clean related state
      if (ud.inhabitantUpdates) delete ud.inhabitantUpdates[id];
      if (ud.inhabitantLogs) delete ud.inhabitantLogs[id];
      if (ud.photos) { delete ud.photos[id]; delete ud.photos[`photo-${id}`]; }
      touch();
      return kindFound;
    },
    // ---- seguimiento (per-inhabitant timeline) ----
    getInhabitantLogs(id) {
      return (ud.inhabitantLogs && ud.inhabitantLogs[id]) || [];
    },
    addInhabitantLog(id, entry) {
      const log = { ts: Date.now(), ...entry };
      ud.inhabitantLogs = ud.inhabitantLogs || {};
      ud.inhabitantLogs[id] = [log, ...(ud.inhabitantLogs[id] || [])];
      // A log entry with a status also updates the inhabitant's current status
      if (entry.status) this.updateInhabitant(id, { status: entry.status });
      else touch();
      return log;
    },
    removeInhabitantLog(id, ts) {
      if (!ud.inhabitantLogs || !ud.inhabitantLogs[id]) return;
      ud.inhabitantLogs[id] = ud.inhabitantLogs[id].filter((l) => l.ts !== ts);
      touch();
    },
    findInhabitant(text) {
      const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const q = norm(text);
      const words = q.split(/\s+/).filter((w) => w.length > 2);
      let best = null, bestScore = 0;
      for (const kind of ["fish", "corals", "cuc"]) {
        for (const it of A.INHABITANTS[kind]) {
          const name = norm(it.name);
          const score = words.filter((w) => name.includes(w)).length + (q.includes(name) ? 2 : 0);
          if (score > bestScore) { best = it; bestScore = score; }
        }
      }
      return bestScore > 0 ? best : null;
    },

    // ---- lecturas ----
    logReading(k, v) {
      A.logReading(k, v);
      ud.readingsLogged = (ud.readingsLogged || 0) + 1;
      touch();
    },
    // ¿El usuario ha registrado alguna lectura propia? Si no, la app no debe
    // presentar un "Salud 100/100" que en realidad son los valores semilla.
    get hasRealReadings() { return (ud.readingsLogged || 0) > 0; },

    // ---- iluminación ----
    get lightingWeek() { return ud.lightingWeek || 1; },
    setLightingWeek(w) { ud.lightingWeek = w; touch(); },
    get lightFixture() { return ud.lightFixture || null; },
    setLightFixture(data) { ud.lightFixture = data; touch(); },

    // ---- fotos ----
    // Las fotos viven dentro del blob JSON, así que SIEMPRE se reescalan antes
    // de guardarlas: una foto de iPhone en base64 (~5 MB) reventaba la cuota
    // de localStorage ella sola.
    compressPhoto(dataURL, maxPx = 1200, quality = 0.75) {
      return new Promise((resolve) => {
        if (typeof dataURL !== "string" || !dataURL.startsWith("data:image")) { resolve(dataURL); return; }
        const img = new Image();
        img.onload = () => {
          try {
            const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
            const c = document.createElement("canvas");
            c.width = Math.max(1, Math.round(img.width * scale));
            c.height = Math.max(1, Math.round(img.height * scale));
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
            const out = c.toDataURL("image/jpeg", quality);
            resolve(out.length < dataURL.length ? out : dataURL);
          } catch (e) { resolve(dataURL); }
        };
        img.onerror = () => resolve(dataURL);
        img.src = dataURL;
      });
    },
    getPhoto(id) { return ud.photos[id] || null; },
    async setPhoto(id, dataURL) {
      if (dataURL) ud.photos[id] = await this.compressPhoto(dataURL);
      else delete ud.photos[id];
      touch();
      return ud.photos[id] || null;
    },

    // ---- multi-tank ----
    get activeTankId() { return ud.activeTankId || "tank-001"; },
    get activeTank() { return (A.ALL_TANKS || []).find((t) => t.id === (ud.activeTankId || "tank-001")) || A.TANK_CONFIG; },
    setActiveTank(id) {
      ud.activeTankId = id;
      const tank = (A.ALL_TANKS || []).find((t) => t.id === id);
      if (tank) Object.assign(A.TANK_CONFIG, tank);
      touch();
      window.dispatchEvent(new CustomEvent("aqua:tank", { detail: { id } }));
    },
    addTank(data) {
      const t = {
        id: "tank-" + Date.now(),
        online: true,
        setupDate: new Date().toISOString().slice(0, 10),
        owner: A.TANK_CONFIG.owner,
        localStore: A.TANK_CONFIG.localStore,
        location: A.TANK_CONFIG.location,
        ...data,
      };
      A.ALL_TANKS.push(t);
      ud.customTanks = [...(ud.customTanks || []), t];
      touch();
      window.dispatchEvent(new CustomEvent("aqua:tanks:changed", {}));
      return t;
    },
    deleteTank(id) {
      if (id === "tank-001") return; // never delete the default tank
      A.ALL_TANKS = (A.ALL_TANKS || []).filter((t) => t.id !== id);
      ud.customTanks = (ud.customTanks || []).filter((t) => t.id !== id);
      ud.customInhabitants = (ud.customInhabitants || []).filter(({ item }) => item.tankId !== id);
      if (ud.activeTankId === id) this.setActiveTank("tank-001");
      touch();
      window.dispatchEvent(new CustomEvent("aqua:tanks:changed", {}));
    },

    // ---- suplementos / comida ----
    addSupplement(s) {
      const item = { id: "sup-" + Date.now(), ...s };
      ud.supplements = [...(ud.supplements || []), item];
      touch();
      return item;
    },
    removeSupplement(id) {
      ud.supplements = (ud.supplements || []).filter((s) => s.id !== id);
      touch();
    },
    updateSupplement(id, patch) {
      ud.supplements = (ud.supplements || []).map((s) => s.id === id ? { ...s, ...patch } : s);
      touch();
    },

    // ---- identidad: estos datos pertenecen a un usuario ----
    get ownerUid() { return ud.ownerUid || null; },
    // Se llama al iniciar sesión. Si los datos locales son de OTRA persona
    // (o de una sesión de invitado sobre la que ahora entra alguien), se
    // descartan antes de tocar la nube. Sin esto, el usuario B veía —y
    // sobrescribía— el acuario del usuario A en el mismo navegador.
    bindUser(uid) {
      if (!uid) return false;
      const prev = ud.ownerUid || null;
      if (prev && prev !== uid) { this.wipeLocal(); return true; }
      if (!prev) {
        // Datos locales sin dueño: adoptarlos.
        // OJO: escribir SIN tocar updatedAt. Si aquí se llamara a persist(),
        // updatedAt saltaría a "ahora" y la copia de la nube (más antigua en
        // el reloj) se descartaría por vieja — el usuario iniciaba sesión y
        // veía su acuario vacío.
        ud.ownerUid = uid;
        try { localStorage.setItem(KEY, JSON.stringify(ud)); } catch (e) { /* ignorar */ }
      }
      return false;
    },
    // Borra los datos de este dispositivo sin tocar la nube ni recargar.
    wipeLocal() {
      try {
        localStorage.removeItem(KEY);
        localStorage.removeItem("aqua:onboarded");
        localStorage.removeItem("aqua:page");
      } catch (e) { /* ignorar */ }
      sessionStorage.removeItem("aqua:session");
    },

    // ---- sincronización nube → local ----
    // Solo se aplica un blob remoto si pertenece a la misma cuenta y es más
    // reciente. Si falla la escritura, se avisa en vez de fallar en silencio.
    // ¿Este conjunto de datos tiene contenido real del usuario?
    isEmptyData(d) {
      if (!d) return true;
      return !(d.customTanks || []).length
        && !(d.customInhabitants || []).length
        && !(d.supplements || []).length
        && !(d.customRoutines || []).length
        && !Object.keys(d.photos || {}).length
        && !(d.readingsLogged || 0)
        && !d.lightFixture;
    },
    applyRemote(remote, uid) {
      if (!remote || typeof remote.updatedAt !== "number") return;
      if (uid && remote.ownerUid && remote.ownerUid !== uid) return;
      // Red de seguridad: si en este dispositivo no hay nada propio pero la
      // nube sí tiene datos, traerlos aunque el reloj diga lo contrario.
      // (Relojes desajustados no deben esconderle el acuario al usuario.)
      const localVacio = this.isEmptyData(ud);
      const remotoConDatos = !this.isEmptyData(remote);
      if (remote.updatedAt <= ud.updatedAt && !(localVacio && remotoConDatos)) return;
      try {
        localStorage.setItem(KEY, JSON.stringify(remote));
      } catch (e) {
        window.toast?.(
          TT("No se pudieron traer los datos de la nube: almacenamiento lleno.",
             "Couldn't pull cloud data: storage is full."),
          { tone: "warn", icon: "AlertTriangle" }
        );
        return;
      }
      location.reload();
    },

    // Datos que el motor de notificaciones necesita consultar
    get routinesDone() { return ud.routinesDone || {}; },

    reset() {
      // Clear all AquaMind localStorage keys so a new account starts truly fresh
      Object.keys(localStorage).filter((k) => k.startsWith("aqua:")).forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
      location.reload();
    },
  };
})();

// ============ NOTIFICACIONES ============
// Aviso honesto sobre el alcance: sin un servidor propio, una web no puede
// despertar el teléfono con la app CERRADA. Lo que sí funciona y es lo que
// hace esto:
//   · avisos mientras la app está abierta o en segundo plano reciente
//   · repaso al abrir la app (rutinas vencidas, parámetros críticos)
//   · en iPhone requiere instalar la app en la pantalla de inicio (iOS 16.4+)
// Se usa el service worker para mostrarlas, que es lo que funciona en móvil.
window.AquaNotify = (() => {
  const SEEN_KEY = "aqua:notified";
  const A = window.AQUA;

  const supported = typeof Notification !== "undefined";
  const permission = () => (supported ? Notification.permission : "unsupported");

  async function request() {
    if (!supported) return "unsupported";
    const p = await Notification.requestPermission();
    return p;
  }

  // Mostrar vía service worker (funciona en móvil e instalada); si no hay SW,
  // recurrir a la Notification normal (escritorio con la pestaña abierta).
  async function show(title, body, tag) {
    if (permission() !== "granted") return false;
    const opts = {
      body, tag, renotify: false,
      icon: "icon-192.png", badge: "icon-192.png",
      lang: window.__lang === "en" ? "en" : "es",
    };
    try {
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) { await reg.showNotification(title, opts); return true; }
    } catch (e) { /* seguir con el plan B */ }
    try { new Notification(title, opts); return true; } catch (e) { return false; }
  }

  // Evita repetir el mismo aviso el mismo día
  function alreadySent(key) {
    const today = new Date().toISOString().slice(0, 10);
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); } catch (e) {}
    if (seen.day !== today) seen = { day: today, keys: [] };
    return { seen, hit: (seen.keys || []).includes(key) };
  }
  function markSent(key) {
    const { seen } = alreadySent(key);
    seen.keys = [...new Set([...(seen.keys || []), key])];
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {}
  }

  const T2 = (es, en) => (window.__lang === "en" ? en : es);

  // Revisa el estado real del acuario y avisa de lo que importa
  async function check({ force = false } = {}) {
    if (permission() !== "granted") return 0;
    if (localStorage.getItem("aqua:notify_enabled") === "false") return 0;
    let sent = 0;

    // 1) Parámetros en estado crítico
    const bad = Object.entries(A.CURRENT_PARAMETERS || {})
      .filter(([, p]) => p.status === "danger")
      .map(([k, p]) => `${p.label} ${p.value}${p.unit ? " " + p.unit : ""}`);
    if (bad.length) {
      const key = "param:" + bad.join("|");
      const { hit } = alreadySent(key);
      if (force || !hit) {
        await show(
          T2("⚠️ Parámetro fuera de rango", "⚠️ Parameter out of range"),
          bad.join(" · ") + T2(" — revisa tu acuario", " — check your tank"),
          "aqua-param"
        );
        markSent(key); sent++;
      }
    }

    // 2) Rutinas pendientes de hoy
    const done = window.AquaStore?.routinesDone || {};
    const due = (A.ROUTINES || []).filter((r) => r.nextDue === "today" && !done[r.id]);
    if (due.length) {
      const key = "routine:" + due.map((r) => r.id).join("|");
      const { hit } = alreadySent(key);
      if (force || !hit) {
        await show(
          T2(`Tienes ${due.length} tarea(s) de mantenimiento hoy`, `You have ${due.length} maintenance task(s) today`),
          due.map((r) => r.task || r.name).join(" · "),
          "aqua-routine"
        );
        markSent(key); sent++;
      }
    }

    // 3) Alertas críticas activas
    const alerts = (window.AquaStore?.activeAlerts?.() || []).filter((a) => a.severity === "danger");
    if (alerts.length) {
      const key = "alert:" + alerts.map((a) => a.id).join("|");
      const { hit } = alreadySent(key);
      if (force || !hit) {
        await show("⚠️ " + (alerts[0].title || T2("Alerta crítica", "Critical alert")), alerts[0].body || "", "aqua-alert");
        markSent(key); sent++;
      }
    }
    return sent;
  }

  // Notificación de prueba con el estado REAL del acuario (antes mostraba un
  // texto inventado sobre un coral que el usuario podía no tener).
  async function test() {
    const p = A.CURRENT_PARAMETERS || {};
    const n = (A.INHABITANTS?.fish?.length || 0) + (A.INHABITANTS?.corals?.length || 0) + (A.INHABITANTS?.cuc?.length || 0);
    const bits = [];
    if (p.temperature?.value) bits.push(`${p.temperature.value}°F`);
    if (p.ph?.value) bits.push(`pH ${p.ph.value}`);
    if (n) bits.push(T2(`${n} habitantes`, `${n} inhabitants`));
    return show(
      "AquaMind · " + (A.TANK_CONFIG?.name || T2("Tu acuario", "Your tank")),
      bits.length ? bits.join(" · ") : T2("Notificaciones activadas correctamente.", "Notifications enabled successfully."),
      "aqua-test"
    );
  }

  // Revisar al abrir y cada 30 min mientras la app siga abierta
  let timer = null;
  function start() {
    if (timer) return;
    setTimeout(() => check(), 4000);
    timer = setInterval(() => check(), 30 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
  }

  return { supported, permission, request, show, check, test, start };
})();

// ============ MOTOR DE IA (Groq) ============
// El modelo vivía copiado en 5 archivos. Cuando Groq retiró
// llama-3.3-70b-versatile (dejó de servirse en agosto de 2026), la IA dejó de
// funcionar aunque la key fuera válida, y el error se confundía con "sin key".
// Ahora hay una sola lista, con respaldo automático: si un modelo desaparece,
// se pasa al siguiente y se recuerda cuál funcionó.
window.AquaAI = (() => {
  const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
  const PREF_KEY = "aqua:ai_model";

  // En orden de preferencia. El primero que responda se recuerda.
  const MODELS = [
    "openai/gpt-oss-120b",   // sucesor recomendado por Groq, admite tool calling
    "openai/gpt-oss-20b",    // más rápido y barato
    "qwen/qwen3-32b",        // alternativa
  ];

  const getKey = () => window.AQUAMIND_AI_KEY || localStorage.getItem("aqua:ai_key") || null;
  const hasKey = () => !!getKey();

  function modelOrder() {
    const saved = localStorage.getItem(PREF_KEY);
    return saved && MODELS.includes(saved) ? [saved, ...MODELS.filter((m) => m !== saved)] : [...MODELS];
  }

  // ¿El error dice que el modelo ya no existe? Entonces probar el siguiente.
  function isModelGone(status, text) {
    if (status !== 400 && status !== 404) return false;
    return /decommission|deprecat|does not exist|not found|invalid.*model|model_not_found/i.test(text || "");
  }

  // Llamada única. Devuelve { ok, data } o { ok:false, code, message }.
  // code: "no_key" | "bad_key" | "rate_limit" | "timeout" | "network" |
  //       "no_model" | "server" | number
  async function chat({ messages, system, tools = null, maxTokens = 600, temperature, json = false, timeout = 30000 }) {
    const key = getKey();
    if (!key) return { ok: false, code: "no_key", message: "Falta la API key de Groq" };

    let lastErr = null;
    for (const model of modelOrder()) {
      const body = {
        model,
        messages: system ? [{ role: "system", content: system }, ...messages] : messages,
        max_tokens: maxTokens,
      };
      if (temperature != null) body.temperature = temperature;
      if (tools && tools.length) { body.tools = tools; body.tool_choice = "auto"; }
      if (json) body.response_format = { type: "json_object" };

      try {
        const resp = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeout),
        });
        if (resp.ok) {
          localStorage.setItem(PREF_KEY, model);   // recordar el que sí sirve
          return { ok: true, data: await resp.json(), model };
        }
        const text = await resp.text().catch(() => "");
        if (isModelGone(resp.status, text)) { lastErr = { code: "no_model", message: text.slice(0, 200) }; continue; }
        if (resp.status === 401 || resp.status === 403) return { ok: false, code: "bad_key", message: text.slice(0, 200) };
        if (resp.status === 429) return { ok: false, code: "rate_limit", message: text.slice(0, 200) };
        if (resp.status >= 500) return { ok: false, code: "server", message: text.slice(0, 200) };
        return { ok: false, code: resp.status, message: text.slice(0, 200) };
      } catch (e) {
        return { ok: false, code: e?.name === "TimeoutError" ? "timeout" : "network", message: String(e?.message || e) };
      }
    }
    return lastErr
      ? { ok: false, code: "no_model", message: "Ningún modelo disponible: " + lastErr.message }
      : { ok: false, code: "network", message: "Sin respuesta" };
  }

  // Atajo para respuestas en JSON (fichas, planes, insights…)
  async function json(system, user, maxTokens = 600) {
    const r = await chat({
      messages: [{ role: "user", content: user }],
      system, maxTokens, temperature: 0.2, json: true,
    });
    if (!r.ok) return { _error: r.code, _msg: r.message };
    const raw = r.data?.choices?.[0]?.message?.content?.trim() || "";
    try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
    catch (e) { return { _parseError: true, _msg: raw.slice(0, 200) }; }
  }

  // Mensaje claro para el usuario según el fallo
  function explain(code) {
    const es = window.__lang !== "en";
    switch (code) {
      case "no_key":     return es ? "Falta tu API key de Groq. Añádela en Ajustes → Cuenta." : "Your Groq API key is missing. Add it in Settings → Account.";
      case "bad_key":    return es ? "Tu API key de Groq no es válida o fue revocada. Genera una nueva en console.groq.com/keys." : "Your Groq API key is invalid or was revoked. Create a new one at console.groq.com/keys.";
      case "rate_limit": return es ? "Alcanzaste el límite del plan gratuito de Groq. Espera un minuto e inténtalo otra vez." : "You hit Groq's free-tier rate limit. Wait a minute and try again.";
      case "timeout":    return es ? "La IA tardó demasiado. Revisa tu conexión e inténtalo de nuevo." : "The AI took too long. Check your connection and try again.";
      case "network":    return es ? "No se pudo conectar con Groq. Revisa tu internet." : "Couldn't reach Groq. Check your connection.";
      case "no_model":   return es ? "Groq retiró el modelo que usábamos y no hay ninguno disponible con tu cuenta." : "Groq retired the model we used and none are available on your account.";
      case "server":     return es ? "Groq tuvo un problema en su servidor. Inténtalo en un momento." : "Groq had a server problem. Try again shortly.";
      default:           return es ? "La IA falló. Inténtalo de nuevo." : "The AI failed. Try again.";
    }
  }

  // Diagnóstico para el botón "Probar" de Ajustes
  async function testKey() {
    const r = await chat({ messages: [{ role: "user", content: "Responde solo: OK" }], maxTokens: 5, timeout: 15000 });
    if (r.ok) return { ok: true, model: r.model, text: r.data?.choices?.[0]?.message?.content?.trim() || "" };
    return { ok: false, code: r.code, message: explain(r.code), detail: r.message };
  }

  return { MODELS, chat, json, explain, testKey, hasKey, getKey, get model() { return localStorage.getItem(PREF_KEY) || MODELS[0]; } };
})();
