// onboarding.jsx — Multi-step onboarding for first-time AquaMind users

function OnboardingFlow({ onDone }) {
  const [step, setStep] = React.useState(0); // 0..3
  const TOTAL_STEPS = 4;

  // Step 2 — tank form state
  const [tankName, setTankName] = React.useState(() => window.AQUA?.TANK_CONFIG?.name || "");
  const [tankType, setTankType] = React.useState(() => window.AQUA?.TANK_CONFIG?.type || "saltwater");
  const [tankVolume, setTankVolume] = React.useState(() => String(window.AQUA?.TANK_CONFIG?.displayVolume || ""));
  const [tankBrand, setTankBrand] = React.useState(() => window.AQUA?.TANK_CONFIG?.brand || "");

  // Step 3 — up to 3 initial inhabitants
  const [inhabitants, setInhabitants] = React.useState([
    { name: "", kind: "fish" },
    { name: "", kind: "coral" },
    { name: "", kind: "fish" },
  ]);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const completeTankStep = () => {
    if (tankName.trim()) {
      const cfg = window.AQUA?.TANK_CONFIG;
      if (cfg) {
        cfg.name = tankName.trim();
        cfg.type = tankType;
        if (tankVolume && isFinite(+tankVolume)) cfg.displayVolume = +tankVolume;
        if (tankBrand.trim()) cfg.brand = tankBrand.trim();
      }
      window.AquaStore?.touch?.();
    }
    goNext();
  };

  const completeInhabitantsStep = () => {
    const S = window.AquaStore;
    if (S) {
      inhabitants.forEach((inh) => {
        const name = inh.name.trim();
        if (!name) return;
        const item = {
          id: "oi" + Date.now() + Math.random().toString(36).slice(2),
          name: name.charAt(0).toUpperCase() + name.slice(1),
          scientific: "",
          added: window.AQUA?.MOCK_TODAY || new Date().toISOString().slice(0, 10),
          status: "ok",
          note: T("Añadido durante el onboarding", "Added during onboarding"),
        };
        const kind = inh.kind === "coral" ? "corals" : inh.kind === "cuc" ? "cuc" : "fish";
        S.addInhabitant(kind, item);
      });
    }
    goNext();
  };

  const finish = () => {
    localStorage.setItem("aqua:onboarded", "1");
    onDone?.();
  };

  // Progress dots
  const Dots = () => (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? 24 : 8,
            height: 8,
            borderRadius: 9999,
            background: i === step ? "var(--accent)" : i < step ? "var(--accent-border)" : "var(--hairline-strong)",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );

  // ── Step 0: Bienvenido ──────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen relative grid place-items-center p-4" data-screen-label="Onboarding">
        <Atmosphere />
        <div className="relative z-10 w-full max-w-[440px]">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-fit mb-4"><Logo size={56} /></div>
              <h1 className="text-[26px] font-semibold tracking-tight text-[var(--ink)] mb-2">
                {T("Bienvenido a AquaMind", "Welcome to AquaMind")}
              </h1>
              <p className="text-[14px] text-[var(--ink-2)] leading-relaxed">
                {T(
                  "Tu centro de inteligencia para acuarios. Registra parámetros, sigue a tus habitantes, organiza tus rutinas y habla con tu asistente IA.",
                  "Your aquarium intelligence center. Track parameters, follow your livestock, organize routines, and chat with your AI assistant."
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: "Activity", label: T("Parámetros", "Parameters"), desc: T("pH, KH, Ca, Mg y más", "pH, KH, Ca, Mg & more") },
                { icon: "Fish", label: T("Habitantes", "Livestock"), desc: T("Peces, corales, CUC", "Fish, corals, CUC") },
                { icon: "CalendarCheck", label: T("Rutinas", "Routines"), desc: T("Mantenimiento programado", "Scheduled maintenance") },
                { icon: "Sparkles", label: "Aqua Buddy", desc: T("Asistente IA experto", "Expert AI assistant") },
              ].map((f) => (
                <div
                  key={f.icon}
                  className="rounded-2xl p-3.5"
                  style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}
                >
                  <div
                    className="grid place-items-center w-9 h-9 rounded-xl mb-2"
                    style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}
                  >
                    <L name={f.icon} size={16} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="text-[13px] font-medium text-[var(--ink)]">{f.label}</div>
                  <div className="text-[11px] text-[var(--ink-3)] mt-0.5">{f.desc}</div>
                </div>
              ))}
            </div>

            <Dots />

            <Button variant="primary" icon="ArrowRight" onClick={goNext} className="w-full justify-center">
              {T("Empezar", "Get started")}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Step 1: Tu tanque ───────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen relative grid place-items-center p-4" data-screen-label="Onboarding">
        <Atmosphere />
        <div className="relative z-10 w-full max-w-[440px]">
          <Card className="p-7">
            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">
                {T("Paso 2 de 4", "Step 2 of 4")}
              </div>
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--ink)]">
                {T("Tu tanque", "Your tank")}
              </h2>
              <p className="text-[12.5px] text-[var(--ink-2)] mt-1">
                {T("Cuéntanos sobre tu acuario para personalizar AquaMind.", "Tell us about your aquarium to personalize AquaMind.")}
              </p>
            </div>

            <div className="space-y-3 mb-5">
              {/* Tank name */}
              <div>
                <label className="text-[11.5px] font-medium text-[var(--ink-2)] mb-1 block">
                  {T("Nombre del tanque", "Tank name")}
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[var(--accent-border)]"
                  style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}
                >
                  <L name="Waves" size={14} className="text-[var(--ink-3)] shrink-0" />
                  <input
                    type="text"
                    value={tankName}
                    onChange={(e) => setTankName(e.target.value)}
                    placeholder={T("ej. Arrecife 20G High Reef", "e.g. 20G High Reef")}
                    className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                  />
                </div>
              </div>

              {/* Tank type */}
              <div>
                <label className="text-[11.5px] font-medium text-[var(--ink-2)] mb-1 block">
                  {T("Tipo de acuario", "Tank type")}
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "saltwater", label: T("Marino / Reef", "Saltwater / Reef"), icon: "Waves" },
                    { id: "freshwater", label: T("Agua dulce", "Freshwater"), icon: "Droplet" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTankType(opt.id)}
                      className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition-all"
                      style={tankType === opt.id
                        ? { background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)" }
                        : { background: "var(--well)", border: "1px solid var(--hairline)", color: "var(--ink-2)" }}
                    >
                      <L name={opt.icon} size={14} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div>
                <label className="text-[11.5px] font-medium text-[var(--ink-2)] mb-1 block">
                  {T("Volumen display (galones)", "Display volume (gallons)")}
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[var(--accent-border)]"
                  style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}
                >
                  <L name="Container" size={14} className="text-[var(--ink-3)] shrink-0" />
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={tankVolume}
                    onChange={(e) => setTankVolume(e.target.value)}
                    placeholder={T("ej. 20", "e.g. 20")}
                    className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                  />
                  <span className="text-[11.5px] text-[var(--ink-3)]">gal</span>
                </div>
              </div>

              {/* Brand / model */}
              <div>
                <label className="text-[11.5px] font-medium text-[var(--ink-2)] mb-1 block">
                  {T("Marca / modelo", "Brand / model")}
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[var(--accent-border)]"
                  style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}
                >
                  <L name="Tag" size={14} className="text-[var(--ink-3)] shrink-0" />
                  <input
                    type="text"
                    value={tankBrand}
                    onChange={(e) => setTankBrand(e.target.value)}
                    placeholder={T("ej. Waterbox 20 Cube, Fluval Evo 13.5…", "e.g. Waterbox 20 Cube, Fluval Evo 13.5…")}
                    className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                  />
                </div>
              </div>
            </div>

            {/* Aqua Buddy tip */}
            <div
              className="rounded-2xl px-4 py-3 mb-6 text-[12px] text-[var(--ink-2)] leading-relaxed flex items-start gap-2.5"
              style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)" }}
            >
              <L name="Sparkles" size={14} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
              <span>
                {T(
                  "Aqua Buddy puede buscar las dimensiones y parámetros ideales para tu modelo de tanque automáticamente.",
                  "Aqua Buddy puede buscar las dimensiones y parámetros ideales para tu modelo de tanque automáticamente."
                )}
              </span>
            </div>

            <Dots />

            <div className="flex gap-2">
              <Button variant="ghost" icon="ArrowLeft" onClick={goPrev}>
                {T("Atrás", "Back")}
              </Button>
              <Button variant="primary" icon="ArrowRight" onClick={completeTankStep} className="flex-1 justify-center">
                {T("Continuar", "Continue")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Step 2: Habitantes iniciales ────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen relative grid place-items-center p-4" data-screen-label="Onboarding">
        <Atmosphere />
        <div className="relative z-10 w-full max-w-[440px]">
          <Card className="p-7">
            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mb-1">
                {T("Paso 3 de 4 · Opcional", "Step 3 of 4 · Optional")}
              </div>
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--ink)]">
                {T("Habitantes iniciales", "Initial livestock")}
              </h2>
              <p className="text-[12.5px] text-[var(--ink-2)] mt-1">
                {T(
                  "Agrega hasta 3 peces o corales para comenzar. Puedes agregar más después con Aqua Buddy.",
                  "Add up to 3 fish or corals to get started. You can add more later with Aqua Buddy."
                )}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {inhabitants.map((inh, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  {/* Kind selector */}
                  <select
                    value={inh.kind}
                    onChange={(e) => {
                      const updated = [...inhabitants];
                      updated[idx] = { ...updated[idx], kind: e.target.value };
                      setInhabitants(updated);
                    }}
                    className="rounded-xl px-2.5 py-2 text-[12px] text-[var(--ink)] border-0 outline-none focus:ring-1 focus:ring-[var(--accent-border)]"
                    style={{ background: "var(--well)", border: "1px solid var(--hairline)", minWidth: 80 }}
                  >
                    <option value="fish">{T("Pez", "Fish")}</option>
                    <option value="coral">{T("Coral", "Coral")}</option>
                    <option value="cuc">CUC</option>
                  </select>
                  {/* Name input */}
                  <div
                    className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[var(--accent-border)]"
                    style={{ background: "var(--well)", border: "1px solid var(--hairline)" }}
                  >
                    <L
                      name={inh.kind === "coral" ? "Flower2" : inh.kind === "cuc" ? "Bug" : "Fish"}
                      size={13}
                      className="text-[var(--ink-3)] shrink-0"
                    />
                    <input
                      type="text"
                      value={inh.name}
                      onChange={(e) => {
                        const updated = [...inhabitants];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setInhabitants(updated);
                      }}
                      placeholder={
                        idx === 0
                          ? T("ej. Pez payaso", "e.g. Clownfish")
                          : idx === 1
                          ? T("ej. Euphyllia hammer", "e.g. Hammer coral")
                          : T("ej. Gramma loreto", "e.g. Royal gramma")
                      }
                      className="flex-1 bg-transparent border-0 outline-none text-[12.5px] text-[var(--ink)] placeholder:text-[var(--ink-3)]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Dots />

            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" icon="ArrowLeft" onClick={goPrev}>
                {T("Atrás", "Back")}
              </Button>
              <Button variant="ghost" onClick={goNext} className="flex-1 justify-center">
                {T("Saltar por ahora", "Skip for now")}
              </Button>
              <Button variant="primary" icon="Check" onClick={completeInhabitantsStep}>
                {T("Agregar", "Add")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Step 3: Listo ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative grid place-items-center p-4" data-screen-label="Onboarding">
      <Atmosphere />
      <div className="relative z-10 w-full max-w-[440px]">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div
              className="mx-auto w-20 h-20 rounded-3xl grid place-items-center mb-5 shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-strong))" }}
            >
              <L name="CheckCircle2" size={36} style={{ color: "white" }} />
            </div>
            <h2 className="text-[24px] font-semibold tracking-tight text-[var(--ink)] mb-3">
              {T("¡Listo!", "All set!")}
            </h2>
            <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">
              {T(
                "Tu AquaMind está configurado. Puedes usar Aqua Buddy para agregar más datos cuando quieras.",
                "Tu AquaMind está configurado. Puedes usar Aqua Buddy para agregar más datos cuando quieras."
              )}
            </p>
          </div>

          <div className="space-y-2 mb-8">
            {[
              { icon: "Activity", label: T("Parámetros listos para registrar", "Parameters ready to log") },
              { icon: "Fish", label: T("Habitantes agregados al inventario", "Livestock added to inventory") },
              { icon: "Sparkles", label: T("Aqua Buddy disponible en el dashboard", "Aqua Buddy available on the dashboard") },
            ].map((item) => (
              <div key={item.icon} className="flex items-center gap-3 text-[12.5px] text-[var(--ink-2)]">
                <div
                  className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
                  style={{ background: "rgba(16,185,129,0.13)", border: "1px solid rgba(16,185,129,0.3)" }}
                >
                  <L name={item.icon} size={13} style={{ color: "#0E9F6E" }} />
                </div>
                {item.label}
              </div>
            ))}
          </div>

          <Dots />

          <Button variant="primary" icon="ArrowRight" onClick={finish} className="w-full justify-center text-[14px] py-3">
            {T("Ir al Dashboard", "Go to Dashboard")}
          </Button>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { OnboardingFlow });
