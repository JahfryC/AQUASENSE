// cloud.js — Supabase integration (auth + cloud sync)
// Project: zsvqyhzzavmlqxxoaezc

// Default credentials — override in Settings → Account if needed
const SUPABASE_DEFAULT_URL = "https://zsvqyhzzavmlqxxoaezc.supabase.co";
const SUPABASE_DEFAULT_KEY = "sb_publishable_3mJ5rNElrWZXcfAIBWZyYA_cparoje8";

window.CLOUD = (() => {
  const CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  let client = null, user = null, realtimeChannel = null;

  function getConfig() {
    return {
      url: localStorage.getItem("aqua:supabase_url") || SUPABASE_DEFAULT_URL,
      key: localStorage.getItem("aqua:supabase_key") || SUPABASE_DEFAULT_KEY,
    };
  }

  const loadScript = (src) => new Promise((res, rej) => {
    if (window.supabase) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

  async function init() {
    const { url, key } = getConfig();
    if (!url || !key) return "local";
    try {
      await loadScript(CDN);
      client = window.supabase.createClient(url, key);

      // Restore existing session (handles OAuth redirect return)
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) handleUser(session.user);

      client.auth.onAuthStateChange((_event, session) => {
        if (_event === "PASSWORD_RECOVERY") {
          // User arrived from a reset-password email link — surface the
          // "set new password" flow even if React mounted before this fires.
          window.__aquaRecovery = true;
          window.dispatchEvent(new CustomEvent("aqua:recovery"));
        }
        handleUser(session?.user || null);
      });

      return "cloud";
    } catch (e) {
      console.warn("[AquaMind] Supabase init failed:", e);
      return "local";
    }
  }

  function handleUser(u) {
    user = u;
    window.dispatchEvent(new CustomEvent("aqua:auth", {
      detail: u ? {
        name: u.user_metadata?.full_name || u.email,
        email: u.email,
        uid: u.id,
        photo: u.user_metadata?.avatar_url,
        provider: "supabase-google",
      } : null,
    }));
    if (u) startSync(u.id);
    else stopSync();
  }

  async function startSync(uid) {
    stopSync();
    // Los datos locales pueden ser de otra cuenta (o de una sesión de invitado).
    // bindUser los descarta antes de leer o escribir nada en la nube.
    const wiped = window.AquaStore?.bindUser?.(uid);
    if (wiped) { location.reload(); return; }
    // Pull latest from cloud
    try {
      const { data } = await client
        .from("aquamind_data")
        .select("data")
        .eq("user_id", uid)
        .single();
      if (data?.data) window.AquaStore?.applyRemote(data.data, uid);
      syncState("ok");
    } catch (_) { syncState("error"); }

    // Real-time subscription for changes from other devices.
    // "*" cubre INSERT además de UPDATE: la primera vez que un dispositivo
    // guarda, es un INSERT y con "UPDATE" nunca llegaba.
    realtimeChannel = client
      .channel("aquamind_data_changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "aquamind_data",
        filter: `user_id=eq.${uid}`,
      }, (payload) => {
        if (payload.new?.data) window.AquaStore?.applyRemote(payload.new.data, uid);
      })
      .subscribe();
  }

  function stopSync() {
    if (realtimeChannel && client) {
      client.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }

  // ---- estado de sincronización (para que la UI no mienta) ----
  // "off" sin cuenta · "syncing" subiendo · "ok" al día · "error" pendiente
  let sync = { state: "off", lastOk: null, pending: false };
  function syncState(state) {
    sync = { ...sync, state, ...(state === "ok" ? { lastOk: Date.now(), pending: false } : {}) };
    window.dispatchEvent(new CustomEvent("aqua:sync", { detail: { ...sync } }));
  }

  let pushTimer = null, retryDelay = 2000;
  async function push(ud) {
    if (!client || !user || !ud) return;
    // Nunca subir datos de otra cuenta a esta cuenta
    if (ud.ownerUid && ud.ownerUid !== user.id) return;
    if (!ud.ownerUid) ud.ownerUid = user.id;
    syncState("syncing");
    try {
      const { error } = await client
        .from("aquamind_data")
        .upsert(
          { user_id: user.id, data: JSON.parse(JSON.stringify(ud)), updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      retryDelay = 2000;
      syncState("ok");
    } catch (e) {
      // Sin conexión / proyecto pausado: reintentar con backoff en vez de
      // perder el cambio en silencio (localStorage ya lo tiene).
      sync.pending = true;
      syncState("error");
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => {
        retryDelay = Math.min(retryDelay * 2, 60000);
        push(window.AquaStore?.ud);
      }, retryDelay);
    }
  }

  async function signInWithEmail(email, password) {
    if (!client) throw new Error("cloud-not-configured");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }

  async function signUp(email, password) {
    if (!client) throw new Error("cloud-not-configured");
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    // data.session is null when email confirmation is required
    return { user: data.user, session: data.session };
  }

  async function updatePassword(newPassword) {
    if (!client) throw new Error("cloud-not-configured");
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function resetPassword(email) {
    if (!client) throw new Error("cloud-not-configured");
    const { error } = await client.auth.resetPasswordForEmail(email, {
      // Clean URL (no query/hash) so the recovery token in the hash survives
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) throw error;
  }

  async function signInGoogle() {
    if (!client) throw new Error("cloud-not-configured");
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
    if (error) throw error;
  }

  async function signOut() {
    stopSync();
    clearTimeout(pushTimer);
    try { await client?.auth.signOut(); } catch (_) {}
    user = null;
    syncState("off");
    window.dispatchEvent(new CustomEvent("aqua:auth", { detail: null }));
  }

  const ready = init();

  return {
    get isConfigured() { return true; },
    get user() { return user; },
    get syncStatus() { return { ...sync }; },
    ready,
    signInWithEmail,
    signUp,
    updatePassword,
    resetPassword,
    signInGoogle,
    signOut,
    push,
    setConfig(url, key) {
      localStorage.setItem("aqua:supabase_url", url.trim());
      localStorage.setItem("aqua:supabase_key", key.trim());
    },
  };
})();
