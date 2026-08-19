// Service Worker da Brit's Confeitaria
// Guarda em cache só as imagens (mais pesadas), pra abrir mais rápido depois da primeira visita.
// HTML/CSS/JS NÃO ficam em cache de propósito, pra você nunca ficar preso numa versão antiga
// depois que eu (ou você) atualizar o site.

const CACHE_NAME = 'brits-confeitaria-imagens-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(nomes =>
            Promise.all(
                nomes.filter(nome => nome !== CACHE_NAME).map(nome => caches.delete(nome))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    const ehImagem = /\.(png|jpe?g|webp|svg|gif)$/i.test(url);

    if (!ehImagem) {
        return; // deixa passar direto pra rede (HTML/CSS/JS sempre atualizados)
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(event.request).then(respostaCache => {
                if (respostaCache) return respostaCache;
                return fetch(event.request).then(respostaRede => {
                    cache.put(event.request, respostaRede.clone());
                    return respostaRede;
                }).catch(() => respostaCache);
            })
        )
    );
});
