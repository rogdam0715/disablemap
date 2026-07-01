// 기린마을 PWA 서비스 워커
// 지금은 최소 등록만 (Android Chrome이 PWA로 인식하려면 fetch 핸들러가 있어야 함)
// 나중에 오프라인 지원을 원하면 여기에 캐시 전략 추가 가능

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', () => { /* pass-through */ });
