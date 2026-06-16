// Dashboard — Liquid Glass: reef status hero + AI update, params, lighting, livestock, gallery
const PARAM_ICON = {
  ph: "Beaker", kh: "TestTube", phosphate: "FlaskConical", calcium: "Atom",
  nitrate: "Droplets", nitrite: "Droplets", ammonia: "Droplets",
  temperature: "Thermometer", salinity: "Sailboat", magnesium: "Atom",
};

// ---- Aqua Buddy command engine ----
// Entiende órdenes en lenguaje natural (ES/EN) y las aplica a la app:
// lecturas, rutinas, alertas/recordatorios, habitantes e iluminación.
// Todo lo que toca pasa por AquaStore → persiste en local y se sincroniza
// con la nube cuando hay sesión de Google conectada.
const PARAM_ALIASES = {
  ph: "ph", kh: "kh", alcalinidad: "kh", alkalinity: "kh", dkh: "kh",
  fosfato: "phosphate", fosfatos: "phosphate", po4: "phosphate", "po₄": "phosphate", phosphate: "phosphate", phosphates: "phosphate",
  calcio: "calcium", ca: "calcium", calcium: "calcium",
  nitrato: "nitrate", nitratos: "nitrate", no3: "nitrate", nitrate: "nitrate", nitrates: "nitrate",
  nitrito: "nitrite", nitritos: "nitrite", no2: "nitrite", nitrite: "nitrite",
  amonio: "ammonia", amoniaco: "ammonia", ammonia: "ammonia", nh3: "ammonia", nh4: "ammonia",
  temperatura: "temperature", temp: "temperature", temperature: "temperature",
  salinidad: "salinity", salinity: "salinity", sal: "salinity",
};
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function applyAquaCommand(raw) {
  const S = window.AquaStore;
  if (!S) return null;
  const msg = raw.trim();
  const low = msg.toLowerCase();
  let m;

  // 1) Registrar lectura: "registra kh 7.5" · "anota el ph en 8.1" · "log calcium 420"
  m = low.match(/(?:registra|anota|apunta|log|record)\s+(?:el\s+|la\s+|los\s+)?([a-zá-ú₄0-9]+)\s*(?:en|a|at|:|=)?\s*(\d+(?:[.,]\d+)?)/i);
  if (m && PARAM_ALIASES[m[1]]) {
    const k = PARAM_ALIASES[m[1]];
    const v = parseFloat(m[2].replace(",", "."));
    S.logReading(k, v);
    const p = window.AQUA.CURRENT_PARAMETERS[k];
    const st = p.status === "ok" ? T("óptimo", "optimal") : p.status === "warn" ? T("a vigilar", "watch") : T("crítico", "critical");
    return T(
      `✓ Registré ${p.label} = ${v}${p.unit ? " " + p.unit : ""} — estado ${st}. Dashboard y bitácora actualizados.`,
      `✓ Logged ${p.label} = ${v}${p.unit ? " " + p.unit : ""} — status ${st}. Dashboard and logbook updated.`
    );
  }

  // 2) Nueva rutina: "agrega rutina limpiar cristales semanal"
  m = msg.match(/(?:agrega|añade|crea|add|create|new)\s+(?:una\s+)?(?:rutina|tarea|routine|task)\s+(?:de\s+|of\s+)?(.+)/i);
  if (m) {
    let text = m[1].trim().replace(/[.!]$/, "");
    let freq = T("según necesidad", "as needed");
    const f = text.match(/\s+(diari[oa](?:mente)?|semanal(?:mente)?|quincenal|mensual|cada\s+[\wáéíóú\s]+|daily|weekly|biweekly|monthly)$/i);
    if (f) { freq = f[1]; text = text.slice(0, f.index).trim(); }
    const r = { id: "ru" + Date.now(), task: cap1(text), detail: T("Añadida vía Aqua Buddy", "Added via Aqua Buddy"), frequency: freq, nextDue: "today", time: "12:00", icon: "CalendarCheck" };
    S.addRoutine(r);
    return T(
      `✓ Rutina creada: «${r.task}» (${freq}). Ya aparece en Rutinas y en el timeline del dashboard.`,
      `✓ Routine created: "${r.task}" (${freq}). It's now in Routines and on the dashboard timeline.`
    );
  }

  // 3) Recordatorio/alerta: "recuérdame comprar sal" · "avísame revisar la bomba"
  m = msg.match(/(?:recu[eé]rdame|av[ií]same|crea\s+(?:una\s+)?alerta(?:\s+de)?|remind\s+me\s+(?:to\s+)?|add\s+alert)\s*:?\s*(.+)/i);
  if (m) {
    const a = {
      id: "ua" + Date.now(), severity: "info", badge: T("RECORDATORIO", "REMINDER"),
      title: cap1(m[1].trim().replace(/[.!]$/, "")),
      body: T("Creado por ti vía Aqua Buddy.", "Created by you via Aqua Buddy."),
      cta: T("Marcar hecho", "Mark done"), tag: "Aqua Buddy",
    };
    S.addAlert(a);
    return T(
      `✓ Anotado: «${a.title}». Lo dejé en el centro de alertas — el badge ya lo cuenta.`,
      `✓ Noted: "${a.title}". It's in the alert center — the badge counts it now.`
    );
  }

  // 4) Nuevo habitante: "agrega un pez royal gramma" · "añade coral zoa"
  m = msg.match(/(?:agrega|añade|add)\s+(?:un\s+|una\s+|a\s+)?(pez|coral|caracol|cangrejo|invertebrado|fish|snail|crab|invert)\s+(.+)/i);
  if (m) {
    const kindMap = { pez: "fish", fish: "fish", coral: "corals", caracol: "cuc", cangrejo: "cuc", invertebrado: "cuc", snail: "cuc", crab: "cuc", invert: "cuc" };
    const kind = kindMap[m[1].toLowerCase()] || "fish";
    const item = {
      id: "ui" + Date.now(), name: cap1(m[2].trim().replace(/[.!]$/, "")), scientific: "",
      added: window.AQUA.MOCK_TODAY, status: "ok",
      note: T("Añadido vía Aqua Buddy — en observación", "Added via Aqua Buddy — under observation"),
    };
    S.addInhabitant(kind, item);
    const kindLabel = { fish: T("Peces", "Fish"), corals: T("Corales", "Corals"), cuc: "CUC" }[kind];
    return T(
      `✓ ${item.name} añadido a Habitantes (${kindLabel}). Súbele una foto desde su tarjeta cuando puedas.`,
      `✓ ${item.name} added to Livestock (${kindLabel}). Drop a photo on its card when you can.`
    );
  }

  // 5) Estado de un habitante: "el hammer está mal" · "birdsnest looks better"
  m = low.match(/(.+?)\s+(?:está|esta|is|se\s+ve|looks?)\s+(blanqueando|bleaching|mal|peor|worse|bad|mejor|better|bien|fine|ok|recuper\w+|expandid[oa]|decaíd[oa]|dying)/);
  if (m) {
    const found = S.findInhabitant(m[1].replace(/^(el|la|los|las|mi|mis|the|my)\s+/i, ""));
    if (found) {
      const word = m[2];
      const status = /blanque|bleach|mal|peor|worse|bad|decaíd|dying/.test(word) ? "danger"
        : /mejor|better|recuper/.test(word) ? "warn" : "ok";
      S.updateInhabitant(found.id, { status, note: T("Tu actualización: ", "Your update: ") + msg });
      let extra = "";
      if (status === "danger") {
        S.addAlert({
          id: "ua" + Date.now(), severity: "warn", badge: T("AVISO", "NOTICE"),
          title: T(`${found.name} reportado en mal estado`, `${found.name} reported in bad shape`),
          body: msg, cta: T("Ver habitantes", "View livestock"), tag: T("Habitante", "Livestock"),
        });
        extra = T(" También creé un aviso en alertas para darle seguimiento.", " I also raised a notice in alerts to track it.");
      }
      return T(
        `✓ Actualicé el estado de ${found.name}.${extra}`,
        `✓ Updated ${found.name}'s status.${extra}`
      );
    }
  }

  // 6) Rutina completada: "ya alimenté las BTAs" · "completé el cambio de agua"
  m = low.match(/(?:ya\s+|complet[eé]\s+(?:el\s+|la\s+)?|hice\s+(?:el\s+|la\s+)?|termin[eé]\s+|done\s+|finished\s+)(.+)/);
  if (m) {
    const words = m[1].split(/\s+/).filter((w) => w.length > 3);
    const r = window.AQUA.ROUTINES.find((rt) => {
      const t = rt.task.toLowerCase();
      return words.some((w) => t.includes(w));
    });
    if (r) {
      if (!S.ud.routinesDone[r.id]) S.toggleRoutine(r.id);
      return T(`✓ «${r.task}» marcada como completada. Bien ahí.`, `✓ "${r.task}" marked complete. Nice.`);
    }
  }

  // 7) Iluminación: "cambia la luz a semana 3" · "lighting week 4"
  m = low.match(/(?:luz|luces|iluminaci[oó]n|light\w*)[^.]*?(?:semana|week)\s*([1-4])/) ||
      low.match(/(?:semana|week)\s*([1-4])[^.]*?(?:luz|luces|iluminaci[oó]n|light)/);
  if (m) {
    S.setLightingWeek(+m[1]);
    const wk = window.AQUA.LIGHTING_SCHEDULE[+m[1] - 1];
    return T(
      `✓ Programa de luz cambiado a semana ${m[1]} (B/C al ${wk.channels.B}%). Revisa la página de Iluminación.`,
      `✓ Lighting schedule set to week ${m[1]} (B/C at ${wk.channels.B}%). Check the Lighting page.`
    );
  }

  return null; // no es una orden → responde como chat
}

