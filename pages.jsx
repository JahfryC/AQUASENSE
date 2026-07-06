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
            <div className="flex items-center gap-2 flex-wrap">
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
  const order = ["ph", "kh", "phosphate", "calcium", "nitrate", "temperature", "salinity", "ammonia", "nitrite"];
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
function InhabitantCard({ item, kind }) {
  const s = STATUS_COLOR[item.status];
  const iconByKind = { fish: "Fish", coral: "Flower2", cuc: "Bug" };
  const placeholderColors = { fish: ["#60A5FA", "#22D3EE"], coral: ["#F87171", "#C77F00"], cuc: ["#0E9F6E", "#22D3EE"] };
  const [a, b] = placeholderColors[kind] || ["#60A5FA", "#22D3EE"];

  return (
    <Card hover className="overflow-hidden">
      {/* Photo slot with gradient avatar fallback */}
      <div
        className="relative h-28 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${a}22, ${b}22), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 6px, transparent 6px, transparent 12px)`,
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        {/* Centered photo slot with avatar fallback */}
        <div style={{ width: 64, height: 64, position: "relative", borderRadius: 16, overflow: "hidden", flexShrink: 0 }}>
          {/* Fallback avatar shown when no photo */}
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${a}, ${b})` }}>
            <span style={{ color: "white", fontSize: 24, fontWeight: 700 }}>{item.name[0]}</span>
          </div>
          {/* PhotoSlot overlays the avatar — shows upload UI on hover */}
          <PhotoSlot id={`photo-${item.id}`} radius={16} style={{ position: "absolute", inset: 0 }} />
        </div>
        <div className="absolute top-2 left-2">
          <StatusPill status={item.status} />
        </div>
        <div className="absolute bottom-2 right-2 grid place-items-center w-7 h-7 rounded-lg bg-[var(--well)] backdrop-blur border border-[var(--hairline)]">
          <L name={iconByKind[kind]} size={12} style={{ color: s.fg }} />
        </div>
      </div>
      <div className="p-3.5">
        <div className="text-[13px] text-[var(--ink)] font-medium leading-tight">{item.name}</div>
        <div className="text-[10.5px] text-[var(--ink-3)] italic mt-0.5">{item.scientific}</div>
        {item.note && <div className="text-[11px] text-[var(--ink-2)] mt-2 line-clamp-2 leading-relaxed">{item.note}</div>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-[var(--ink-3)] inline-flex items-center gap-1"><L name="Calendar" size={10} /> {item.added}</span>
          <Button size="sm" variant="ghost" icon="Sparkles" onClick={() => window.dispatchEvent(new CustomEvent("aquabot:ask", { detail: T(`¿Cómo está mi ${item.name}?`, `How is my ${item.name} doing?`) }))}>{T("Preguntar IA", "Ask AI")}</Button>
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

// iNaturalist photo search — returns [{url, name, scientific}]
async function searchSpeciesPhoto(query) {
  try {
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=6&order=desc&order_by=observations_count`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || [])
      .filter((x) => x.default_photo?.medium_url)
      .slice(0, 4)
      .map((x) => ({
        url: x.default_photo.medium_url.replace("medium", "square"),
        preview: x.default_photo.medium_url,
        name: x.preferred_common_name || x.name,
        scientific: x.name,
      }));
  } catch {
    return [];
  }
}

