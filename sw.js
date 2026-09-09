// sw.js — service worker de AquaMind.
// Objetivo: que la app abra sin internet. Toda la app vive en index.html, así
// que basta con cachear ese archivo (y los iconos) para tener offline completo.
//
// Estrategia: network-first para el documento. Así una versión nueva siempre
// gana cuando hay red, y el caché solo entra cuando no la hay — sin el clásico
// problema de quedarse servido una versión vieja para siempre.

const CACHE = "aquamind-v1";
const CORE = ["./index.html", "./manifest.webmanifest", "./icon-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // No tocar la API de Supabase ni la de Groq: sus respuestas nunca se cachean.
  if (url.origin !== self.location.origin) return;

  const isDoc = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");

  if (isDoc) {
    // Network-first: red si hay, caché si no.
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match(req)))
    );
    return;
  }

  // Resto de archivos propios (iconos, manifest): caché primero, red de reserva.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