// ---- AI plumbing — Google Gemini 2.0 Flash (gratis) + local fallback ----
// Agrega tu key en Ajustes → Cuenta → Aqua Buddy. Se guarda en localStorage.
function localAquaBuddy(q) {
  const m = q.toLowerCase();
  if (/\bkh\b|buffer|alcalin|alkalin|dkh/.test(m)) return T(
    "Para subir el KH, dosa de forma gradual — nunca más de 1 dKH/día para evitar estrés en los corales. Usa carbonato sódico (soda ash) o un buffer comercial, re-mide en 24 h y repite hasta alcanzar el rango ideal (8–10 dKH).",
    "To raise KH, dose gradually — never more than 1 dKH/day to avoid coral stress. Use sodium carbonate (soda ash) or a commercial buffer, re-test in 24 h and repeat until you reach the ideal range (8–10 dKH)."
  );
  if (/blanque|bleach|coral|seriatopora|sps|lps/.test(m)) return T(
    "El blanqueo en corales suele estar ligado a cambios bruscos de KH, temperatura o luz. Estabiliza los parámetros, mantén flujo moderado y no muevas el coral. Si la base conserva tejido, puede recuperarse en 2–3 semanas.",
    "Coral bleaching is usually tied to sudden changes in KH, temperature or light. Stabilize parameters, maintain moderate flow and don't move the coral. If the base keeps tissue it can recover in 2–3 weeks."
  );
  if (/fosfat|phosphat|po4|po₄|algas|algae/.test(m)) return T(
    "Para reducir fosfatos: haz un cambio de agua del 20–25%, reduce la alimentación esta semana y considera medios absorbentes como GFO o PhosGuard. Re-mide en 3 días para ver la tendencia.",
    "To reduce phosphates: do a 20–25% water change, reduce feeding this week and consider absorbent media like GFO or PhosGuard. Re-test in 3 days to track the trend."
  );
  if (/cambio|water change|agua|rodi/.test(m)) return T(
    "Para un cambio de agua: prepara RODI + sal de calidad a la gravedad específica y temperatura de tu tanque (1.025 SG, 78°F para marina), luego cambia el 10–25% semanalmente o cada dos semanas.",
    "For a water change: prepare RODI + quality salt at your tank's specific gravity and temperature (1.025 SG, 78°F for saltwater), then change 10–25% weekly or biweekly."
  );
  if (/\bph\b/.test(m)) return T(
    "El pH ideal en reef es 8.1–8.3. Suele bajar de noche — eso es normal. Mejor aireación y agitación superficial ayudan. Si el KH está bajo, corrige primero la alcalinidad y el pH subirá solo.",
    "The ideal reef pH is 8.1–8.3. It naturally drops at night — that's normal. Better aeration and surface agitation help. If KH is low, fix alkalinity first and pH will follow."
  );
  if (/magnesio|magnesium|mg\b/.test(m)) return T(
    "El magnesio debe estar en 1250–1350 mg/L. Si está bajo, suplementa gradualmente con cloruro o sulfato de magnesio. Los cambios de agua regulares con agua bien mezclada ayudan a mantenerlo estable.",
    "Magnesium should be 1250–1350 mg/L. If low, supplement gradually with magnesium chloride or sulfate. Regular water changes with well-mixed saltwater help keep it stable."
  );
  return T(
    "Soy Aqua Buddy, tu asistente de acuario. Puedo ayudarte con parámetros, registrar lecturas, crear rutinas o responder preguntas sobre tu reef. Agrega tu key de Groq gratis (console.groq.com/keys) en Ajustes → Aqua Buddy para respuestas IA en tiempo real.",
    "I'm Aqua Buddy, your aquarium assistant. I can help with parameters, log readings, create routines or answer questions about your reef. Add your free Groq key (console.groq.com/keys) in Settings → Aqua Buddy for real-time AI responses."
  );
}

// Build a rich system prompt from live tank data for Aqua Buddy
function buildAquaBuddyPrompt(mode = "personalized") {
  const { TANK_CONFIG, CURRENT_PARAMETERS, INHABITANTS, EQUIPMENT, ALERTS } = window.AQUA;
  const lang = window.__lang === "en" ? "English" : "Spanish";

  const params = Object.entries(CURRENT_PARAMETERS)
    .map(([k, p]) => `${p.label}: ${p.value}${p.unit ? " " + p.unit : ""} (${p.status === "ok" ? "ok" : p.status === "warn" ? "warn" : "critical"})`)
    .join(", ");

  const fish = INHABITANTS.fish.map((f) => `${f.name} (${f.status})`).join(", ");
  const corals = INHABITANTS.corals.map((c) => `${c.name} (${c.status})`).join(", ");
  const equipment = EQUIPMENT.map((e) => e.name).join(", ");
  const alerts = ALERTS.map((a) => a.title).join("; ");

  const tankContext = mode === "personalized" ? `
TANK: ${TANK_CONFIG.name} — ${TANK_CONFIG.displayVolume} gal display / ${TANK_CONFIG.realVolume} gal real, ${TANK_CONFIG.type}, ${TANK_CONFIG.location}.
PARAMETERS (live): ${params}.
FISH: ${fish}.
CORALS: ${corals}.
EQUIPMENT: ${equipment}.
ACTIVE ALERTS: ${alerts || "none"}.
OWNER: ${TANK_CONFIG.owner} — experienced in freshwater, newer to saltwater.` : "";

  return `You are Aqua Buddy, the AI assistant for AquaMind — an aquarium intelligence app.
You are an expert marine and freshwater aquarist with deep knowledge of reef chemistry, coral husbandry, fish health, and planted tank techniques. You draw on community knowledge from Reef2Reef, BRS, and other leading reef forums.
${tankContext}
CAPABILITIES: You can take actions in the app using function calls (add routine, log parameter, add inhabitant, create alert, update note).
CRITICAL RULE — WHEN TO USE FUNCTIONS: ONLY call a function when the user explicitly uses action words like "agrega", "registra", "añade", "crea", "recuérdame", "add", "log", "create", "remind me". For ALL other questions, observations, or discussions — answer with text only. Do NOT proactively add routines, alerts, or notes just because you think it would be helpful. The user will ask if they want an action taken.
RULES:
- Reply in ${lang}. Give thorough, detailed responses (5–8 sentences) — the user wants to learn, not just get a one-liner.
- When the tank context is available, reference specific parameters, livestock, and equipment — give personalized advice with exact quantities (ml, g) based on the real tank volume.
- When answering questions, cite best practices and explain the science behind recommendations.
- Be friendly, expert, and conversational — like a veteran reefer explaining to a friend.
- Mode: ${mode === "personalized" ? "personalized to this tank" : "general aquarium expert"}.`;
}