// ---------------------------- ADD INHABITANT MODAL ----------------------------
function AddInhabitantModal({ onClose }) {
  const [kind, setKind] = useState("fish");
  const [name, setName] = useState("");
  const [scientific, setScientific] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoResults, setPhotoResults] = useState([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const nameRef = useRef(null);
  useEscape(onClose);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const searchPhoto = async () => {
    const q = scientific.trim() || name.trim();
    if (!q) return;
    setPhotoLoading(true);
    setPhotoResults([]);
    const results = await searchSpeciesPhoto(q);
    setPhotoResults(results);
    if (results.length === 0) window.toast?.(T("No se encontraron fotos — intenta con el nombre científico", "No photos found — try the scientific name"), { tone: "warn", icon: "Image" });
    setPhotoLoading(false);
  };

  const save = () => {
    const n = name.trim();
    if (!n) { nameRef.current?.focus(); return; }
    setSaving(true);
    const item = {
      id: "ui" + Date.now(),
      name: n.charAt(0).toUpperCase() + n.slice(1),
      scientific: scientific.trim(),
      added: window.AQUA.MOCK_TODAY,
      status: "ok",
      note: note.trim() || T("Recién añadido — en observación", "Newly added — under observation"),
    };
    window.AquaStore.addInhabitant(kind, item);
    if (selectedPhoto) window.AquaStore.setPhoto(item.id, selectedPhoto);
    window.toast?.(T(`${item.name} añadido`, `${item.name} added`), { icon: "Fish" });
    onClose();
  };

  const kinds = [
    { id: "fish",   label: T("Pez", "Fish"),   icon: "Fish" },
    { id: "corals", label: T("Coral", "Coral"), icon: "Flower2" },
    { id: "cuc",    label: "CUC",              icon: "Bug" },
  ];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)] backdrop-blur" onClick={onClose}>
      <Card
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={T("Agregar habitante", "Add inhabitant")}
        className="w-full max-w-md glass-strong rounded-3xl overflow-y-auto max-h-[90dvh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center w-8 h-8 rounded-xl" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
              <L name="Fish" size={14} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div className="text-[13.5px] font-semibold text-[var(--ink)]">{T("Agregar habitante", "Add inhabitant")}</div>
              <div className="text-[10.5px] text-[var(--ink-2)]">{T("Pez, coral o limpiador", "Fish, coral or clean-up crew")}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label={T("Cerrar", "Close")} className="p-1.5 rounded-full hover:bg-[var(--hover)] text-[var(--ink-2)]"><L name="X" size={14} /></button>
        </div>

        <div className="p-4 space-y-3">
          {/* Category selector */}
          <div>
            <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">{T("Categoría", "Category")}</div>
            <div className="flex gap-2">
              {kinds.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium border transition-all ${kind === k.id ? "text-[var(--ink)]" : "text-[var(--ink-3)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]"}`}
                  style={kind === k.id ? { background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)" } : {}}
                >
                  <L name={k.icon} size={13} />
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <label className="block">
            <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">{T("Nombre común *", "Common name *")}</div>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              placeholder={T("ej. Birdsnest, Pez payaso", "e.g. Birdsnest, Clownfish")}
              className="w-full bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] transition-colors"
            />
          </label>

          {/* Scientific name + photo search trigger */}
          <div>
            <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">{T("Nombre científico", "Scientific name")} <span className="normal-case text-[10px]">({T("opcional", "optional")})</span></div>
            <div className="flex gap-2">
              <input
                type="text"
                value={scientific}
                onChange={(e) => setScientific(e.target.value)}
                placeholder={T("ej. Seriatopora hystrix", "e.g. Amphiprion ocellaris")}
                className="flex-1 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] transition-colors italic"
              />
              <button
                type="button"
                onClick={searchPhoto}
                disabled={!name.trim() || photoLoading}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all disabled:opacity-40"
                style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}
                title={T("Buscar foto de la especie", "Search species photo")}
              >
                {photoLoading ? <L name="Loader2" size={13} className="animate-spin" /> : <L name="Search" size={13} />}
                {T("Foto", "Photo")}
              </button>
            </div>
          </div>

          {/* Photo results grid */}
          {photoResults.length > 0 && (
            <div>
              <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">
                {T("Selecciona una foto (iNaturalist)", "Select a photo (iNaturalist)")}
                <span className="ml-2 normal-case text-[9.5px]">· {T("toca para elegir", "tap to select")}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {photoResults.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedPhoto(selectedPhoto === p.preview ? null : p.preview)}
                    className="relative aspect-square rounded-xl overflow-hidden transition-all"
                    style={{
                      outline: selectedPhoto === p.preview ? "2.5px solid var(--accent)" : "2px solid transparent",
                      outlineOffset: 1,
                    }}
                    title={p.name}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    {selectedPhoto === p.preview && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(13,148,136,0.35)" }}>
                        <L name="Check" size={18} style={{ color: "white" }} />
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 px-1 py-0.5 text-[8.5px] text-white truncate" style={{ background: "rgba(0,0,0,0.55)" }}>{p.name}</div>
                  </button>
                ))}
              </div>
              {selectedPhoto && (
                <p className="text-[10px] text-[var(--accent)] mt-1 flex items-center gap-1">
                  <L name="CheckCircle2" size={10} />{T("Foto seleccionada — se guardará con el habitante", "Photo selected — will be saved with inhabitant")}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <label className="block">
            <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">{T("Notas", "Notes")} <span className="normal-case text-[10px]">({T("opcional", "optional")})</span></div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={T("Comportamiento, condición, procedencia…", "Behavior, condition, origin…")}
              rows={2}
              className="w-full bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] transition-colors resize-none"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--hairline)]">
          <Button variant="ghost" onClick={onClose}>{T("Cancelar", "Cancel")}</Button>
          <Button variant="primary" icon={saving ? undefined : "Plus"} loading={saving} disabled={!name.trim()} onClick={save}>
            {T("Agregar", "Add")}
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  );
}

function InhabitantsPage() {
  const { INHABITANTS, TANK_CONFIG } = window.AQUA;
  const [tab, setTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const total = INHABITANTS.fish.length + INHABITANTS.corals.length + INHABITANTS.cuc.length;

  const tabs = [
    { id: "all",    label: T("Todos","All"),   count: total },
    { id: "fish",   label: T("Peces","Fish"),   count: INHABITANTS.fish.length },
    { id: "corals", label: T("Corales","Corals"), count: INHABITANTS.corals.length },
    { id: "cuc",    label: "CUC",     count: INHABITANTS.cuc.length },
  ];

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">Habitantes</div>
          <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">
            {total > 0
              ? T(`El equipo de ${TANK_CONFIG.name || "tu acuario"}`, `${TANK_CONFIG.name || "Your aquarium"} crew`)
              : T("Añade tus primeros habitantes", "Add your first inhabitants")
            }
          </h1>
        </div>
        <Button variant="primary" icon="Plus" onClick={() => setAddOpen(true)}>{T("Agregar habitante","Add inhabitant")}</Button>
      </div>
      {addOpen && <AddInhabitantModal onClose={() => setAddOpen(false)} />}

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

      {total === 0 && (
        <div className="py-12 text-center">
          <div className="grid place-items-center w-16 h-16 mx-auto rounded-3xl mb-4" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)" }}>
            <L name="Fish" size={28} style={{ color: "#22D3EE" }} />
          </div>
          <div className="text-[15px] text-[var(--ink)] font-medium mb-1">{T("Tu tanque está vacío", "Your tank is empty")}</div>
          <div className="text-[12.5px] text-[var(--ink-2)] mb-4">{T("Agrega tus primeros peces, corales o limpiadores para comenzar", "Add your first fish, corals or clean-up crew to get started")}</div>
          <Button variant="primary" icon="Plus" onClick={() => setAddOpen(true)}>{T("Agregar primer habitante", "Add first inhabitant")}</Button>
        </div>
      )}
      {(tab === "all" || tab === "fish") && INHABITANTS.fish.length > 0 && (
        <div>
          <SectionHeader kicker={T("Peces","Fish")} title={`${INHABITANTS.fish.length} ${T("en el tanque","in the tank")}`} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {INHABITANTS.fish.map((f) => <InhabitantCard key={f.id} item={f} kind="fish" />)}
          </div>
        </div>
      )}
      {(tab === "all" || tab === "corals") && INHABITANTS.corals.length > 0 && (
        <div className="mt-5">
          <SectionHeader kicker={T("Corales","Corals")} title={`${INHABITANTS.corals.length} ${T("colonias","colonies")}`} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {INHABITANTS.corals.map((c) => <InhabitantCard key={c.id} item={c} kind="coral" />)}
          </div>
        </div>
      )}
      {(tab === "all" || tab === "cuc") && INHABITANTS.cuc.length > 0 && (
        <div className="mt-5">
          <SectionHeader kicker="Clean-up Crew" title={`${INHABITANTS.cuc.length} ${T("ayudantes","helpers")}`} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {INHABITANTS.cuc.map((c) => <InhabitantCard key={c.id} item={c} kind="cuc" />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------- LIGHTING PAGE ----------------------------
// Fixture database — popular reef & planted lights
const FIXTURE_DB = [
  // Aqua Illumination (AI)
  { n:"AI Prime 16 HD", par:220,          br:"Aqua Illumination", w:55,  type:"led", spectrum:"reef",    desc:"Reef nano puck · up to 20 gal" },
  { n:"AI Hydra 26 HD", par:350,          br:"Aqua Illumination", w:100, type:"led", spectrum:"reef",    desc:"Reef puck · up to 50 gal" },
  { n:"AI Hydra 32 HD", par:420,          br:"Aqua Illumination", w:130, type:"led", spectrum:"reef",    desc:"Reef puck · up to 65 gal" },
  { n:"AI Hydra 52 HD", par:500,          br:"Aqua Illumination", w:185, type:"led", spectrum:"reef",    desc:"Reef puck · up to 100 gal" },
  { n:"AI Hydra 64 HD", par:560,          br:"Aqua Illumination", w:215, type:"led", spectrum:"reef",    desc:"Reef puck · up to 130 gal" },
  { n:"AI Blade Grow 24\"", par:150,      br:"Aqua Illumination", w:55,  type:"led", spectrum:"planted", desc:"Freshwater bar" },
  { n:"AI Blade Grow 36\"", par:160,      br:"Aqua Illumination", w:80,  type:"led", spectrum:"planted", desc:"Freshwater bar" },
  { n:"AI Blade Grow 48\"", par:170,      br:"Aqua Illumination", w:100, type:"led", spectrum:"planted", desc:"Freshwater bar" },
  // Kessil
  { n:"Kessil A80 Tuna Blue", par:130,    br:"Kessil",            w:15,  type:"led", spectrum:"reef",    desc:"Nano reef · up to 10 gal" },
  { n:"Kessil A160WE Tuna Blue", par:250, br:"Kessil",            w:40,  type:"led", spectrum:"reef",    desc:"Compact reef · up to 40 gal" },
  { n:"Kessil A360X Tuna Blue", par:420,  br:"Kessil",            w:90,  type:"led", spectrum:"reef",    desc:"Full-reef puck · up to 100 gal" },
  { n:"Kessil AP700", par:520,            br:"Kessil",            w:185, type:"led", spectrum:"reef",    desc:"Bar LED · 36–60\" tanks" },
  { n:"Kessil AP9X", par:600,             br:"Kessil",            w:250, type:"led", spectrum:"reef",    desc:"Top-end bar · 48–72\" tanks" },
  { n:"Kessil H80 Tuna Sun", par:120,     br:"Kessil",            w:15,  type:"led", spectrum:"planted", desc:"Freshwater nano" },
  { n:"Kessil H160 Tuna Sun", par:220,    br:"Kessil",            w:40,  type:"led", spectrum:"planted", desc:"Freshwater compact" },
  { n:"Kessil H380 Tuna Sun", par:380,    br:"Kessil",            w:90,  type:"led", spectrum:"planted", desc:"Freshwater full-size" },
  // EcoTech Radion
  { n:"Radion XR15 G5 Blue", par:400,     br:"EcoTech Marine",    w:110, type:"led", spectrum:"reef",    desc:"Reef puck · up to 50 gal" },
  { n:"Radion XR15 G5 Pro", par:420,      br:"EcoTech Marine",    w:130, type:"led", spectrum:"reef",    desc:"Reef puck · full spectrum" },
  { n:"Radion XR30 G5 Blue", par:520,     br:"EcoTech Marine",    w:185, type:"led", spectrum:"reef",    desc:"Reef puck · up to 100 gal" },
  { n:"Radion XR30 G5 Pro", par:550,      br:"EcoTech Marine",    w:210, type:"led", spectrum:"reef",    desc:"Reef puck · premium spectrum" },
  // Orphek
  { n:"Orphek OR3 75W Blue Plus", par:240,br:"Orphek",            w:75,  type:"led", spectrum:"reef",    desc:"Reef bar · 36\"" },
  { n:"Orphek OR3 100W Sky Blue", par:280,br:"Orphek",            w:100, type:"led", spectrum:"reef",    desc:"Reef bar · 48\"" },
  { n:"Orphek Atlantik V4", par:550,      br:"Orphek",            w:200, type:"led", spectrum:"reef",    desc:"Reef puck · up to 150 gal" },
  { n:"Orphek Atlantik Compact", par:420, br:"Orphek",            w:115, type:"led", spectrum:"reef",    desc:"Reef puck · 50–90 gal" },
  // Smatfarm
  { n:"Smatfarm G5 95W", par:410,         br:"Smatfarm",          w:95,  type:"led", spectrum:"reef",    desc:"Reef LED · 6-channel · community PAR data" },
  { n:"Smatfarm G3 Pro 165W", par:520,    br:"Smatfarm",          w:165, type:"led", spectrum:"reef",    desc:"Reef LED · full spectrum" },
  // Noopsyche (same factory family as Smatfarm black-box LEDs)
  { n:"Noopsyche K7 Pro II 95W", par:400,  br:"Noopsyche",         w:95,  type:"led", spectrum:"reef",    desc:"Reef LED · community PAR data" },
  { n:"Noopsyche K7 Pro III", par:460,     br:"Noopsyche",         w:100, type:"led", spectrum:"reef",    desc:"Reef LED · community PAR data" },
  { n:"Noopsyche K7 Pro V3", par:480,      br:"Noopsyche",         w:120, type:"led", spectrum:"reef",    desc:"Reef LED · WRGB" },
  { n:"Noopsyche K7 Pro IV", par:520,      br:"Noopsyche",         w:130, type:"led", spectrum:"reef",    desc:"Reef LED · latest gen" },
  // Maxspect
  { n:"Maxspect Ethereal 130W", par:380,  br:"Maxspect",          w:130, type:"led", spectrum:"reef",    desc:"Reef bar · 36\"" },
  { n:"Maxspect Ethereal 260W", par:420,  br:"Maxspect",          w:260, type:"led", spectrum:"reef",    desc:"Reef bar · 72\"" },
  { n:"Maxspect Razor X 130W", par:350,   br:"Maxspect",          w:130, type:"led", spectrum:"reef",    desc:"Thin reef LED" },
  // Reef Breeders
  { n:"Reef Breeders Photon 16", par:320, br:"Reef Breeders",     w:70,  type:"led", spectrum:"reef",    desc:"DIY reef · 16\"" },
  { n:"Reef Breeders Photon 32", par:380, br:"Reef Breeders",     w:130, type:"led", spectrum:"reef",    desc:"DIY reef · 32\"" },
  { n:"Reef Breeders Photon 48", par:420, br:"Reef Breeders",     w:185, type:"led", spectrum:"reef",    desc:"DIY reef · 48\"" },
  // ATI
  { n:"ATI Powermodule 4×24W", par:220,   br:"ATI",               w:96,  type:"hybrid", spectrum:"reef", desc:"T5+LED hybrid · 24\"" },
  { n:"ATI Powermodule 6×39W", par:320,   br:"ATI",               w:234, type:"hybrid", spectrum:"reef", desc:"T5+LED hybrid · 36\"" },
  { n:"ATI Powermodule 8×54W", par:420,   br:"ATI",               w:432, type:"hybrid", spectrum:"reef", desc:"T5+LED hybrid · 48\"" },
  // Fluval
  { n:"Fluval Marine 3.0 (32\")", par:110,br:"Fluval",            w:32,  type:"led", spectrum:"reef",    desc:"Marine LED · 24–32\"" },
  { n:"Fluval Marine 3.0 (48\")", par:120,br:"Fluval",            w:59,  type:"led", spectrum:"reef",    desc:"Marine LED · 36–48\"" },
  { n:"Fluval Plant 3.0 (24\")", par:110, br:"Fluval",            w:27,  type:"led", spectrum:"planted", desc:"Planted LED · 17–24\"" },
  { n:"Fluval Plant 3.0 (36\")", par:115, br:"Fluval",            w:46,  type:"led", spectrum:"planted", desc:"Planted LED · 25–36\"" },
  { n:"Fluval Plant 3.0 (48\")", par:120, br:"Fluval",            w:59,  type:"led", spectrum:"planted", desc:"Planted LED · 37–48\"" },
  // Finnex
  { n:"Finnex Planted+ 24/7 ALC 24\"", par:80, br:"Finnex",     w:24,  type:"led", spectrum:"planted", desc:"Auto day/night cycle" },
  { n:"Finnex Planted+ 24/7 ALC 36\"", par:85, br:"Finnex",     w:36,  type:"led", spectrum:"planted", desc:"Auto day/night cycle" },
  { n:"Finnex Planted+ 24/7 ALC 48\"", par:90, br:"Finnex",     w:48,  type:"led", spectrum:"planted", desc:"Auto day/night cycle" },
  { n:"Finnex Ray2 30\"", par:100,        br:"Finnex",            w:30,  type:"led", spectrum:"planted", desc:"High-output planted" },
  { n:"Finnex Ray2 48\"", par:110,        br:"Finnex",            w:48,  type:"led", spectrum:"planted", desc:"High-output planted" },
  // Current USA
  { n:"Current USA Orbit Marine Pro 24\"", par:100,br:"Current USA",w:32, type:"led",spectrum:"reef",   desc:"Reef · 18–24\"" },
  { n:"Current USA Orbit Marine Pro 48\"", par:120,br:"Current USA",w:64, type:"led",spectrum:"reef",   desc:"Reef · 36–48\"" },
  // ADA
  { n:"ADA Solar RGB", par:230,           br:"ADA",               w:52,  type:"led", spectrum:"planted", desc:"High CRI planted" },
  { n:"ADA Aquasky G 30", par:110,        br:"ADA",               w:11,  type:"led", spectrum:"planted", desc:"Nano planted" },
  { n:"ADA Aquasky G 60", par:130,        br:"ADA",               w:22,  type:"led", spectrum:"planted", desc:"60cm planted" },
  // Twinstar
  { n:"Twinstar 450EA", par:130,          br:"Twinstar",          w:27,  type:"led", spectrum:"planted", desc:"Planted · 45cm" },
  { n:"Twinstar 600EA", par:150,          br:"Twinstar",          w:38,  type:"led", spectrum:"planted", desc:"Planted · 60cm" },
  { n:"Twinstar 900EA", par:170,          br:"Twinstar",          w:54,  type:"led", spectrum:"planted", desc:"Planted · 90cm" },
  { n:"Twinstar 1200EA", par:180,         br:"Twinstar",          w:72,  type:"led", spectrum:"planted", desc:"Planted · 120cm" },
  // ONF
  { n:"ONF Flat Nano", par:110,           br:"ONF",               w:15,  type:"led", spectrum:"planted", desc:"Nano planted · up to 30cm" },
  { n:"ONF Flat One", par:140,            br:"ONF",               w:30,  type:"led", spectrum:"planted", desc:"Planted · 45–60cm" },
  { n:"ONF Flat One Plus", par:150,       br:"ONF",               w:40,  type:"led", spectrum:"planted", desc:"Planted · 60–90cm" },
  // Nanobox
  { n:"Nanobox Duo", par:300,             br:"Nanobox",           w:45,  type:"led", spectrum:"reef",    desc:"Reef puck · up to 30 gal" },
  { n:"Nanobox Duo XL", par:420,          br:"Nanobox",           w:90,  type:"led", spectrum:"reef",    desc:"Reef puck · up to 60 gal" },
  // Generic T5
  { n:"Tek T5 4×24W HO", par:200,        br:"Sunlight Supply",   w:96,  type:"t5",  spectrum:"reef",    desc:"T5 HO fixture · 24\"" },
  { n:"Tek T5 6×39W HO", par:300,        br:"Sunlight Supply",   w:234, type:"t5",  spectrum:"reef",    desc:"T5 HO fixture · 36\"" },
  { n:"Tek T5 8×54W HO", par:400,        br:"Sunlight Supply",   w:432, type:"t5",  spectrum:"reef",    desc:"T5 HO fixture · 48\"" },
];

function LightFixtureModal({ onClose }) {
  const S = window.AquaStore;
  const existing = S.lightFixture || {};
  const [step, setStep] = useState(existing.name ? "fill" : "search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  // Form fields
  const [name, setName]       = useState(existing.name || "");
  const [brand, setBrand]     = useState(existing.brand || "");
  const [wattage, setWattage] = useState(existing.wattage ? String(existing.wattage) : "");
  const [type, setType]       = useState(existing.type || "led");
  const [spectrum, setSpectrum] = useState(existing.spectrum || "reef");
  const [desc, setDesc]       = useState(existing.desc || "");
  const [parDb, setParDb]     = useState(existing.par || null); // PAR ref from DB (null = manual entry)
  const searchRef = useRef(null);
  const nameRef   = useRef(null);
  useEscape(onClose);
  useEffect(() => {
    if (step === "search") setTimeout(() => searchRef.current?.focus(), 80);
    if (step === "fill")   setTimeout(() => nameRef.current?.focus(), 80);
  }, [step]);

  // Live search
  useEffect(() => {
    // Drop filler words that never appear in DB entries so "smatfarm 95w light" still matches
    const q = query.trim().toLowerCase()
      .replace(/\b(light|lamp|luz|lampara|lámpara|fixture|the|de|el|la)\b/g, " ")
      .replace(/\s+/g, " ").trim();
    if (!q) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      const words = q.split(/\s+/);
      const matches = FIXTURE_DB.filter((row) => {
        const hay = (row.n + " " + row.br + " " + row.w + " " + row.spectrum + " " + row.type).toLowerCase();
        return words.every((w) => hay.includes(w));
      }).slice(0, 8);
      setResults(matches);
      setSearching(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const fillFrom = (row) => {
    setName(row.n);
    setBrand(row.br || "");
    setWattage(row.w ? String(row.w) : "");
    setType(["led", "t5", "mh", "hybrid"].includes(row.type) ? row.type : "led");
    setSpectrum(["reef", "planted", "both"].includes(row.spectrum) ? row.spectrum : "reef");
    setDesc(row.desc || "");
    setParDb(row.par || null);
    setStep("fill");
  };

  const searchWithAI = async () => {
    const apiKey = window.AQUAMIND_AI_KEY || localStorage.getItem("aqua:ai_key");
    if (!apiKey) {
      window.toast?.(T("Agrega tu key de Groq en Ajustes para buscar con IA", "Add your Groq key in Settings to search with AI"), { tone: "warn", icon: "Key" });
      return;
    }
    setAiSearching(true);
    try {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a database of aquarium light fixtures with PAR data. Return ONLY a JSON object — no markdown, no explanation. If the fixture is unknown, return {\"notFound\":true}." },
            { role: "user", content: `Aquarium light fixture specs for: "${query.trim()}"\nReturn: {"n":"full model name","br":"brand","w":watts_number,"type":"led|t5|mh|hybrid","spectrum":"reef|planted|both","par":typical_peak_PAR_number_at_30cm_water_depth_at_100_percent_intensity,"desc":"one short line"}` },
          ],
          max_tokens: 160,
          temperature: 0.1,
        }),
      });
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "";
      const jsonStr = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.notFound || !parsed.n) {
        window.toast?.(T("Lámpara no encontrada por IA — intenta con el nombre exacto del modelo", "Fixture not found by AI — try the exact model name"), { tone: "warn", icon: "SearchX" });
      } else {
        fillFrom(parsed);
        window.toast?.(T("Datos encontrados con IA — revisa y confirma", "Specs found with AI — review and confirm"), { icon: "Sparkles" });
      }
    } catch (e) {
      window.toast?.(T("Error buscando con IA — verifica tu key de Groq", "AI search error — check your Groq key"), { tone: "warn", icon: "AlertTriangle" });
    }
    setAiSearching(false);
  };

  const save = () => {
    const n = name.trim();
    if (!n) { nameRef.current?.focus(); return; }
    S.setLightFixture({ name: n, brand: brand.trim(), wattage: wattage ? +wattage : null, type, spectrum, desc: desc.trim(), par: parDb });
    window.toast?.(T("Lámpara guardada", "Fixture saved"), { icon: "Lamp" });
    window.dispatchEvent(new Event("aqua:data"));
    onClose();
  };

  const typeOpts = [
    { id: "led",    label: "LED" },
    { id: "t5",     label: "T5" },
    { id: "mh",     label: "MH" },
    { id: "hybrid", label: T("Híbrido","Hybrid") },
  ];
  const specOpts = [
    { id: "reef",    label: T("Reef","Reef"),          icon: "Waves" },
    { id: "planted", label: T("Plantado","Planted"),   icon: "Leaf" },
    { id: "both",    label: T("Mixto","Mixed"),        icon: "Layers" },
  ];

  const spectrumColor = { reef: "var(--accent)", planted: "#16a34a", both: "#7C3AED" };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)] backdrop-blur" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg glass-strong rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[96dvh] flex flex-col"
        style={{ boxShadow: "var(--glass-shadow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--hairline)] shrink-0">
          <div className="flex items-center gap-2.5">
            {step === "fill" && (
              <button onClick={() => setStep("search")} className="p-1.5 -ml-1 rounded-full hover:bg-[var(--hover)] text-[var(--ink-2)]">
                <L name="ArrowLeft" size={15} />
              </button>
            )}
            <div className="grid place-items-center w-8 h-8 rounded-xl" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
              <L name={step === "search" ? "Search" : "Lamp"} size={14} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[var(--ink)]">
                {step === "search" ? T("Buscar lámpara", "Search fixture") : T("Detalles de la lámpara", "Fixture details")}
              </div>
              <div className="text-[10.5px] text-[var(--ink-3)]">
                {step === "search" ? T("Base de datos de luminarias", "Lighting fixture database") : T("Edita y confirma", "Edit and confirm")}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--hover)] text-[var(--ink-2)]"><L name="X" size={14} /></button>
        </div>

        {/* STEP 1 — Search */}
        {step === "search" && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-5 pt-4 pb-3 shrink-0">
              <div className="flex items-center gap-2 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[var(--accent-border)] transition-all">
                {searching
                  ? <L name="Loader2" size={15} className="text-[var(--ink-3)] shrink-0 animate-spin" />
                  : <L name="Search" size={15} className="text-[var(--ink-3)] shrink-0" />}
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={T("ej. Kessil A360, Radion XR30, Fluval Plant 3.0…", "e.g. Kessil A360, Radion XR30, Fluval Plant 3.0…")}
                  className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="shrink-0 text-[var(--ink-3)] hover:text-[var(--ink-2)]"><L name="X" size={13} /></button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-[160px]">
              {query.trim() && results.length === 0 && !searching && (
                <div className="text-center py-5">
                  <L name="SearchX" size={22} className="text-[var(--ink-3)] mx-auto mb-2" />
                  <div className="text-[12.5px] text-[var(--ink-2)] mb-3">{T("No está en la base de datos local", "Not in local database")}</div>
                  <button onClick={searchWithAI} disabled={aiSearching}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12.5px] font-semibold text-white disabled:opacity-60 transition-all"
                    style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-strong))" }}>
                    {aiSearching
                      ? <><L name="Loader2" size={13} className="animate-spin" /> {T("Buscando…","Searching…")}</>
                      : <><L name="Sparkles" size={13} /> {T("Buscar con IA","Search with AI")}</>}
                  </button>
                  <div className="text-[10.5px] text-[var(--ink-3)] mt-2">{T("Usa Groq para buscar watts, espectro y PAR típico","Uses Groq to find watts, spectrum and typical PAR")}</div>
                </div>
              )}
              {!query.trim() && (
                <div className="text-[11px] text-[var(--ink-3)] pt-1 pb-2">
                  {T("Marcas:", "Brands:")} AI · Kessil · Radion · Orphek · Smatfarm · Maxspect · ATI · Fluval · Finnex · ADA · Twinstar · ONF…
                </div>
              )}
              <div className="space-y-1">
                {results.map((row, i) => (
                  <button
                    key={i}
                    onClick={() => fillFrom(row)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--hover)] transition-colors text-left group"
                  >
                    <div className="grid place-items-center w-8 h-8 rounded-lg shrink-0" style={{
                      background: `${spectrumColor[row.spectrum]}18`,
                      border: `1px solid ${spectrumColor[row.spectrum]}35`,
                    }}>
                      <L name={row.spectrum === "planted" ? "Leaf" : "Lamp"} size={13} style={{ color: spectrumColor[row.spectrum] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-[var(--ink)] truncate">{row.n}</div>
                      <div className="text-[10.5px] text-[var(--ink-3)]">
                        {row.br} · {row.w}W · {row.type.toUpperCase()} · {row.desc}
                      </div>
                    </div>
                    <L name="ChevronRight" size={13} className="text-[var(--ink-3)] group-hover:text-[var(--accent)] transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[var(--hairline)] shrink-0">
              <button
                onClick={() => setStep("fill")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--hover)] transition-colors"
              >
                <L name="PenLine" size={13} /> {T("Añadir manualmente", "Add manually")}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Fill form */}
        {step === "fill" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 space-y-3">
              {/* Name */}
              <label className="block">
                <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1">{T("Nombre / modelo *","Name / model *")}</div>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") save(); }}
                  placeholder={T("ej. AI Hydra 26, Kessil A360","e.g. AI Hydra 26, Kessil A360")}
                  className="w-full bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] transition-colors"
                />
              </label>

              {/* Type */}
              <div>
                <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1">{T("Tecnología","Technology")}</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {typeOpts.map((o) => (
                    <button key={o.id} onClick={() => setType(o.id)}
                      className={`rounded-xl py-2 text-[12px] font-medium border transition-all ${type === o.id ? "" : "border-[var(--hairline)] text-[var(--ink-3)]"}`}
                      style={type === o.id ? { background:"var(--accent-soft)", border:"1px solid var(--accent-border)", color:"var(--accent)" } : {}}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spectrum */}
              <div>
                <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1">{T("Espectro objetivo","Target spectrum")}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {specOpts.map((o) => (
                    <button key={o.id} onClick={() => setSpectrum(o.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-medium border transition-all ${spectrum === o.id ? "" : "border-[var(--hairline)] text-[var(--ink-3)]"}`}
                      style={spectrum === o.id ? { background:`${spectrumColor[o.id]}14`, border:`1.5px solid ${spectrumColor[o.id]}50`, color:spectrumColor[o.id] } : {}}>
                      <L name={o.icon} size={12} /> {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand + Wattage */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1">{T("Marca","Brand")}</div>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                    placeholder="Kessil, AI, Orphek…"
                    className="w-full bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] transition-colors"
                  />
                </label>
                <label className="block">
                  <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1">{T("Potencia","Wattage")}</div>
                  <div className="flex items-center gap-1 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[var(--accent-border)] transition-all">
                    <input type="number" inputMode="decimal" value={wattage} onChange={(e) => setWattage(e.target.value)} placeholder="95"
                      className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]" />
                    <span className="text-[10.5px] text-[var(--ink-3)] shrink-0">W</span>
                  </div>
                </label>
              </div>

              {/* Description */}
              <label className="block">
                <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1">{T("Notas","Notes")} <span className="normal-case text-[10px]">({T("opcional","optional")})</span></div>
                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder={T("ej. Cobertura hasta 100 gal, 6 canales","e.g. Up to 100 gal coverage, 6 channels")}
                  className="w-full bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] transition-colors"
                />
              </label>
            </div>

            <div className="px-5 py-4 border-t border-[var(--hairline)] shrink-0 flex gap-2">
              <button onClick={onClose}
                className="flex-1 rounded-full py-2.5 text-[13px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                style={{ background:"var(--well)", border:"1px solid var(--hairline)" }}>
                {T("Cancelar","Cancel")}
              </button>
              <button onClick={save} disabled={!name.trim()}
                className="flex-1 rounded-full py-2.5 text-[13px] font-semibold text-white disabled:opacity-40 transition-all active:scale-[0.99]"
                style={{ background:"linear-gradient(135deg, var(--accent), var(--accent-strong))" }}>
                {T("Guardar lámpara","Save fixture")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// ---------------------------- PAR CALCULATOR ----------------------------
// Model: DB `par` = peak PAR (µmol/m²/s) at ~12" (30 cm) of water depth with the
// fixture mounted ~8" (20 cm) above the surface at 100% intensity. Values come
// from manufacturer data and community PAR maps (Reef2Reef / BRS-style Apogee
// measurements). Vertical decay: PAR halves roughly every 12" of water — this
// matches published depth charts for blue-heavy reef LEDs. Lateral decay uses
// a cos³ optic profile (~120° lens), which reproduces the ~55-60% of center
// PAR that community maps show at 12" off-axis. Calibrating with one real
// PAR-meter reading replaces the reference value with your actual number.

const PAR_ZONES_REEF = [
  { min: 0,   max: 30,   color: "#64748B", label: () => T("Muy bajo", "Very low"),     corals: () => T("Solo peces — sin corales fotosintéticos", "Fish only — no photosynthetic corals") },
  { min: 30,  max: 60,   color: "#3B82F6", label: () => T("Bajo", "Low"),              corals: () => T("Hongos, Discosoma, zoas de sombra", "Mushrooms, Discosoma, shade zoas") },
  { min: 60,  max: 110,  color: "#0E9F6E", label: () => T("Moderado", "Moderate"),     corals: () => T("Blandos: Zoanthus, Sinularia · LPS fácil: Duncan, Candy Cane", "Softies: Zoanthus, Sinularia · easy LPS: Duncan, Candy Cane") },
  { min: 110, max: 160,  color: "#65a30d", label: () => T("Medio-alto", "Medium-high"),corals: () => T("LPS: Euphyllia (hammer/torch), Favia, Acan, Chalice", "LPS: Euphyllia (hammer/torch), Favia, Acans, Chalice") },
  { min: 160, max: 250,  color: "#d97706", label: () => T("Alto", "High"),             corals: () => T("SPS tolerantes: Montipora, Birdsnest, Stylophora · Almejas", "Forgiving SPS: Montipora, Birdsnest, Stylophora · Clams") },
  { min: 250, max: 400,  color: "#DC4458", label: () => T("Muy alto", "Very high"),    corals: () => T("SPS exigentes: Acropora", "Demanding SPS: Acropora") },
  { min: 400, max: 9999, color: "#9F1239", label: () => T("Extremo", "Extreme"),       corals: () => T("Riesgo de fotoinhibición — solo Acro aclimatada", "Photoinhibition risk — acclimated Acros only") },
];
const PAR_ZONES_PLANTED = [
  { min: 0,  max: 15,   color: "#64748B", label: () => T("Muy bajo", "Very low"),   corals: () => T("Solo musgos y plantas de sombra extrema", "Only mosses and extreme-shade plants") },
  { min: 15, max: 30,   color: "#3B82F6", label: () => T("Bajo", "Low"),            corals: () => T("Anubias, helechos, Cryptocoryne, musgos", "Anubias, ferns, Cryptocoryne, mosses") },
  { min: 30, max: 50,   color: "#0E9F6E", label: () => T("Medio", "Medium"),        corals: () => T("Mayoría de plantas de tallo, alfombras fáciles", "Most stem plants, easy carpets") },
  { min: 50, max: 80,   color: "#65a30d", label: () => T("Alto", "High"),           corals: () => T("Alfombras exigentes, plantas rojas — CO₂ recomendado", "Demanding carpets, red plants — CO₂ recommended") },
  { min: 80, max: 9999, color: "#d97706", label: () => T("Muy alto", "Very high"),  corals: () => T("Riesgo de algas sin CO₂ y fertilización al día", "Algae risk without CO₂ and dialed-in ferts") },
];

function estimateBasePar(fx) {
  if (!fx) return null;
  if (fx.par) return fx.par;
  const w = fx.wattage || 0;
  if (!w) return null;
  // Rough PAR-per-watt at the 12"-depth reference by technology
  const perW = fx.type === "t5" ? 1.0 : fx.type === "mh" ? 1.8 : fx.type === "hybrid" ? 2.2 : (fx.spectrum === "reef" ? 3.4 : 2.4);
  return Math.round(w * perW);
}

const PAR_HALF_DEPTH = 12;   // inches of water for PAR to halve (BRS depth charts)
const PAR_MOUNT_EXP  = 1.4;  // air-side falloff exponent vs the 8" reference mount

function parMountFactor(mountIn) {
  return Math.pow((8 + 12) / (mountIn + 12), PAR_MOUNT_EXP);
}

function parAtDepth(basePar, intensityPct, mountIn, depthIn) {
  const p12 = basePar * (intensityPct / 100) * parMountFactor(mountIn);
  return Math.max(0, Math.round(p12 * Math.pow(0.5, (depthIn - 12) / PAR_HALF_DEPTH)));
}

// PAR at a point off the fixture's vertical axis: center PAR at that depth,
// reduced by a cos³ optic profile over the total optical distance.
function parAtPoint(basePar, intensityPct, mountIn, depthIn, radialIn) {
  const center = parAtDepth(basePar, intensityPct, mountIn, depthIn);
  const L = mountIn + depthIn;
  const lateral = Math.pow(L / Math.sqrt(L * L + radialIn * radialIn), 3);
  return Math.max(0, Math.round(center * lateral));
}

// Invert the model from one real PAR-meter reading → reference base PAR
function solveBaseParFromReading(measuredPar, depthIn, intensityPct, mountIn) {
  const decay = Math.pow(0.5, (depthIn - 12) / PAR_HALF_DEPTH);
  const denom = (intensityPct / 100) * parMountFactor(mountIn) * decay;
  return denom > 0 ? Math.round(measuredPar / denom) : null;
}

function parZoneFor(par, zones) {
  return zones.find((z) => par >= z.min && par < z.max) || zones[zones.length - 1];
}

// Depth range (inches below surface) where PAR falls inside a zone band.
// PAR decreases monotonically with depth, so invert the decay curve.
function depthRangeForZone(zone, basePar, intensityPct, mountIn, tankDepth) {
  const p12 = basePar * (intensityPct / 100) * parMountFactor(mountIn);
  if (p12 <= 0) return null;
  const depthAtPar = (target) => 12 + PAR_HALF_DEPTH * Math.log2(p12 / target);
  let dMin = zone.max >= 9999 ? -99 : depthAtPar(zone.max); // shallower bound (higher PAR)
  let dMax = zone.min <= 0 ? tankDepth : depthAtPar(zone.min);
  dMin = Math.max(0, dMin);
  dMax = Math.min(tankDepth, dMax);
  if (dMax <= dMin + 0.2) return null;
  return [Math.round(dMin), Math.round(dMax)];
}

// Resolve the active tank's physical dimensions: saved dims (new tanks store
// them) or a TANK_DB match by name for tanks added before dims existed.
function activeTankDims() {
  const tank = window.AquaStore?.activeTank || {};
  if (tank.dims?.h) return { tank, dims: tank.dims };
  const name = (tank.name || "").toLowerCase();
  if (typeof TANK_DB !== "undefined") {
    const row =
      (name && TANK_DB.find((r) => {
        const rn = r.n.toLowerCase();
        return rn === name || name.includes(rn) || rn.includes(name);
      })) ||
      // Renamed tank: fall back to brand + volume match
      (tank.brand && TANK_DB.find((r) =>
        r.br.toLowerCase() === tank.brand.toLowerCase() &&
        (r.vol === tank.displayVolume || r.vol === tank.realVolume)
      ));
    if (row?.h) return { tank, dims: { l: row.l, w: row.w, h: row.h } };
  }
  return { tank, dims: null };
}

const toCm = (inches) => Math.round(inches * 2.54);

function ParSliderRow({ icon, label, value, unit, display, min, max, step = 1, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-2)]">
          <L name={icon} size={12} className="text-[var(--ink-3)]" /> {label}
        </div>
        <div className="text-[12px] font-medium text-[var(--ink)] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
          {display || `${value}${unit}`}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full"
        style={{ accentColor: "var(--accent)", height: 22 }}
      />
    </div>
  );
}

