// Layout: Sidebar, Header, MobileTabBar, Logo — Liquid Glass edition
const NAV_ITEMS = () => [
  { id: "dashboard",   label: T("Inicio", "Home"),                   icon: "Home" },
  { id: "parameters",  label: T("Bitácora", "Logbook"),              icon: "NotebookPen" },
  { id: "lighting",    label: T("Iluminación", "Lighting"),          icon: "SunMedium" },
  { id: "inhabitants", label: T("Habitantes", "Livestock"),          icon: "Fish" },
  { id: "supplements", label: T("Suplementos", "Supplements"),       icon: "FlaskConical" },
  { id: "routines",    label: T("Rutinas", "Routines"),              icon: "CalendarCheck" },
  { id: "ai",          label: T("Asistente IA", "AI Assistant"),     icon: "Sparkles" },
  { id: "alerts",      label: T("Alertas", "Alerts"),                icon: "Bell" },
];

function Logo({ size = 36 }) {
  return (
    <div
      className="grid place-items-center rounded-2xl shrink-0"
      style={{
        width: size, height: size,
        background: "linear-gradient(150deg, rgba(255,255,255,0.85), rgba(255,255,255,0.25))",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 4px 14px rgba(13,148,136,0.25), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      <L name="Droplet" size={size * 0.5} style={{ color: "var(--accent)" }} strokeWidth={1.8} />
    </div>
  );
}

function NavItem({ item, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-150 ${
        active
          ? "glass-strong text-[var(--ink)] font-semibold shadow-sm"
          : "text-[var(--ink-2)] hover:bg-[var(--hover)] hover:text-[var(--ink)]"
      }`}
    >
      <L name={item.icon} size={17} strokeWidth={active ? 2 : 1.6} style={active ? { color: "var(--accent)" } : undefined} />
      <span className="text-[13.5px] flex-1">{item.label}</span>
      {badge > 0 && (
        <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full" style={{ background: "rgba(225,29,72,0.13)", color: "#DC4458", border: "1px solid rgba(225,29,72,0.28)" }}>{badge}</span>
      )}
    </button>
  );
}

function Sidebar({ activePage, onNavigate, alertCount = 0, session }) {
  const { TANK_CONFIG } = window.AQUA;
  const userName = session?.name || TANK_CONFIG.owner;
  const userSub = session?.email || TANK_CONFIG.location;
  const userColor = session?.color || "linear-gradient(150deg, var(--accent), var(--indigo))";
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 sticky top-0 h-screen p-4 pr-0">
      <div className="glass rounded-[28px] flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <Logo />
          <div>
            <div className="text-[15.5px] font-semibold tracking-tight text-[var(--ink)]">AquaMind</div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-[var(--ink-3)] font-medium">Aquarium Intelligence</div>
          </div>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto flex flex-col gap-1">
          {NAV_ITEMS().map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={activePage === item.id}
              badge={item.id === "alerts" ? alertCount : 0}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>

        <div className="p-3 mt-auto flex flex-col gap-1 border-t border-[var(--hairline)]">
          <NavItem
            item={{ id: "settings", label: T("Ajustes", "Settings"), icon: "Settings" }}
            active={activePage === "settings"}
            onClick={() => onNavigate("settings")}
          />
          <button onClick={() => onNavigate("settings")} className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl hover:bg-[var(--hover)] transition-colors text-left w-full">
            <div
              className="grid place-items-center w-8 h-8 rounded-full text-[11px] font-semibold text-white shrink-0"
              style={{ background: userColor }}
            >
              {userName[0]}
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-[var(--ink)] truncate">{userName}</div>
              <div className="text-[10px] text-[var(--ink-3)] truncate">{userSub}</div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}

function useClock() {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ---- Built-in tank database ----
const TANK_DB = [
  // Aqueon
  { n:"Aqueon 5.5 Gallon",       br:"Aqueon",            vol:5.5,  l:16, w:8,  h:10, t:"freshwater" },
  { n:"Aqueon 10 Gallon",        br:"Aqueon",            vol:10,   l:20, w:10, h:12, t:"freshwater" },
  { n:"Aqueon 20H",              br:"Aqueon",            vol:20,   l:24, w:12, h:16, t:"freshwater" },
  { n:"Aqueon 20L",              br:"Aqueon",            vol:20,   l:30, w:12, h:12, t:"freshwater" },
  { n:"Aqueon 29 Gallon",        br:"Aqueon",            vol:29,   l:30, w:12, h:18, t:"freshwater" },
  { n:"Aqueon 40 Breeder",       br:"Aqueon",            vol:40,   l:36, w:18, h:16, t:"freshwater" },
  { n:"Aqueon 55 Gallon",        br:"Aqueon",            vol:55,   l:48, w:13, h:21, t:"freshwater" },
  { n:"Aqueon 75 Gallon",        br:"Aqueon",            vol:75,   l:48, w:18, h:21, t:"freshwater" },
  { n:"Aqueon 90 Gallon",        br:"Aqueon",            vol:90,   l:48, w:18, h:24, t:"freshwater" },
  { n:"Aqueon 125 Gallon",       br:"Aqueon",            vol:125,  l:72, w:18, h:22, t:"freshwater" },
  // Red Sea Reefer
  { n:"Red Sea Reefer 170",      br:"Red Sea",           vol:45,   l:28, w:23, h:21, t:"saltwater" },
  { n:"Red Sea Reefer 250",      br:"Red Sea",           vol:65,   l:35, w:22, h:22, t:"saltwater" },
  { n:"Red Sea Reefer 300",      br:"Red Sea",           vol:79,   l:43, w:22, h:22, t:"saltwater" },
  { n:"Red Sea Reefer 350",      br:"Red Sea",           vol:92,   l:47, w:24, h:24, t:"saltwater" },
  { n:"Red Sea Reefer 425XL",    br:"Red Sea",           vol:112,  l:47, w:29, h:24, t:"saltwater" },
  { n:"Red Sea Reefer 500",      br:"Red Sea",           vol:132,  l:59, w:24, h:24, t:"saltwater" },
  { n:"Red Sea Reefer 625XL",    br:"Red Sea",           vol:165,  l:59, w:30, h:26, t:"saltwater" },
  { n:"Red Sea Reefer 900XL",    br:"Red Sea",           vol:238,  l:79, w:30, h:26, t:"saltwater" },
  { n:"Red Sea Peninsula 500",   br:"Red Sea",           vol:132,  l:56, w:29, h:24, t:"saltwater" },
  { n:"Red Sea Peninsula 650",   br:"Red Sea",           vol:172,  l:59, w:35, h:26, t:"saltwater" },
  { n:"Red Sea Peninsula 900",   br:"Red Sea",           vol:238,  l:79, w:35, h:26, t:"saltwater" },
  { n:"Red Sea Max E-170",       br:"Red Sea",           vol:45,   l:28, w:23, h:21, t:"saltwater" },
  { n:"Red Sea Max 250",         br:"Red Sea",           vol:66,   l:35, w:22, h:22, t:"saltwater" },
  // Innovative Marine
  { n:"IM NUVO Fusion 10",       br:"Innovative Marine", vol:10,   l:16, w:16, h:14, t:"saltwater" },
  { n:"IM NUVO Fusion 20",       br:"Innovative Marine", vol:20,   l:20, w:20, h:18, t:"saltwater" },
  { n:"IM NUVO Fusion 30L",      br:"Innovative Marine", vol:30,   l:36, w:12, h:18, t:"saltwater" },
  { n:"IM NUVO Fusion 40",       br:"Innovative Marine", vol:40,   l:24, w:20, h:22, t:"saltwater" },
  { n:"IM NUVO Fusion 60",       br:"Innovative Marine", vol:60,   l:36, w:20, h:22, t:"saltwater" },
  { n:"IM Lagoon 25",            br:"Innovative Marine", vol:25,   l:24, w:24, h:12, t:"saltwater" },
  // Waterbox
  { n:"Waterbox Cube 10",        br:"Waterbox",          vol:10,   l:16, w:16, h:15, t:"saltwater" },
  { n:"Waterbox Cube 20",        br:"Waterbox",          vol:20,   l:20, w:20, h:18, t:"saltwater" },
  { n:"Waterbox Marine X 30",    br:"Waterbox",          vol:30,   l:32, w:15, h:18, t:"saltwater" },
  { n:"Waterbox Reef 75.4",      br:"Waterbox",          vol:75,   l:48, w:20, h:22, t:"saltwater" },
  { n:"Waterbox Reef 100.4",     br:"Waterbox",          vol:100,  l:54, w:21, h:24, t:"saltwater" },
  { n:"Waterbox Reef 130.4",     br:"Waterbox",          vol:130,  l:60, w:21, h:24, t:"saltwater" },
  { n:"Waterbox Reef 170.5",     br:"Waterbox",          vol:170,  l:60, w:27, h:25, t:"saltwater" },
  { n:"Waterbox Reef 220.6",     br:"Waterbox",          vol:220,  l:72, w:27, h:25, t:"saltwater" },
  // Fluval
  { n:"Fluval Evo 13.5",         br:"Fluval",            vol:13.5, l:16, w:13, h:15, t:"saltwater" },
  { n:"Fluval Evo 52",           br:"Fluval",            vol:52,   l:37, w:19, h:21, t:"saltwater" },
  { n:"Fluval Sea M40",          br:"Fluval",            vol:40,   l:24, w:18, h:22, t:"saltwater" },
  { n:"Fluval Sea M60",          br:"Fluval",            vol:60,   l:36, w:19, h:22, t:"saltwater" },
  { n:"Fluval Sea M90",          br:"Fluval",            vol:90,   l:48, w:19, h:22, t:"saltwater" },
  { n:"Fluval Vista 16",         br:"Fluval",            vol:16,   l:25, w:11, h:18, t:"freshwater" },
  { n:"Fluval Vista 32",         br:"Fluval",            vol:32,   l:36, w:14, h:20, t:"freshwater" },
  { n:"Fluval Flex 9",           br:"Fluval",            vol:9,    l:14, w:15, h:16, t:"freshwater" },
  { n:"Fluval Flex 15",          br:"Fluval",            vol:15,   l:17, w:17, h:18, t:"freshwater" },
  { n:"Fluval Flex 32.5",        br:"Fluval",            vol:32.5, l:23, w:19, h:23, t:"freshwater" },
  { n:"Fluval Plant 32",         br:"Fluval",            vol:32,   l:24, w:14, h:20, t:"planted" },
  { n:"Fluval Plant 94",         br:"Fluval",            vol:94,   l:48, w:18, h:24, t:"planted" },
  // Tideline
  { n:"Tideline AIO 25",         br:"Tideline",          vol:25,   l:24, w:18, h:18, t:"reef" },
  { n:"Tideline Lagoon 31",      br:"Tideline",          vol:31,   l:36, w:18, h:14, t:"reef" },
  { n:"Tideline AIO 36 Cube",    br:"Tideline",          vol:50,   l:36, w:24, h:20, t:"reef" },
  { n:"Tideline AIO 48",         br:"Tideline",          vol:75,   l:48, w:20, h:20, t:"reef" },
  { n:"Tideline AIO 60",         br:"Tideline",          vol:100,  l:60, w:20, h:20, t:"reef" },
  { n:"Tideline 36 Cube",        br:"Tideline",          vol:67,   l:36, w:24, h:24, t:"reef" },
  { n:"Tideline 48",             br:"Tideline",          vol:100,  l:48, w:24, h:24, t:"reef" },
  { n:"Tideline 60",             br:"Tideline",          vol:140,  l:60, w:24, h:24, t:"reef" },
  { n:"Tideline 72",             br:"Tideline",          vol:185,  l:72, w:24, h:25, t:"reef" },
  { n:"Tideline 84",             br:"Tideline",          vol:230,  l:84, w:24, h:25, t:"reef" },
  { n:"Tideline Pro 48",         br:"Tideline",          vol:110,  l:48, w:26, h:24, t:"reef" },
  { n:"Tideline Pro 60",         br:"Tideline",          vol:155,  l:60, w:26, h:24, t:"reef" },
  { n:"Tideline Pro 72",         br:"Tideline",          vol:200,  l:72, w:26, h:25, t:"reef" },
  // Coralife Biocube
  { n:"Coralife Biocube 16",     br:"Coralife",          vol:16,   l:17, w:17, h:18, t:"saltwater" },
  { n:"Coralife Biocube 32",     br:"Coralife",          vol:32,   l:22, w:22, h:22, t:"saltwater" },
  // JBJ
  { n:"JBJ Rimless 10",          br:"JBJ",               vol:10,   l:16, w:11, h:15, t:"saltwater" },
  { n:"JBJ Rimless 30",          br:"JBJ",               vol:30,   l:30, w:14, h:18, t:"saltwater" },
  { n:"JBJ Rimless 45",          br:"JBJ",               vol:45,   l:36, w:16, h:21, t:"saltwater" },
  // ADA (planted)
  { n:"ADA 60-P",                br:"ADA",               vol:17,   l:24, w:12, h:14, t:"freshwater" },
  { n:"ADA 60-F",                br:"ADA",               vol:12,   l:24, w:12, h:10, t:"freshwater" },
  { n:"ADA 90-P",                br:"ADA",               vol:45,   l:36, w:18, h:14, t:"freshwater" },
  { n:"ADA 120-P",               br:"ADA",               vol:79,   l:47, w:18, h:18, t:"freshwater" },
  { n:"ADA 180-P",               br:"ADA",               vol:158,  l:71, w:24, h:24, t:"freshwater" },
  // Landen
  { n:"Landen 30C Cube",         br:"Landen",            vol:8,    l:12, w:12, h:14, t:"freshwater" },
  { n:"Landen 60P",              br:"Landen",            vol:16,   l:24, w:12, h:14, t:"freshwater" },
  { n:"Landen 90P",              br:"Landen",            vol:36,   l:36, w:18, h:14, t:"freshwater" },
  // SC Aquariums
  { n:"SC Aquariums 120G",       br:"SC Aquariums",      vol:120,  l:48, w:24, h:24, t:"saltwater" },
  { n:"SC Aquariums 150G",       br:"SC Aquariums",      vol:150,  l:60, w:24, h:24, t:"saltwater" },
  { n:"SC Aquariums 180G",       br:"SC Aquariums",      vol:180,  l:72, w:24, h:24, t:"saltwater" },
  { n:"SC Aquariums 210G",       br:"SC Aquariums",      vol:210,  l:72, w:24, h:29, t:"saltwater" },
  // Generic / DIY
  { n:"Nano Reef 5G",            br:"Generic",           vol:5,    l:16, w:8,  h:10, t:"saltwater" },
  { n:"Nano Reef 10G",           br:"Generic",           vol:10,   l:20, w:10, h:12, t:"saltwater" },
  { n:"Reef 20L",                br:"Generic",           vol:20,   l:30, w:12, h:12, t:"saltwater" },
  { n:"Reef 40 Breeder",         br:"Generic",           vol:40,   l:36, w:18, h:16, t:"saltwater" },
  { n:"Reef 75G",                br:"Generic",           vol:75,   l:48, w:18, h:21, t:"saltwater" },
  { n:"Reef 90G",                br:"Generic",           vol:90,   l:48, w:18, h:24, t:"saltwater" },
  { n:"Reef 120G",               br:"Generic",           vol:120,  l:48, w:24, h:24, t:"saltwater" },
  { n:"Reef 180G",               br:"Generic",           vol:180,  l:72, w:24, h:24, t:"saltwater" },
  { n:"Reef 240G",               br:"Generic",           vol:240,  l:96, w:24, h:24, t:"saltwater" },
  { n:"Planted 10G",             br:"Generic",           vol:10,   l:20, w:10, h:12, t:"freshwater" },
  { n:"Planted 20L",             br:"Generic",           vol:20,   l:30, w:12, h:12, t:"freshwater" },
  { n:"Planted 40 Breeder",      br:"Generic",           vol:40,   l:36, w:18, h:16, t:"freshwater" },
  { n:"Planted 75G",             br:"Generic",           vol:75,   l:48, w:18, h:21, t:"freshwater" },
];

function FieldInput({ label, value, onChange, placeholder, ftype = "text", unit, icon }) {
  return (
    <label className="block">
      <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-center gap-2 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[var(--accent-border)] transition-all">
        {icon && <L name={icon} size={13} className="text-[var(--ink-3)] shrink-0" />}
        <input
          type={ftype} inputMode={ftype === "number" ? "decimal" : undefined}
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
        />
        {unit && <span className="text-[10.5px] text-[var(--ink-3)] shrink-0">{unit}</span>}
      </div>
    </label>
  );
}

const TYPE_META = {
  reef:       { label: () => T("Reef","Reef"),           icon: "Shell",   bg: "rgba(13,148,136,0.1)",  border: "rgba(13,148,136,0.25)",  color: "var(--accent)" },
  saltwater:  { label: () => T("Marino","Saltwater"),    icon: "Waves",   bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)",  color: "#3B82F6" },
  freshwater: { label: () => T("Dulce","Freshwater"),    icon: "Droplet", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.25)",   color: "#16a34a" },
  planted:    { label: () => T("Plantado","Planted"),    icon: "Leaf",    bg: "rgba(101,163,13,0.1)",  border: "rgba(101,163,13,0.25)",  color: "#65a30d" },
};

function AddTankModal({ onClose, onAdded }) {
  const [step, setStep] = React.useState("search"); // "search" | "fill"
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [aiSearching, setAiSearching] = React.useState(false);

  // Form fields
  const [name,       setName]       = React.useState("");
  const [type,       setType]       = React.useState("reef");
  const [brand,      setBrand]      = React.useState("");
  const [displayVol, setDisplayVol] = React.useState("");
  const [totalVol,   setTotalVol]   = React.useState("");
  const [filtration, setFiltration] = React.useState("sump");
  const [dims, setDims]             = React.useState(null); // { l, w, h } inches — from DB/AI, not asked manually
  const searchRef = React.useRef(null);
  const nameRef   = React.useRef(null);
  useEscape(onClose);

  React.useEffect(() => {
    if (step === "search") setTimeout(() => searchRef.current?.focus(), 80);
    if (step === "fill")   setTimeout(() => nameRef.current?.focus(), 80);
  }, [step]);

  // Live search
  React.useEffect(() => {
    // Normalize: "31g"/"31 gal" → "31"; drop filler words that never appear in DB names
    const q = query.trim().toLowerCase()
      .replace(/(\d+)\s*(g|gal|gallons|galones)\b/g, "$1")
      .replace(/\b(tank|aquarium|acuario|tanque|pecera|the|de|el|la)\b/g, " ")
      .replace(/\s+/g, " ").trim();
    if (!q) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      const words = q.split(/\s+/);
      const matches = TANK_DB.filter((row) => {
        const haystack = (row.n + " " + row.br + " " + row.vol).toLowerCase();
        return words.every((w) => haystack.includes(w));
      }).slice(0, 7);
      setResults(matches);
      setSearching(false);
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

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
            { role: "system", content: "You are a database of aquarium tanks. Return ONLY a JSON object — no markdown, no explanation. If the tank is unknown, return {\"notFound\":true}." },
            { role: "user", content: `Aquarium tank specs for: "${query.trim()}"\nReturn: {"n":"full name","br":"brand","vol":gallons_number,"t":"reef|saltwater|freshwater|planted","filtration":"sump|aio|canister|none","l":length_inches,"w":width_inches,"h":height_inches}` },
          ],
          max_tokens: 160,
          temperature: 0.1,
        }),
      });
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "";
      const jsonStr = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.notFound) {
        window.toast?.(T("Tanque no encontrado en IA — intenta con el nombre exacto del modelo", "Tank not found by AI — try the exact model name"), { tone: "warn", icon: "SearchX" });
      } else {
        fillFrom(parsed);
      }
    } catch (e) {
      window.toast?.(T("Error buscando con IA — verifica tu key de Groq", "AI search error — check your Groq key"), { tone: "warn", icon: "AlertTriangle" });
    }
    setAiSearching(false);
  };

  const fillFrom = (row) => {
    setName(row.n);
    setBrand(row.br || "");
    setType(row.t === "freshwater" ? "freshwater" : row.t === "planted" ? "planted" : "reef");
    setDisplayVol(row.vol ? String(row.vol) : "");
    setTotalVol(row.vol ? String(row.vol) : "");
    if (row.filtration) setFiltration(row.filtration);
    setDims(row.l && row.h ? { l: row.l, w: row.w || null, h: row.h } : null);
    setStep("fill");
  };

  const save = () => {
    const n = name.trim();
    if (!n) { nameRef.current?.focus(); return; }
    const tank = window.AquaStore.addTank({
      name: n,
      type,
      displayVolume: displayVol ? +displayVol : 0,
      realVolume: totalVol ? +totalVol : displayVol ? +displayVol : 0,
      brand: brand.trim(),
      filtration,
      dims,
    });
    window.toast?.(T(`Tanque "${tank.name}" añadido`, `Tank "${tank.name}" added`), { icon: "Waves" });
    onAdded?.();
    onClose();
  };

  const typeOpts = [
    { id: "reef",       label: T("Reef","Reef"),           icon: "Shell" },
    { id: "saltwater",  label: T("Marino","Saltwater"),    icon: "Waves" },
    { id: "freshwater", label: T("Dulce","Freshwater"),    icon: "Droplet" },
    { id: "planted",    label: T("Plantado","Planted"),    icon: "Leaf" },
  ];

  const filtrationOpts = [
    { id: "sump",     label: "Sump",          icon: "Layers",      desc: T("Filtro externo bajo el tanque","External sump below tank") },
    { id: "aio",      label: "AIO",           icon: "Box",         desc: T("All-in-One · filtro integrado","All-in-One · built-in filter") },
    { id: "canister", label: T("Canister","Canister"), icon: "Filter", desc: T("Filtro canister externo","External canister filter") },
    { id: "none",     label: T("Ninguno","None"), icon: "Minus",   desc: T("Sin sistema de filtración","No filtration system") },
  ];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)] backdrop-blur" onClick={onClose}>
      <div
        className="w-full sm:max-w-md glass-strong rounded-3xl overflow-hidden flex flex-col"
        style={{ boxShadow: "var(--glass-shadow)", maxHeight: "90dvh" }}
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
              <L name={step === "search" ? "Search" : "Waves"} size={14} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[var(--ink)]">
                {step === "search" ? T("Buscar tanque", "Search tank") : T("Configurar tanque", "Set up tank")}
              </div>
              <div className="text-[10.5px] text-[var(--ink-3)]">
                {step === "search" ? T("Base de datos de acuarios", "Aquarium database") : T("Marca, galones, filtración y tipo", "Brand, gallons, filtration & type")}
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
                  type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder={T("ej. Red Sea Reefer 250, Waterbox 75, ADA 60…", "e.g. Red Sea Reefer 250, Waterbox 75, ADA 60…")}
                  className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                />
                {query && <button onClick={() => setQuery("")} className="shrink-0 text-[var(--ink-3)] hover:text-[var(--ink-2)]"><L name="X" size={13} /></button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-[140px]">
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
                  <div className="text-[10.5px] text-[var(--ink-3)] mt-2">{T("Usa Groq para buscar dimensiones y tipo","Uses Groq to find specs and type")}</div>
                </div>
              )}
              {!query.trim() && (
                <div className="text-[11px] text-[var(--ink-3)] pt-2 pb-1">
                  {T("Marcas:", "Brands:")} Red Sea · Waterbox · Fluval · IM · ADA · Aqueon · JBJ · Coralife…
                </div>
              )}
              <div className="space-y-1 mt-1">
                {results.map((row, i) => {
                  const tm = TYPE_META[row.t] || TYPE_META.reef;
                  return (
                    <button key={i} onClick={() => fillFrom(row)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--hover)] transition-colors text-left group">
                      <div className="grid place-items-center w-8 h-8 rounded-lg shrink-0" style={{ background: tm.bg, border: `1px solid ${tm.border}` }}>
                        <L name={tm.icon} size={13} style={{ color: tm.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-[var(--ink)] truncate">{row.n}</div>
                        <div className="text-[10.5px] text-[var(--ink-3)]">
                          {row.br} · {row.vol} gal ·{" "}
                          <span style={{ color: tm.color }}>{tm.label()}</span>
                        </div>
                      </div>
                      <L name="ChevronRight" size={13} className="text-[var(--ink-3)] group-hover:text-[var(--accent)] transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[var(--hairline)] shrink-0">
              <button onClick={() => setStep("fill")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--hover)] transition-colors">
                <L name="PenLine" size={13} /> {T("Añadir manualmente", "Add manually")}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Configure */}
        {step === "fill" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 space-y-4">
              {/* Name */}
              <div>
                <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1">{T("Nombre del tanque *","Tank name *")}</div>
                <div className="flex items-center gap-2 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[var(--accent-border)] transition-all">
                  <L name="Waves" size={13} className="text-[var(--ink-3)] shrink-0" />
                  <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)}
                    placeholder={T("ej. Mi Reef 50G","e.g. My Reef 50G")}
                    className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]" />
                </div>
              </div>

              {/* Type */}
              <div>
                <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">{T("Tipo de tanque","Tank type")}</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {typeOpts.map((opt) => (
                    <button key={opt.id} onClick={() => setType(opt.id)}
                      className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium border transition-all"
                      style={type === opt.id
                        ? { background:"var(--accent-soft)", border:"1px solid var(--accent-border)", color:"var(--accent)" }
                        : { border:"1px solid var(--hairline)", color:"var(--ink-3)" }}>
                      <L name={opt.icon} size={15} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtration */}
              <div>
                <div className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">{T("Sistema de filtración","Filtration system")}</div>
                <div className="grid grid-cols-2 gap-2">
                  {filtrationOpts.map((opt) => (
                    <button key={opt.id} onClick={() => setFiltration(opt.id)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left border transition-all"
                      style={filtration === opt.id
                        ? { background:"var(--accent-soft)", border:"1px solid var(--accent-border)" }
                        : { background:"var(--well)", border:"1px solid var(--hairline)" }}>
                      <L name={opt.icon} size={14} style={{ color: filtration === opt.id ? "var(--accent)" : "var(--ink-3)" }} />
                      <div>
                        <div className="text-[12px] font-semibold" style={{ color: filtration === opt.id ? "var(--accent)" : "var(--ink)" }}>{opt.label}</div>
                        <div className="text-[9.5px] leading-tight" style={{ color: "var(--ink-3)" }}>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand + Gallons */}
              <FieldInput label={T("Marca","Brand")} value={brand} onChange={setBrand} placeholder={T("ej. Red Sea, Aqueon, Waterbox","e.g. Red Sea, Aqueon, Waterbox")} icon="Tag" />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label={T("Galones display","Display gal.")} value={displayVol} onChange={setDisplayVol} placeholder="50" ftype="number" unit="gal" icon="Container" />
                <FieldInput label={filtration === "sump" ? T("Total c/sump","Total w/sump") : T("Vol. total","Total vol.")} value={totalVol} onChange={setTotalVol} placeholder="70" ftype="number" unit="gal" icon="Layers" />
              </div>
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
                {T("Agregar tanque","Add tank")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}


function TankSelector() {
  const { CURRENT_PARAMETERS } = window.AQUA;
  const [open, setOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [activeTankId, setActiveTankId] = React.useState(() => window.AquaStore?.activeTankId || "tank-001");
  const [tanks, setTanks] = React.useState(() => window.AQUA.ALL_TANKS || []);
  const close = React.useCallback(() => setOpen(false), []);
  useEscape(close);

  // Keep in sync if tank changes from elsewhere
  React.useEffect(() => {
    const onTank = (e) => setActiveTankId(e.detail?.id || "tank-001");
    const onChanged = () => setTanks([...(window.AQUA.ALL_TANKS || [])]);
    window.addEventListener("aqua:tank", onTank);
    window.addEventListener("aqua:tanks:changed", onChanged);
    return () => {
      window.removeEventListener("aqua:tank", onTank);
      window.removeEventListener("aqua:tanks:changed", onChanged);
    };
  }, []);

  const activeTank = tanks.find((t) => t.id === activeTankId) || tanks[0];

  const typeLabel = (tank) => {
    if (tank.type === "freshwater") return T(`Dulce · ${tank.displayVolume} gal`, `Freshwater · ${tank.displayVolume} gal`);
    return T(`Marino · ${tank.displayVolume} gal`, `Saltwater · ${tank.displayVolume} gal`);
  };

  const switchTank = (id) => {
    window.AquaStore?.setActiveTank(id);
    setActiveTankId(id);
    close();
  };

  const deleteTank = (e, id) => {
    e.stopPropagation();
    window.AquaStore?.deleteTank(id);
    setTanks([...(window.AQUA.ALL_TANKS || [])]);
    window.toast?.(T("Tanque eliminado", "Tank deleted"), { icon: "Trash2" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="glass-strong inline-flex items-center gap-2 rounded-full pl-2.5 pr-3 py-1.5 text-[12.5px] font-medium text-[var(--ink)] hover:brightness-105 transition-all"
      >
        <PulsingDot color="#0E9F6E" size={7} />
        {activeTank?.name || "Tank"}
        <span className="hidden sm:inline text-[var(--ink-3)]">·</span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[var(--ink-2)] tabular-nums">
          <L name="Thermometer" size={12} /> {CURRENT_PARAMETERS.temperature.value}°F
        </span>
        <L name="ChevronDown" size={13} className={`text-[var(--ink-3)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />
          <div role="menu" className="absolute right-0 top-full mt-2 z-50 glass-strong rounded-2xl p-1.5 w-64" style={{ boxShadow: "var(--glass-shadow)" }}>
            <div className="px-3 pt-2 pb-1.5 text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-3)] font-semibold">{T("Tus tanques", "Your tanks")}</div>
            {tanks.map((tank) => {
              const isActive = tank.id === activeTankId;
              const canDelete = tank.id !== "tank-001" && !isActive;
              return (
                <div key={tank.id} className="flex items-center gap-1 rounded-xl hover:bg-[var(--hover)] transition-colors group">
                  <button
                    role="menuitem"
                    onClick={() => switchTank(tank.id)}
                    className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-left min-w-0"
                  >
                    <PulsingDot color={tank.type === "freshwater" ? "#16a34a" : "#0E9F6E"} size={7} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12.5px] font-medium text-[var(--ink)]">{tank.name}</span>
                      <span className="block text-[10.5px] text-[var(--ink-2)]">{typeLabel(tank)} {T("· en línea", "· online")}</span>
                    </span>
                    {isActive && <L name="Check" size={14} style={{ color: "var(--accent)" }} />}
                  </button>
                  {canDelete && (
                    <button
                      onClick={(e) => deleteTank(e, tank.id)}
                      aria-label={T("Eliminar tanque", "Delete tank")}
                      className="p-1.5 mr-1 rounded-lg text-[var(--ink-3)] hover:text-[#DC4458] hover:bg-[rgba(225,29,72,0.1)] transition-all"
                      title={T("Eliminar este tanque", "Delete this tank")}
                    >
                      <L name="Trash2" size={13} />
                    </button>
                  )}
                </div>
              );
            })}
            <div className="h-px bg-[var(--hairline)] mx-2 my-1" />
            <button
              role="menuitem"
              onClick={() => { close(); setAddOpen(true); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--hover)] transition-colors text-left text-[var(--ink-2)] hover:text-[var(--ink)]"
            >
              <span className="grid place-items-center w-5 h-5 rounded-full" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
                <L name="Plus" size={11} style={{ color: "var(--accent)" }} />
              </span>
              <span className="text-[12px] font-medium">{T("Agregar tanque", "Add tank")}</span>
            </button>
          </div>
        </>
      )}
      {addOpen && (
        <AddTankModal
          onClose={() => setAddOpen(false)}
          onAdded={() => setTanks([...(window.AQUA.ALL_TANKS || [])])}
        />
      )}
    </div>
  );
}