// ---- Aqua Buddy tools (function calling) ----
const AQUA_TOOLS = [
  {
    type: "function",
    function: {
      name: "add_routine",
      description: "Adds a maintenance routine/task to the user's aquarium care schedule",
      parameters: {
        type: "object",
        properties: {
          task: { type: "string", description: "Name of the routine task" },
          frequency: { type: "string", description: "How often: Diario, Semanal, Quincenal, Mensual, or custom phrase" },
          detail: { type: "string", description: "Additional details or notes about the task" },
        },
        required: ["task", "frequency"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_parameter",
      description: "Logs a water parameter reading to the aquarium history",
      parameters: {
        type: "object",
        properties: {
          param: { type: "string", enum: ["ph", "temperature", "salinity", "kh", "calcium", "magnesium", "nitrate", "phosphate", "ammonia"] },
          value: { type: "number", description: "The measured numeric value" },
        },
        required: ["param", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_inhabitant",
      description: "Adds a new fish, coral, or CUC (clean-up crew) to the tank",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["fish", "corals", "cuc"], description: "Category of inhabitant" },
          name: { type: "string", description: "Common name" },
          species: { type: "string", description: "Scientific name if known" },
          note: { type: "string", description: "Notes about this inhabitant" },
        },
        required: ["kind", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_alert",
      description: "Creates an alert or reminder in the app's alert center",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title for the alert or reminder" },
          body: { type: "string", description: "More details about the alert" },
          severity: { type: "string", enum: ["info", "warn", "danger"] },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_parameter_note",
      description: "Updates the note/comment displayed on a water parameter card",
      parameters: {
        type: "object",
        properties: {
          param: { type: "string", enum: ["ph", "temperature", "salinity", "kh", "calcium", "magnesium", "nitrate", "phosphate", "ammonia"] },
          note: { type: "string", description: "The new note text" },
        },
        required: ["param", "note"],
      },
    },
  },
];

function executeAquaTool(name, args) {
  const A = window.AQUA;
  const S = window.AquaStore;
  const c1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  switch (name) {
    case "add_routine": {
      const r = {
        id: "ru" + Date.now(),
        task: c1(args.task),
        detail: args.detail || T("Añadida vía Aqua Buddy", "Added via Aqua Buddy"),
        frequency: args.frequency,
        nextDue: "today",
        time: "12:00",
        icon: "CalendarCheck",
      };
      S.addRoutine(r);
      window.toast?.(T(`Rutina "${r.task}" creada`, `Routine "${r.task}" created`), { icon: "CalendarCheck" });
      return T(`Rutina "${r.task}" agregada (${args.frequency}).`, `Routine "${r.task}" added (${args.frequency}).`);
    }
    case "log_parameter": {
      S.logReading(args.param, args.value);
      const p = A.CURRENT_PARAMETERS[args.param];
      window.toast?.(T(`${p?.label || args.param}: ${args.value} registrado`, `${p?.label || args.param}: ${args.value} logged`), { icon: "Activity" });
      return T(`${p?.label || args.param} = ${args.value}${p?.unit ? " " + p.unit : ""} guardado.`, `${p?.label || args.param} = ${args.value}${p?.unit ? " " + p.unit : ""} saved.`);
    }
    case "add_inhabitant": {
      const item = {
        id: "ui" + Date.now(),
        name: c1(args.name),
        scientific: args.species || "",
        added: A.MOCK_TODAY,
        status: "ok",
        note: args.note || T("Añadido vía Aqua Buddy", "Added via Aqua Buddy"),
      };
      S.addInhabitant(args.kind, item);
      window.toast?.(T(`${item.name} agregado`, `${item.name} added`), { icon: "Fish" });
      return T(`${item.name} añadido a Habitantes.`, `${item.name} added to Livestock.`);
    }
    case "create_alert": {
      const a = {
        id: "ua" + Date.now(),
        severity: args.severity || "info",
        badge: T("RECORDATORIO", "REMINDER"),
        title: args.title,
        body: args.body || "",
        cta: T("Marcar hecho", "Mark done"),
        tag: "Aqua Buddy",
      };
      S.addAlert(a);
      window.toast?.(T("Alerta creada", "Alert created"), { icon: "Bell" });
      return T(`Alerta "${args.title}" creada.`, `Alert "${args.title}" created.`);
    }
    case "update_parameter_note": {
      const p = A.CURRENT_PARAMETERS[args.param];
      if (p) { p.note = args.note; S.touch(); }
      return T(`Nota de ${p?.label || args.param} actualizada.`, `Note for ${p?.label || args.param} updated.`);
    }
    default:
      return T("Accion completada.", "Action completed.");
  }
}

// Call Groq — OpenAI-compatible API, Llama 3.3 70B
async function callGroq(messages, system, tools = null) {
  const apiKey = window.AQUAMIND_AI_KEY || localStorage.getItem("aqua:ai_key");
  if (!apiKey) return null;
  try {
    const formatted = messages.map((m) => {
      if (m.role === "tool" || m.tool_calls !== undefined) return m;
      const role = m.role === "assistant" ? "assistant" : "user";
      return { role, content: typeof m.content === "string" ? m.content : JSON.stringify(m.content) };
    });
    const body = {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, ...formatted],
      max_tokens: 600,
    };
    if (tools && tools.length) { body.tools = tools; body.tool_choice = "auto"; }

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const err = await resp.text().catch(() => "");
      console.error("[AquaBuddy] Groq error", resp.status, err.slice(0, 400));
      return { _error: resp.status, _msg: err.slice(0, 200) };
    }
    return await resp.json();
  } catch (e) {
    console.warn("[AquaBuddy] fetch error:", e);
    return null;
  }
}

async function callAquaBuddy(userMessage, mode = "personalized", history = []) {
  // Rule-based command parser — fast, works offline, no key needed
  const command = applyAquaCommand(userMessage);
  if (command) {
    await new Promise((r) => setTimeout(r, 450));
    return command;
  }

  const system = buildAquaBuddyPrompt(mode);
  const messages = [
    ...history.map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text })),
    { role: "user", content: userMessage },
  ];

  // --- Groq (Llama 3.3 70B, OpenAI-compatible) ---
  const groqData = await callGroq(messages, system, AQUA_TOOLS);
  if (groqData && groqData._error) {
    const code = groqData._error;
    if (code === 401 || code === 403) return T("⚠ API key de Groq inválida. Configúrala en Ajustes → Cuenta → Aqua Buddy.", "⚠ Invalid Groq API key. Set it in Settings → Account → Aqua Buddy.");
    // 429 or 5xx — fall through to local silently
  }
  if (groqData) {
    const msg = groqData.choices?.[0]?.message;
    if (msg?.tool_calls?.length > 0) {
      const toolResults = msg.tool_calls.map((tc) => {
        let args = {};
        try { args = JSON.parse(tc.function.arguments); } catch (_) {}
        return { role: "tool", tool_call_id: tc.id, content: String(executeAquaTool(tc.function.name, args)) };
      });
      // Follow-up: let model narrate completed actions
      const followMessages = [
        ...messages,
        { role: "assistant", content: null, tool_calls: msg.tool_calls },
        ...toolResults,
      ];
      const follow = await callGroq(followMessages, system);
      const followText = follow?.choices?.[0]?.message?.content?.trim();
      if (followText) return followText;
      return toolResults.map((r) => r.content).join("\n");
    }
    const text = msg?.content?.replace(/<function\([^)]*\)=[^]*?<\/function>/g, "").trim();
    if (text) return text;
  }

  // --- Local knowledge base (sin key) ---
  await new Promise((r) => setTimeout(r, 800));
  return localAquaBuddy(userMessage);
}

