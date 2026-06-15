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

// ---------- Login screen — Supabase email/password ----------
function LoginScreen({ onSignIn, isNew = false }) {
  const [mode, setMode] = React.useState("signin"); // "signin" | "signup" | "reset"
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [remember, setRemember] = React.useState(() => localStorage.getItem("aqua:remember") !== "false");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");

  const cloudReady = window.CLOUD?.isConfigured;

  const clearMessages = () => { setError(""); setInfo(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(T("Ingresa tu email.", "Enter your email.")); return; }
    if (mode !== "reset" && password.length < 6) { setError(T("La contrasena debe tener al menos 6 caracteres.", "Password must be at least 6 characters.")); return; }
    clearMessages();
    setLoading(true);

    // Persist remember preference
    if (remember) localStorage.removeItem("aqua:remember");
    else localStorage.setItem("aqua:remember", "false");

    if (!cloudReady) {
      // No Supabase configured — sign in as demo with the typed email
      await new Promise((r) => setTimeout(r, 700));
      const name = email.split("@")[0];
      onSignIn({ name, email, color: "linear-gradient(150deg, #0E8C86, #5B5BD6)", provider: "email-demo", remember, since: new Date().toISOString().slice(0, 10) });
      setLoading(false);
      return;
    }

    try {
      if (mode === "reset") {
        await window.CLOUD.resetPassword(email.trim());
        setInfo(T("Revisa tu email — te enviamos el enlace de recuperacion.", "Check your email — we sent the recovery link."));
        setMode("signin");
      } else if (mode === "signup") {
        const u = await window.CLOUD.signUp(email.trim(), password);
        if (u && !u.identities?.length) {
          setInfo(T("Revisa tu email para confirmar tu cuenta.", "Check your email to confirm your account."));
        } else if (u) {
          // Auto-confirmed (email confirmation disabled in Supabase)
          onSignIn({ name: u.email?.split("@")[0] || "User", email: u.email, uid: u.id, color: "linear-gradient(150deg, #0E8C86, #5B5BD6)", provider: "supabase", since: new Date().toISOString().slice(0, 10) });
        }
      } else {
        await window.CLOUD.signInWithEmail(email.trim(), password);
        // aqua:auth event fires from cloud.js and the App will react
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("Invalid login")) setError(T("Email o contrasena incorrectos.", "Incorrect email or password."));
      else if (msg.includes("Email not confirmed")) setError(T("Confirma tu email antes de iniciar sesion.", "Please confirm your email before signing in."));
      else if (msg.includes("User already registered")) setError(T("Ya tienes cuenta. Inicia sesion.", "Account already exists. Sign in instead."));
      else setError(msg || T("Algo salio mal. Intenta de nuevo.", "Something went wrong. Please try again."));
    }
    setLoading(false);
  };

  const googleSignIn = async () => {
    if (!cloudReady) return;
    setLoading(true);
    clearMessages();
    try {
      await window.CLOUD.signInGoogle();
      // Page redirects; session restored on return
    } catch (e) {
      setError(T(
        "Para login con Google, activa Google Provider en tu panel de Supabase → Authentication → Providers.",
        "Para login con Google, activa Google Provider en tu panel de Supabase → Authentication → Providers."
      ));
      setLoading(false);
    }
  };

  const demoMode = () => {
    // Clear all aqua:* keys so demo always starts truly fresh (onboarding included)
    Object.keys(localStorage).filter((k) => k.startsWith("aqua:")).forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    onSignIn({
      name: "Demo", email: null,
      color: "linear-gradient(150deg, #7C90A3, #46607A)",
      provider: "guest",
      remember: false,  // session lives in sessionStorage only; doesn't persist across tabs/reload
      since: new Date().toISOString().slice(0, 10),
    });
  };

  const titles = {
    signin: T("Iniciar sesion", "Sign in"),
    signup: T("Crear cuenta", "Create account"),
    reset:  T("Recuperar contrasena", "Reset password"),
  };

  return (
    <div className="min-h-screen relative grid place-items-center p-4" data-screen-label="Login">
      <Atmosphere />
      <div className="relative z-10 w-full max-w-[400px]">
        <Card className="p-7">
          {/* Logo + brand */}
          <div className="text-center mb-6">
            <div className="mx-auto w-fit mb-3"><Logo size={48} /></div>
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--ink)]">AquaMind</h1>
            <p className="text-[12px] text-[var(--ink-2)] mt-1">
              {T("Tu acuario, monitoreado con inteligencia.", "Your aquarium, intelligently monitored.")}
            </p>
          </div>

          {/* New-user recap — visible only on first visit */}
          {isNew && mode === "signin" && (
            <div className="mb-5 rounded-2xl overflow-hidden" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
              <div className="px-4 py-3 flex items-center gap-2 border-b border-[var(--accent-border)]">
                <L name="Sparkles" size={14} style={{ color: "var(--accent)" }} />
                <span className="text-[12.5px] font-semibold" style={{ color: "var(--accent)" }}>
                  {T("¡Bienvenido a AquaMind! Ten esto a mano:", "Welcome to AquaMind! Have these ready:")}
                </span>
              </div>
              <ul className="px-4 py-3 space-y-2">
                {[
                  [T("Kit de pruebas de agua", "Water test kit"), T("pH, KH, calcio, magnesio, nitrito, nitrato, amoniaco", "pH, KH, calcium, magnesium, nitrite, nitrate, ammonia"), "Droplets"],
                  [T("Datos de tu acuario", "Aquarium specs"), T("Dimensiones, volumen, marca y modelo", "Dimensions, volume, brand and model"), "Box"],
                  [T("Lista de habitantes", "Inhabitant list"), T("Peces, corales, equinodermos y limpiadores", "Fish, corals, echinoderms and cleanup crew"), "Fish"],
                  [T("Productos que usas", "Products you use"), T("Alimentos, aditivos y marcas de equipo", "Foods, additives and equipment brands"), "Package"],
                ].map(([title, desc, icon]) => (
                  <li key={title} className="flex items-start gap-2.5">
                    <L name={icon} size={13} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                    <div>
                      <span className="text-[12px] font-medium text-[var(--ink)]">{title}</span>
                      <span className="text-[10.5px] text-[var(--ink-3)] block">{desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="px-4 pb-3 text-[10px] text-[var(--ink-3)] leading-relaxed">
                {T("No te preocupes si no tienes todo — puedes completar los datos más tarde.", "Don't worry if you don't have everything — you can fill in the details later.")}
              </p>
            </div>
          )}

          {/* Mode tabs */}
          {mode !== "reset" && (
            <div className="flex p-0.5 rounded-xl mb-5" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
              {[["signin", T("Entrar", "Sign in")], ["signup", T("Registrarse", "Sign up")]].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setMode(id); clearMessages(); }}
                  className={`flex-1 py-1.5 rounded-[10px] text-[12.5px] font-medium transition-all ${mode === id ? "glass-strong text-[var(--ink)]" : "text-[var(--ink-3)] hover:text-[var(--ink-2)]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Error / info banners */}
          {error && (
            <div className="mb-3 rounded-xl px-3 py-2.5 text-[12px] text-red-700 dark:text-red-300 flex items-start gap-2" style={{ background: "rgba(220,68,88,0.1)", border: "1px solid rgba(220,68,88,0.25)" }}>
              <L name="AlertCircle" size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {info && (
            <div className="mb-3 rounded-xl px-3 py-2.5 text-[12px] flex items-start gap-2" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>
              <L name="Info" size={14} className="shrink-0 mt-0.5" />
              {info}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center gap-2 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[var(--accent-border)]">
              <L name="Mail" size={14} className="text-[var(--ink-3)] shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                placeholder={T("tu@email.com", "you@email.com")}
                autoComplete="email"
                className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                required
              />
            </div>

            {mode !== "reset" && (
              <div className="flex items-center gap-2 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[var(--accent-border)]">
                <L name="Lock" size={14} className="text-[var(--ink-3)] shrink-0" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearMessages(); }}
                  placeholder={mode === "signup" ? T("Minimo 6 caracteres", "Minimum 6 characters") : T("Contrasena", "Password")}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                  required
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="text-[var(--ink-3)] hover:text-[var(--ink-2)]">
                  <L name={showPw ? "EyeOff" : "Eye"} size={14} />
                </button>
              </div>
            )}

            {mode === "signin" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setRemember((r) => !r)}
                    className="relative w-8 h-4.5 rounded-full transition-all cursor-pointer"
                    style={{ height: 18, width: 32, background: remember ? "linear-gradient(160deg, var(--accent), var(--accent-strong))" : "var(--well)", border: `1px solid ${remember ? "transparent" : "var(--hairline-strong)"}` }}
                  >
                    <span className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-all" style={{ width: 14, height: 14, left: remember ? 15 : 1 }} />
                  </div>
                  <span className="text-[11.5px] text-[var(--ink-2)]">{T("Recordar dispositivo", "Remember device")}</span>
                </label>
                <button type="button" onClick={() => { setMode("reset"); clearMessages(); }} className="text-[11px] text-[var(--ink-3)] hover:text-[var(--accent)] transition-colors">
                  {T("Olvide mi contrasena", "Forgot password?")}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60 transition-all active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-strong))" }}
            >
              {loading
                ? <L name="Loader2" size={16} className="animate-spin mx-auto" />
                : titles[mode]}
            </button>

            {mode === "reset" && (
              <button type="button" onClick={() => { setMode("signin"); clearMessages(); }} className="w-full text-[12px] text-[var(--ink-3)] hover:text-[var(--ink-2)] transition-colors">
                {T("← Volver al inicio de sesion", "← Back to sign in")}
              </button>
            )}
          </form>

          {!cloudReady && (
            <p className="text-[10.5px] text-[var(--ink-3)] mt-3 text-center leading-relaxed rounded-lg px-2 py-1.5" style={{ background: "var(--well)" }}>
              {T("Supabase no configurado — entrara en modo demo local.", "Supabase not configured — will enter local demo mode.")}
            </p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <span className="flex-1 h-px bg-[var(--hairline)]" />
            <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">{T("o", "or")}</span>
            <span className="flex-1 h-px bg-[var(--hairline)]" />
          </div>

          {/* Google OAuth — optional if Supabase Google provider is enabled */}
          <button
            onClick={googleSignIn}
            disabled={loading || !cloudReady}
            className="w-full glass-strong rounded-full px-4 py-2.5 flex flex-col items-center justify-center gap-0.5 text-[13px] font-medium text-[var(--ink)] hover:brightness-105 transition-all disabled:opacity-40 mb-1"
          >
            <div className="flex items-center gap-3">
              <GoogleG size={16} />
              {T("Continuar con Google", "Continue with Google")}
            </div>
          </button>
          <div className="text-center text-[10.5px] text-[var(--ink-3)] mb-3">
            {T("(Requiere configuración adicional en Supabase)", "(Requiere configuración adicional en Supabase)")}
          </div>

          <div className="text-center">
            <button onClick={demoMode} className="text-[12px] text-[var(--ink-3)] hover:text-[var(--ink-2)] transition-colors">
              {T("Explorar sin cuenta →", "Explore without account →")}
            </button>
          </div>

          <p className="text-[10px] text-[var(--ink-3)] mt-5 text-center leading-relaxed">
            {T("Datos cifrados en transito y en reposo. Nunca compartimos tu informacion.", "Data encrypted in transit and at rest. We never share your information.")}
          </p>
        </Card>
      </div>
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
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AquaMind//Aquarium Intelligence//ES", "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:AquaMind · ${TANK_CONFIG.name}`,
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

// ---------- Compact Aqua Buddy key row (shown inside the AI card in Account tab) ----------
function AquaBuddyKeyRow() {
  const [key, setKey] = React.useState(() => localStorage.getItem("aqua:ai_key") || "");
  const [show, setShow] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const hasDefault = !localStorage.getItem("aqua:ai_key") && !!window.AQUAMIND_AI_KEY;

  const save = () => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem("aqua:ai_key", trimmed);
      window.AQUAMIND_AI_KEY = trimmed;
    } else {
      localStorage.removeItem("aqua:ai_key");
      try { window.AQUAMIND_AI_KEY = atob("QVEuQWI4Uk42THloSDdHQ0NoOENTeTVzTTNCd0lZWVE2UDR2OGRWLUtCQ1lLN0Mtb01wQVE="); } catch (_) {}
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.toast?.(T("Key de Gemini actualizada", "Gemini key updated"), { icon: "Sparkles" });
  };

  return (
    <div className="px-5 pb-4 pt-1 space-y-2">
      <div className="text-[11px] text-[var(--ink-3)]">
        {hasDefault
          ? T("Usando key integrada. Pega la tuya si Aqua Buddy no responde.", "Using built-in key. Paste yours if Aqua Buddy isn't responding.")
          : T("Key propia configurada.", "Custom key configured.")}
        {" "}<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="underline" style={{ color: "var(--accent)" }}>aistudio.google.com/apikey</a>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}>
          <L name="KeyRound" size={12} className="text-[var(--ink-3)] shrink-0" />
          <input type={show ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); }}
            placeholder={hasDefault ? T("Usar key integrada (por defecto)", "Using built-in key (default)") : "AIza..."}
            className="flex-1 bg-transparent border-0 outline-none text-[11.5px] text-[var(--ink)] placeholder:text-[var(--ink-3)] font-mono" />
          <button onClick={() => setShow((s) => !s)} className="text-[var(--ink-3)] hover:text-[var(--ink-2)]"><L name={show ? "EyeOff" : "Eye"} size={12} /></button>
        </div>
        <button onClick={save}
          className="px-3 rounded-xl text-[11.5px] font-medium text-white transition-all active:scale-[0.98]"
          style={{ background: saved ? "#0E9F6E" : "linear-gradient(135deg, var(--accent), var(--accent-strong))" }}>
          {saved ? <L name="Check" size={13} /> : T("Guardar", "Save")}
        </button>
      </div>
    </div>
  );
}

// ---------- Google Gemini API key ----------
function GeminiKeyRow() {
  const [key, setKey] = React.useState(() => localStorage.getItem("aqua:ai_key") || "");
  const [show, setShow] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const save = () => {
    if (key.trim()) {
      localStorage.setItem("aqua:ai_key", key.trim());
      window.AQUAMIND_AI_KEY = key.trim();
    } else {
      localStorage.removeItem("aqua:ai_key");
      delete window.AQUAMIND_AI_KEY;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.toast?.(T("API key guardada — Aqua Buddy usará Google Gemini", "API key saved — Aqua Buddy will use Google Gemini"), { icon: "Sparkles" });
  };

  return (
    <div className="space-y-2">
      <div className="text-[11.5px] text-[var(--ink-2)] leading-relaxed">
        {T(
          "Consigue tu API key gratis (sin tarjeta) en ",
          "Get your free API key (no credit card) at "
        )}
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="underline" style={{ color: "var(--accent)" }}>aistudio.google.com/apikey</a>
        {T(". Se guarda solo en este dispositivo.", ". Stored on this device only.")}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[var(--accent-border)] transition-all">
          <L name="KeyRound" size={13} className="text-[var(--ink-3)] shrink-0" />
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIza..."
            className="flex-1 bg-transparent border-0 outline-none text-[12.5px] text-[var(--ink)] placeholder:text-[var(--ink-3)] font-mono"
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          />
          <button onClick={() => setShow((s) => !s)} className="text-[var(--ink-3)] hover:text-[var(--ink-2)] transition-colors">
            <L name={show ? "EyeOff" : "Eye"} size={13} />
          </button>
        </div>
        <Button variant={saved ? "primary" : "secondary"} icon={saved ? "Check" : "Save"} onClick={save}>
          {saved ? T("Guardado", "Saved") : T("Guardar", "Save")}
        </Button>
      </div>
      {key && (
        <div className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--accent)" }}>
          <L name="CheckCircle2" size={11} />
          {T("Key configurada — Aqua Buddy usara Google Gemini", "Key configured — Aqua Buddy will use Google Gemini")}
        </div>
      )}
    </div>
  );
}

// ---------- Supabase config ----------
function SupabaseConfigRow() {
  const [url, setUrl] = React.useState(() => localStorage.getItem("aqua:supabase_url") || "");
  const [key, setKey] = React.useState(() => localStorage.getItem("aqua:supabase_key") || "");
  const [show, setShow] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const save = () => {
    window.CLOUD?.setConfig?.(url.trim(), key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    window.toast?.(
      T("Supabase guardado — recarga la pagina para activar la nube", "Supabase saved — reload the page to activate cloud sync"),
      { icon: "Cloud", tone: "info" }
    );
  };

  const configured = !!(localStorage.getItem("aqua:supabase_url") && localStorage.getItem("aqua:supabase_key"));

  return (
    <div className="space-y-2">
      <div className="text-[11.5px] text-[var(--ink-2)] leading-relaxed">
        {T("Crea un proyecto gratis en ", "Create a free project at ")}
        <a href="https://supabase.com" target="_blank" rel="noopener" className="underline" style={{ color: "var(--accent)" }}>supabase.com</a>
        {T(", luego Settings → API → copia la URL y la clave anon.", ", then Settings → API → copy the URL and anon key.")}
      </div>
      <div className="flex-1 flex items-center gap-2 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[var(--accent-border)] transition-all mb-1">
        <L name="Link" size={13} className="text-[var(--ink-3)] shrink-0" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://xxxx.supabase.co"
          className="flex-1 bg-transparent border-0 outline-none text-[12.5px] text-[var(--ink)] placeholder:text-[var(--ink-3)] font-mono"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[var(--well)] border border-[var(--hairline)] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[var(--accent-border)] transition-all">
          <L name="KeyRound" size={13} className="text-[var(--ink-3)] shrink-0" />
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="eyJhbGci..."
            className="flex-1 bg-transparent border-0 outline-none text-[12.5px] text-[var(--ink)] placeholder:text-[var(--ink-3)] font-mono"
          />
          <button onClick={() => setShow((s) => !s)} className="text-[var(--ink-3)] hover:text-[var(--ink-2)] transition-colors">
            <L name={show ? "EyeOff" : "Eye"} size={13} />
          </button>
        </div>
        <Button variant={saved ? "primary" : "secondary"} icon={saved ? "Check" : "Save"} onClick={save} disabled={!url.trim() || !key.trim()}>
          {saved ? T("Guardado", "Saved") : T("Guardar", "Save")}
        </Button>
      </div>
      {configured && !saved && (
        <div className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "#0E9F6E" }}>
          <L name="CheckCircle2" size={11} />
          {T("Supabase configurado", "Supabase configured")}
        </div>
      )}
    </div>
  );
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

  // Inline display-name editor
  const [editingName, setEditingName] = React.useState(false);
  const [editName, setEditName] = React.useState(() => localStorage.getItem("aqua:display_name") || session?.name || "");
  const saveDisplayName = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      localStorage.setItem("aqua:display_name", trimmed);
      window.AQUA.TANK_CONFIG.owner = trimmed;
    }
    setEditingName(false);
    window.toast?.(T("Nombre actualizado", "Name updated"), { icon: "UserRound" });
  };

  // Delete account confirmation
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const doDeleteAccount = () => {
    window.AquaStore?.reset();
  };

  const askPermission = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      new Notification("AquaMind", { body: T("Notificaciones activadas — te avisaremos de alertas críticas y rutinas.", "Notifications on — we'll ping you about critical alerts and routines.") });
    }
  };

  const testNotification = () => {
    if (perm === "granted") {
      new Notification("AquaMind · " + T("Alerta crítica", "Critical alert"), { body: T("Birdsnest blanqueando — KH 7.0 dKH. Dosifica 7 ml de Reef Buffer.", "Birdsnest bleaching — KH 7.0 dKH. Dose 7 ml Reef Buffer.") });
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
                    ? T("Lecturas, fotos, rutinas y alertas se sincronizan en la nube con tu cuenta. Abre la app en otro dispositivo e inicia sesión para ver lo mismo.",
                        "Readings, photos, routines and alerts sync to the cloud with your account. Open the app on another device and sign in to see the same data.")
                    : T("Todo se guarda automáticamente en este navegador. Inicia sesión para activar la sincronización entre dispositivos con Supabase.",
                        "Everything saves automatically in this browser. Sign in to enable cross-device sync with Supabase.")}
                </p>
              </div>
            </div>
          </Card>

          {/* Aqua Buddy — AI status + key override */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--hairline)]">
              <div className="grid place-items-center w-9 h-9 rounded-xl shrink-0" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}>
                <L name="Sparkles" size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-[14px] font-semibold text-[var(--ink)]">Aqua Buddy · Google Gemini</div>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-semibold" style={{ background: "rgba(16,185,129,0.13)", color: "#0E9F6E", border: "1px solid rgba(16,185,129,0.3)" }}>ACTIVO</span>
                </div>
                <div className="text-[11.5px] text-[var(--ink-2)] mt-0.5">
                  {T("Gemini 2.0 Flash · contexto de tu tanque + acciones directas", "Gemini 2.0 Flash · your tank context + direct actions")}
                </div>
              </div>
              <PulsingDot color="#0E9F6E" size={8} />
            </div>
            {/* Optional key override — paste your own key if the default stops working */}
            <AquaBuddyKeyRow />
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-5 border-b border-[var(--hairline)]">
              <span className="grid place-items-center w-14 h-14 rounded-full text-white text-[20px] font-semibold shrink-0" style={{ background: session?.color }}>
                {(localStorage.getItem("aqua:display_name") || session?.name || "?")[0]}
              </span>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveDisplayName(); if (e.key === "Escape") setEditingName(false); }}
                      className="flex-1 bg-[var(--well)] border border-[var(--accent-border)] rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--ink)] outline-none focus:ring-1 focus:ring-[var(--accent-border)]"
                    />
                    <button onClick={saveDisplayName} className="text-[var(--accent)] hover:opacity-80 text-[12px] font-semibold">{T("Guardar", "Save")}</button>
                    <button onClick={() => setEditingName(false)} className="text-[var(--ink-3)] hover:text-[var(--ink-2)] text-[12px]">{T("Cancelar", "Cancel")}</button>
                  </div>
                ) : (
                  <>
                    <div className="text-[16px] font-semibold text-[var(--ink)]">{localStorage.getItem("aqua:display_name") || session?.name}</div>
                    <div className="text-[12px] text-[var(--ink-2)] truncate">{session?.email || T("Modo demo · sin cuenta", "Demo mode · no account")}</div>
                  </>
                )}
                {session?.provider === "google" && (
                  <span className="inline-flex items-center gap-1.5 mt-1.5 text-[10.5px] text-[var(--ink-2)] glass-strong rounded-full px-2 py-0.5">
                    <GoogleG size={11} /> {T("Conectado con Google", "Connected with Google")}
                  </span>
                )}
              </div>
              {!editingName && (
                <Button variant="secondary" size="sm" icon="Pencil" onClick={() => { setEditName(localStorage.getItem("aqua:display_name") || session?.name || ""); setEditingName(true); }}>{T("Editar", "Edit")}</Button>
              )}
            </div>
            <SettingRow icon="ShieldCheck" title={T("Verificación en dos pasos", "Two-step verification")}
              sub={T("Código por app de autenticación al iniciar sesión en un dispositivo nuevo", "Authenticator code when signing in on a new device")}>
              <GlassToggle on={twoFA} onChange={setTwoFA} />
            </SettingRow>
            <SettingRow icon="KeyRound" title={T("Llaves de acceso (passkeys)", "Passkeys")}
              sub={T("Face ID / Touch ID en este dispositivo", "Face ID / Touch ID on this device")}>
              <Button variant="secondary" size="sm" onClick={() => window.toast?.(T("Próximamente en tu dispositivo", "Coming soon on your device"), { icon: "KeyRound", tone: "info" })}>{T("Añadir", "Add")}</Button>
            </SettingRow>
            <SettingRow icon="MonitorSmartphone" title={T("Sesiones activas", "Active sessions")}
              sub={T("iPhone 15 Pro · Columbus, OH (esta) — MacBook Air · hace 2 días", "iPhone 15 Pro · Columbus, OH (this) — MacBook Air · 2 days ago")}>
              <Button variant="ghost" size="sm" onClick={() => window.toast?.(T("Sesión activa en este dispositivo", "Active session on this device"), { icon: "MonitorSmartphone", tone: "info" })}>{T("Gestionar", "Manage")}</Button>
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
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] text-[#DC4458]">{T("¿Seguro?", "Sure?")}</span>
                  <Button variant="danger" size="sm" onClick={doDeleteAccount}>{T("Sí, eliminar", "Yes, delete")}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>{T("No", "No")}</Button>
                </div>
              ) : (
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>{T("Eliminar", "Delete")}</Button>
              )}
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
                  {T("AquaMind necesita permiso del navegador para avisarte de alertas críticas (blanqueamiento, parámetros fuera de rango) y rutinas pendientes.",
                     "AquaMind needs browser permission to alert you about critical events (bleaching, out-of-range parameters) and pending routines.")}
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
            <SettingRow icon="Sparkles" title={T("Consejos de Aqua Buddy", "Aqua Buddy tips")}
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
                  {T("Crea un atajo 'Registrar lectura AquaMind' en la app Atajos: nuevo atajo → 'Abrir URL' con la dirección de esta app (?page=parameters) → añádelo a la pantalla de inicio o dí 'Oye Siri, registrar lectura'.",
                     "Create a 'Log AquaMind reading' shortcut in the Shortcuts app: new shortcut → 'Open URL' pointing to this app (?page=parameters) → add it to your home screen or say 'Hey Siri, log reading'.")}
                </p>
                <ol className="mt-2.5 space-y-1.5">
                  {[
                    T("Abre Atajos → «+» → Añadir acción", "Open Shortcuts → '+' → Add action"),
                    T("Busca «Abrir URL» y pega la URL de AquaMind", "Search 'Open URL' and paste the AquaMind URL"),
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
