// cloud.js — inicio de sesión REAL con Google + datos en la nube (Firestore).
// Funciona con el plan gratuito de Firebase (Spark): sin tarjeta, sin costo.
//
// ════════════ CÓMO ACTIVARLO (5 minutos, gratis) ════════════
// 1. Entra a https://console.firebase.google.com → "Agregar proyecto"
//    (nombre: aquasense; desactiva Analytics).
// 2. Menú Compilación → Authentication → Comenzar → pestaña "Método de
//    acceso" → Google → Habilitar → Guardar.
// 3. Menú Compilación → Firestore Database → Crear base de datos →
//    modo producción → en la pestaña "Reglas" pega y publica:
//
//      rules_version = '2';
//      service cloud.firestore {
//        match /databases/{database}/documents {
//          match /users/{uid}/{document=**} {
//            allow read, write: if request.auth != null && request.auth.uid == uid;
//          }
//        }
//      }
//
// 4. ⚙ Configuración del proyecto → "Tus apps" → icono Web </> →
//    registra la app → copia el objeto firebaseConfig.
// 5. Pégalo abajo reemplazando `null`. Ejemplo:
//      const FIREBASE_CONFIG = { apiKey: "AIza…", authDomain: "aquasense-xxx.firebaseapp.com",
//        projectId: "aquasense-xxx", storageBucket: "…", messagingSenderId: "…", appId: "…" };
// 6. En Authentication → Settings → Dominios autorizados, añade el dominio
//    donde publicaste la app (p. ej. aquasense.netlify.app).
// ═════════════════════════════════════════════════════════════
const FIREBASE_CONFIG = null;

window.CLOUD = (() => {
  const SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
  let auth = null, db = null, user = null, unsubscribe = null;

  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

  async function init() {
    if (!FIREBASE_CONFIG) return "local";
    try {
      await loadScript(SDK + "firebase-app-compat.js");
      await Promise.all([
        loadScript(SDK + "firebase-auth-compat.js"),
        loadScript(SDK + "firebase-firestore-compat.js"),
      ]);
      firebase.initializeApp(FIREBASE_CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();
      auth.onAuthStateChanged((u) => {
        user = u;
        window.dispatchEvent(new CustomEvent("aqua:auth", {
          detail: u ? { name: u.displayName || u.email, email: u.email, uid: u.uid, photo: u.photoURL, provider: "google-cloud" } : null,
        }));
        if (u) startSync(u.uid); else stopSync();
      });
      return "cloud";
    } catch (e) {
      return "local"; // sin red o SDK bloqueado → la app sigue en modo local
    }
  }
  const ready = init();

  const docRef = (uid) => db.collection("users").doc(uid).collection("tanks").doc("tank-001");

  function startSync(uid) {
    stopSync();
    unsubscribe = docRef(uid).onSnapshot(
      (snap) => {
        const d = snap.data();
        // ignora ecos de nuestras propias escrituras pendientes
        if (d && !snap.metadata.hasPendingWrites) window.AquaStore?.applyRemote(d);
      },
      () => {}
    );
    push(window.AquaStore?.ud); // sube el estado local más reciente al conectar
  }
  function stopSync() { if (unsubscribe) { unsubscribe(); unsubscribe = null; } }

  async function push(ud) {
    if (!user || !db || !ud) return;
    try { await docRef(user.uid).set(JSON.parse(JSON.stringify(ud))); } catch (e) { /* offline: localStorage ya lo tiene */ }
  }

  async function signInGoogle() {
    await ready;
    if (!auth) throw new Error("cloud-not-configured");
    const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    return result.user;
  }

  async function signOut() {
    stopSync();
    try { await auth?.signOut(); } catch (e) {}
  }

  return {
    get isConfigured() { return !!FIREBASE_CONFIG; },
    get user() { return user; },
    ready,
    signInGoogle,
    signOut,
    push,
  };
})();
