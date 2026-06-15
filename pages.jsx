// Secondary pages: Parameters, Inhabitants, Lighting, Routines, Aqua Buddy full chat, Alerts

// Generate a 30-day history series from a 14-day base
function expand30(base) {
  if (!base) return [];
  const out = [];
  for (let i = 0; i < 30; i++) {
    const idx = Math.floor(i * (base.length - 1) / 29);
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.01 * Math.abs(base[idx] || 1);
    out.push(+(base[idx] + noise).toFixed(3));
  }
  return out;
}

// ---------------------------- LOG READING MODAL ----------------------------
// Logs one or many readings; data layer recomputes status/trend, then we
// broadcast aqua:data so the app shell re-renders every chart and gauge.
function LogReadingModal({ paramKeys, onClose }) {
  const { CURRENT_PARAMETERS } = window.AQUA;
  const [vals, setVals] = useState({});
  useEscape(onClose);
  const firstRef = useRef(null);
  useEffect(() => { firstRef.current?.focus(); }, []);

  const entries = Object.entries(vals).filter(([, v]) => v !== "" && isFinite(+v));
  const save = () => {
    if (!entries.length) return;
    entries.forEach(([k, v]) => window.AQUA.logReading(k, +v));
    window.dispatchEvent(new Event("aqua:data"));
    window.toast?.(
      entries.length === 1
        ? T(`Lectura de ${CURRENT_PARAMETERS[entries[0][0]].label} registrada`, `${CURRENT_PARAMETERS[entries[0][0]].label} reading logged`)
        : T(`${entries.length} lecturas registradas`, `${entries.length} readings logged`)
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-[var(--scrim)] backdrop-blur" onClick={onClose}>
      <Card
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={T("Registrar lecturas", "Log readings")}
        className="w-full max-w-md overflow-hidden glass-strong"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center w-8 h-8 rounded-xl" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
              <L name="FlaskConical" size={14} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div className="text-[13.5px] font-semibold text-[var(--ink)]">{T("Registrar lecturas", "Log readings")}</div>
              <div className="text-[10.5px] text-[var(--ink-2)]">{fmtLongDate(window.AQUA.MOCK_TODAY)} · {T("deja en blanco lo que no midas", "leave blank what you didn't test")}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label={T("Cerrar", "Close")} className="p-1.5 rounded-full hover:bg-[var(--hover)] text-[var(--ink-2)]"><L name="X" size={14} /></button>
        </div>

        <div className="p-4 max-h-[55vh] overflow-y-auto space-y-2">
          {paramKeys.map((k, i) => {
            const p = CURRENT_PARAMETERS[k];
            if (!p) return null;
            return (
              <label key={k} className="flex items-center gap-3 rounded-2xl bg-[var(--well)] border border-[var(--hairline)] px-3 py-2.5 focus-within:ring-1 focus-within:ring-[var(--accent-border)] transition-all cursor-text">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[var(--ink)]">{p.label}</div>
                  <div className="text-[10px] text-[var(--ink-3)] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                    {T("ideal", "ideal")} {p.idealMin}–{p.idealMax}{p.unit && ` ${p.unit}`}
                  </div>
                </div>
                <input
                  ref={i === 0 ? firstRef : undefined}
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder={String(p.value)}
                  value={vals[k] ?? ""}
                  onChange={(e) => setVals((prev) => ({ ...prev, [k]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") save(); }}
                  className="w-24 bg-transparent border-0 outline-none text-right text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-3)] tabular-nums"
                  style={{ fontFamily: "var(--font-mono)" }}
                  aria-label={p.label}
                />
                <span className="text-[10.5px] text-[var(--ink-3)] w-9">{p.unit || " "}</span>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--hairline)]">
          <Button variant="ghost" onClick={onClose}>{T("Cancelar", "Cancel")}</Button>
          <Button variant="primary" icon="Check" disabled={!entries.length} onClick={save}>
            {T("Guardar", "Save")}{entries.length > 0 && ` (${entries.length})`}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------- CSV EXPORT ----------------------------
function exportParamsCSV() {
  const { HISTORY, CURRENT_PARAMETERS } = window.AQUA;
  const keys = Object.keys(HISTORY);
  const len = Math.max(...keys.map((k) => HISTORY[k].length));
  const header = ["day", ...keys.map((k) => `${k}${CURRENT_PARAMETERS[k]?.unit ? ` (${CURRENT_PARAMETERS[k].unit})` : ""}`)];
  const rows = [header.join(",")];
  for (let i = 0; i < len; i++) {
    rows.push([`-${len - 1 - i}d`, ...keys.map((k) => HISTORY[k][i] ?? "")].join(","));
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aquamind-parametros.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  window.toast?.(T("CSV exportado — 14 días, 10 parámetros", "CSV exported — 14 days, 10 parameters"), { icon: "FileDown" });
}

// ---------------------------- PARAMETERS PAGE ----------------------------
function LineChartFull({ data, color = "#0E9F6E", idealMin, idealMax, height = 220, width = 760 }) {
  // SVG line chart with ideal band
  const pad = { top: 16, right: 12, bottom: 24, left: 36 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const min = Math.min(...data, idealMin) * 0.96;
  const max = Math.max(...data, idealMax) * 1.04;
  const range = max - min || 1;
  const x = (i) => pad.left + (i / (data.length - 1)) * W;
  const y = (v) => pad.top + H - ((v - min) / range) * H;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const fill = `${path} L${x(data.length - 1)},${pad.top + H} L${x(0)},${pad.top + H} Z`;
  const idealTop = y(idealMax);
  const idealBottom = y(idealMin);
  const gradId = `fillg-${Math.round(Math.random() * 1e6)}`;
  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + (range * i) / yTicks);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* ideal band */}
      <rect x={pad.left} y={idealTop} width={W} height={Math.max(0, idealBottom - idealTop)} fill="#0E9F6E" opacity="0.06" />
      <line x1={pad.left} x2={pad.left + W} y1={idealTop} y2={idealTop} stroke="#0E9F6E" strokeOpacity="0.3" strokeDasharray="3 4" />
      <line x1={pad.left} x2={pad.left + W} y1={idealBottom} y2={idealBottom} stroke="#0E9F6E" strokeOpacity="0.3" strokeDasharray="3 4" />
      {/* y ticks */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.left} x2={pad.left + W} y1={y(t)} y2={y(t)} stroke="#7C90A3" strokeOpacity="0.4" />
          <text x={pad.left - 6} y={y(t) + 3} fontSize="9" fill="#7C90A3" textAnchor="end" fontFamily="DM Mono">{t.toFixed(2)}</text>
        </g>
      ))}
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* last point */}
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="4" fill={color} />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="8" fill={color} opacity="0.18" />
      {/* x labels */}
      {[0, 7, 14, 21, 29].map((i) => (
        <text key={i} x={x(i)} y={height - 6} fontSize="9" fill="#7C90A3" textAnchor="middle" fontFamily="DM Mono">
          {`-${29 - i}d`}
        </text>
      ))}
    </svg>
  );
}

function ParameterDetailRow({ paramKey, param, onAskAI, onLog }) {
  // param.value in deps: a freshly logged reading must rebuild the series.
  const history30 = useMemo(() => expand30(window.AQUA.HISTORY[paramKey]), [paramKey, param.value]);
  const s = STATUS_COLOR[param.status];
  const decimals = String(param.value).split(".")[1]?.length || 0;
  const iconName = window.PARAM_ICON[paramKey] || "Activity";
  const last10 = history30.slice(-10).reverse();

  return (
    <Card className="p-5">
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-9 h-9 rounded-xl" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <L name={iconName} size={15} style={{ color: s.fg }} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)]">{paramKey}</div>
                <h3 className="text-[15px] font-medium text-[var(--ink)]">{param.label}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={param.status} />
              <Button size="sm" variant="secondary" icon="Plus" onClick={() => onLog(paramKey)}>{T("Registrar lectura","Log reading")}</Button>
              <Button size="sm" variant="primary" icon="Sparkles" onClick={() => onAskAI(paramKey, param)}>{T("Preguntar a Aqua Buddy","Ask Aqua Buddy")}</Button>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-4">
            <div className="text-[40px] font-medium text-[var(--ink)] tabular-nums leading-none" style={{ fontFamily: "var(--font-mono)" }}>
              {param.value.toFixed(decimals)}
            </div>
            <div className="text-[13px] text-[var(--ink-2)]">{param.unit}</div>
            <div className="ml-auto text-[11px] text-[var(--ink-2)] flex items-center gap-3">
              <span>Ideal <span className="text-[var(--ink)] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{param.idealMin}–{param.idealMax}</span></span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400/60" /> {T("Banda óptima","Optimal band")}</span>
            </div>
          </div>

          <LineChartFull data={history30} color={s.fg} idealMin={param.idealMin} idealMax={param.idealMax} />
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-[var(--hairline)] lg:pl-5 pt-4 lg:pt-0">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-2">{T("Últimas 10 lecturas","Last 10 readings")}</div>
          <div className="space-y-1">
            {last10.map((v, i) => {
              const prev = last10[i + 1];
              const delta = prev != null ? v - prev : null;
              const within = v >= param.idealMin && v <= param.idealMax;
              // Green when the change moved the reading toward the ideal band, amber when away.
              const target = (param.idealMin + param.idealMax) / 2;
              const deltaColor = delta == null || delta === 0 ? "#7C90A3"
                : Math.abs(v - target) < Math.abs(prev - target) ? "#0E9F6E" : "#C77F00";
              return (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--hover)] transition-colors text-[11.5px]">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: within ? "#0E9F6E" : "#C77F00" }} />
                  <span className="text-[var(--ink-3)] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>-{i}d</span>
                  <span className="ml-auto text-[var(--ink)] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{v.toFixed(decimals)}{param.unit && ` ${param.unit}`}</span>
                  {delta != null && (
                    <span className="text-[10.5px] tabular-nums w-12 text-right" style={{ fontFamily: "var(--font-mono)", color: deltaColor }}>
                      {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(decimals)}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ParametersPage({ onNavigate }) {
  const { CURRENT_PARAMETERS } = window.AQUA;
  const order = ["ph", "kh", "phosphate", "calcium", "magnesium", "nitrate", "temperature", "salinity", "ammonia", "nitrite"];
  // null = closed · "all" = every parameter · paramKey = just that one
  const [logTarget, setLogTarget] = useState(null);

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">{T("Parámetros · 30 días","Parameters · 30 days")}</div>
          <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">{T("Historial completo del tanque","Complete tank history")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon="Download" size="sm" onClick={exportParamsCSV}>{T("Exportar CSV","Export CSV")}</Button>
          <Button variant="primary" icon="Plus" size="sm" onClick={() => setLogTarget("all")}>{T("Registrar todas","Log all")}</Button>
        </div>
      </div>

      <div className="space-y-3">
        {order.map((k) => (
          <ParameterDetailRow key={k} paramKey={k} param={CURRENT_PARAMETERS[k]} onAskAI={() => onNavigate("ai")} onLog={setLogTarget} />
        ))}
      </div>

      {logTarget && (
        <LogReadingModal
          paramKeys={logTarget === "all" ? order : [logTarget]}
          onClose={() => setLogTarget(null)}
        />
      )}
    </div>
  );
}

// ---------------------------- INHABITANTS PAGE ----------------------------
function InhabitantCard({ item, kind, onDiagnose }) {
  const s = STATUS_COLOR[item.status];
  const iconByKind = { fish: "Fish", coral: "Flower2", cuc: "Bug" };
  const placeholderColors = { fish: ["#60A5FA", "#22D3EE"], coral: ["#F87171", "#C77F00"], cuc: ["#0E9F6E", "#22D3EE"] };
  const [a, b] = placeholderColors[kind] || ["#60A5FA", "#22D3EE"];

  return (
    <Card hover className="overflow-hidden">
      <div
        className="relative h-28"
        style={{
          background: `linear-gradient(135deg, ${a}22, ${b}22), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 6px, transparent 6px, transparent 12px)`,
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <PhotoSlot id={`photo-${item.id}`} radius={0} placeholder={T("Toca para subir foto", "Tap to upload photo")} style={{ position: "absolute", inset: 0 }} />
        <div className="absolute top-2 left-2 pointer-events-none">
          <StatusPill status={item.status} />
        </div>
        <div className="absolute bottom-2 right-2 grid place-items-center w-7 h-7 rounded-lg bg-[var(--well)] backdrop-blur border border-[var(--hairline)] pointer-events-none">
          <L name={iconByKind[kind]} size={12} style={{ color: s.fg }} />
        </div>
      </div>
      <div className="p-3.5">
        <div className="text-[13px] text-[var(--ink)] font-medium leading-tight">{item.name}</div>
        <div className="text-[10.5px] text-[var(--ink-3)] italic mt-0.5">{item.scientific}</div>
        {item.note && <div className="text-[11px] text-[var(--ink-2)] mt-2 line-clamp-2 leading-relaxed">{item.note}</div>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-[var(--ink-3)] inline-flex items-center gap-1"><L name="Calendar" size={10} /> {item.added}</span>
          <Button size="sm" variant="ghost" icon="Camera" onClick={() => onDiagnose(item)}>{T("Diagnosticar","Diagnose")}</Button>
        </div>
      </div>
    </Card>
  );
}

function DiagnoseModal({ inhabitant, onClose }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [imageData, setImageData] = useState(null);
  const fileRef = useRef(null);
  useEscape(onClose);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    setAnalyzing(true);
    setResult("");
    const offline = () => T(
      `Modo demo sin conexión — guía general para ${inhabitant.name}:\n• Revisa color y extensión del tejido comparado con fotos anteriores.\n• Busca palidez/transparencia (blanqueo), tejido retraído o necrosis en la base.\n• Estado reportado: "${inhabitant.note}".\n• Acción: estabiliza KH en 8–8.5 y mantén parámetros estables 2 semanas antes de mover nada.`,
      `Offline demo mode — general guide for ${inhabitant.name}:\n• Compare color and tissue extension against earlier photos.\n• Look for paleness/translucence (bleaching), receding tissue or base necrosis.\n• Reported state: "${inhabitant.note}".\n• Action: stabilize KH at 8–8.5 and hold parameters steady for 2 weeks before moving anything.`
    );
    try {
      if (!window.claude?.complete) {
        await new Promise((r) => setTimeout(r, 800));
        setResult(offline());
        return;
      }
      const text = await window.claude.complete({
        messages: [{ role: "user", content: `Soy un reefer con tanque marino 23 gal. Habitante: ${inhabitant.name} (${inhabitant.scientific}). Estado actual reportado: ${inhabitant.note}. Aunque no puedo enviarte la imagen ahora, dame: 1) qué buscar visualmente en este especímen para evaluar salud, 2) signos de blanqueamiento/estrés/enfermedad específicos, 3) acción inmediata recomendada. Sé conciso, 4-5 viñetas máximo, en español.` }]
      });
      setResult(text);
    } catch (e) {
      setResult(offline());
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-[var(--scrim)] backdrop-blur" onClick={onClose}>
      <Card
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={T("Diagnóstico IA", "AI Diagnosis")}
        className="w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2">
            <div className="grid place-items-center w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/25">
              <L name="Sparkles" size={14} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="text-[13px] text-[var(--ink)] font-medium">{T("Diagnóstico IA","AI Diagnosis")} · {inhabitant?.name}</div>
              <div className="text-[10.5px] text-[var(--ink-2)]">{T("Sube una foto reciente del especímen","Upload a recent photo of the specimen")}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--ink-2)]"><L name="X" size={14} /></button>
        </div>

        <div className="p-4 space-y-3">
          <div
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-[var(--hairline-strong)] bg-[var(--well)] p-6 grid place-items-center cursor-pointer hover:border-teal-500/40 transition-colors min-h-[180px]"
          >
            {imageData ? (
              <img src={imageData} alt="preview" className="max-h-48 rounded-lg" />
            ) : (
              <div className="text-center">
                <L name="ImagePlus" size={24} className="text-[var(--ink-3)] mx-auto mb-2" />
                <div className="text-[12.5px] text-[var(--ink-2)]">{T("Arrastra una foto o haz click","Drag a photo here or click")}</div>
                <div className="text-[10.5px] text-[var(--ink-3)] mt-1">{T("JPG/PNG · iluminación natural","JPG/PNG · natural light")}</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>

          {result && (
            <div className="rounded-xl bg-teal-500/8 border border-teal-500/25 p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <L name="Sparkles" size={12} className="text-[var(--accent)]" />
                <span className="text-[10.5px] uppercase tracking-wider text-[var(--accent)] font-medium">{T("Análisis Aqua Buddy","Aqua Buddy Analysis")}</span>
              </div>
              <div className="text-[12px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap">{result}</div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>{T("Cerrar","Close")}</Button>
            <Button variant="primary" icon="Sparkles" onClick={analyze} loading={analyzing} disabled={analyzing}>
              {T("Analizar con Aqua Buddy","Analyze with Aqua Buddy")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InhabitantsPage() {
  const { INHABITANTS } = window.AQUA;
  const [diag, setDiag] = useState(null);
  const [tab, setTab] = useState("all");

  const tabs = [
    { id: "all",    label: T("Todos","All"),   count: INHABITANTS.fish.length + INHABITANTS.corals.length + INHABITANTS.cuc.length },
    { id: "fish",   label: T("Peces","Fish"),   count: INHABITANTS.fish.length },
    { id: "corals", label: T("Corales","Corals"), count: INHABITANTS.corals.length },
    { id: "cuc",    label: "CUC",     count: INHABITANTS.cuc.length },
  ];

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">Habitantes</div>
          <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">{T("El equipo del 20G High Reef","The 20G High Reef crew")}</h1>
        </div>
        <Button variant="primary" icon="Plus" onClick={demoAction}>{T("Agregar habitante","Add inhabitant")}</Button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--hairline)] rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-[12px] rounded-lg transition-all ${tab === t.id ? "glass-strong text-[var(--ink)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"}`}
          >
            {t.label} <span className="text-[10px] text-[var(--ink-3)] ml-1 tabular-nums">{t.count}</span>
          </button>
        ))}
      </div>

      {(tab === "all" || tab === "fish") && (
        <div>
          <SectionHeader kicker={T("Peces","Fish")} title={`${INHABITANTS.fish.length} ${T("en el tanque","in the tank")}`} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {INHABITANTS.fish.map((f) => <InhabitantCard key={f.id} item={f} kind="fish" onDiagnose={setDiag} />)}
          </div>
        </div>
      )}
      {(tab === "all" || tab === "corals") && (
        <div className="mt-5">
          <SectionHeader kicker={T("Corales","Corals")} title={`${INHABITANTS.corals.length} ${T("colonias","colonies")}`} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {INHABITANTS.corals.map((c) => <InhabitantCard key={c.id} item={c} kind="coral" onDiagnose={setDiag} />)}
          </div>
        </div>
      )}
      {(tab === "all" || tab === "cuc") && (
        <div className="mt-5">
          <SectionHeader kicker="Clean-up Crew" title={`${INHABITANTS.cuc.length} ${T("ayudantes","helpers")}`} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {INHABITANTS.cuc.map((c) => <InhabitantCard key={c.id} item={c} kind="cuc" onDiagnose={setDiag} />)}
          </div>
        </div>
      )}

      {diag && <DiagnoseModal inhabitant={diag} onClose={() => setDiag(null)} />}
    </div>
  );
}

// ---------------------------- LIGHTING PAGE ----------------------------
function LightingPage() {
  const { LIGHTING_SCHEDULE, LIGHT_CHANNELS } = window.AQUA;
  const currentWeek = window.AquaStore?.lightingWeek || 2;

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">{T("Iluminación · Smatfarm G5 95W","Lighting · Smatfarm G5 95W")}</div>
          <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">{T("Protocolo de aclimatación · 4 semanas","Acclimation protocol · 4 weeks")}</h1>
          <p className="text-[12.5px] text-[var(--ink-2)] mt-1">{T("Aumentos graduales por canal para evitar estrés lumínico en corales nuevos","Gradual per-channel ramps to avoid light stress on new corals")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon="Power" onClick={demoAction}>{T("Modo noche","Night mode")}</Button>
          <Button variant="primary" icon="Sliders" onClick={demoAction}>{T("Ajustes finos","Fine tuning")}</Button>
        </div>
      </div>

      {/* week selector */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-2">
          {LIGHTING_SCHEDULE.map((wk) => {
            const isNow = wk.week === currentWeek;
            const isPast = wk.week < currentWeek;
            return (
              <div
                key={wk.week}
                className={`rounded-xl p-3 border transition-all ${isNow ? "bg-teal-500/8 border-teal-500/30" : isPast ? "border-[var(--hairline)] opacity-60" : "border-[var(--hairline)]"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">{T("Semana","Week")}</span>
                  {isNow && <PulsingDot color="#2DD4BF" size={6} />}
                </div>
                <div className="text-[24px] font-medium text-[var(--ink)] tabular-nums leading-none" style={{ fontFamily: "var(--font-mono)" }}>{wk.week}</div>
                <div className="text-[10.5px] text-[var(--ink-2)] mt-1">{wk.startDate}</div>
                {isNow && <div className="text-[9.5px] uppercase tracking-wider text-[var(--accent)] mt-2">{T("Activa","Active")}</div>}
                {isPast && <div className="text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] mt-2">{T("Completada","Done")}</div>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Channels detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {LIGHT_CHANNELS.map((ch) => {
          const values = LIGHTING_SCHEDULE.map((w) => w.channels[ch.key]);
          const current = LIGHTING_SCHEDULE[currentWeek - 1].channels[ch.key];
          return (
            <Card key={ch.key} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: `${ch.color}22`, border: `1px solid ${ch.color}44` }}>
                    <span className="text-[11px] font-medium" style={{ color: ch.color }}>{ch.key}</span>
                  </div>
                  <div>
                    <div className="text-[13px] text-[var(--ink)] font-medium">{ch.name}</div>
                    <div className="text-[10.5px] text-[var(--ink-2)]">{ch.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[22px] font-medium text-[var(--ink)] tabular-nums leading-none" style={{ fontFamily: "var(--font-mono)" }}>{current}%</div>
                  <div className="text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] mt-0.5">{T("Actual","Current")}</div>
                </div>
              </div>

              {/* Progression line */}
              <div className="relative h-16">
                <svg viewBox="0 0 240 64" className="w-full h-full">
                  {/* base line */}
                  <line x1="10" x2="230" y1="56" y2="56" stroke="#7C90A3" strokeOpacity="0.5" />
                  {values.map((v, i) => {
                    const x = 10 + (220 * i) / 3;
                    const y = 56 - (v / 100) * 44;
                    const next = values[i + 1];
                    return (
                      <g key={i}>
                        {next != null && (
                          <line
                            x1={x} y1={y}
                            x2={10 + (220 * (i + 1)) / 3}
                            y2={56 - (next / 100) * 44}
                            stroke={ch.color}
                            strokeOpacity={i + 1 < currentWeek ? 0.4 : i + 1 === currentWeek ? 0.9 : 0.25}
                            strokeWidth="1.5"
                            strokeDasharray={i + 1 >= currentWeek ? "4 3" : ""}
                          />
                        )}
                        <circle cx={x} cy={y} r={i + 1 === currentWeek ? 5 : 3.5} fill={ch.color} opacity={i + 1 === currentWeek ? 1 : 0.6} />
                        <text x={x} y={62} fontSize="8" fill={i + 1 === currentWeek ? ch.color : "#7C90A3"} textAnchor="middle" fontFamily="DM Mono">W{i + 1}</text>
                        <text x={x} y={y - 6} fontSize="9" fill="#7C90A3" textAnchor="middle" fontFamily="DM Mono">{v}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Daily curve mock */}
      <Card className="p-5">
        <SectionHeader kicker={T("Ciclo diario","Daily cycle")} title={T("Curva de iluminación · 24h","Light curve · 24h")} action={<Button size="sm" variant="ghost" icon="Edit3" onClick={demoAction}>{T("Editar","Edit")}</Button>} />
        <div className="relative h-28">
          <svg viewBox="0 0 1000 120" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="dayfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Sample curve: ramp-up 7-11, peak 11-15, ramp-down 15-21, night */}
            {(() => {
              const pts = [];
              for (let h = 0; h <= 24; h += 0.5) {
                let v = 0;
                if (h >= 7 && h <= 11) v = (h - 7) / 4;
                else if (h > 11 && h < 15) v = 1;
                else if (h >= 15 && h <= 21) v = 1 - (h - 15) / 6;
                else if (h > 21 && h <= 22) v = 0.05;
                pts.push({ x: (h / 24) * 1000, y: 120 - 16 - v * 92 });
              }
              const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
              const fill = `${d} L1000,120 L0,120 Z`;
              return (
                <g>
                  <path d={fill} fill="url(#dayfill)" />
                  <path d={d} fill="none" stroke="#2DD4BF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              );
            })()}
            {[0, 6, 12, 18, 24].map((h) => (
              <g key={h}>
                <line x1={(h / 24) * 1000} x2={(h / 24) * 1000} y1="0" y2="120" stroke="#7C90A3" strokeOpacity="0.3" />
                <text x={(h / 24) * 1000 + 4} y="112" fontSize="9" fill="#7C90A3" fontFamily="DM Mono">{String(h).padStart(2, "0")}:00</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-2">
          {[
            { label: T("Amanecer","Sunrise"), time: "07:00", icon: "Sunrise" },
            { label: T("Pico","Peak"), time: "13:00", icon: "Sun" },
            { label: T("Atardecer","Sunset"), time: "21:00", icon: "Sunset" },
            { label: T("Luna","Moon"), time: "21:00–07:00", icon: "Moon" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[11.5px] text-[var(--ink-2)]">
              <L name={s.icon} size={13} className="text-[var(--ink-3)]" />
              <div>
                <div className="text-[var(--ink)]">{s.label}</div>
                <div className="text-[10px] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{s.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------- ROUTINES PAGE ----------------------------
function RoutinesPage({ routinesDone, onToggleRoutine }) {
  const { ROUTINES, EQUIPMENT, MOCK_TODAY } = window.AQUA;
  // Shared with the dashboard timeline via App; local fallback for standalone use.
  const [localDone, setLocalDone] = useState({});
  const done = routinesDone || localDone;
  const toggle = onToggleRoutine || ((id) => setLocalDone((p) => ({ ...p, [id]: !p[id] })));

  const groups = {
    today: ROUTINES.filter((r) => r.nextDue === "today"),
    week: ROUTINES.filter((r) => r.nextDue !== "today" && r.nextDue <= "2026-05-27"),
    later: ROUTINES.filter((r) => r.nextDue > "2026-05-27"),
  };

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">{T("Rutinas y mantenimiento","Routines & maintenance")}</div>
          <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">{T("Tu calendario de cuidados","Your care calendar")}</h1>
        </div>
        <Button variant="primary" icon="Plus" onClick={demoAction}>{T("Nueva rutina","New routine")}</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <SectionHeader kicker={`${T("Hoy","Today")} · ${fmtShortDate(MOCK_TODAY)}`} title={`${groups.today.length} ${T("pendientes","pending")}`} />
          <div className="space-y-1">
            {groups.today.map((r, i) => (
              <RoutineItem key={r.id} routine={r} done={!!done[r.id]} onToggle={() => toggle(r.id)} isFirst={i === 0} isLast={i === groups.today.length - 1} urgent />
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <SectionHeader kicker={T("Esta semana","This week")} title={`${groups.week.length} ${T("programadas","scheduled")}`} />
          <div className="space-y-1">
            {groups.week.map((r, i) => (
              <RoutineItem key={r.id} routine={r} done={!!done[r.id]} onToggle={() => toggle(r.id)} isFirst={i === 0} isLast={i === groups.week.length - 1} urgent={false} />
            ))}
            {groups.week.length === 0 && (
              <div className="text-[11.5px] text-[var(--ink-3)] py-6 text-center">{T("Sin rutinas esta semana","No routines this week")}</div>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <SectionHeader kicker={T("Más adelante","Later")} title={`${groups.later.length} ${T("próximas","upcoming")}`} />
          <div className="space-y-1">
            {groups.later.map((r, i) => (
              <RoutineItem key={r.id} routine={r} done={!!done[r.id]} onToggle={() => toggle(r.id)} isFirst={i === 0} isLast={i === groups.later.length - 1} urgent={false} />
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeader kicker={T("Equipo activo","Active equipment")} title={`${EQUIPMENT.length} ${T("items en monitoreo","items monitored")}`} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {EQUIPMENT.map((eq) => {
            const s = STATUS_COLOR[eq.status];
            const icons = { lighting: "Sun", skimmer: "Wind", ato: "Droplet", media: "Filter", additive: "FlaskConical", flow: "Waves", pump: "Plug" };
            return (
              <div key={eq.id} className="rounded-xl bg-[var(--well)] border border-[var(--hairline)] p-3 hover:border-[var(--hairline-strong)] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    <L name={icons[eq.type] || "Cog"} size={13} style={{ color: s.fg }} />
                  </div>
                  <StatusPill status={eq.status} />
                </div>
                <div className="text-[12.5px] text-[var(--ink)] font-medium truncate">{eq.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--ink-3)] mt-0.5">{eq.type}</div>
                {eq.nextAction && (
                  <div className="text-[10.5px] text-[var(--ink-2)] mt-2 leading-snug">
                    {eq.nextAction}{eq.nextDate ? ` · ${eq.nextDate}` : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------- AQUABOT FULL CHAT PAGE ----------------------------
function AquaBotPage() {
  const { TANK_CONFIG, CURRENT_PARAMETERS } = window.AQUA;
  const params = CURRENT_PARAMETERS;

  const contextRows = [
    ["pH", `${params.ph?.value} (${params.ph?.status})`],
    ["KH", `${params.kh?.value} dKH (${params.kh?.status})`],
    ["PO₄", `${params.phosphate?.value} ppm (${params.phosphate?.status})`],
    ["Ca", `${params.calcium?.value} mg/L`],
    ["Mg", `${params.magnesium?.value} mg/L`],
    ["Temp", `${params.temperature?.value}°F`],
    [T("Volumen real", "Real volume"), `${TANK_CONFIG.realVolume} gal`],
  ];

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">{T("Aqua Buddy · IA experta en reefing","Aqua Buddy · reef & aquarium AI")}</div>
          <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">{T("Conversación con Aqua Buddy","Chat with Aqua Buddy")}</h1>
          <p className="text-[12.5px] text-[var(--ink-2)] mt-1">{T("Contexto completo de tu tanque cargado · OpenAI + Reef2Reef · modo personalizado y general","Full tank context loaded · OpenAI + Reef2Reef · personalized and general mode")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="h-[680px] min-w-0">
          <AquaBotWidget fullPage={true} />
        </div>
        <div className="space-y-3">
          <Card className="p-4">
            <SectionHeader kicker={T("Contexto cargado","Context loaded")} title={T("Estado del tanque","Tank state")} />
            <ul className="space-y-1.5 text-[11.5px]">
              {contextRows.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between text-[var(--ink-2)]">
                  <span>{k}</span>
                  <span className="text-[var(--ink)] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{v}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <SectionHeader kicker={T("Modo personalizado","Personalized mode")} title={T("Preguntas sobre tu tanque","Questions about your tank")} />
            <div className="flex flex-col gap-1.5">
              {[
                T("Plan diario para subir KH sin chocar pH","Daily plan to raise KH without crashing pH"),
                T("¿Por qué blanquea el Birdsnest?","Why is the Birdsnest bleaching?"),
                T("Esquema completo de cambios de agua","Full water-change scheme"),
                T("¿Es seguro agregar un nuevo coral ahora?","Is it safe to add a new coral now?"),
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => window.dispatchEvent(new CustomEvent("aquabot:ask", { detail: q }))}
                  className="text-left text-[12px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg px-2 py-1.5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionHeader kicker={T("Modo general","General mode")} title={T("Reef2Reef & comunidad","Reef2Reef & community")} />
            <div className="flex flex-col gap-1.5">
              {[
                T("¿Mejores corales para principiantes?","Best corals for beginners?"),
                T("¿Cómo identificar RTN vs STN?","How to identify RTN vs STN?"),
                T("¿SPS o LPS para empezar?","SPS or LPS to start?"),
                T("Guía de aclimatación de nuevos peces","New fish acclimation guide"),
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => window.dispatchEvent(new CustomEvent("aquabot:ask", { detail: q }))}
                  className="text-left text-[12px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg px-2 py-1.5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------- ALERTS PAGE ----------------------------
function AlertsPage({ onNavigate, alerts, onDismissAlert }) {
  const list = alerts || window.AQUA.ALERTS;
  const dismiss = onDismissAlert || (() => {});
  const navigate = onNavigate || (() => {});
  const counts = list.reduce((a, x) => { a[x.severity] = (a[x.severity] || 0) + 1; return a; }, {});

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">{T("Centro de alertas","Alert center")}</div>
        <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">{list.length} {T("activas · prioriza acción","active · prioritize action")}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {["danger", "warn", "info"].map((s) => {
          const c = STATUS_COLOR[s];
          const labels = { danger: T("Críticas","Critical"), warn: T("Avisos","Warnings"), info: T("Informativas","Info") };
          return (
            <Card key={s} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: c.fg }}>{labels[s]}</span>
                <L name={s === "danger" ? "AlertOctagon" : s === "warn" ? "AlertTriangle" : "Info"} size={14} style={{ color: c.fg }} />
              </div>
              <div className="text-[28px] font-medium tabular-nums leading-none mt-1" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{counts[s] || 0}</div>
            </Card>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {list.length === 0 && (
          <Card className="p-6 text-center">
            <div className="grid place-items-center w-10 h-10 mx-auto rounded-xl mb-2" style={{ background: "rgba(16,185,129,0.13)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <L name="CheckCircle2" size={18} style={{ color: "#0E9F6E" }} />
            </div>
            <div className="text-[13px] text-[var(--ink)] font-medium">{T("Sin alertas activas", "No active alerts")}</div>
            <div className="text-[11.5px] text-[var(--ink-2)] mt-1">{T("Tu reef está estable.", "Your reef is stable.")}</div>
          </Card>
        )}
        {list.map((a, i) => (
          <AlertCard key={a.id} alert={a} index={i} onDismiss={() => dismiss(a.id)} onCTA={() => alertCTAAction(a, navigate, dismiss)} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ParametersPage, InhabitantsPage, LightingPage, RoutinesPage, AquaBotPage, AlertsPage, expand30, LogReadingModal, exportParamsCSV });
