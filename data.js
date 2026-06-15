// AquaMind mock data — single source of truth
window.AQUA = (() => {
  // The dataset is a coherent snapshot of this date; "today" everywhere means this.
  const MOCK_TODAY = "2026-05-20";

  // Multi-tank registry — the active tank is selected via AquaStore.activeTankId
  const ALL_TANKS = [
    {
      id: "tank-001",
      name: "20G High Reef",
      type: "saltwater",
      displayVolume: 20,
      realVolume: 23,
      location: "Columbus, Ohio",
      localStore: { name: "Matt's Corals", address: "265 Lincoln Cir B, Gahanna", rodiPricePerGal: 0.75 },
      setupDate: "2026-05-01",
      owner: "Jeffrey",
      online: true,
    },
    {
      id: "tank-002",
      name: "Planted 10G",
      type: "freshwater",
      displayVolume: 10,
      realVolume: 10,
      location: "Columbus, Ohio",
      localStore: { name: "Matt's Corals", address: "265 Lincoln Cir B, Gahanna", rodiPricePerGal: 0.75 },
      setupDate: "2026-04-10",
      owner: "Jeffrey",
      online: true,
    },
  ];

  const TANK_CONFIG = ALL_TANKS[0];

  // status: ok | warn | danger | info
  const CURRENT_PARAMETERS = {
    ph:          { label: "pH",          value: 7.9,   unit: "",     idealMin: 8.1,  idealMax: 8.3,  status: "warn",   trend: "down",   note: "Descendente 3 días" },
    kh:          { label: "KH",          value: 7.0,   unit: "dKH",  idealMin: 8,    idealMax: 10,   status: "warn",   trend: "down",   note: "Buffer en corrección" },
    phosphate:   { label: "Fosfatos",    value: 0.25,  unit: "ppm",  idealMin: 0.03, idealMax: 0.10, status: "danger", trend: "up",     note: "PhosGuard activo" },
    calcium:     { label: "Calcio",      value: 400,   unit: "mg/L", idealMin: 380,  idealMax: 450,  status: "ok",     trend: "flat",   note: "Estable" },
    nitrate:     { label: "Nitratos",    value: 5,     unit: "ppm",  idealMin: 0,    idealMax: 20,   status: "ok",     trend: "flat",   note: "En rango" },
    nitrite:     { label: "Nitritos",    value: 0,     unit: "ppm",  idealMin: 0,    idealMax: 0.1,  status: "ok",     trend: "flat",   note: "Indetectable" },
    ammonia:     { label: "Amonio",      value: 0,     unit: "ppm",  idealMin: 0,    idealMax: 0.25, status: "ok",     trend: "flat",   note: "Indetectable" },
    temperature: { label: "Temperatura", value: 79,    unit: "°F",   idealMin: 76,   idealMax: 80,   status: "ok",     trend: "flat",   note: "Estable" },
    salinity:    { label: "Salinidad",   value: 1.025, unit: "SG",   idealMin: 1.024,idealMax: 1.026,status: "ok",     trend: "flat",   note: "En rango" },
    magnesium:   { label: "Magnesio",    value: 1320,  unit: "mg/L", idealMin: 1250, idealMax: 1350, status: "ok",     trend: "flat",   note: "Estable" },
  };

  // 14-day history (last index = today)
  const HISTORY = {
    ph:          [8.05, 8.04, 8.02, 8.03, 8.02, 8.00, 8.01, 7.98, 7.99, 7.97, 7.95, 7.93, 7.92, 7.90],
    kh:          [8.4,  8.3,  8.2,  8.1,  8.0,  7.9,  7.8,  7.7,  7.6,  7.5,  7.4,  7.3,  7.1,  7.0],
    phosphate:   [0.08, 0.09, 0.10, 0.12, 0.13, 0.14, 0.16, 0.18, 0.19, 0.21, 0.22, 0.23, 0.24, 0.25],
    calcium:     [395,  398,  402,  399,  401,  400,  403,  402,  400,  399,  401,  400,  400,  400],
    nitrate:     [3,    4,    4,    5,    5,    4,    5,    6,    5,    5,    4,    5,    5,    5],
    nitrite:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ammonia:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    temperature: [78.6, 78.8, 79.1, 79.0, 78.7, 78.9, 79.2, 79.0, 78.8, 79.1, 79.0, 78.9, 79.0, 79.0],
    salinity:    [1.025,1.025,1.025,1.024,1.025,1.026,1.025,1.025,1.025,1.025,1.025,1.025,1.025,1.025],
    magnesium:   [1280,1290,1295,1300,1305,1310,1305,1315,1318,1320,1322,1320,1321,1320],
  };

  const INHABITANTS = {
    fish: [
      { id: "f1", name: "Yellow Watchman Goby", scientific: "Cryptocentrus cinctus", added: "2026-05-04", status: "warn",   note: "Recuperándose, aletas dañadas" },
      { id: "f2", name: "Clownfish × 2",        scientific: "Amphiprion ocellaris",  added: "2026-05-04", status: "ok",     note: "Saludables, activos" },
      { id: "f3", name: "6-Line Wrasse",        scientific: "Pseudocheilinus hexataenia", added: "2026-05-09", status: "ok", note: "Activo, sin problemas" },
      { id: "f4", name: "Tailspot Blenny",      scientific: "Ecsenius stigmatura",   added: "2026-05-12", status: "ok",     note: "Normal" },
    ],
    corals: [
      { id: "c1",  name: "Pink BTA × 2",         scientific: "Entacmaea quadricolor", added: "2026-05-06", status: "ok",     note: "Mejorando, tentáculos saliendo" },
      { id: "c2",  name: "BTA escondida",        scientific: "Entacmaea quadricolor", added: "2026-05-06", status: "warn",   note: "Split reciente — escondida en Xenia" },
      { id: "c3",  name: "Pulsing Xenia",        scientific: "Xenia elongata",        added: "2026-05-06", status: "ok",     note: "Pulsando normal" },
      { id: "c4",  name: "Kenya Tree",           scientific: "Capnella sp.",          added: "2026-05-06", status: "ok",     note: "Expandido" },
      { id: "c5",  name: "Mushroom naranja/rosa",scientific: "Discosoma sp.",         added: "2026-05-08", status: "ok",     note: "Expandido" },
      { id: "c6",  name: "Hairy Green Mushroom", scientific: "Rhodactis indosinensis",added: "2026-05-08", status: "warn",   note: "Decaído — mover a menor flujo" },
      { id: "c7",  name: "GSP",                  scientific: "Pachyclavularia violacea",added: "2026-05-10", status: "ok",   note: "Creciendo bien" },
      { id: "c8",  name: "Coral verde esqueleto",scientific: "Sin identificar",       added: "2026-05-10", status: "danger", note: "Blanqueando — sin identificar" },
      { id: "c9",  name: "Birdsnest",            scientific: "Seriatopora hystrix",   added: "2026-05-10", status: "danger", note: "Blanqueando — KH bajo + apagón reciente" },
      { id: "c10", name: "Hammer",               scientific: "Euphyllia ancora",      added: "2026-05-12", status: "ok",     note: "Expandido" },
      { id: "c11", name: "Torch",                scientific: "Euphyllia glabrescens", added: "2026-05-12", status: "ok",     note: "Expandido" },
      { id: "c12", name: "Candy Cane",           scientific: "Caulastrea furcata",    added: "2026-05-14", status: "ok",     note: "Normal" },
    ],
    cuc: [
      { id: "cuc1", name: "Turbo Snails × 3", scientific: "Turbo fluctuosa",    added: "2026-05-03", status: "ok", note: "Trabajando algas" },
      { id: "cuc2", name: "Hermit Crabs × 5", scientific: "Clibanarius tricolor", added: "2026-05-03", status: "ok", note: "Activos" },
      { id: "cuc3", name: "Emerald Crab × 1", scientific: "Mithraculus sculptus", added: "2026-05-05", status: "ok", note: "Trabajando bubble algae" },
    ],
  };

  const EQUIPMENT = [
    { id: "eq1", name: "Smatfarm G5 95W",   type: "lighting", status: "ok",   installed: "2026-05-15", nextAction: "Ajuste sem 3", nextDate: "2026-05-29" },
    { id: "eq2", name: "Fluval Sea Nano",    type: "skimmer",  status: "ok",   installed: "2026-05-16", nextAction: "Limpiar copa", nextDate: "2026-05-21" },
    { id: "eq3", name: "ATO System",         type: "ato",      status: "warn", installed: null,         nextAction: "Reponer RODI — 15% restante", nextDate: "today" },
    { id: "eq4", name: "Carbón Fluval",      type: "media",    status: "ok",   installed: "2026-05-18", nextAction: "Reemplazar", nextDate: "2026-06-18" },
    { id: "eq5", name: "PhosGuard Seachem",  type: "media",    status: "ok",   installed: "2026-05-18", nextAction: "Reemplazar", nextDate: "2026-07-01" },
    { id: "eq6", name: "Reef Buffer Seachem",type: "additive", status: "warn", installed: "2026-05-18", nextAction: "Dosificar 7 ml", nextDate: "today" },
    { id: "eq7", name: "Wave makers",        type: "flow",     status: "ok",   installed: null,         nextAction: null, nextDate: null },
    { id: "eq8", name: "Bomba emergencia",   type: "pump",     status: "ok",   installed: null,         nextAction: "5–6h autonomía", nextDate: null },
  ];

  const LIGHTING_SCHEDULE = [
    { week: 1, startDate: "2026-05-15", channels: { A: 10, B: 35, C: 35, D: 30, E: 10, F: 5 } },
    { week: 2, startDate: "2026-05-22", channels: { A: 12, B: 50, C: 50, D: 45, E: 12, F: 5 } },
    { week: 3, startDate: "2026-05-29", channels: { A: 15, B: 65, C: 65, D: 60, E: 15, F: 8 } },
    { week: 4, startDate: "2026-06-05", channels: { A: 18, B: 80, C: 80, D: 75, E: 18, F: 10 } },
  ];

  const LIGHT_CHANNELS = [
    { key: "A", name: "UV / Violeta",  color: "#7C3AED", description: "Fluorescencia y crecimiento" },
    { key: "B", name: "Azul Royal",    color: "#3B82F6", description: "Fotosíntesis primaria" },
    { key: "C", name: "Azul",          color: "#60A5FA", description: "Color y profundidad" },
    { key: "D", name: "Cyan",          color: "#22D3EE", description: "Transición espectro" },
    { key: "E", name: "Blanco",        color: "#F1F5F9", description: "Visibilidad y daylight" },
    { key: "F", name: "Rojo",          color: "#F87171", description: "Pigmentos rojos / LPS" },
  ];

  const ROUTINES = [
    { id: "r1", task: "Alimentar BTAs",         detail: "Omega One, jeringa directa",  frequency: "3x/semana",   nextDue: "today",      time: "18:00", icon: "Fish" },
    { id: "r2", task: "Alimentar corales LPS",  detail: "Brightwell NRG+ 2 ml",        frequency: "días alternos",nextDue: "today",      time: "20:00", icon: "Sparkles" },
    { id: "r7", task: "Dosis Reef Buffer",      detail: "7 ml · KH en corrección",     frequency: "diario",      nextDue: "today",      time: "21:30", icon: "Droplets" },
    { id: "r3", task: "Limpiar copa Skimmer",   detail: "Fluval Sea Nano",             frequency: "semanal",     nextDue: "2026-05-21", time: "09:00", icon: "Wind" },
    { id: "r4", task: "Cambio de agua 25%",     detail: "~5-6 gal, Instant Ocean",     frequency: "quincenal",   nextDue: "2026-06-01", time: "10:00", icon: "Waves" },
    { id: "r5", task: "Reemplazar carbón",      detail: "Fluval, mensual",             frequency: "mensual",     nextDue: "2026-06-18", time: "11:00", icon: "Leaf" },
    { id: "r6", task: "Reemplazar PhosGuard",   detail: "Seachem, 1/3 paquete",        frequency: "6-8 semanas", nextDue: "2026-07-01", time: "11:00", icon: "FlaskConical" },
  ];

  const ALERTS = [
    {
      id: "a1",
      severity: "danger",
      badge: "CRÍTICO",
      title: "Birdsnest blanqueando rápido",
      body: "KH cayó a 7.0 dKH (ideal 8–10) + apagón de 6h ayer. Tejido perdiendo color en la base.",
      cta: "Ver plan de dosificación",
      tag: "Coral · c9",
    },
    {
      id: "a2",
      severity: "warn",
      badge: "AVISO",
      title: "ATO al 15% — reponer RODI",
      body: "A este ritmo se vacía en ~36h. Matt's Corals vende RODI a $0.75/gal.",
      cta: "Marcar como repuesto",
      tag: "Equipo · ATO",
      progress: 15,
    },
    {
      id: "a3",
      severity: "warn",
      badge: "AVISO",
      title: "Fosfatos en ascenso continuo",
      body: "0.25 ppm hoy (ideal 0.03–0.10). PhosGuard instalado hace 2 días — vigilar 48h más.",
      cta: "Preguntar a Aqua Buddy",
      tag: "Parámetro · PO₄",
    },
    {
      id: "a4",
      severity: "info",
      badge: "INFO",
      title: "Cambio de programación de luces el viernes",
      body: "Semana 3 inicia 2026-05-29 — incremento a 65% en canales B/C.",
      cta: "Ver calendario",
      tag: "Iluminación · Smatfarm G5",
    },
  ];

  // Log a new reading: append to history (new array ref so memoized charts refresh)
  // and recompute value/status/trend/note in place.
  function logReading(key, value) {
    const p = CURRENT_PARAMETERS[key];
    if (!p || !isFinite(value)) return;
    const prev = p.value;
    HISTORY[key] = [...(HISTORY[key] || []).slice(1), value];
    const span = (p.idealMax - p.idealMin) || 1;
    const dev = value < p.idealMin ? p.idealMin - value : value > p.idealMax ? value - p.idealMax : 0;
    p.value = value;
    p.status = dev === 0 ? "ok" : dev <= span ? "warn" : "danger";
    p.trend = Math.abs(value - prev) < span * 0.02 ? "flat" : value > prev ? "up" : "down";
    const t = window.T || ((a) => a);
    p.note = p.status === "ok" ? t("En rango", "In range")
      : p.status === "warn" ? t("Vigilar tendencia", "Watch the trend")
      : t("Fuera de rango", "Out of range");
  }

  return {
    MOCK_TODAY, ALL_TANKS, TANK_CONFIG, CURRENT_PARAMETERS, HISTORY, INHABITANTS, EQUIPMENT,
    LIGHTING_SCHEDULE, LIGHT_CHANNELS, ROUTINES, ALERTS, logReading
  };
})();