function Header({ activePage, onNavigate, alertCount }) {
  const now = useClock();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  return (
    <header className="sticky top-0 z-30 px-4 lg:px-6 pt-4 pb-2">
      <div className="glass rounded-full flex items-center gap-2 pl-4 pr-2 py-2">
        <div className="lg:hidden flex items-center gap-2">
          <Logo size={28} />
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-2)] tabular-nums" style={{ fontFamily: "DM Mono, monospace" }}>
          <L name="Clock" size={13} /> {hh}:{mm}
        </span>

        <div className="flex-1" />

        <TankSelector />

        <button
          onClick={() => onNavigate("alerts")}
          className="relative p-2 rounded-full hover:bg-[var(--hover)] transition-colors text-[var(--ink-2)] hover:text-[var(--ink)]"
          aria-label={T("Notificaciones", "Notifications")}
        >
          <L name="Bell" size={16} />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#DC4458", boxShadow: "0 0 0 2px var(--surface-strong)" }} />
          )}
        </button>
        <button
          onClick={() => onNavigate("settings")}
          className="p-2 rounded-full hover:bg-[var(--hover)] transition-colors text-[var(--ink-2)] hover:text-[var(--ink)]"
          aria-label={T("Ajustes", "Settings")}
        >
          <L name="Settings" size={16} />
        </button>
      </div>
    </header>
  );
}

// ---- Mobile tab bar ----
const MOBILE_TABS = () => [
  { id: "dashboard",   label: T("Inicio", "Home"),         icon: "Home" },
  { id: "parameters",  label: T("Bitácora", "Logbook"),    icon: "NotebookPen" },
  { id: "supplements", label: T("Suplementos", "Suppl."),  icon: "FlaskConical" },
  { id: "inhabitants", label: T("Vida", "Livestock"),      icon: "Fish" },
  { id: "ai",          label: "IA",                        icon: "Sparkles" },
];

function MobileTabBar({ activePage, onNavigate }) {
  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 glass rounded-[26px] px-2 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 grid grid-cols-5 gap-1">
      {MOBILE_TABS().map((t) => {
        const active = activePage === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onNavigate(t.id)}
            className={`relative flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-colors ${
              active ? "text-[var(--accent)]" : "text-[var(--ink-3)] hover:text-[var(--ink-2)]"
            }`}
          >
            <L name={t.icon} size={18} strokeWidth={active ? 2 : 1.6} />
            <span className="text-[9.5px] font-medium">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

Object.assign(window, { Sidebar, Header, MobileTabBar, Logo, NAV_ITEMS, useClock, TankSelector });
