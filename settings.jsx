// settings.jsx — LoginScreen (Google sign-in, prototype), SettingsPage (account, security,
// preferences, notifications, calendar/reminders integration)

// ---------- mock Google account (prototype: no real OAuth) ----------
const GOOGLE_ACCOUNTS = [
  { name: "Jeffrey", email: "jeffrey.reef@gmail.com", color: "linear-gradient(150deg, #0E8C86, #5B5BD6)" },
  { name: "Jeff Work", email: "jeff@columbusaquatics.com", color: "linear-gradient(150deg, #C77F00, #DC4458)" },
];

function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// ---------- Login screen ----------
function LoginScreen({ onSignIn }) {
  const [chooser, setChooser] = React.useState(false);
  const [loading, setLoading] = React.useState(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  useEscape(React.useCallback(() => setChooser(false), []));

  const pick = (acc) => {
    setLoading(acc.email);
    setTimeout(() => {
      onSignIn({ name: acc.name, email: acc.email, color: acc.color, provider: "google", since: new Date().toISOString().slice(0, 10) });
    }, 900);
  };

  // OAuth real cuando Firebase está configurado; selector simulado si no.
  const googleSignIn = async () => {
    if (window.CLOUD?.isConfigured) {
      setGoogleLoading(true);
      try {
        await window.CLOUD.signInGoogle(); // aqua:auth completa la sesión
      } catch (e) {
        window.toast?.(T("No se pudo iniciar sesión con Google. Revisa los dominios autorizados en Firebase.", "Google sign-in failed. Check Firebase authorized domains."), { tone: "warn", icon: "AlertTriangle" });
      }
      setGoogleLoading(false);
    } else {
      setChooser(true);
    }
  };

  return (
    <div className="min-h-screen relative grid place-items-center p-4" data-screen-label="Login">
      <Atmosphere />
      <div className="relative z-10 w-full max-w-[400px]">
        <Card className="p-7 text-center">
          <div className="mx-auto w-fit mb-4"><Logo size={52} /></div>
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--ink)]">AquaSense</h1>
          <p className="text-[12.5px] text-[var(--ink-2)] mt-1 mb-6">
            {T("Tu reef, monitoreado con inteligencia. Inicia sesión para sincronizar tu tanque en todos tus dispositivos.",
               "Your reef, intelligently monitored. Sign in to sync your tank across devices.")}
          </p>

          <button
            onClick={googleSignIn}
            disabled={googleLoading}
            className="w-full glass-strong rounded-full px-4 py-3 flex items-center justify-center gap-3 text-[13.5px] font-medium text-[var(--ink)] hover:brightness-105 transition-all active:scale-[0.99] disabled:opacity-60"
          >
            {googleLoading ? <L name="Loader2" size={18} className="animate-spin" /> : <GoogleG />}
            {T("Continuar con Google", "Continue with Google")}
          </button>
          {!window.CLOUD?.isConfigured && (
            <p className="text-[10px] text-[var(--ink-3)] mt-2 leading-relaxed">
              {T("Login real + nube disponibles al conectar Firebase (gratis) — instrucciones en Ajustes → Cuenta.",
                 "Real login + cloud sync available by connecting Firebase (free) — see Settings → Account.")}
            </p>
          )}

          <div className="flex items-center gap-3 my-4">
            <span className="flex-1 h-px bg-[var(--hairline)]" />
            <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">{T("o", "or")}</span>
            <span className="flex-1 h-px bg-[var(--hairline)]" />
          </div>

          <button
            onClick={() => onSignIn({ name: "Invitado", email: null, color: "linear-gradient(150deg, #7C90A3, #46607A)", provider: "guest", since: new Date().toISOString().slice(0, 10) })}
            className="text-[12px] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
          >
            {T("Explorar en modo demo →", "Explore demo mode →")}
          </button>

          <p className="text-[10px] text-[var(--ink-3)] mt-6 leading-relaxed">
            {T("Tus datos se cifran en tránsito y en reposo. Nunca compartimos información de tu acuario.",
               "Your data is encrypted in transit and at rest. We never share your aquarium data.")}
          </p>
        </Card>
      </div>

      {chooser && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-[var(--scrim)] backdrop-blur" onClick={() => setChooser(false)}>
          <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-sm overflow-hidden glass-strong">
            <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center gap-2.5">
              <GoogleG size={20} />
              <div>
                <div className="text-[13.5px] font-semibold text-[var(--ink)]">{T("Elige una cuenta", "Choose an account")}</div>
                <div className="text-[11px] text-[var(--ink-2)]">{T("para continuar a AquaSense", "to continue to AquaSense")}</div>
              </div>
            </div>
            <div className="p-2">
              {GOOGLE_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => pick(acc)}
                  disabled={!!loading}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[var(--hover)] transition-colors text-left disabled:opacity-60"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-full text-white text-[13px] font-semibold shrink-0" style={{ background: acc.color }}>
                    {acc.name[0]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-[var(--ink)]">{acc.name}</span>
                    <span className="block text-[11px] text-[var(--ink-2)] truncate">{acc.email}</span>
                  </span>
                  {loading === acc.email && <L name="Loader2" size={15} className="animate-spin text-[var(--ink-3)]" />}
                </button>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[var(--hairline)] text-[10px] text-[var(--ink-3)] leading-relaxed">
              {T("Demo de diseño: el inicio de sesión es simulado, no se conecta a Google.",
                 "Design demo: sign-in is simulated, no real Google connection.")}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ---------- helpers: .ics generation for Apple Calendar / Reminders ----------
function buildICS(kind) {
  const { ROUTINES, TANK_CONFIG } = window.AQUA;
  const now = new Date();
  const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const dateFor = (r) => (r.nextDue === "today" ? todayStr : r.nextDue.replaceAll("-", ""));
  const esc = (s) => String(s).replace(/([,;\\])/g, "\\$1");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AquaSense//Reef Intelligence//ES", "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:AquaSense · ${TANK_CONFIG.name}`,
  ];
  ROUTINES.forEach((r) => {
    const d = dateFor(r);
    const time = r.time.replace(":", "") + "00";
    // 30-min event end, carrying the hour (21:30 must end 22:00, not "21:60")
    const [h, m] = r.time.split(":").map(Number);
    const endMin = h * 60 + m + 30;
    const endTime = `${String(Math.floor(endMin / 60) % 24).padStart(2, "0")}${String(endMin % 60).padStart(2, "0")}00`;
    if (kind === "todo") {
      lines.push(
        "BEGIN:VTODO",
        `UID:aquasense-${r.id}@aquasense.app`,
        `DTSTART:${d}T${time}`,
        `DUE:${d}T${time}`,
        `SUMMARY:${esc(r.task)}`,
        `DESCRIPTION:${esc(r.detail + " · " + r.frequency)}`,
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(r.task)}`, "TRIGGER:-PT15M", "END:VALARM",
        "END:VTODO"
      );
    } else {
      lines.push(
        "BEGIN:VEVENT",
        `UID:aquasense-${r.id}@aquasense.app`,
        `DTSTART:${d}T${time}`,
        `DTEND:${d}T${endTime}`,
        `SUMMARY:🪸 ${esc(r.task)}`,
        `DESCRIPTION:${esc(r.detail + " · " + r.frequency)}`,
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(r.task)}`, "TRIGGER:-PT15M", "END:VALARM",
        "END:VEVENT"
      );
    }
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(kind) {
  const blob = new Blob([buildICS(kind)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = kind === "todo" ? "aquasense-recordatorios.ics" : "aquasense-rutinas.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------- shared bits ----------
function SettingRow({ icon, title, sub, children, danger }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--hairline)] last:border-b-0">
      <div className="grid place-items-center w-9 h-9 rounded-xl shrink-0"
        style={danger
          ? { background: "rgba(225,29,72,0.11)", border: "1px solid rgba(225,29,72,0.3)" }
          : { background: "var(--well)", border: "1px solid var(--hairline)" }}>
        <L name={icon} size={15} style={{ color: danger ? "#DC4458" : "var(--ink-2)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-[var(--ink)]">{title}</div>
        {sub && <div className="text-[11px] text-[var(--ink-2)] mt-0.5 leading-snug">{sub}</div>}
      </div>
      <div className="shrink-0 flex items-center gap-2">{children}</div>
    </div>
  );
}

function GlassToggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className="relative w-11 h-6.5 rounded-full transition-all"
      style={{
        height: 26, width: 44,
        background: on ? "linear-gradient(160deg, var(--accent), var(--accent-strong))" : "var(--well)",
        border: `1px solid ${on ? "transparent" : "var(--hairline-strong)"}`,
        boxShadow: on ? "0 2px 10px rgba(13,148,136,0.35)" : "none",
      }}
    >
      <span
        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-all"
        style={{ width: 20, height: 20, left: on ? 21 : 2 }}
      />
    </button>
  );
}

function Segmented({ value, options, onChange, labels = {} }) {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-[var(--well)] border border-[var(--hairline)]">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-3 py-1.5 text-[11.5px] rounded-full transition-all font-medium ${
            value === o ? "glass-strong text-[var(--ink)] shadow-sm" : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          {labels[o] || o}
        </button>
      ))}
    </div>
  );
}