const callAquaBot = (msg, hist) => callAquaBuddy(msg, "personalized", hist);
const localAquaBot = localAquaBuddy;

// ---- Reef Status & AI Update hero ----
function ReefStatusHero({ onNavigate }) {
  const { TANK_CONFIG, CURRENT_PARAMETERS, ALERTS } = window.AQUA;
  const [input, setInput] = React.useState("");
  const [reply, setReply] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Compute live status from actual data
  const paramVals = Object.values(CURRENT_PARAMETERS);
  const dangerCount = paramVals.filter((p) => p.status === "danger").length;
  const warnCount = paramVals.filter((p) => p.status === "warn").length;
  const alertCount = (window.AquaStore?.activeAlerts() || []).length;
  const overallStatus = dangerCount > 0 || alertCount > 0 ? "danger" : warnCount > 0 ? "warn" : "ok";
  const statusBadge = {
    ok:     { bg: "rgba(16,185,129,0.88)", text: "#fff", label: T("Todo en orden", "All good") },
    warn:   { bg: "rgba(245,158,11,0.92)", text: "#3A2A05", label: T("Vigilar parámetros", "Watch parameters") },
    danger: { bg: "rgba(220,68,88,0.92)",  text: "#fff", label: T("Alerta crítica", "Critical alert") },
  }[overallStatus];
  const isNewTank = !TANK_CONFIG.displayVolume && !TANK_CONFIG.owner;

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setLoading(true);
    setReply("");
    const r = await callAquaBot(msg);
    setReply(r);
    setLoading(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="text-[17px] font-semibold tracking-tight text-[var(--ink)]">
          {T("Estado del acuario", "Aquarium Status")}
        </h2>
        <span className="text-[11px] text-[var(--ink-3)]">{fmtLongDate(window.AQUA.MOCK_TODAY)}</span>
      </div>

      {/* Tank banner */}
      <div className="relative mx-4 rounded-3xl overflow-hidden" style={{ height: 150 }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a2a3a 0%, #0e4a6a 40%, #115e5a 70%, #0d3d3a 100%)" }} />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 150">
          <path d="M0,75 C100,55 200,95 300,70 C350,57 380,80 400,75 L400,150 L0,150 Z" fill="rgba(255,255,255,0.05)" />
          <path d="M0,105 C80,90 160,115 240,100 C310,87 370,110 400,103 L400,150 L0,150 Z" fill="rgba(255,255,255,0.03)" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(8,22,34,0.55), transparent)" }} />
        <div className="absolute left-4 bottom-3">
          <div className="text-[20px] font-semibold text-white tracking-tight" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.45)" }}>
            {TANK_CONFIG.name || T("Mi Acuario", "My Aquarium")}
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ background: statusBadge.bg, color: statusBadge.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusBadge.text, opacity: 0.7 }} />
              {statusBadge.label}
            </span>
          </div>
        </div>
        {!isNewTank && (dangerCount + warnCount + alertCount) > 0 && (
          <div className="absolute right-3 bottom-3 hidden sm:block">
            <span className="text-[10.5px] text-white/85 px-2 py-1 rounded-full" style={{ background: "rgba(8,22,34,0.45)", backdropFilter: "blur(8px)" }}>
              {dangerCount + warnCount > 0 ? T(`${dangerCount + warnCount} parámetros · ${alertCount} alertas`, `${dangerCount + warnCount} params · ${alertCount} alerts`) : T(`${alertCount} alertas`, `${alertCount} alerts`)}
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <div className="grid place-items-center w-9 h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <L name="Droplet" size={16} style={{ color: "#2DD4BF" }} />
          </div>
        </div>
        <HeroPhotoSlot />
      </div>

      {/* Quick update / ask AI */}
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[13px] font-semibold text-[var(--ink)]">{T("Pregunta a Aqua Buddy", "Ask Aqua Buddy")}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={T("Describe lo que observas o pregunta sobre un coral…", "Describe current observations or ask about a coral…")}
              className="w-full glass-strong rounded-full pl-4 pr-10 py-2.5 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]"><L name="Sparkles" size={15} /></span>
          </div>
          <Button variant="primary" icon={loading ? undefined : "Send"} loading={loading} onClick={send}>{T("Enviar", "Post")}</Button>
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <button onClick={() => onNavigate("ai")} className="ml-auto text-[11.5px] text-[var(--accent)] hover:opacity-80 inline-flex items-center gap-1">
            {T("Abrir chat completo", "Open full chat")} <L name="ArrowRight" size={11} />
          </button>
        </div>

        {(loading || reply) && (
          <div className="mt-3 rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--ink)]" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--accent)" }}>
              <L name="Sparkles" size={11} /> Aqua Buddy
            </span>
            <div>{loading ? T("Analizando tu tanque…", "Analyzing your tank…") : reply}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ---- Hero photo slot for tank banner ----
function HeroPhotoSlot() {
  const fileRef = React.useRef(null);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const photo = window.AquaStore?.getPhoto?.("tank-hero");

  const handleFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => { window.AquaStore?.setPhoto("tank-hero", ev.target.result); forceUpdate(); e.target.value = ""; };
    reader.readAsDataURL(f);
  };

  return (
    <>
      {photo && <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ borderRadius: "inherit", opacity: 0.55 }} />}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button onClick={() => fileRef.current?.click()} className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-white transition-all hover:brightness-110" style={{ background: "rgba(13,148,136,0.7)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>
        <L name="Camera" size={12} /> {photo ? T("Cambiar foto","Change photo") : T("Agregar foto","Add photo")}
      </button>
    </>
  );
}

