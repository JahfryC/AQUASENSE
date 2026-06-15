// cloud.js — Supabase integration (auth + cloud sync)
// Free tier: 500 MB DB, 50k monthly active users, unlimited auth
//
// ════════════ SETUP (5 minutes, gratis) ════════════
// 1. Ve a https://supabase.com → New project (elige región cerca tuya)
// 2. En el SQL Editor pega y ejecuta el schema de abajo.
// 3. Authentication → Providers → Google → habilita y añade
//    Client ID/Secret desde console.cloud.google.com (OAuth 2.0).
// 4. Settings → API → copia "Project URL" y "anon public key".
// 5. En AquaMind → Ajustes → Integraciones pega esos valores.
//
// SCHEMA SQL (ejecutar en Supabase SQL Editor):
//   create extension if not exists "uuid-ossp";
//   create table if not exists aquamind_data (
//     id uuid default uuid_generate_v4() primary key,
//     user_id uuid references auth.users(id) on delete cascade not null unique,
//     data jsonb not null default '{}',
//     updated_at timestamptz default now() not null
//   );
//   alter table aquamind_data enable row level security;
//   create policy "own data" on aquamind_data for all using (auth.uid() = user_id);
// ═════════════════════════════════════════════════

window.CLOUD = (() => {
  const CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  let client = null, user = null, realtimeChannel = null;

  function getConfig() {
    return {
      url: localStorage.getItem("aqua:supabase_url") || "",
      key: localStorage.getItem("aqua:supabase_key") || "",
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
    // Pull latest from cloud
    try {
      const { data } = await client
        .from("aquamind_data")
        .select("data")
        .eq("user_id", uid)
        .single();
      if (data?.data) window.AquaStore?.applyRemote(data.data);
    } catch (_) {}

    // Real-time subscription for changes from other devices
    realtimeChannel = client
      .channel("aquamind_data_changes")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "aquamind_data",
        filter: `user_id=eq.${uid}`,
      }, (payload) => {
        if (payload.new?.data) window.AquaStore?.applyRemote(payload.new.data);
      })
      .subscribe();
  }

  function stopSync() {
    if (realtimeChannel && client) {
      client.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }

  async function push(ud) {
    if (!client || !user || !ud) return;
    try {
      await client
        .from("aquamind_data")
        .upsert(
          { user_id: user.id, data: JSON.parse(JSON.stringify(ud)), updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
    } catch (_) { /* offline — localStorage already saved it */ }
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
    return data.user;
  }

  async function resetPassword(email) {
    if (!client) throw new Error("cloud-not-configured");
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href,
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
    try { await client?.auth.signOut(); } catch (_) {}
    user = null;
    window.dispatchEvent(new CustomEvent("aqua:auth", { detail: null }));
  }

  const ready = init();

  return {
    get isConfigured() {
      const { url, key } = getConfig();
      return !!(url && key);
    },
    get user() { return user; },
    ready,
    signInWithEmail,
    signUp,
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
