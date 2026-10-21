/* Akouè — Service Worker PWA : app installable + fonctionne hors ligne */
const CACHE = "akoue-v2";
const CORE = ["/", "/manifest.webmanifest", "/images/icon-192.png", "/images/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("akoue-") && key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // API Supabase : jamais cachée
  if (/^\/(auth|rest|storage|functions|realtime)\//.test(url.pathname)) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }
  if (url.search || !/^\/(images|assets|_expo\/static)\//.test(url.pathname)) return;
  event.respondWith(
    fetch(request).then((response) => {
      if (!response.ok || response.type !== "basic") return response;
      return caches.open(CACHE).then((cache) =>
        cache.put(request, response.clone()).catch((error) => {
          console.warn("[pwa] Cache hors ligne indisponible :", error);
        }).then(() => response)
      );
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      return Response.error();
    })
  );
});