// ---- Tank vitals strip ----
function TankVitalsStrip() {
  const { CURRENT_PARAMETERS, TANK_CONFIG, MOCK_TODAY } = window.AQUA;
  const daysRunning = Math.round((new Date(MOCK_TODAY) - new Date(TANK_CONFIG.setupDate)) / 86400000);

  // Compute health score from live parameter statuses
  const paramVals = Object.values(CURRENT_PARAMETERS);
  const dangerCount = paramVals.filter((p) => p.status === "danger").length;
  const warnCount = paramVals.filter((p) => p.status === "warn").length;
  const healthScore = Math.max(0, 100 - dangerCount * 25 - warnCount * 10);
  const healthColor = healthScore >= 80 ? "#0E9F6E" : healthScore >= 60 ? "#C77F00" : "#DC4458";

  // Cycle status
  const ammonia = CURRENT_PARAMETERS.ammonia?.value ?? 0;
  const nitrite = CURRENT_PARAMETERS.nitrite?.value ?? 0;
  const cycled = daysRunning >= 30 && ammonia <= 0.25 && nitrite <= 0.1;
  const cycleLabel = daysRunning === 0 ? T("Nuevo", "New") : cycled ? T("Completo", "Complete") : T("En proceso", "In progress");
  const cycleColor = cycled ? "#0E9F6E" : daysRunning === 0 ? "var(--ink-3)" : "#C77F00";
  const cycleIcon = cycled ? "CheckCircle2" : daysRunning === 0 ? "Clock" : "RefreshCw";

  const stats = [
    { label: "Temp", value: `${CURRENT_PARAMETERS.temperature.value}°F`, icon: "Thermometer", color: "#0E9F6E" },
    { label: T("Salinidad", "Salinity"), value: CURRENT_PARAMETERS.salinity.value, icon: "Sailboat", color: "#0E9F6E" },
    { label: T("Volumen", "Volume"), value: TANK_CONFIG.realVolume ? `${TANK_CONFIG.realVolume} gal` : "—", icon: "Container", color: "var(--ink-2)" },
    { label: T("Días activo", "Days running"), value: String(daysRunning), icon: "Calendar", color: "var(--ink-2)" },
    { label: T("Salud", "Health"), value: `${healthScore} / 100`, icon: "Heart", color: healthColor },
    { label: T("Ciclado", "Cycle"), value: cycleLabel, icon: cycleIcon, color: cycleColor },
  ];
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="glass rounded-2xl px-3 py-2 flex items-center gap-2">
          <L name={s.icon} size={13} style={{ color: s.color }} />
          <div className="min-w-0">
            <div className="text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] font-medium">{s.label}</div>
            <div className="text-[12px] text-[var(--ink)] tabular-nums truncate font-medium" style={{ fontFamily: "DM Mono, monospace" }}>{s.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Water Parameters Log (ring gauges, like the reference) ----
function WaterParamsCard({ onNavigate }) {
  const { CURRENT_PARAMETERS, HISTORY } = window.AQUA;
  const [logOpen, setLogOpen] = React.useState(false);
  const ReadingModal = window.LogReadingModal;
  const rings = [
    { k: "ph",        display: CURRENT_PARAMETERS.ph.value.toFixed(1), label: "pH" },
    { k: "temperature", display: `${CURRENT_PARAMETERS.temperature.value}°`, label: "Temp" },
    { k: "kh",        display: CURRENT_PARAMETERS.kh.value.toFixed(1), label: "KH" },
    { k: "calcium",   display: CURRENT_PARAMETERS.calcium.value, label: "Ca" },
    { k: "phosphate", display: CURRENT_PARAMETERS.phosphate.value.toFixed(2), label: "PO₄" },
    { k: "nitrate",   display: CURRENT_PARAMETERS.nitrate.value, label: "NO₃" },
  ];
  const statusSub = (st) => st === "ok" ? T("Óptimo", "Optimal") : st === "warn" ? T("Vigilar", "Watch") : T("Crítico", "Critical");
  const chartKeys = ["ph", "kh", "phosphate"];
  const chartColors = { ph: "#3B82F6", kh: "#C77F00", phosphate: "#DC4458" };

  return (
    <Card className="p-5">
      <SectionHeader
        kicker={T("Registro de agua", "Water Log")}
        title={T("Parámetros del agua", "Water Parameters Log")}
        action={
          <button onClick={() => onNavigate("parameters")} className="text-[11.5px] text-[var(--accent)] hover:opacity-80 inline-flex items-center gap-1">
            {T("Historial completo", "Full history")} <L name="ArrowRight" size={11} />
          </button>
        }
      />

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {rings.map(({ k, display, label }) => {
          const p = CURRENT_PARAMETERS[k];
          return (
            <RingGauge
              key={k}
              value={p.value}
              min={p.idealMin - (p.idealMax - p.idealMin)}
              max={p.idealMax + (p.idealMax - p.idealMin) * 0.5}
              status={p.status}
              display={display}
              label={label}
              sub={statusSub(p.status)}
            />
          );
        })}
      </div>

      {/* 14-day mini multiline */}
      <div className="rounded-2xl bg-[var(--well)] border border-[var(--hairline)] p-3 min-w-0">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-x-3 gap-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)] font-medium">{T("Últimos 14 días", "Last 14 days")}</span>
          <div className="flex items-center gap-2.5 flex-wrap">
            {chartKeys.map((k) => (
              <span key={k} className="inline-flex items-center gap-1 text-[9.5px] text-[var(--ink-2)] whitespace-nowrap">
                <span className="w-2 h-[3px] rounded-full" style={{ background: chartColors[k] }} />
                {CURRENT_PARAMETERS[k].label}
              </span>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 560 72" className="w-full h-auto" preserveAspectRatio="none">
          {chartKeys.map((k) => {
            const data = HISTORY[k];
            const min = Math.min(...data), max = Math.max(...data);
            const range = max - min || 1;
            const pts = data.map((v, i) => `${(i / (data.length - 1)) * 552 + 4},${64 - ((v - min) / range) * 52 + 4}`).join(" ");
            return <polyline key={k} points={pts} fill="none" stroke={chartColors[k]} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />;
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button variant="primary" size="sm" icon="Plus" onClick={() => setLogOpen(true)}>{T("Nueva lectura", "Add New Reading")}</Button>
        <Button variant="ghost" size="sm" icon="ArrowRight" onClick={() => onNavigate("parameters")}>{T("Ver historial", "Full history")}</Button>
      </div>
      {logOpen && ReadingModal && <ReadingModal paramKeys={Object.keys(CURRENT_PARAMETERS)} onClose={() => setLogOpen(false)} />}
    </Card>
  );
}

// ---- Lighting Schedule card ----
function LightingScheduleCard({ onNavigate }) {
  const { LIGHTING_SCHEDULE, LIGHT_CHANNELS } = window.AQUA;
  const currentWeekNum = window.AquaStore?.lightingWeek || 1;
  const wk = LIGHTING_SCHEDULE[Math.min(currentWeekNum - 1, LIGHTING_SCHEDULE.length - 1)];
  const nextWeekNum = currentWeekNum + 1;
  const hasNextWeek = nextWeekNum <= LIGHTING_SCHEDULE.length;
  const nextWk = hasNextWeek ? LIGHTING_SCHEDULE[nextWeekNum - 1] : null;
  const deltaB = hasNextWeek ? (nextWk.channels.B - wk.channels.B) : 0;
  const lightFixture = window.AquaStore?.lightFixture;
  // 24h cycle gradient: night → ramp 7-11 → peak → ramp down 15-21 → night
  const cycleGradient = "linear-gradient(90deg, #283A66 0%, #283A66 27%, #7FB4D9 38%, #FDF3C9 47%, #FDF6D8 58%, #F4C77E 72%, #4A5A92 88%, #283A66 100%)";

  return (
    <Card className="p-5">
      <SectionHeader
        kicker={T("Iluminación", "Lighting")}
        title={T("Programa de luz", "Lighting Schedule")}
        action={
          <button onClick={() => onNavigate("lighting")} className="text-[11.5px] text-[var(--accent)] hover:opacity-80 inline-flex items-center gap-1">
            {T("Ajustar", "Adjust")} <L name="Sliders" size={11} />
          </button>
        }
      />

      {/* Day cycle bar */}
      <div className="relative h-7 rounded-full overflow-hidden border border-[var(--hairline)]" style={{ background: cycleGradient }}>
        <div className="absolute top-1/2 -translate-y-1/2 grid place-items-center w-5 h-5 rounded-full bg-white shadow-md" style={{ left: "44%" }}>
          <L name="Sun" size={12} style={{ color: "#C77F00" }} strokeWidth={2} />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 grid place-items-center w-5 h-5 rounded-full shadow-md" style={{ left: "88%", background: "#1E2B52" }}>
          <L name="Moon" size={11} style={{ color: "#BFD0F2" }} strokeWidth={2} />
        </div>
      </div>
      <div className="flex justify-between mt-1.5 px-1 text-[9.5px] text-[var(--ink-3)] tabular-nums" style={{ fontFamily: "DM Mono, monospace" }}>
        {["00:00", "06:00", "12:00", "18:00", "24:00"].map((t) => <span key={t}>{t}</span>)}
      </div>

      {/* Fixture row */}
      <div className="mt-3 glass-strong rounded-2xl p-3.5 flex items-start gap-3">
        <div className="grid place-items-center w-11 h-11 rounded-xl shrink-0" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
          <L name="Lamp" size={18} className="text-[var(--ink-2)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-[var(--ink)]">
            {lightFixture
              ? [lightFixture.name, lightFixture.wattage ? `${lightFixture.wattage}W` : null].filter(Boolean).join(" ")
              : T("Lámpara LED", "LED Light")}
          </div>
          <div className="text-[11px] text-[var(--ink-2)] mt-0.5">
            {T("Tipo:", "Type:")} {lightFixture?.type?.toUpperCase() || "LED"} · {T("Fase: Aclimatación semana", "Phase: Acclimation week")} {wk.week}
          </div>
          <div className="text-[11px] text-[var(--ink-2)]">
            {T("Horario: 07:00 – 21:00 (rampa azul+blanco)", "Schedule: 7a – 9p (blue+white ramp)")}
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="grid grid-cols-6 gap-1.5 mt-3">
        {LIGHT_CHANNELS.map((ch) => {
          const pct = wk.channels[ch.key];
          return (
            <div key={ch.key} className="rounded-xl bg-[var(--well)] border border-[var(--hairline)] p-1.5 text-center">
              <div className="relative h-10 rounded-md overflow-hidden" style={{ background: "rgba(10,30,48,0.12)" }}>
                <div className="absolute bottom-0 left-0 right-0" style={{ height: `${pct}%`, background: `linear-gradient(180deg, ${ch.color}, ${ch.color}88)` }} />
              </div>
              <div className="text-[9px] mt-1 text-[var(--ink-2)] tabular-nums font-medium" style={{ fontFamily: "DM Mono, monospace" }}>{ch.key} {pct}%</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10.5px] text-[var(--ink-2)]">
        {hasNextWeek ? (
          <span className="inline-flex items-center gap-1.5">
            <L name="CalendarClock" size={12} />
            {T(`Próximo ajuste: Semana ${nextWeekNum}`, `Next adjustment: Week ${nextWeekNum}`)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <L name="CheckCircle2" size={12} style={{ color: "#0E9F6E" }} />
            {T("Protocolo de aclimatación completado", "Acclimation protocol complete")}
          </span>
        )}
        {hasNextWeek && deltaB !== 0 && (
          <span className="tabular-nums" style={{ fontFamily: "DM Mono, monospace" }}>
            {deltaB > 0 ? `+${deltaB}` : deltaB}% B/C
          </span>
        )}
      </div>
    </Card>
  );
}

// ---- Livestock inventory ----
const KIND_AVATAR_COLOR = {
  fish: ["#60A5FA", "#22D3EE"],
  coral: ["#F87171", "#C77F00"],
  cuc: ["#0E9F6E", "#22D3EE"],
};
function LivestockRow({ item, kind, onNavigate }) {
  const s = STATUS_COLOR[item.status];
  const [a, b] = KIND_AVATAR_COLOR[kind] || KIND_AVATAR_COLOR.fish;
  return (
    <button onClick={() => onNavigate("inhabitants")} className="w-full flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-[var(--hover)] transition-colors text-left">
      {/* 40×40 avatar with PhotoSlot overlay */}
      <div style={{ width: 40, height: 40, position: "relative", borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
        {/* Fallback gradient avatar */}
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${a}, ${b})` }}>
          <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{item.name.charAt(0).toUpperCase()}</span>
        </div>
        {/* PhotoSlot overlays the avatar — shows upload UI on hover */}
        <PhotoSlot id={`photo-${item.id}`} radius={12} style={{ position: "absolute", inset: 0 }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium text-[var(--ink)] truncate">{item.name}</div>
        <div className="text-[10.5px] text-[var(--ink-2)] truncate">{item.note}</div>
      </div>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.fg }} />
    </button>
  );
}

function LivestockInventory({ onNavigate }) {
  const { INHABITANTS } = window.AQUA;
  const corals = INHABITANTS.corals.slice(0, 4);
  const others = [...INHABITANTS.fish.slice(0, 3), ...INHABITANTS.cuc.slice(0, 1)];
  const total = INHABITANTS.fish.length + INHABITANTS.corals.length + INHABITANTS.cuc.length;

  if (total === 0) {
    return (
      <Card className="p-5">
        <SectionHeader
          kicker={T("Habitantes", "Livestock")}
          title={T("Inventario de vida", "Livestock Inventory")}
        />
        <div className="py-6 text-center">
          <div className="grid place-items-center w-12 h-12 mx-auto rounded-2xl mb-3" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)" }}>
            <L name="Fish" size={20} style={{ color: "#22D3EE" }} />
          </div>
          <div className="text-[13px] text-[var(--ink)] font-medium mb-1">{T("Aún no hay habitantes", "No inhabitants yet")}</div>
          <div className="text-[11.5px] text-[var(--ink-2)] mb-3">{T("Agrega tus primeros peces, corales o limpiadores", "Add your first fish, corals or clean-up crew")}</div>
          <Button variant="primary" size="sm" icon="Plus" onClick={() => onNavigate("inhabitants")}>{T("Agregar habitante", "Add inhabitant")}</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <SectionHeader
        kicker={T("Habitantes", "Livestock")}
        title={T("Inventario de vida", "Livestock Inventory")}
        action={
          <button onClick={() => onNavigate("inhabitants")} className="text-[11.5px] text-[var(--accent)] hover:opacity-80 inline-flex items-center gap-1">
            {T("Ver todos", "View All")} ({total}) <L name="ArrowRight" size={11} />
          </button>
        }
      />
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
        <div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--ink-3)] font-semibold mb-1.5 px-1.5">{T("Corales", "Corals")}</div>
          <div className="flex flex-col gap-0.5">
            {corals.map((c) => <LivestockRow key={c.id} item={c} kind="coral" onNavigate={onNavigate} />)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--ink-3)] font-semibold mb-1.5 px-1.5">{T("Peces / Inverts", "Inverts/Fish")}</div>
          <div className="flex flex-col gap-0.5">
            {others.map((f) => <LivestockRow key={f.id} item={f} kind="fish" onNavigate={onNavigate} />)}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---- Gallery strip (placeholder — photo feature removed) ----
function GalleryStrip() { return null; }

// ---- Alert card (used here + AlertsPage) ----
function AlertCard({ alert, onDismiss, onCTA, index = 0 }) {
  const s = STATUS_COLOR[alert.severity];
  return (
    <div
      className="relative rounded-3xl p-4 overflow-hidden transition-all glass"
      style={{ animation: `fadeUp 0.45s cubic-bezier(.2,.7,.3,1) ${index * 80}ms both` }}
    >
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: s.fg, opacity: 0.85 }} />
      <div className="flex items-start gap-3 pl-1.5">
        <div className="grid place-items-center w-8 h-8 rounded-xl shrink-0 mt-0.5" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
          <L name={alert.severity === "danger" ? "AlertOctagon" : alert.severity === "warn" ? "AlertTriangle" : "Info"} size={14} style={{ color: s.fg }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[9.5px] uppercase tracking-[0.12em] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.fg }}>{alert.badge}</span>
            <span className="text-[9.5px] uppercase tracking-wider text-[var(--ink-3)]">{alert.tag}</span>
          </div>
          <h3 className="text-[13.5px] font-semibold text-[var(--ink)] mb-1">{alert.title}</h3>
          <p className="text-[12px] text-[var(--ink-2)] leading-relaxed mb-2">{alert.body}</p>

          {alert.progress != null && (
            <div className="mb-2.5 mt-1">
              <div className="flex items-center justify-between text-[10px] text-[var(--ink-2)] mb-1">
                <span>{T("Nivel reservorio", "Reservoir level")}</span>
                <span className="tabular-nums" style={{ fontFamily: "DM Mono, monospace" }}>{alert.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--well)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${alert.progress}%`, background: s.fg }} />
              </div>
            </div>
          )}

          <button onClick={onCTA} className="inline-flex items-center gap-1 text-[12px] font-medium hover:opacity-80 transition-opacity" style={{ color: s.fg }}>
            {alert.cta} <L name="ArrowRight" size={12} />
          </button>
        </div>
        <button
          onClick={onDismiss}
          aria-label={T("Descartar alerta", "Dismiss alert")}
          className="p-1.5 rounded-full text-[var(--ink-3)] hover:bg-[var(--hover)] hover:text-[var(--ink-2)] transition-colors shrink-0"
        >
          <L name="X" size={13} />
        </button>
      </div>
    </div>
  );
}

// ---- Routines timeline ----
function RoutineItem({ routine, done, onToggle, isFirst, isLast, urgent }) {
  const tag = { label: fmtDue(routine.nextDue), color: routine.nextDue === "today" ? "warn" : "info" };
  const ts = STATUS_COLOR[tag.color];
  const nodeColor = urgent ? "#C77F00" : "var(--ink-3)";

  return (
    <div className="relative flex gap-3 group">
      <div className="relative w-4 shrink-0 flex justify-center">
        {!isFirst && <span className="absolute top-0 bottom-1/2 w-px bg-[var(--hairline)]" />}
        {!isLast && <span className="absolute top-1/2 bottom-0 w-px bg-[var(--hairline)]" />}
        <span
          className="relative mt-3.5 w-3 h-3 rounded-full transition-all"
          style={{
            background: done ? "#0E9F6E" : urgent ? nodeColor : "transparent",
            border: `1.5px solid ${done ? "#0E9F6E" : nodeColor}`,
            boxShadow: urgent && !done ? `0 0 0 4px rgba(245,158,11,0.12)` : "none",
          }}
        />
      </div>

      <div className={`flex-1 py-2.5 pr-2 flex items-start gap-3 transition-opacity ${done ? "opacity-50" : ""}`}>
        <div className="grid place-items-center w-8 h-8 rounded-xl bg-[var(--well)] border border-[var(--hairline)] shrink-0">
          <L name={routine.icon} size={14} className="text-[var(--ink-2)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[12.5px] font-medium text-[var(--ink)] transition-all ${done ? "line-through" : ""}`}>{routine.task}</div>
          <div className="text-[11px] text-[var(--ink-2)] truncate">{routine.detail}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md" style={{ background: ts.bg, border: `1px solid ${ts.border}`, color: ts.fg }}>{tag.label}</span>
          <span className="text-[10px] text-[var(--ink-3)] tabular-nums" style={{ fontFamily: "DM Mono, monospace" }}>{routine.time}</span>
        </div>
        <button
          onClick={onToggle}
          aria-label={done ? T("Desmarcar", "Unmark") : T("Marcar completado", "Mark done")}
          className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border grid place-items-center transition-all ${
            done
              ? "bg-[rgba(16,185,129,0.16)] border-[rgba(16,185,129,0.4)] text-[#0E9F6E]"
              : "border-[var(--hairline-strong)] text-transparent hover:border-[var(--accent-border)] hover:text-[var(--accent)]"
          }`}
        >
          <L name="Check" size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function RoutinesTimeline({ items = 6, done: doneProp, onToggle: onToggleProp }) {
  const { ROUTINES } = window.AQUA;
  const list = ROUTINES.slice(0, items);
  const [localDone, setLocalDone] = React.useState({});
  const done = doneProp || localDone;
  const toggle = onToggleProp || ((id) => setLocalDone((p) => ({ ...p, [id]: !p[id] })));

  if (list.length === 0) {
    return (
      <div className="py-5 text-center">
        <div className="grid place-items-center w-10 h-10 mx-auto rounded-xl mb-2" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
          <L name="CalendarCheck" size={16} className="text-[var(--ink-3)]" />
        </div>
        <div className="text-[12px] text-[var(--ink-2)] leading-relaxed">
          {T("Sin rutinas aún.", "No routines yet.")}<br />
          <span className="text-[var(--ink-3)]">{T("Escribe «agrega rutina» en Aqua Buddy", "Say 'add routine' in Aqua Buddy")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {list.map((r, i) => (
        <RoutineItem
          key={r.id}
          routine={r}
          done={!!done[r.id]}
          onToggle={() => toggle(r.id)}
          isFirst={i === 0}
          isLast={i === list.length - 1}
          urgent={r.nextDue === "today"}
        />
      ))}
    </div>
  );
}

// ---- Aqua Buddy widget ----
const QUICK_PROMPTS = () => window.__lang === "en"
  ? ["How to raise KH safely?", "Log KH 9.0", "Remind me to do water change", "Add routine clean glass weekly", "Best corals for beginners?"]
  : ["¿Cómo subir KH sin estrés?", "Registra KH 9.0", "Recuérdame hacer cambio de agua", "Agrega rutina limpiar cristales semanal", "¿Mejores corales para principiantes?"];

const GENERAL_PROMPTS = () => window.__lang === "en"
  ? ["Best corals for beginners?", "How to cycle a new tank?", "SPS vs LPS: what's easier?", "Reef2Reef: most common mistakes?"]
  : ["¿Mejores corales para principiantes?", "¿Cómo ciclar un tanque nuevo?", "¿SPS vs LPS: cuál es más fácil?", "¿Errores más comunes en reef?"];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 150, 300].map((d) => (
        <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${d}ms`, animationDuration: "0.9s" }} />
      ))}
    </div>
  );
}

function AquaBotWidget({ fullPage = false }) {
  const { TANK_CONFIG } = window.AQUA;
  const owner = TANK_CONFIG.owner;
  const [mode, setMode] = React.useState("personalized"); // "personalized" | "general"
  const [messages, setMessages] = React.useState([
    { from: "bot", text: owner
      ? T(
          `¡Hola ${owner}! Soy Aqua Buddy. Puedo registrar lecturas, crear rutinas, buscar información de tu reef o responder preguntas. Prueba: «Registra KH 9.0» o «Recuérdame hacer cambio de agua».`,
          `Hi ${owner}! I'm Aqua Buddy. I can log readings, create routines, research your reef or answer questions. Try: "Log KH 9.0" or "Remind me to do a water change".`
        )
      : T(
          `¡Hola! Soy Aqua Buddy, tu asistente de acuario. Puedo registrar lecturas, crear rutinas o responder cualquier pregunta sobre tu tanque. Prueba: «Registra pH 8.2» o «Agrega rutina limpiar cristales semanal».`,
          `Hi! I'm Aqua Buddy, your aquarium assistant. I can log readings, create routines or answer any question about your tank. Try: "Log pH 8.2" or "Add routine clean glass weekly".`
        )
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const loadingRef = React.useRef(false);
  const scroller = React.useRef(null);
  const historyRef = React.useRef(messages);
  historyRef.current = messages;

  React.useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loadingRef.current) return;
    const newMsg = { from: "user", text: msg };
    setMessages((m) => [...m, newMsg]);
    setInput("");
    loadingRef.current = true;
    setLoading(true);
    const context = historyRef.current.slice(-8); // last 8 messages for context
    const reply = await callAquaBuddy(msg, mode, context);
    setMessages((m) => [...m, { from: "bot", text: reply }]);
    loadingRef.current = false;
    setLoading(false);
  };

  // Other surfaces (AI page suggestions) can hand the widget a question.
  const sendRef = React.useRef(send);
  sendRef.current = send;
  React.useEffect(() => {
    const fn = (e) => sendRef.current(e.detail);
    window.addEventListener("aquabot:ask", fn);
    return () => window.removeEventListener("aquabot:ask", fn);
  }, []);

  const prompts = mode === "personalized" ? QUICK_PROMPTS() : GENERAL_PROMPTS();

  return (
    <Card className="flex flex-col overflow-hidden" style={{ maxHeight: fullPage ? "none" : 520 }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--hairline)]">
        <div className="grid place-items-center w-8 h-8 rounded-xl" style={{ background: "linear-gradient(135deg, var(--accent-soft), rgba(99,102,241,0.16))", border: "1px solid var(--accent-border)" }}>
          <L name="Sparkles" size={14} style={{ color: "var(--accent)" }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[var(--ink)]">Aqua Buddy</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>AI</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-2)]">
            <PulsingDot color="#0E9F6E" size={5} /> {T("En línea · Reef2Reef + tu tanque", "Online · Reef2Reef + your tank")}
          </div>
        </div>
        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
          {[
            { id: "personalized", label: T("Mi tanque", "My tank"), icon: "Fish" },
            { id: "general", label: T("General", "General"), icon: "Globe" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-medium transition-all ${mode === m.id ? "glass-strong text-[var(--ink)]" : "text-[var(--ink-3)] hover:text-[var(--ink-2)]"}`}
            >
              <L name={m.icon} size={10} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "general" && (
        <div className="px-4 py-2 border-b border-[var(--hairline)]" style={{ background: "rgba(99,102,241,0.06)" }}>
          <div className="text-[10.5px] text-[var(--ink-2)] flex items-center gap-1.5">
            <L name="Globe" size={11} style={{ color: "var(--indigo)" }} />
            {T("Modo general — basado en Reef2Reef y mejores prácticas de la comunidad", "General mode — based on Reef2Reef and community best practices")}
          </div>
        </div>
      )}

      <div ref={scroller} className={`flex-1 px-4 py-3 overflow-y-auto space-y-2.5 ${fullPage ? "min-h-[300px]" : "min-h-[200px] max-h-[320px]"}`}>
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.from === "user" ? "justify-end" : ""}`}>
            {m.from === "bot" && (
              <div className="grid place-items-center w-6 h-6 rounded-lg shrink-0 mt-0.5" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
                <L name="Sparkles" size={11} style={{ color: "var(--accent)" }} />
              </div>
            )}
            <div
              className={`max-w-[82%] text-[12px] leading-relaxed rounded-2xl px-3 py-2 text-[var(--ink)] ${m.from === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
              style={m.from === "user"
                ? { background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }
                : { background: "var(--well)", border: "1px solid var(--hairline)" }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="grid place-items-center w-6 h-6 rounded-lg shrink-0 mt-0.5" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
              <L name="Sparkles" size={11} style={{ color: "var(--accent)" }} />
            </div>
            <div className="rounded-2xl rounded-bl-md" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pt-2 pb-3 border-t border-[var(--hairline)] min-w-0 max-w-full">
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 scroller min-w-0">
          {prompts.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-colors hover:brightness-105"
              style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 bg-[var(--well)] border border-[var(--hairline)] rounded-full pl-3 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-[var(--accent-border)] transition-all"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={T("Pregunta a Aqua Buddy…", "Ask Aqua Buddy…")}
            className="flex-1 bg-transparent border-0 outline-none text-[12.5px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="grid place-items-center w-7 h-7 rounded-full text-white disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(160deg, var(--accent), var(--accent-strong))" }}
            aria-label={T("Enviar", "Send")}
          >
            <L name="Send" size={12} />
          </button>
        </form>
      </div>
    </Card>
  );
}

// What each alert's CTA does — shared by the dashboard and the alerts page.
function alertCTAAction(a, navigate, dismiss) {
  if (String(a.id).startsWith("ua")) {
    // recordatorio creado por el usuario → su CTA es "marcar hecho"
    dismiss(a.id);
    window.toast?.(T("Hecho ✓", "Done ✓"));
  } else if (a.id === "a2") {
    dismiss(a.id);
    window.toast?.(T("ATO marcado como repuesto — nivel 100%", "ATO marked refilled — level 100%"));
  } else if (a.severity === "danger") navigate("ai");
  else if (a.id === "a4") navigate("lighting");
  else navigate("parameters");
}

// ---------- Dashboard ----------
function Dashboard({ onNavigate, alerts: allAlerts, onDismissAlert, routinesDone, onToggleRoutine }) {
  const { TANK_CONFIG } = window.AQUA;
  const alerts = (allAlerts || window.AQUA.ALERTS).slice(0, 3);
  const dismiss = onDismissAlert || (() => {});

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4" data-screen-label="Dashboard">
      <ReefStatusHero onNavigate={onNavigate} />

      <TankVitalsStrip />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4 min-w-0">
          <WaterParamsCard onNavigate={onNavigate} />

          <div>
            <SectionHeader
              kicker={T("Centro de alertas", "Alert center")}
              title={T("Lo que necesita acción", "What needs action")}
              action={
                <button onClick={() => onNavigate("alerts")} className="text-[11.5px] text-[var(--ink-2)] hover:text-[var(--ink)] inline-flex items-center gap-1">
                  {T("Ver todas", "View all")} <L name="ArrowRight" size={11} />
                </button>
              }
            />
            <div className="space-y-2.5">
              {alerts.length === 0 && (
                <Card className="p-6 text-center">
                  <div className="grid place-items-center w-10 h-10 mx-auto rounded-xl mb-2" style={{ background: "rgba(16,185,129,0.13)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <L name="CheckCircle2" size={18} style={{ color: "#0E9F6E" }} />
                  </div>
                  <div className="text-[13px] text-[var(--ink)] font-medium">{T("Sin alertas activas", "No active alerts")}</div>
                  <div className="text-[11.5px] text-[var(--ink-2)] mt-1">{T("Tu reef está estable. Vuelve a registrar parámetros en 24h.", "Your reef is stable. Log parameters again in 24h.")}</div>
                </Card>
              )}
              {alerts.map((a, i) => (
                <AlertCard
                  key={a.id}
                  alert={a}
                  index={i}
                  onDismiss={() => dismiss(a.id)}
                  onCTA={() => alertCTAAction(a, onNavigate, dismiss)}
                />
              ))}
            </div>
          </div>

          <LivestockInventory onNavigate={onNavigate} />
        </div>

        <div className="lg:col-span-2 space-y-4 min-w-0">
          <LightingScheduleCard onNavigate={onNavigate} />

          <Card className="p-4">
            <SectionHeader
              kicker={T("Rutinas", "Routines")}
              title={T("Hoy y próximos días", "Today & coming days")}
              action={
                <button onClick={() => onNavigate("routines")} className="text-[11.5px] text-[var(--accent)] hover:opacity-80 inline-flex items-center gap-1">
                  {T("Calendario", "Calendar")} <L name="ArrowRight" size={11} />
                </button>
              }
            />
            <RoutinesTimeline items={5} done={routinesDone} onToggle={onToggleRoutine} />
          </Card>

          <AquaBotWidget />
        </div>
      </div>

      <GalleryStrip />

      {/* Store card — only shown when the user has configured a local store */}
      {TANK_CONFIG.localStore?.name && (
        <Card className="p-4 lg:p-5 flex items-center gap-4 flex-wrap">
          <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: "rgba(99,102,241,0.13)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <L name="Store" size={16} style={{ color: "var(--indigo)" }} />
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] font-semibold">{T("Tienda local", "Local store")} · {TANK_CONFIG.localStore.name}</div>
            {TANK_CONFIG.localStore.restock && <div className="text-[13.5px] text-[var(--ink)] font-medium">{TANK_CONFIG.localStore.restock}</div>}
            {TANK_CONFIG.localStore.address && <div className="text-[11.5px] text-[var(--ink-2)]">{TANK_CONFIG.localStore.address}</div>}
          </div>
          {TANK_CONFIG.localStore.address && (
            <Button
              variant="secondary"
              icon="MapPin"
              onClick={() => window.open("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(TANK_CONFIG.localStore.address), "_blank", "noopener")}
            >
              {T("Ver mapa", "View map")}
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

Object.assign(window, {
  Dashboard, AlertCard, AquaBotWidget, RoutinesTimeline, RoutineItem,
  ReefStatusHero, WaterParamsCard, LightingScheduleCard, LivestockInventory, GalleryStrip,
  TankVitalsStrip, PARAM_ICON, callAquaBot, callAquaBuddy, localAquaBuddy, localAquaBot, alertCTAAction, applyAquaCommand,
  AQUA_TOOLS, executeAquaTool, callGroq, buildAquaBuddyPrompt,
});