function ParCalculatorCard({ fixture, onConfigure }) {
  const { LIGHTING_SCHEDULE } = window.AQUA;
  const week = window.AquaStore?.lightingWeek || 1;
  const chans = LIGHTING_SCHEDULE[week - 1]?.channels || {};
  const weekAvg = Object.keys(chans).length
    ? Math.round(Object.values(chans).reduce((a, b) => a + b, 0) / Object.keys(chans).length)
    : 70;

  const persisted = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("aqua:parcalc") || "{}"); } catch (e) { return {}; }
  }, []);

  // Active tank dimensions → real water depth (minus ~3" of sand bed + rim)
  const [tankRev, setTankRev] = useState(0);
  useEffect(() => {
    const fn = () => setTankRev((v) => v + 1);
    window.addEventListener("aqua:tank", fn);
    return () => window.removeEventListener("aqua:tank", fn);
  }, []);
  const { tank, dims: tankDims } = useMemo(activeTankDims, [tankRev]);
  const tankDepth = tankDims?.h ? Math.max(6, tankDims.h - 3) : null;

  const [intensity, setIntensity] = useState(persisted.i ?? weekAvg);
  const [mount, setMount]         = useState(persisted.m ?? 8);
  const [depth, setDepth]         = useState(persisted.d ?? tankDepth ?? 20);
  useEffect(() => {
    localStorage.setItem("aqua:parcalc", JSON.stringify({ i: intensity, m: mount, d: depth }));
  }, [intensity, mount, depth]);

  // AI-fetched PAR for manual fixtures that lack model data
  const [aiPar, setAiPar]   = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  useEffect(() => { setAiPar(null); }, [fixture?.name]);

  // Top-down map level + real-reading calibration
  const [mapLevel, setMapLevel] = useState("alta");
  const [calOpen, setCalOpen]   = useState(false);
  const [calPar, setCalPar]     = useState("");
  const [calDepth, setCalDepth] = useState("");

  const applyCalibration = () => {
    const measured = +calPar;
    const dCm = +calDepth;
    if (!measured || measured <= 0 || !dCm || dCm <= 0) {
      window.toast?.(T("Ingresa el PAR medido y la profundidad en cm", "Enter the measured PAR and depth in cm"), { tone: "warn", icon: "Gauge" });
      return;
    }
    const dIn = dCm / 2.54;
    const solved = solveBaseParFromReading(measured, dIn, intensity, mount);
    if (!solved || solved <= 0) return;
    setAiPar(solved);
    window.AquaStore?.setLightFixture({ ...fixture, par: solved, calibrated: true });
    setCalOpen(false); setCalPar(""); setCalDepth("");
    window.toast?.(T(`Calibrado: referencia ajustada a ${solved} µmol con tu medición`, `Calibrated: reference set to ${solved} µmol from your reading`), { icon: "Gauge" });
  };

  const fetchParAI = async () => {
    const apiKey = window.AQUAMIND_AI_KEY || localStorage.getItem("aqua:ai_key");
    if (!apiKey) {
      window.toast?.(T("Agrega tu key de Groq en Ajustes para usar la IA", "Add your Groq key in Settings to use AI"), { tone: "warn", icon: "Key" });
      return;
    }
    setAiBusy(true);
    try {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a database of aquarium light fixtures with PAR data. Return ONLY a JSON object — no markdown. If unknown, return {\"notFound\":true}." },
            { role: "user", content: `Typical peak PAR for the aquarium light "${[fixture.brand, fixture.name].filter(Boolean).join(" ")}" at 30cm water depth at 100% intensity.\nReturn: {"par":number}` },
          ],
          max_tokens: 60,
          temperature: 0.1,
        }),
      });
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      if (parsed.par && parsed.par > 0) {
        setAiPar(parsed.par);
        window.AquaStore?.setLightFixture({ ...fixture, par: parsed.par });
        window.toast?.(T(`PAR de referencia encontrado: ${parsed.par} µmol — guardado en tu lámpara`, `Reference PAR found: ${parsed.par} µmol — saved to your fixture`), { icon: "Sparkles" });
      } else {
        window.toast?.(T("La IA no tiene datos de esta lámpara — se usa el estimado por watts", "AI has no data for this fixture — using the wattage estimate"), { tone: "warn", icon: "SearchX" });
      }
    } catch (e) {
      window.toast?.(T("Error consultando la IA — verifica tu key de Groq", "AI request error — check your Groq key"), { tone: "warn", icon: "AlertTriangle" });
    }
    setAiBusy(false);
  };

  const basePar = aiPar || estimateBasePar(fixture);
  const zones = fixture?.spectrum === "planted" ? PAR_ZONES_PLANTED : PAR_ZONES_REEF;

  // ---- no fixture / no data states ----
  if (!fixture) {
    return (
      <Card className="p-5">
        <SectionHeader kicker={T("Estimador", "Estimator")} title={T("Calculadora PAR", "PAR calculator")} />
        <div className="flex items-center gap-3 py-2">
          <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: "var(--well)", border: "1px dashed var(--hairline-strong)" }}>
            <L name="SunDim" size={16} className="text-[var(--ink-3)]" />
          </div>
          <div className="flex-1 text-[12px] text-[var(--ink-2)]">
            {T("Configura tu lámpara para estimar el PAR en cada zona de tu tanque y saber dónde colocar cada coral.", "Set up your fixture to estimate PAR at every depth of your tank and know where each coral belongs.")}
          </div>
          <Button size="sm" variant="primary" icon="Lamp" onClick={onConfigure}>{T("Configurar", "Set up")}</Button>
        </div>
      </Card>
    );
  }
  if (!basePar) {
    return (
      <Card className="p-5">
        <SectionHeader kicker={T("Estimador", "Estimator")} title={T("Calculadora PAR", "PAR calculator")} />
        <div className="text-[12px] text-[var(--ink-2)]">
          {T("Agrega la potencia (W) de tu lámpara para poder estimar el PAR.", "Add your fixture's wattage so PAR can be estimated.")}
          {" "}<button onClick={onConfigure} className="text-[var(--accent)] underline underline-offset-2">{T("Editar lámpara", "Edit fixture")}</button>
        </div>
      </Card>
    );
  }

  const parAt = (d) => parAtDepth(basePar, intensity, mount, d);
  const surface = parAt(2);
  const middle  = parAt(depth / 2);
  const bottom  = parAt(Math.max(2, depth - 2));

  // Average over the water column (1" samples)
  let sum = 0;
  for (let d = 1; d <= depth; d++) sum += parAt(d);
  const avg = Math.round(sum / depth);
  const avgZone = parZoneFor(avg, zones);

  // Cross-section geometry
  const W = 300, PAD = 14, LAMP_H = 16, AIR_MAX = 34;
  const airH = 10 + (mount / 16) * (AIR_MAX - 10);
  const waterH = 150;
  const H = PAD + LAMP_H + airH + waterH + 10;
  const yWater = PAD + LAMP_H + airH;
  const yOfDepth = (d) => yWater + (d / depth) * waterH;
  const bands = [];
  const STEPS = 24;
  for (let i = 0; i < STEPS; i++) {
    const d0 = (depth * i) / STEPS, d1 = (depth * (i + 1)) / STEPS;
    const z = parZoneFor(parAt((d0 + d1) / 2), zones);
    bands.push({ y: yOfDepth(d0), h: yOfDepth(d1) - yOfDepth(d0), color: z.color });
  }
  const markers = [
    { d: 2,                     par: surface, name: T("Superficie", "Surface") },
    { d: depth / 2,             par: middle,  name: T("Medio", "Middle") },
    { d: Math.max(2, depth - 2), par: bottom, name: T("Fondo", "Bottom") },
  ];

  // Placement guide rows (only zones present in this tank at these settings)
  const guide = zones
    .map((z) => ({ z, range: depthRangeForZone(z, basePar, intensity, mount, depth) }))
    .filter((g) => g.range);

  return (
    <Card className="p-5">
      <SectionHeader
        kicker={T("Estimador", "Estimator")}
        title={T("Calculadora PAR", "PAR calculator")}
        action={
          <div className="text-right">
            <div className="text-[22px] font-medium tabular-nums leading-none" style={{ fontFamily: "var(--font-mono)", color: avgZone.color }}>{avg}</div>
            <div className="text-[9px] tracking-wider text-[var(--ink-3)] mt-0.5"><span className="uppercase">{T("PAR promedio", "Avg PAR")}</span> · µmol/m²/s</div>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-4 text-[11.5px] text-[var(--ink-2)]">
        <L name="Lamp" size={13} className="text-[var(--accent)] shrink-0" />
        <span className="truncate">{fixture.name}</span>
        {(fixture.par || aiPar)
          ? <span className="shrink-0" style={{ color: fixture.calibrated ? "var(--accent)" : "var(--ink-3)" }}>
              · {fixture.calibrated ? T("calibrada con tu medición", "calibrated with your reading") : T("datos del modelo", "model data")}
            </span>
          : <button onClick={fetchParAI} disabled={aiBusy}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold disabled:opacity-60 transition-all"
              style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>
              <L name={aiBusy ? "Loader2" : "Sparkles"} size={10} className={aiBusy ? "animate-spin" : ""} />
              {aiBusy ? T("Buscando…", "Searching…") : T("PAR real con IA", "Real PAR via AI")}
            </button>}
        <button onClick={onConfigure} className="ml-auto shrink-0 text-[var(--ink-3)] hover:text-[var(--accent)] transition-colors"><L name="Edit3" size={13} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left — controls + cross-section */}
        <div>
          {/* Active tank — real dimensions drive the water depth */}
          {tankDims && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
              <L name="Container" size={13} style={{ color: "var(--accent)" }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-[var(--ink)] truncate">{tank.name}</div>
                <div className="text-[10px] text-[var(--ink-2)]">
                  {tankDims.l}×{tankDims.w || "?"}×{tankDims.h} in ({toCm(tankDims.l)}×{tankDims.w ? toCm(tankDims.w) : "?"}×{toCm(tankDims.h)} cm)
                  {" · "}{T("agua", "water")} ≈ {tankDepth} in
                </div>
              </div>
              {depth !== tankDepth && (
                <button onClick={() => setDepth(tankDepth)}
                  className="shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold transition-all"
                  style={{ background: "var(--accent)", color: "#fff" }}>
                  {T("Usar medidas", "Use dims")}
                </button>
              )}
            </div>
          )}

          <div className="space-y-3 mb-4">
            <ParSliderRow icon="SunMedium" label={T("Intensidad", "Intensity")} value={intensity} unit="%" min={10} max={100} step={5} onChange={setIntensity} />
            <ParSliderRow icon="MoveVertical" label={T("Altura de montaje sobre el agua", "Mount height above water")} value={mount} display={`${mount} in · ${toCm(mount)} cm`} min={3} max={16} onChange={setMount} />
            <ParSliderRow icon="Waves" label={T("Profundidad del agua", "Water depth")} value={depth} display={`${depth} in · ${toCm(depth)} cm`} min={8} max={32} onChange={setDepth} />
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {/* lamp */}
            <rect x={W / 2 - 34} y={PAD} width={68} height={LAMP_H} rx={5} fill="var(--well)" stroke="var(--hairline-strong)" />
            <circle cx={W / 2} cy={PAD + LAMP_H / 2} r={3.5} fill={avgZone.color} />
            {/* light cone */}
            <path d={`M${W / 2 - 26},${PAD + LAMP_H} L${PAD + 6},${yWater} L${W - PAD - 6},${yWater} L${W / 2 + 26},${PAD + LAMP_H} Z`} fill={avgZone.color} opacity="0.08" />
            {/* water: colored PAR bands */}
            {bands.map((b, i) => (
              <rect key={i} x={PAD} y={b.y} width={W - PAD * 2} height={b.h + 0.5} fill={b.color} opacity="0.22" />
            ))}
            {/* tank walls */}
            <path d={`M${PAD},${yWater} L${PAD},${yWater + waterH} L${W - PAD},${yWater + waterH} L${W - PAD},${yWater}`} fill="none" stroke="var(--hairline-strong)" strokeWidth="1.5" />
            <line x1={PAD} x2={W - PAD} y1={yWater} y2={yWater} stroke="var(--accent)" strokeOpacity="0.5" strokeDasharray="5 4" />
            {/* depth markers */}
            {markers.map((m, i) => {
              const y = yOfDepth(m.d);
              const z = parZoneFor(m.par, zones);
              return (
                <g key={i}>
                  <line x1={PAD + 4} x2={W - 140} y1={y} y2={y} stroke={z.color} strokeOpacity="0.55" strokeDasharray="2 3" />
                  <text x={W - 134} y={y + 3} fontSize="9" fill="var(--ink-2)" fontFamily="DM Mono">{m.name} · {toCm(m.d)} cm</text>
                  <text x={W - PAD} y={y + 3} fontSize="10.5" fontWeight="600" fill={z.color} textAnchor="end" fontFamily="DM Mono">{m.par}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right — placement guide */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-2">
            {fixture.spectrum === "planted" ? T("Guía de plantas por profundidad", "Plant guide by depth") : T("¿Dónde va cada coral?", "Where does each coral go?")}
          </div>
          <div className="space-y-1.5">
            {guide.map(({ z, range }, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2" style={{ background: `${z.color}0F`, border: `1px solid ${z.color}30` }}>
                <span className="mt-0.5 w-2 h-2 rounded-full shrink-0" style={{ background: z.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-semibold" style={{ color: z.color }}>{z.label()} · {z.min}–{z.max >= 9999 ? "∞" : z.max} µmol</div>
                  <div className="text-[10.5px] text-[var(--ink-2)] mt-0.5">{z.corals()}</div>
                  <div className="text-[10px] font-medium mt-1 flex items-center gap-1" style={{ color: z.color }}>
                    <L name="MoveDown" size={9} />
                    {T(`Colócalo a ${toCm(range[0])}–${toCm(range[1])} cm bajo la superficie (${range[0]}–${range[1]} in)`,
                       `Place it ${toCm(range[0])}–${toCm(range[1])} cm below the surface (${range[0]}–${range[1]} in)`)}
                  </div>
                </div>
              </div>
            ))}
            {!guide.length && (
              <div className="text-[11.5px] text-[var(--ink-2)]">{T("Con esta configuración el PAR queda fuera de las zonas útiles — sube la intensidad o baja la lámpara.", "At these settings PAR falls outside useful ranges — raise intensity or lower the fixture.")}</div>
            )}
          </div>
          <div className="mt-3 flex items-start gap-1.5 text-[10px] text-[var(--ink-3)]">
            <L name="Info" size={11} className="shrink-0 mt-0.5" />
            {T("Estimación basada en datos de fabricantes y mediciones de la comunidad (Reef2Reef). Un medidor PAR real siempre da el valor exacto.", "Estimate based on manufacturer data and community measurements (Reef2Reef). A real PAR meter always gives the exact value.")}
          </div>
        </div>
      </div>

      {/* ---- Top-down PAR map: 6×6 grid at three rock levels ---- */}
      {(() => {
        const gl = tankDims?.l || 24;                     // footprint length (in)
        const gw = tankDims?.w || Math.min(18, gl);       // footprint width (in)
        const levels = [
          { id: "alta",  name: T("Zona alta", "Top zone"),    d: Math.max(2, Math.round(depth * 0.25)) },
          { id: "media", name: T("Zona media", "Mid zone"),   d: Math.max(3, Math.round(depth * 0.55)) },
          { id: "baja",  name: T("Zona baja", "Bottom zone"), d: Math.max(4, depth - 2) },
        ];
        const level = levels.find((l) => l.id === mapLevel) || levels[0];
        const N = 6;
        const cellsFor = (dz) => {
          const out = [];
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
            const cx = ((i + 0.5) / N) * gl - gl / 2;
            const cy = ((j + 0.5) / N) * gw - gw / 2;
            out.push(parAtPoint(basePar, intensity, mount, dz, Math.hypot(cx, cy)));
          }
          return out;
        };
        const cells = cellsFor(level.d);
        const avgOf = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

        return (
          <div className="mt-5 pt-4 border-t border-[var(--hairline)]">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)]">
                {T("Vista superior · mapa PAR", "Top-down view · PAR map")}
                <span className="normal-case ml-1.5">({gl}×{gw} in · {toCm(gl)}×{toCm(gw)} cm · {T("lámpara centrada", "fixture centered")})</span>
              </div>
              <div className="flex p-0.5 rounded-lg" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
                {levels.map((lv) => (
                  <button key={lv.id} onClick={() => setMapLevel(lv.id)}
                    className="px-2.5 py-1 rounded-md text-[10.5px] font-medium transition-all"
                    style={mapLevel === lv.id ? { background: "var(--surface-strong)", color: "var(--accent)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "var(--ink-3)" }}>
                    {lv.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Zone comparison strip — average of each level side by side */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {levels.map((lv) => {
                const a = avgOf(cellsFor(lv.d));
                const z = parZoneFor(a, zones);
                const active = mapLevel === lv.id;
                return (
                  <button key={lv.id} onClick={() => setMapLevel(lv.id)}
                    className="rounded-xl px-2 py-1.5 text-left transition-all"
                    style={{ background: `${z.color}${active ? "1F" : "0D"}`, border: `1px solid ${z.color}${active ? "60" : "25"}` }}>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--ink-3)]">{lv.name} · {toCm(lv.d)} cm</div>
                    <div className="text-[14px] font-semibold tabular-nums leading-tight" style={{ fontFamily: "var(--font-mono)", color: z.color }}>
                      {a} <span className="text-[9px] font-normal">µmol</span>
                    </div>
                    <div className="text-[9px] font-medium" style={{ color: z.color }}>{z.label()}</div>
                  </button>
                );
              })}
            </div>

            {/* 6×6 grid, proportional to the tank footprint */}
            <div className="grid gap-[3px] mx-auto" style={{ gridTemplateColumns: `repeat(${N}, 1fr)`, maxWidth: 420, aspectRatio: `${gl} / ${gw}` }}>
              {cells.map((p, idx) => {
                const z = parZoneFor(p, zones);
                return (
                  <div key={idx} className="rounded-[5px] grid place-items-center min-h-[26px]"
                    style={{ background: `${z.color}26`, border: `1px solid ${z.color}45` }}>
                    <span className="text-[10px] font-semibold tabular-nums" style={{ fontFamily: "var(--font-mono)", color: z.color }}>{p}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[9.5px] text-[var(--ink-3)] text-center mt-1.5">
              {T(`PAR a ${toCm(level.d)} cm (${level.d} in) bajo la superficie · frente del tanque abajo`, `PAR at ${toCm(level.d)} cm (${level.d} in) below the surface · tank front at bottom`)}
            </div>
          </div>
        );
      })()}

      {/* ---- Calibrate with a real PAR meter reading ---- */}
      <div className="mt-4 pt-3 border-t border-[var(--hairline)]">
        {!calOpen ? (
          <button onClick={() => setCalOpen(true)} className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity">
            <L name="Gauge" size={12} />
            {fixture.calibrated
              ? T("Recalibrar con otra medición real", "Recalibrate with another real reading")
              : T("¿Tienes un medidor PAR? Calibra con tu medición real", "Have a PAR meter? Calibrate with your real reading")}
          </button>
        ) : (
          <div className="rounded-xl p-3" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
            <div className="text-[11px] font-semibold text-[var(--ink)] mb-0.5">{T("Calibrar con medición real", "Calibrate with a real reading")}</div>
            <div className="text-[10px] text-[var(--ink-2)] mb-2">
              {T("Mide el PAR en el centro del tanque con tu intensidad y montaje actuales, y dime a qué profundidad mediste. Ajusto todo el mapa a tu número.",
                 "Measure PAR at tank center with your current intensity and mount, and tell me the depth. The whole map recalibrates to your number.")}
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <label className="block">
                <div className="text-[9px] uppercase tracking-wider text-[var(--ink-3)] mb-0.5">{T("PAR medido", "Measured PAR")}</div>
                <input type="number" inputMode="numeric" value={calPar} onChange={(e) => setCalPar(e.target.value)} placeholder="230"
                  className="w-24 bg-[var(--surface-strong)] border border-[var(--hairline)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)]" />
              </label>
              <label className="block">
                <div className="text-[9px] uppercase tracking-wider text-[var(--ink-3)] mb-0.5">{T("Profundidad (cm)", "Depth (cm)")}</div>
                <input type="number" inputMode="numeric" value={calDepth} onChange={(e) => setCalDepth(e.target.value)} placeholder={String(toCm(depth / 2))}
                  className="w-24 bg-[var(--surface-strong)] border border-[var(--hairline)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)]" />
              </label>
              <button onClick={applyCalibration}
                className="px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-strong))" }}>
                {T("Calibrar", "Calibrate")}
              </button>
              <button onClick={() => setCalOpen(false)} className="px-2 py-1.5 text-[11px] text-[var(--ink-3)] hover:text-[var(--ink-2)]">
                {T("Cancelar", "Cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function LightingPage() {
  const { LIGHTING_SCHEDULE, LIGHT_CHANNELS } = window.AQUA;
  const currentWeek = window.AquaStore?.lightingWeek || 1;
  const [fixture, setFixture] = useState(window.AquaStore?.lightFixture || null);
  const [fixtureOpen, setFixtureOpen] = useState(false);

  // Re-read fixture after modal closes
  const closeFixtureModal = () => {
    setFixtureOpen(false);
    setFixture(window.AquaStore?.lightFixture || null);
  };

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">{T("Iluminación · Protocolo de aclimatación","Lighting · Acclimation protocol")}</div>
          <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">{T("Programa de luz · 4 semanas","Lighting schedule · 4 weeks")}</h1>
          <p className="text-[12.5px] text-[var(--ink-2)] mt-1">{T("Aumentos graduales por canal para evitar estrés lumínico en corales nuevos","Gradual per-channel ramps to avoid light stress on new corals")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" icon="Lamp" onClick={() => setFixtureOpen(true)}>{T("Mi lámpara","My fixture")}</Button>
          <Button variant="secondary" size="sm" icon="Power" onClick={() => window.toast?.(T("Modo noche activado — intensidad reducida al 5%", "Night mode active — intensity reduced to 5%"), { icon: "Moon", tone: "info" })}>{T("Modo noche","Night mode")}</Button>
          <Button variant="primary" size="sm" icon="Sliders" onClick={() => window.toast?.(T("Ajustes finos de iluminación — próximamente", "Fine lighting controls — coming soon"), { icon: "Sliders", tone: "info" })}>{T("Ajustes finos","Fine tuning")}</Button>
        </div>
      </div>
      {fixtureOpen && <LightFixtureModal onClose={closeFixtureModal} />}

      {/* Fixture info card — shown when configured */}
      {fixture && (
        <Card className="p-4 flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: "rgba(13,148,136,0.13)", border: "1px solid rgba(13,148,136,0.3)" }}>
            <L name="Lamp" size={16} style={{ color: "#0E9F6E" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold text-[var(--ink)]">{fixture.name}</div>
            <div className="text-[11px] text-[var(--ink-2)]">
              {[fixture.brand, fixture.type?.toUpperCase(), fixture.wattage ? `${fixture.wattage}W` : null].filter(Boolean).join(" · ")}
            </div>
          </div>
          <Button size="sm" variant="ghost" icon="Edit3" onClick={() => setFixtureOpen(true)}>{T("Editar","Edit")}</Button>
        </Card>
      )}

      {/* No fixture yet — prompt to configure */}
      {!fixture && (
        <Card className="p-4 flex items-center gap-3" style={{ border: "1px dashed var(--hairline-strong)" }}>
          <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
            <L name="Lamp" size={16} className="text-[var(--ink-3)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-[var(--ink)]">{T("Sin lámpara configurada", "No fixture configured")}</div>
            <div className="text-[11px] text-[var(--ink-2)]">{T("Agrega tu luminaria para ver su nombre en el dashboard", "Add your light to show its name on the dashboard")}</div>
          </div>
          <Button size="sm" variant="primary" icon="Plus" onClick={() => setFixtureOpen(true)}>{T("Agregar","Add")}</Button>
        </Card>
      )}

      {/* PAR estimator */}
      <ParCalculatorCard fixture={fixture} onConfigure={() => setFixtureOpen(true)} />

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
        <SectionHeader kicker={T("Ciclo diario","Daily cycle")} title={T("Curva de iluminación · 24h","Light curve · 24h")} action={<Button size="sm" variant="ghost" icon="Edit3" onClick={() => window.toast?.(T("Editor de curva de luz — próximamente", "Light curve editor — coming soon"), { icon: "SunMedium", tone: "info" })}>{T("Editar","Edit")}</Button>} />
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

  const nextWeekDate = new Date(MOCK_TODAY);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeekStr = nextWeekDate.toISOString().slice(0, 10);
  const groups = {
    today: ROUTINES.filter((r) => r.nextDue === "today"),
    week: ROUTINES.filter((r) => r.nextDue !== "today" && r.nextDue <= nextWeekStr),
    later: ROUTINES.filter((r) => r.nextDue > nextWeekStr),
  };

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">{T("Rutinas y mantenimiento","Routines & maintenance")}</div>
          <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">{T("Tu calendario de cuidados","Your care calendar")}</h1>
        </div>
        <Button variant="primary" icon="Plus" onClick={() => window.toast?.(T("Escribe «agrega rutina [nombre] semanal» en Aqua Buddy para crear una rutina", "Type 'add routine [name] weekly' in Aqua Buddy to create a routine"), { icon: "Sparkles", tone: "info" })}>{T("Nueva rutina","New routine")}</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <SectionHeader kicker={`${T("Hoy","Today")} · ${fmtShortDate(MOCK_TODAY)}`} title={`${groups.today.length} ${T("pendientes","pending")}`} />
          <div className="space-y-1">
            {groups.today.map((r, i) => (
              <RoutineItem key={r.id} routine={r} done={!!done[r.id]} onToggle={() => toggle(r.id)} isFirst={i === 0} isLast={i === groups.today.length - 1} urgent />
            ))}
            {groups.today.length === 0 && (
              <div className="text-[11.5px] text-[var(--ink-3)] py-5 text-center">{T("¡Todo al día por hoy!", "All caught up for today!")}</div>
            )}
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
            {groups.later.length === 0 && (
              <div className="text-[11.5px] text-[var(--ink-3)] py-5 text-center">{T("Sin rutinas más adelante", "No upcoming routines")}</div>
            )}
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
    ["Temp", `${params.temperature?.value}°F`],
    [T("Volumen real", "Real volume"), `${TANK_CONFIG.realVolume} gal`],
  ];

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 flex flex-col gap-4" style={{ minHeight: 0 }}>
      {/* Visible page header */}
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
          <L name="Sparkles" size={18} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-0.5">{T("Asistente IA · Reef & Acuario", "AI Assistant · Reef & Aquarium")}</div>
          <h1 className="text-[20px] lg:text-[22px] font-semibold text-[var(--ink)] tracking-tight">{T("Aqua Buddy", "Aqua Buddy")}</h1>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-1.5 text-[11px] text-[var(--ink-2)]">
          <PulsingDot color="#0E9F6E" size={6} />
          {T("Contexto de tu tanque cargado", "Your tank context loaded")}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 flex-1 min-h-0">
        <div className="min-h-[500px] lg:min-h-0 min-w-0">
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

          {!window.AQUAMIND_AI_KEY && !localStorage.getItem("aqua:ai_key") && (
            <Card className="p-4">
              <div className="flex items-start gap-2.5">
                <div className="grid place-items-center w-8 h-8 rounded-xl shrink-0 mt-0.5" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <L name="Key" size={14} style={{ color: "#C77F00" }} />
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold text-[var(--ink)] mb-0.5">{T("API key de Groq requerida", "Groq API key required")}</div>
                  <div className="text-[11px] text-[var(--ink-2)] leading-relaxed">{T("Obtén tu key gratuita (sin tarjeta) en ", "Get your free key (no credit card) at ")}<span className="font-medium" style={{ color: "var(--accent)" }}>console.groq.com/keys</span>{T(" y agrégala en Ajustes → Cuenta → Aqua Buddy.", " and add it in Settings → Account → Aqua Buddy.")}</div>
                </div>
              </div>
            </Card>
          )}
          <Card className="p-4">
            <SectionHeader kicker={T("Modo personalizado","Personalized mode")} title={T("Preguntas sobre tu tanque","Questions about your tank")} />
            <div className="flex flex-col gap-1.5">
              {[
                T("¿Cómo están mis parámetros actuales?","How are my current parameters?"),
                T("¿Qué debo hacer esta semana en mi acuario?","What should I do this week in my aquarium?"),
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
                T("¿Cómo ciclar un tanque nuevo?","How to cycle a new tank?"),
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

// ========================= SUPPLEMENTS PAGE =========================
const SUP_CATEGORIES = [
  { id: "fish_food",   label: () => T("Comida Peces",   "Fish Food"),   icon: "Fish",       color: "#60A5FA" },
  { id: "coral_food",  label: () => T("Comida Corales", "Coral Food"),  icon: "Flower2",    color: "#F87171" },
  { id: "additive",    label: () => T("Aditivo / Supl.", "Additive"),   icon: "FlaskConical", color: "#0E9F6E" },
];

function AddSupplementModal({ onClose, editItem }) {
  const S = window.AquaStore;
  const [name,     setName]     = React.useState(editItem?.name     || "");
  const [cat,      setCat]      = React.useState(editItem?.category || "fish_food");
  const [schedule, setSchedule] = React.useState(editItem?.schedule || T("Diario","Daily"));
  const [amount,   setAmount]   = React.useState(editItem?.amount   || "");
  const [unit,     setUnit]     = React.useState(editItem?.unit     || "");
  const [note,     setNote]     = React.useState(editItem?.note     || "");

  const save = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), category: cat, schedule, amount: amount.trim(), unit: unit.trim(), note: note.trim() };
    if (editItem) S.updateSupplement(editItem.id, data);
    else S.addSupplement(data);
    onClose();
  };

  const schedOpts = [T("Diario","Daily"), T("2x día","2x day"), T("Semanal","Weekly"), T("Quincenal","Biweekly"), T("Mensual","Monthly")];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-md glass rounded-3xl p-5 space-y-4" style={{ maxHeight: "90dvh", overflowY: "auto" }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[var(--hover)]"><L name="ArrowLeft" size={16} /></button>
          <h2 className="text-[16px] font-semibold text-[var(--ink)]">{editItem ? T("Editar suplemento","Edit supplement") : T("Agregar suplemento","Add supplement")}</h2>
        </div>

        {/* Category */}
        <div className="grid grid-cols-3 gap-2">
          {SUP_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all text-center" style={{ background: cat === c.id ? `${c.color}20` : "var(--well)", borderColor: cat === c.id ? c.color : "var(--hairline)" }}>
              <L name={c.icon} size={18} style={{ color: c.color }} />
              <span className="text-[10.5px] font-medium leading-tight" style={{ color: cat === c.id ? c.color : "var(--ink-2)" }}>{c.label()}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mb-1 block">{T("Nombre","Name")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={T("Ej: Mysis, Coral Frenzy, Kalkwasser…","E.g. Mysis, Coral Frenzy, Kalkwasser…")} className="w-full glass-strong rounded-xl px-3 py-2.5 text-[13px] text-[var(--ink)] border border-[var(--hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]" />
          </div>
          <div>
            <label className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mb-1 block">{T("Frecuencia","Frequency")}</label>
            <div className="flex flex-wrap gap-1.5">
              {schedOpts.map((o) => (
                <button key={o} onClick={() => setSchedule(o)} className="px-3 py-1.5 rounded-full text-[11.5px] transition-all" style={{ background: schedule === o ? "var(--accent)" : "var(--well)", color: schedule === o ? "#fff" : "var(--ink-2)", border: "1px solid " + (schedule === o ? "var(--accent)" : "var(--hairline)") }}>{o}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mb-1 block">{T("Cantidad","Amount")}</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5" className="w-full glass-strong rounded-xl px-3 py-2.5 text-[13px] text-[var(--ink)] border border-[var(--hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]" />
            </div>
            <div>
              <label className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mb-1 block">{T("Unidad","Unit")}</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ml, g, pinch…" className="w-full glass-strong rounded-xl px-3 py-2.5 text-[13px] text-[var(--ink)] border border-[var(--hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mb-1 block">{T("Nota","Note")}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={T("Instrucciones, marca, observaciones…","Instructions, brand, observations…")} className="w-full glass-strong rounded-xl px-3 py-2.5 text-[13px] text-[var(--ink)] border border-[var(--hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] resize-none" />
          </div>
        </div>

        <button onClick={save} disabled={!name.trim()} className="w-full py-3 rounded-2xl font-semibold text-[13.5px] text-white transition-all disabled:opacity-40" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-strong))" }}>
          {editItem ? T("Guardar cambios","Save changes") : T("Agregar suplemento","Add supplement")}
        </button>
      </div>
    </div>,
    document.body
  );
}

function SupplementCard({ item, onEdit, onRemove, onLog }) {
  const cat = SUP_CATEGORIES.find((c) => c.id === item.category) || SUP_CATEGORIES[0];
  const lastUsed = item.lastUsed ? new Date(item.lastUsed).toLocaleDateString() : T("Nunca","Never");
  return (
    <Card hover className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-2xl shrink-0" style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}40` }}>
          <L name={cat.icon} size={18} style={{ color: cat.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[13.5px] font-semibold text-[var(--ink)] leading-snug">{item.name}</div>
              <div className="text-[11px] text-[var(--ink-3)] mt-0.5">{cat.label()} · {item.schedule}{item.amount ? ` · ${item.amount}${item.unit ? " " + item.unit : ""}` : ""}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onLog(item)} className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--ink-3)] hover:text-[var(--accent)] transition-colors"><L name="CheckCircle2" size={14} /></button>
              <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--ink-3)] transition-colors"><L name="Pencil" size={14} /></button>
              <button onClick={() => onRemove(item.id)} className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--ink-3)] hover:text-red-400 transition-colors"><L name="Trash2" size={14} /></button>
            </div>
          </div>
          {item.note && <div className="text-[11px] text-[var(--ink-2)] mt-1.5 leading-relaxed">{item.note}</div>}
          <div className="text-[10px] text-[var(--ink-3)] mt-1.5">{T("Última dosis:","Last dose:")} {lastUsed}</div>
        </div>
      </div>
    </Card>
  );
}

function SupplementsPage() {
  const S = window.AquaStore;
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [modal, setModal] = React.useState(null); // null | "add" | item (edit)
  const supplements = S.ud.supplements || [];

  React.useEffect(() => {
    const fn = () => forceUpdate();
    window.addEventListener("aqua:data", fn);
    return () => window.removeEventListener("aqua:data", fn);
  }, []);

  const logDose = (item) => {
    S.updateSupplement(item.id, { lastUsed: new Date().toISOString() });
    window.toast?.(T(`Dosis registrada: ${item.name}`, `Dose logged: ${item.name}`), { icon: "CheckCircle2" });
  };

  const grouped = SUP_CATEGORIES.map((cat) => ({
    cat,
    items: supplements.filter((s) => s.category === cat.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="px-4 lg:px-6 py-5 lg:py-6 space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">{T("Alimentación & Suplementos","Feeding & Supplements")}</div>
          <h1 className="text-[20px] lg:text-[22px] font-medium text-[var(--ink)] tracking-tight">{T("Suplementos","Supplements")}</h1>
        </div>
        <Button variant="primary" icon="Plus" onClick={() => setModal("add")}>{T("Agregar","Add")}</Button>
      </div>

      {supplements.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="grid place-items-center w-14 h-14 rounded-3xl mx-auto mb-3" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
            <L name="FlaskConical" size={24} style={{ color: "var(--accent)" }} />
          </div>
          <div className="text-[14px] font-semibold text-[var(--ink)] mb-1">{T("Sin suplementos aún","No supplements yet")}</div>
          <div className="text-[12px] text-[var(--ink-2)] mb-4">{T("Agrega la comida de tus peces, corales y aditivos dosificados.","Add fish food, coral food and dosed additives.")}</div>
          <Button variant="primary" icon="Plus" onClick={() => setModal("add")}>{T("Agregar suplemento","Add supplement")}</Button>
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ cat, items }) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2.5">
                <L name={cat.icon} size={14} style={{ color: cat.color }} />
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: cat.color }}>{cat.label()}</span>
                <span className="text-[11px] text-[var(--ink-3)]">· {items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.map((item) => (
                  <SupplementCard key={item.id} item={item} onEdit={(it) => setModal(it)} onRemove={(id) => { S.removeSupplement(id); forceUpdate(); }} onLog={logDose} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === "add" || (modal && typeof modal === "object")) && (
        <AddSupplementModal editItem={modal === "add" ? null : modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

Object.assign(window, { ParametersPage, InhabitantsPage, LightingPage, RoutinesPage, AquaBotPage, AlertsPage, SupplementsPage, expand30, LogReadingModal, exportParamsCSV });
