// Service worker: ทำให้หน้าเว็บเปิดเร็วขึ้นและติดตั้งเป็นแอปได้
// - หน้าเว็บของเราเอง: โหลดจากเน็ตก่อนเสมอ (ได้เวอร์ชันล่าสุด) ถ้าไม่มีเน็ตจึงใช้สำเนา
// - ฟอนต์/ไอคอนจาก CDN: ใช้สำเนาก่อน (ไม่ค่อยเปลี่ยน)
// - การเรียก API (POST ไป script.google.com) ไม่ผ่านแคชเลย
const CACHE = 'qd-v2-1';
const SHELL = ['./', './index.html', './v2.html', './manifest.webmanifest', './icon-192.png'];
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com', 'lh3.googleusercontent.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./')))
    );
    return;
  }

  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