// ---------- Settings page ----------
function SettingsPage({ session, onSignOut, tweaks, setTweak }) {
  // Survive the full remount that a language change triggers (App keys on lang),
  // so switching idioma from the Preferences tab doesn't bounce you to Account.
  const [tab, setTabState] = React.useState(() => window.__settingsTab || "account");
  const setTab = (id) => { window.__settingsTab = id; setTabState(id); };
  const [perm, setPerm] = React.useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const [notifPrefs, setNotifPrefs] = React.useState({ alerts: true, routines: true, params: true, ai: false });
  const [twoFA, setTwoFA] = React.useState(true);
  const [icsDone, setIcsDone] = React.useState("");

  const askPermission = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      new Notification("AquaSense", { body: T("Notificaciones activadas — te avisaremos de alertas críticas y rutinas.", "Notifications on — we'll ping you about critical alerts and routines.") });
    }
  };

  const testNotification = () => {
    if (perm === "granted") {
      new Notification("AquaSense · " + T("Alerta crítica", "Critical alert"), { body: T("Birdsnest blanqueando — KH 7.0 dKH. Dosifica 7 ml de Reef Buffer.", "Birdsnest bleaching — KH 7.0 dKH. Dose 7 ml Reef Buffer.") });
    }
  };

  const exportICS = (kind) => {
    downloadICS(kind);
    setIcsDone(kind);
    setTimeout(() => setIcsDone(""), 3500);
  };

  const tabs = [
    { id: "account",       label: T("Cuenta", "Account"),               icon: "UserRound" },
    { id: "preferences",   label: T("Preferencias", "Preferences"),     icon: "Palette" },
    { id: "notifications", label: T("Notificaciones", "Notifications"), icon: "BellRing" },
    { id: "integrations",  label: T("Calendario", "Calendar"),          icon: "CalendarPlus" },
  ];

  const permBadge = {
    granted: { label: T("Activadas", "Enabled"), status: "ok" },
    denied: { label: T("Bloqueadas", "Blocked"), status: "danger" },
    default: { label: T("Sin decidir", "Not decided"), status: "warn" },
    unsupported: { label: T("No soportado", "Unsupported"), status: "info" },
  }[perm] || { label: perm, status: "info" };

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4 max-w-4xl" data-screen-label="Settings">
      <div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] font-semibold mb-1">{T("Ajustes", "Settings")}</div>
        <h1 className="text-[20px] lg:text-[22px] font-semibold text-[var(--ink)] tracking-tight">{T("Cuenta y preferencias", "Account & preferences")}</h1>
      </div>

      <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--hairline)] rounded-full w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] rounded-full transition-all font-medium ${
              tab === t.id ? "glass-strong text-[var(--ink)] shadow-sm" : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            <L name={t.icon} size={13} style={tab === t.id ? { color: "var(--accent)" } : undefined} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------------- ACCOUNT ---------------- */}
      {tab === "account" && (
        <div className="space-y-4">
          {/* Estado de datos y nube */}
          <Card className="p-5">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
                <L name={window.CLOUD?.user ? "CloudUpload" : "HardDrive"} size={17} style={{ color: "var(--accent)" }} />
              </div>
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-semibold text-[var(--ink)]">{T("Tus datos", "Your data")}</span>
                  <StatusPill
                    status={window.CLOUD?.user ? "ok" : "info"}
                    label={window.CLOUD?.user ? T("Nube sincronizada", "Cloud synced") : T("Guardados en este dispositivo", "Saved on this device")}
                  />
                </div>
                <p className="text-[11.5px] text-[var(--ink-2)] mt-1 leading-relaxed">
                  {window.CLOUD?.user
                    ? T("Lecturas, fotos, rutinas y alertas se guardan en Firestore con tu cuenta de Google. Abre la app en otro dispositivo e inicia sesión para ver lo mismo.",
                        "Readings, photos, routines and alerts are stored in Firestore under your Google account. Open the app on another device and sign in to see the same data.")
                    : window.CLOUD?.isConfigured
                      ? T("Firebase está configurado. Inicia sesión con Google para activar la sincronización entre dispositivos.",
                          "Firebase is configured. Sign in with Google to enable cross-device sync.")
                      : T("Todo (lecturas, fotos, rutinas, alertas) se guarda automáticamente en este navegador y sobrevive al cerrar la app. Para sincronizar entre dispositivos con tu Google real, conecta Firebase — gratis, ~5 min: las instrucciones están al inicio del archivo cloud.js.",
                          "Everything (readings, photos, routines, alerts) saves automatically in this browser and survives closing the app. To sync across devices with your real Google account, connect Firebase — free, ~5 min: instructions are at the top of cloud.js.")}
                </p>
                {!window.CLOUD?.isConfigured && (
                  <ol className="mt-2.5 space-y-1">
                    {[
                      T("console.firebase.google.com → Agregar proyecto (gratis)", "console.firebase.google.com → Add project (free)"),
                      T("Activa Authentication → Google y crea Firestore", "Enable Authentication → Google and create Firestore"),
                      T("Pega tu firebaseConfig en cloud.js y vuelve a publicar", "Paste your firebaseConfig into cloud.js and re-publish"),
                    ].map((step, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] text-[var(--ink-2)]">
                        <span className="grid place-items-center rounded-full text-[9px] font-semibold shrink-0" style={{ width: 17, height: 17, background: "var(--well)", border: "1px solid var(--hairline)" }}>{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-5 border-b border-[var(--hairline)]">
              <span className="grid place-items-center w-14 h-14 rounded-full text-white text-[20px] font-semibold shrink-0" style={{ background: session?.color }}>
                {session?.name?.[0] || "?"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-semibold text-[var(--ink)]">{session?.name}</div>
                <div className="text-[12px] text-[var(--ink-2)] truncate">{session?.email || T("Modo demo · sin cuenta", "Demo mode · no account")}</div>
                {session?.provider === "google" && (
                  <span className="inline-flex items-center gap-1.5 mt-1.5 text-[10.5px] text-[var(--ink-2)] glass-strong rounded-full px-2 py-0.5">
                    <GoogleG size={11} /> {T("Conectado con Google", "Connected with Google")}
                  </span>
                )}
              </div>
              <Button variant="secondary" size="sm" icon="Pencil" onClick={demoAction}>{T("Editar", "Edit")}</Button>
            </div>
            <SettingRow icon="ShieldCheck" title={T("Verificación en dos pasos", "Two-step verification")}
              sub={T("Código por app de autenticación al iniciar sesión en un dispositivo nuevo", "Authenticator code when signing in on a new device")}>
              <GlassToggle on={twoFA} onChange={setTwoFA} />
            </SettingRow>
            <SettingRow icon="KeyRound" title={T("Llaves de acceso (passkeys)", "Passkeys")}
              sub={T("Face ID / Touch ID en este dispositivo", "Face ID / Touch ID on this device")}>
              <Button variant="secondary" size="sm" onClick={demoAction}>{T("Añadir", "Add")}</Button>
            </SettingRow>
            <SettingRow icon="MonitorSmartphone" title={T("Sesiones activas", "Active sessions")}
              sub={T("iPhone 15 Pro · Columbus, OH (esta) — MacBook Air · hace 2 días", "iPhone 15 Pro · Columbus, OH (this) — MacBook Air · 2 days ago")}>
              <Button variant="ghost" size="sm" onClick={demoAction}>{T("Gestionar", "Manage")}</Button>
            </SettingRow>
            <SettingRow icon="Download" title={T("Exportar mis datos", "Export my data")}
              sub={T("Parámetros, habitantes y bitácora en CSV/JSON", "Parameters, livestock and logbook as CSV/JSON")}>
              <Button variant="ghost" size="sm" icon="FileDown" onClick={() => window.exportParamsCSV?.()}>CSV</Button>
            </SettingRow>
          </Card>

          <Card className="overflow-hidden">
            <SettingRow icon="LogOut" title={T("Cerrar sesión", "Sign out")} sub={session?.email || ""} danger>
              <Button variant="danger" size="sm" onClick={onSignOut}>{T("Salir", "Sign out")}</Button>
            </SettingRow>
            <SettingRow icon="Trash2" title={T("Eliminar cuenta", "Delete account")}
              sub={T("Borra tu cuenta y todos los datos del tanque. Irreversible.", "Deletes your account and all tank data. Irreversible.")} danger>
              <Button variant="danger" size="sm" onClick={demoAction}>{T("Eliminar", "Delete")}</Button>
            </SettingRow>
          </Card>
        </div>
      )}

      {/* ---------------- PREFERENCES ---------------- */}
      {tab === "preferences" && (
        <Card className="overflow-hidden">
          <SettingRow icon="GlassWater" title={T("Estilo de vidrio", "Glass style")}
            sub={T("Frost (claro), Aqua (vívido) o Deep (oscuro)", "Frost (light), Aqua (vivid) or Deep (dark)")}>
            <Segmented value={tweaks.style} options={["frost", "aqua", "deep"]} onChange={(v) => setTweak("style", v)}
              labels={{ frost: "Frost", aqua: "Aqua", deep: "Deep" }} />
          </SettingRow>
          <SettingRow icon="Rows3" title={T("Densidad", "Density")}
            sub={T("Compacta muestra más información por pantalla", "Compact fits more on screen")}>
            <Segmented value={tweaks.density} options={["compact", "comfortable"]} onChange={(v) => setTweak("density", v)}
              labels={{ compact: T("Compacta", "Compact"), comfortable: T("Cómoda", "Comfy") }} />
          </SettingRow>
          <SettingRow icon="Languages" title={T("Idioma", "Language")} sub={T("Interfaz en español o inglés", "Interface in Spanish or English")}>
            <Segmented value={tweaks.lang} options={["es", "en"]} onChange={(v) => setTweak("lang", v)}
              labels={{ es: "Español", en: "English" }} />
          </SettingRow>
          <SettingRow icon="Thermometer" title={T("Unidades", "Units")} sub={T("Temperatura y volumen", "Temperature & volume")}>
            <Segmented value={"us"} options={["us", "metric"]}
              onChange={(v) => { if (v === "metric") window.toast?.(T("Unidades métricas — disponibles en la versión final", "Metric units — coming in the final version"), { icon: "Info", tone: "info" }); }}
              labels={{ us: "°F · gal", metric: "°C · L" }} />
          </SettingRow>
        </Card>
      )}

      {/* ---------------- NOTIFICATIONS ---------------- */}
      {tab === "notifications" && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
                <L name="BellRing" size={17} style={{ color: "var(--accent)" }} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-semibold text-[var(--ink)]">{T("Permiso de notificaciones", "Notification permission")}</span>
                  <StatusPill status={permBadge.status} label={permBadge.label} />
                </div>
                <p className="text-[11.5px] text-[var(--ink-2)] mt-1 leading-relaxed">
                  {T("AquaSense necesita permiso del navegador para avisarte de alertas críticas (blanqueamiento, parámetros fuera de rango) y rutinas pendientes.",
                     "AquaSense needs browser permission to alert you about critical events (bleaching, out-of-range parameters) and pending routines.")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {perm !== "granted" && perm !== "unsupported" && (
                  <Button variant="primary" size="sm" icon="Bell" onClick={askPermission}>{T("Permitir", "Allow")}</Button>
                )}
                {perm === "granted" && (
                  <Button variant="secondary" size="sm" icon="Send" onClick={testNotification}>{T("Probar", "Test")}</Button>
                )}
              </div>
            </div>
            {perm === "denied" && (
              <p className="text-[11px] mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(225,29,72,0.10)", border: "1px solid rgba(225,29,72,0.28)", color: "#DC4458" }}>
                {T("Bloqueaste las notificaciones. Actívalas desde los ajustes del sitio en tu navegador (icono del candado en la barra de direcciones).",
                   "You blocked notifications. Re-enable them in your browser's site settings (lock icon in the address bar).")}
              </p>
            )}
          </Card>

          <Card className="overflow-hidden">
            <SettingRow icon="AlertOctagon" title={T("Alertas críticas", "Critical alerts")}
              sub={T("Blanqueamiento, amonio detectado, fallos de equipo", "Bleaching, ammonia detected, equipment failures")}>
              <GlassToggle on={notifPrefs.alerts} onChange={(v) => setNotifPrefs((p) => ({ ...p, alerts: v }))} />
            </SettingRow>
            <SettingRow icon="CalendarCheck" title={T("Rutinas y dosis", "Routines & dosing")}
              sub={T("Recordatorio 15 min antes de cada tarea", "Reminder 15 min before each task")}>
              <GlassToggle on={notifPrefs.routines} onChange={(v) => setNotifPrefs((p) => ({ ...p, routines: v }))} />
            </SettingRow>
            <SettingRow icon="Activity" title={T("Tendencias de parámetros", "Parameter trends")}
              sub={T("Cuando un parámetro lleva 3 días en deriva", "When a parameter drifts for 3 days")}>
              <GlassToggle on={notifPrefs.params} onChange={(v) => setNotifPrefs((p) => ({ ...p, params: v }))} />
            </SettingRow>
            <SettingRow icon="Sparkles" title={T("Consejos de AquaBot", "AquaBot tips")}
              sub={T("Sugerencias proactivas de cuidado", "Proactive care suggestions")}>
              <GlassToggle on={notifPrefs.ai} onChange={(v) => setNotifPrefs((p) => ({ ...p, ai: v }))} />
            </SettingRow>
          </Card>
        </div>
      )}

      {/* ---------------- CALENDAR / REMINDERS ---------------- */}
      {tab === "integrations" && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <SettingRow icon="Calendar" title={T("Añadir rutinas a Calendario (iPhone/Mac)", "Add routines to Calendar (iPhone/Mac)")}
              sub={T("Descarga un archivo .ics con tus 7 rutinas y sus horas — al abrirlo, iOS las añade a Calendario con aviso 15 min antes.",
                     "Downloads an .ics file with your 7 routines and times — opening it on iOS adds them to Calendar with a 15-min alert.")}>
              <Button variant="primary" size="sm" icon={icsDone === "event" ? "Check" : "CalendarPlus"} onClick={() => exportICS("event")}>
                {icsDone === "event" ? T("Descargado", "Downloaded") : T("Exportar .ics", "Export .ics")}
              </Button>
            </SettingRow>
            <SettingRow icon="ListChecks" title={T("Añadir a Recordatorios (Apple Reminders)", "Add to Apple Reminders")}
              sub={T("Versión como tareas (VTODO) compatible con Recordatorios y otras apps de tareas.",
                     "Task version (VTODO) compatible with Reminders and other to-do apps.")}>
              <Button variant="secondary" size="sm" icon={icsDone === "todo" ? "Check" : "BadgePlus"} onClick={() => exportICS("todo")}>
                {icsDone === "todo" ? T("Descargado", "Downloaded") : T("Exportar tareas", "Export tasks")}
              </Button>
            </SettingRow>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: "rgba(99,102,241,0.13)", border: "1px solid rgba(99,102,241,0.3)" }}>
                <L name="Workflow" size={17} style={{ color: "var(--indigo)" }} />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-[var(--ink)]">{T("Atajo de Siri (Shortcuts)", "Siri Shortcut")}</div>
                <p className="text-[11.5px] text-[var(--ink-2)] mt-1 leading-relaxed">
                  {T("Crea un atajo «Registrar lectura AquaSense» en la app Atajos: nuevo atajo → «Abrir URL» con la dirección de esta app (?page=parameters) → añádelo a la pantalla de inicio o dí «Oye Siri, registrar lectura».",
                     "Create a “Log AquaSense reading” shortcut in the Shortcuts app: new shortcut → “Open URL” pointing to this app (?page=parameters) → add it to your home screen or say “Hey Siri, log reading”.")}
                </p>
                <ol className="mt-2.5 space-y-1.5">
                  {[
                    T("Abre Atajos → «+» → Añadir acción", "Open Shortcuts → “+” → Add action"),
                    T("Busca «Abrir URL» y pega la URL de AquaSense", "Search “Open URL” and paste the AquaSense URL"),
                    T("Renómbralo y actívalo con Siri o un widget", "Rename it and trigger via Siri or a widget"),
                  ].map((step, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11.5px] text-[var(--ink-2)]">
                      <span className="grid place-items-center w-4.5 h-4.5 rounded-full text-[9px] font-semibold shrink-0" style={{ width: 18, height: 18, background: "var(--well)", border: "1px solid var(--hairline)", color: "var(--ink-2)" }}>{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { LoginScreen, SettingsPage, GoogleG, downloadICS });
