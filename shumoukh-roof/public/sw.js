// خدمة عامل التخزين (Service Worker) لشموخ — تتيح التثبيت والعمل بلا إنترنت.
// الاستراتيجية:
//  • التنقّل (صفحات HTML): الشبكة أولاً ثم السقوط إلى قشرة التطبيق المخبّأة.
//  • الأصول الثابتة (JS/CSS/خطوط/صور من نفس الأصل): المخبأ أولاً مع تحديث صامت.
//  • لا نلمس طلبات Firebase/Firestore/التخزين إطلاقاً (تُدار بمخبأ Firestore نفسه).
const VERSION = "shamikh-v1";
const APP_SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const SHELL_URL = "/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(["/", SHELL_URL, "/manifest.json"])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// لا نتدخّل في نطاقات الشبكة الخارجية (Firebase/Google/تحليلات…)
function isBypassed(url) {
  return (
    url.origin !== self.location.origin ||
    /firestore|googleapis|gstatic|firebaseio|identitytoolkit|google\.com/.test(url.hostname + url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (isBypassed(url)) return;

  // التنقّل: شبكة أولاً، ثم القشرة المخبّأة عند انقطاع الإنترنت
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(APP_SHELL).then((c) => c.put(SHELL_URL, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(SHELL_URL).then((r) => r || caches.match("/")))
    );
    return;
  }

  // الأصول الثابتة: مخبأ أولاً، وإلا الشبكة مع تخزين النسخة
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(ASSETS).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached)
    )
  );
});
