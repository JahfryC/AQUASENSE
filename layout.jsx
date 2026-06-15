// Layout: Sidebar, Header, MobileTabBar, Logo — Liquid Glass edition
const NAV_ITEMS = () => [
  { id: "dashboard",   label: T("Inicio", "Home"),           icon: "Home" },
  { id: "parameters",  label: T("Bitácora", "Logbook"),      icon: "NotebookPen" },
  { id: "lighting",    label: T("Iluminación", "Lighting"),  icon: "SunMedium" },
  { id: "inhabitants", label: T("Habitantes", "Livestock"),  icon: "Fish" },
  { id: "routines",    label: T("Rutinas", "Routines"),      icon: "CalendarCheck" },
  { id: "ai",          label: T("Asistente IA", "AI Assistant"), icon: "Sparkles" },
  { id: "alerts",      label: T("Alertas", "Alerts"),        icon: "Bell" },
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

function TankSelector() {
  const { ALL_TANKS, CURRENT_PARAMETERS } = window.AQUA;
  const [open, setOpen] = React.useState(false);
  const [activeTankId, setActiveTankId] = React.useState(() => window.AquaStore?.activeTankId || "tank-001");
  const close = React.useCallback(() => setOpen(false), []);
  useEscape(close);

  // Keep in sync if tank changes from elsewhere
  React.useEffect(() => {
    const fn = (e) => setActiveTankId(e.detail?.id || "tank-001");
    window.addEventListener("aqua:tank", fn);
    return () => window.removeEventListener("aqua:tank", fn);
  }, []);

  const activeTank = (ALL_TANKS || []).find((t) => t.id === activeTankId) || ALL_TANKS?.[0];

  const typeLabel = (tank) => {
    if (tank.type === "freshwater") return T(`Dulce · ${tank.displayVolume} gal`, `Freshwater · ${tank.displayVolume} gal`);
    return T(`Marino · ${tank.displayVolume} gal`, `Saltwater · ${tank.displayVolume} gal`);
  };

  const switchTank = (id) => {
    window.AquaStore?.setActiveTank(id);
    setActiveTankId(id);
    close();
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
            {(ALL_TANKS || []).map((tank) => (
              <button
                key={tank.id}
                role="menuitem"
                onClick={() => switchTank(tank.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--hover)] transition-colors text-left"
              >
                <PulsingDot color={tank.type === "freshwater" ? "#16a34a" : "#0E9F6E"} size={7} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-medium text-[var(--ink)]">{tank.name}</span>
                  <span className="block text-[10.5px] text-[var(--ink-2)]">{typeLabel(tank)} {T("· en línea", "· online")}</span>
                </span>
                {tank.id === activeTankId && <L name="Check" size={14} style={{ color: "var(--accent)" }} />}
              </button>
            ))}
            <div className="h-px bg-[var(--hairline)] mx-2 my-1" />
            <button role="menuitem" onClick={() => { close(); demoAction(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--hover)] transition-colors text-left text-[var(--ink-2)] hover:text-[var(--ink)]">
              <span className="grid place-items-center w-5 h-5 rounded-full bg-[var(--well)] border border-[var(--hairline)]"><L name="Plus" size={11} /></span>
              <span className="text-[12px] font-medium">{T("Agregar tanque", "Add tank")}</span>
            </button>
          </div>
        </>
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
  { id: "dashboard",   label: T("Inicio", "Home"),     icon: "Home" },
  { id: "parameters",  label: T("Bitácora", "Logbook"),icon: "NotebookPen" },
  { id: "inhabitants", label: T("Vida", "Livestock"),  icon: "Fish" },
  { id: "ai",          label: "IA",                    icon: "Sparkles" },
  { id: "alerts",      label: T("Alertas", "Alerts"),  icon: "Bell" },
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
