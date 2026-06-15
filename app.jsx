// App shell — routing, layout, tweaks (style variants / density / language)
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "style": "frost",
  "density": "comfortable",
  "lang": "es"
}/*EDITMODE-END*/;

const STYLE_LABELS = { frost: "Frost", aqua: "Aqua", deep: "Deep" };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme + language before children render
  window.__lang = t.lang;
  document.documentElement.lang = t.lang;
  document.documentElement.dataset.style = t.style;
  document.documentElement.dataset.density = t.density;
  React.useEffect(() => {
    localStorage.setItem("aqua:lang", t.lang);
  }, [t.lang]);

  const [activePage, setActivePage] = React.useState(() => {
    return new URLSearchParams(location.search).get("page") || localStorage.getItem("aqua:page") || "dashboard";
  });

  // ---- session (prototype auth) ----
  const [session, setSession] = React.useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("aqua:session") ||
        sessionStorage.getItem("aqua:session") ||
        "null"
      );
    } catch (e) { return null; }
  });
  const signIn = (user) => {
    const remember = localStorage.getItem("aqua:remember") !== "false";
    if (remember || user.remember !== false) {
      localStorage.setItem("aqua:session", JSON.stringify(user));
      sessionStorage.removeItem("aqua:session");
    } else {
      sessionStorage.setItem("aqua:session", JSON.stringify(user));
      localStorage.removeItem("aqua:session");
    }
    setSession(user);
  };
  const signOut = () => {
    window.CLOUD?.signOut();
    localStorage.removeItem("aqua:session");
    setSession(null);
    setActivePage("dashboard");
  };

  // Supabase auth: cloud.js emite aqua:auth al conectar o cerrar sesion.
  React.useEffect(() => {
    const fn = (e) => {
      if (e.detail) {
        signIn({ ...e.detail, color: "linear-gradient(150deg, var(--accent), var(--indigo))" });
        window.toast?.(T(`Sesion iniciada: ${e.detail.email} — datos sincronizando con la nube`, `Signed in: ${e.detail.email} — data syncing to the cloud`), { icon: "CloudUpload" });
      } else {
        // Sign-out from Supabase: clear any cloud-backed session
        setSession((s) => {
          if (s?.provider?.startsWith("supabase")) { localStorage.removeItem("aqua:session"); return null; }
          return s;
        });
      }
    };
    window.addEventListener("aqua:auth", fn);
    return () => window.removeEventListener("aqua:auth", fn);
  }, []);

  React.useEffect(() => {
    localStorage.setItem("aqua:page", activePage);
  }, [activePage]);

  // ---- estado de usuario: AquaStore es la fuente de verdad (localStorage +
  // nube). Cualquier mutación emite aqua:data y este shell re-renderiza. ----
  const [, setDataRev] = React.useState(0);
  React.useEffect(() => {
    const fn = () => setDataRev((v) => v + 1);
    window.addEventListener("aqua:data", fn);
    return () => window.removeEventListener("aqua:data", fn);
  }, []);

  const alerts = window.AquaStore.activeAlerts();
  const dismissAlert = (id) => window.AquaStore.dismissAlert(id);

  const routinesDone = window.AquaStore.ud.routinesDone;
  const toggleRoutine = (id) => {
    const nowDone = window.AquaStore.toggleRoutine(id);
    if (nowDone) window.toast?.(T("Rutina completada", "Routine completed"));
  };

  // ---- onboarding check ----
  const [onboarded, setOnboarded] = React.useState(() => !!localStorage.getItem("aqua:onboarded"));

  // Show onboarding if not done yet (even before login)
  if (!onboarded) {
    return (
      <div key={t.lang}>
        <OnboardingFlow onDone={() => setOnboarded(true)} />
        <ToastHost />
      </div>
    );
  }

  const navigate = (id) => {
    setActivePage(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const page = (() => {
    switch (activePage) {
      case "dashboard":   return <Dashboard onNavigate={navigate} alerts={alerts} onDismissAlert={dismissAlert} routinesDone={routinesDone} onToggleRoutine={toggleRoutine} />;
      case "parameters":  return <ParametersPage onNavigate={navigate} />;
      case "inhabitants": return <InhabitantsPage onNavigate={navigate} />;
      case "lighting":    return <LightingPage onNavigate={navigate} />;
      case "routines":    return <RoutinesPage onNavigate={navigate} routinesDone={routinesDone} onToggleRoutine={toggleRoutine} />;
      case "ai":          return <AquaBotPage />;
      case "alerts":      return <AlertsPage onNavigate={navigate} alerts={alerts} onDismissAlert={dismissAlert} />;
      default:            return <SettingsPage session={session} onSignOut={signOut} tweaks={t} setTweak={setTweak} />;
    }
  })();

  const tweaksPanel = (
    <TweaksPanel>
      <TweakSection label={T("Estilo de vidrio", "Glass style")} />
      <TweakRadio
        label={T("Variante", "Variant")}
        value={t.style}
        options={["frost", "aqua", "deep"]}
        onChange={(v) => setTweak("style", v)}
      />
      <TweakSection label={T("Diseño", "Layout")} />
      <TweakRadio
        label={T("Densidad", "Density")}
        value={t.density}
        options={["compact", "comfortable"]}
        onChange={(v) => setTweak("density", v)}
      />
      <TweakSection label={T("Idioma", "Language")} />
      <TweakRadio
        label="ES / EN"
        value={t.lang}
        options={["es", "en"]}
        onChange={(v) => setTweak("lang", v)}
      />
    </TweaksPanel>
  );

  if (!session) {
    return (
      <div key={t.lang}>
        <LoginScreen onSignIn={signIn} />
        <ToastHost />
        {tweaksPanel}
      </div>
    );
  }

  return (
    <div key={t.lang} className="min-h-screen relative text-[var(--ink)]">
      <Atmosphere />
      <div className="relative z-10 flex">
        <Sidebar activePage={activePage} onNavigate={navigate} alertCount={alerts.length} session={session} />
        <main className="flex-1 min-w-0 app-main">
          <Header activePage={activePage} onNavigate={navigate} alertCount={alerts.length} />
          <div className="pb-28 lg:pb-10">
            <div key={activePage} style={{ animation: "fadeUp 0.35s cubic-bezier(.2,.7,.3,1)" }}>
              {page}
            </div>
          </div>
        </main>
      </div>
      <MobileTabBar activePage={activePage} onNavigate={navigate} />
      <ToastHost />
      {tweaksPanel}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
