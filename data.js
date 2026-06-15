// AquaMind data — template for new users (starts empty; user fills in their own data)
window.AQUA = (() => {
  const MOCK_TODAY = new Date().toISOString().slice(0, 10);

  // Single generic tank — user renames/configures during onboarding
  const ALL_TANKS = [
    {
      id: "tank-001",
      name: "Mi Acuario",
      type: "saltwater",
      displayVolume: 0,
      realVolume: 0,
      location: "",
      brand: "",
      localStore: {},
      setupDate: MOCK_TODAY,
      owner: "",
      online: true,
    },
  ];

  const TANK_CONFIG = ALL_TANKS[0];

  // Parameters — all at ideal values, no owner-specific notes
  const CURRENT_PARAMETERS = {
    ph:          { label: "pH",          value: 8.2,   unit: "",     idealMin: 8.1,  idealMax: 8.3,  status: "ok", trend: "flat", note: "" },
    kh:          { label: "KH",          value: 9.0,   unit: "dKH",  idealMin: 8,    idealMax: 10,   status: "ok", trend: "flat", note: "" },
    phosphate:   { label: "Fosfatos",    value: 0.06,  unit: "ppm",  idealMin: 0.03, idealMax: 0.10, status: "ok", trend: "flat", note: "" },
    calcium:     { label: "Calcio",      value: 420,   unit: "mg/L", idealMin: 380,  idealMax: 450,  status: "ok", trend: "flat", note: "" },
    nitrate:     { label: "Nitratos",    value: 5,     unit: "ppm",  idealMin: 0,    idealMax: 20,   status: "ok", trend: "flat", note: "" },
    nitrite:     { label: "Nitritos",    value: 0,     unit: "ppm",  idealMin: 0,    idealMax: 0.1,  status: "ok", trend: "flat", note: "" },
    ammonia:     { label: "Amonio",      value: 0,     unit: "ppm",  idealMin: 0,    idealMax: 0.25, status: "ok", trend: "flat", note: "" },
    temperature: { label: "Temperatura", value: 78,    unit: "°F",   idealMin: 76,   idealMax: 80,   status: "ok", trend: "flat", note: "" },
    salinity:    { label: "Salinidad",   value: 1.025, unit: "SG",   idealMin: 1.024,idealMax: 1.026,status: "ok", trend: "flat", note: "" },
    magnesium:   { label: "Magnesio",    value: 1300,  unit: "mg/L", idealMin: 1250, idealMax: 1350, status: "ok", trend: "flat", note: "" },
  };

  // 14-day history — stable baseline values all within ideal range
  const HISTORY = {
    ph:          [8.20,8.21,8.20,8.19,8.21,8.20,8.20,8.21,8.20,8.20,8.21,8.20,8.21,8.20],
    kh:          [9.0, 9.0, 9.1, 9.0, 8.9, 9.0, 9.0, 9.1, 9.0, 9.0, 9.0, 9.1, 9.0, 9.0],
    phosphate:   [0.06,0.06,0.07,0.06,0.06,0.07,0.06,0.06,0.07,0.06,0.06,0.06,0.07,0.06],
    calcium:     [418, 420, 421, 420, 419, 420, 421, 420, 420, 421, 420, 419, 420, 420],
    nitrate:     [5,   5,   5,   6,   5,   5,   4,   5,   5,   6,   5,   5,   5,   5],
    nitrite:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ammonia:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    temperature: [78.0,78.1,78.0,78.2,78.0,78.1,78.0,78.0,78.1,78.0,78.2,78.0,78.1,78.0],
    salinity:    [1.025,1.025,1.025,1.025,1.025,1.025,1.025,1.025,1.025,1.025,1.025,1.025,1.025,1.025],
    magnesium:   [1298,1300,1301,1300,1299,1300,1300,1301,1300,1300,1301,1300,1299,1300],
  };

  // Empty inhabitants — user adds their own
  const INHABITANTS = { fish: [], corals: [], cuc: [] };

  // Generic equipment — user adds their own
  const EQUIPMENT = [];

  const LIGHTING_SCHEDULE = [
    { week: 1, startDate: MOCK_TODAY, channels: { A: 10, B: 35, C: 35, D: 30, E: 10, F: 5 } },
    { week: 2, startDate: MOCK_TODAY, channels: { A: 12, B: 50, C: 50, D: 45, E: 12, F: 5 } },
    { week: 3, startDate: MOCK_TODAY, channels: { A: 15, B: 65, C: 65, D: 60, E: 15, F: 8 } },
    { week: 4, startDate: MOCK_TODAY, channels: { A: 18, B: 80, C: 80, D: 75, E: 18, F: 10 } },
  ];

  const LIGHT_CHANNELS = [
    { key: "A", name: "UV / Violeta",  color: "#7C3AED", description: "Fluorescencia y crecimiento" },
    { key: "B", name: "Azul Royal",    color: "#3B82F6", description: "Fotosíntesis primaria" },
    { key: "C", name: "Azul",          color: "#60A5FA", description: "Color y profundidad" },
    { key: "D", name: "Cyan",          color: "#22D3EE", description: "Transición espectro" },
    { key: "E", name: "Blanco",        color: "#F1F5F9", description: "Visibilidad y daylight" },
    { key: "F", name: "Rojo",          color: "#F87171", description: "Pigmentos rojos / LPS" },
  ];

  // No pre-populated routines — user adds their own
  const ROUTINES = [];

  const ALERTS = [];

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
