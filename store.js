// store.js — persistencia de datos del usuario.
// Capa 1: localStorage (siempre activa — los datos sobreviven al recargar y
//         cerrar el navegador, por dispositivo).
// Capa 2: nube vía window.CLOUD (Firebase) cuando está configurada — los
//         mismos datos se sincronizan entre dispositivos con tu cuenta Google.
window.AquaStore = (() => {
  const KEY = "aqua:userdata:v1";
  const A = window.AQUA;

  let ud = {
    activeTankId: "tank-001",  // selected tank
    readings: null,            // snapshot de HISTORY
    params: null,              // snapshot de CURRENT_PARAMETERS (valor/estado/tendencia/nota)
    dismissedAlerts: [],
    customAlerts: [],          // creadas por el usuario vía Aqua Buddy
    routinesDone: {},
    customRoutines: [],
    customInhabitants: [],     // [{ kind, item }]
    inhabitantUpdates: {},     // { id: { status, note } }
    lightingWeek: null,
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
  Object.entries(ud.inhabitantUpdates || {}).forEach(([id, patch]) => {
    for (const kind of ["fish", "corals", "cuc"]) {
      const it = A.INHABITANTS[kind].find((x) => x.id === id);
      if (it) Object.assign(it, patch);
    }
  });

  // Load AI key immediately (before return) so callGemini can use it on first message
  (function () {
    const storedKey = localStorage.getItem("aqua:ai_key");
    if (storedKey) {
      window.AQUAMIND_AI_KEY = storedKey;
    } else {
      try { window.AQUAMIND_AI_KEY = atob("QVEuQWI4Uk42THloSDdHQ0NoOENTeTVzTTNCd0lZWVE2UDR2OGRWLUtCQ1lLN0Mtb01wQVE="); } catch (_) {}
    }
  })();

  let saveTimer = null;
  function persist() {
    ud.updatedAt = Date.now();
    ud.readings = A.HISTORY;
    ud.params = {};
    Object.keys(A.CURRENT_PARAMETERS).forEach((k) => {
      const p = A.CURRENT_PARAMETERS[k];
      ud.params[k] = { value: p.value, status: p.status, trend: p.trend, note: p.note };
    });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(ud));
      } catch (e) {
        // cuota llena — casi siempre por fotos grandes
        window.toast?.(
          (window.T || ((a) => a))("Almacenamiento lleno — elimina alguna foto", "Storage full — remove a photo"),
          { tone: "warn", icon: "AlertTriangle" }
        );
      }
      window.CLOUD?.push(ud);
    }, 250);
  }
  function touch() {
    persist();
    window.dispatchEvent(new Event("aqua:data"));
  }

  const SEV_RANK = { danger: 0, warn: 1, info: 2 };

  return {
    get ud() { return ud; },
    persist,
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
    logReading(k, v) { A.logReading(k, v); touch(); },

    // ---- iluminación ----
    get lightingWeek() { return ud.lightingWeek || 2; },
    setLightingWeek(w) { ud.lightingWeek = w; touch(); },

    // ---- fotos ----
    getPhoto(id) { return ud.photos[id] || null; },
    setPhoto(id, dataURL) {
      if (dataURL) ud.photos[id] = dataURL;
      else delete ud.photos[id];
      touch();
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
    deleteTank(id) {
      if (id === "tank-001") return; // never delete the default tank
      A.ALL_TANKS = (A.ALL_TANKS || []).filter((t) => t.id !== id);
      ud.customInhabitants = (ud.customInhabitants || []).filter(({ item }) => item.tankId !== id);
      if (ud.activeTankId === id) this.setActiveTank("tank-001");
      touch();
      window.dispatchEvent(new CustomEvent("aqua:tanks:changed", {}));
    },

    // ---- sincronización nube → local (last-write-wins por updatedAt) ----
    applyRemote(remote) {
      if (remote && typeof remote.updatedAt === "number" && remote.updatedAt > ud.updatedAt) {
        try { localStorage.setItem(KEY, JSON.stringify(remote)); } catch (e) { return; }
        location.reload();
      }
    },

    reset() { localStorage.removeItem(KEY); location.reload(); },
  };
})();
