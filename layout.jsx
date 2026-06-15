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

function AddTankModal({ onClose, onAdded }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("saltwater");
  const [volume, setVolume] = React.useState("");
  const [brand, setBrand] = React.useState("");
  useEscape(onClose);

  const save = () => {
    const n = name.trim();
    if (!n) return;
    const tank = window.AquaStore.addTank({
      name: n,
      type,
      displayVolume: volume ? +volume : 0,
      realVolume: volume ? +volume : 0,
      brand: brand.trim(),
    });
    window.toast?.(T(`Tanque "${tank.name}" añadido`, `Tank "${tank.name}" added`), { icon: "Waves" });
    onAdded?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-[var(--scrim)] backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-sm glass-strong rounded-3xl overflow-hidden" style={{ boxShadow: "var(--glass-shadow)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center w-8 h-8 rounded-xl" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
              <L name="Waves" size={14} style={{ color: "var(--accent)" }} />
            </div>
            <span className="text-[14px] font-semibold text-[var(--ink)]">{T("Nuevo tanque", "New tank")}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--hover)] text-[var(--ink-2)]"><L name="X" size={14} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--ink-2)] mb-1 block">{T("Nombre *", "Name *")}</label>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
              <L name="Droplet" size={13} className="text-[var(--ink-3)] shrink-0" />
              <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); }}
                placeholder={T("ej. Reef 50G", "e.g. 50G Reef")}
                className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]" />
            </div>
          </div>
          <div className="flex gap-2">
            {[{ id: "saltwater", label: T("Marino", "Saltwater"), icon: "Waves" }, { id: "freshwater", label: T("Dulce", "Freshwater"), icon: "Droplet" }].map((opt) => (
              <button key={opt.id} onClick={() => setType(opt.id)}
                className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all"
                style={type === opt.id
                  ? { background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)" }
                  : { background: "var(--well)", border: "1px solid var(--hairline)", color: "var(--ink-2)" }}>
                <L name={opt.icon} size={13} />{opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
              <L name="Container" size={13} className="text-[var(--ink-3)] shrink-0" />
              <input type="number" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder={T("Galones", "Gallons")}
                className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]" />
              <span className="text-[11px] text-[var(--ink-3)]">gal</span>
            </div>
            <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
              <L name="Tag" size={13} className="text-[var(--ink-3)] shrink-0" />
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={T("Marca", "Brand")}
                className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]" />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full py-2.5 text-[13px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
            {T("Cancelar", "Cancel")}
          </button>
          <button onClick={save} disabled={!name.trim()}
            className="flex-1 rounded-full py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 transition-all active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-strong))" }}>
            {T("Agregar", "Add")}
          </button>
        </div>
      </div>
    </div>
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
