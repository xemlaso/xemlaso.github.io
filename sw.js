// sw.js – Service worker cho PWA "Vận mệnh" (đặt ở THƯ MỤC GỐC của web, cạnh index.html)
// Chiến lược "lấy từ mạng trước":
//   • Có mạng  → luôn tải file mới nhất từ GitHub Pages (cập nhật hiện ngay, không cần ?v=), đồng thời lưu bản sao.
//   • Mất mạng → dùng bản đã lưu, nên app vẫn mở và lập lá số được.
// Chỉ xử lý file của chính web; Firebase, Google, CDN… đi thẳng ra mạng như bình thường.
const CACHE = 'vanmenh-v1';            // đổi tên khi muốn xóa sạch bản lưu cũ trên máy người dùng

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add('./')).catch(() => {}));
  self.skipWaiting();                  // bản sw mới dùng ngay, không chờ đóng hết tab
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                                  // POST… đi thẳng
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                   // Firebase, CDN… đi thẳng

  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });          // hỏi lại máy chủ, có bản mới thì lấy
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {                                                  // mất mạng
      const hit = await caches.match(req, { ignoreSearch: true });   // bỏ qua ?v=… khi tìm bản lưu
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const home = await caches.match('./');
        if (home) return home;
      }
      throw err;
    }
  })());
});
