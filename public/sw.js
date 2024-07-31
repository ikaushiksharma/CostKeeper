if (!self.define) {
    let e,
        s = {}
    const a = (a, n) => (
        (a = new URL(a + '.js', n).href),
        s[a] ||
            new Promise((s) => {
                if ('document' in self) {
                    const e = document.createElement('script')
                    ;(e.src = a), (e.onload = s), document.head.appendChild(e)
                } else (e = a), importScripts(a), s()
            }).then(() => {
                let e = s[a]
                if (!e)
                    throw new Error(`Module ${a} didn’t register its module`)
                return e
            })
    )
    self.define = (n, i) => {
        const t =
            e ||
            ('document' in self ? document.currentScript.src : '') ||
            location.href
        if (s[t]) return
        let c = {}
        const r = (e) => a(e, t),
            d = { module: { uri: t }, exports: c, require: r }
        s[t] = Promise.all(n.map((e) => d[e] || r(e))).then((e) => (i(...e), c))
    }
}
define(['./workbox-f1770938'], function (e) {
    'use strict'
    importScripts('/fallback-ce627215c0e4a9af.js'),
        self.skipWaiting(),
        e.clientsClaim(),
        e.precacheAndRoute(
            [
                {
                    url: '/_next/static/chunks/123-21a7d9c824d8a03d.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/173-12e456140eca7ab9.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/190-4fbeba8f277de24b.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/28-a8990c307957e870.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/314-69f6c01bcb22485d.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/315-7049354c7dbfdf7d.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/334-40871403d7a1df7f.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/470-120e6502e22bb7de.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/513-83b17658cbec6275.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/53c13509-2b3563f3ad8b0898.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/546-f62dde2442b54249.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/56-4b11d84d697de7ae.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/714-a8087cd6a583b1c8.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/834-218478067b51d252.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/8e1d74a4-7fd81b18fd334758.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/925-77712547dd996e97.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/962-b5cd9d1821e6e1e4.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/972-836c9d22a6572c54.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/(auth)/sign-in/%5B%5B...sign-in%5D%5D/page-be5bf065e191b3c6.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/(auth)/sign-up/%5B%5B...sign-up%5D%5D/page-c715783cee669706.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/(dashboard)/accounts/page-47b5ad9c66294783.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/(dashboard)/categories/page-6933703ec323ec3f.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/(dashboard)/layout-061196c74ff8dd46.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/(dashboard)/page-728894cdb8822f80.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/(dashboard)/transactions/page-ef9414595e729e6a.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/_not-found/page-d9e7ed0d5c5ace76.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/layout-2dd14d9640f1f8bc.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/app/offline/page-12d11d3bff3b0b24.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/fd9d1056-155e55d286c70fa8.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/framework-00a8ba1a63cfdc9e.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/main-97161f3110e21754.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/main-app-6961bf9f108259f1.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/pages/_app-037b5d058bd9a820.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/pages/_error-6ae619510b1539d6.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js',
                    revision: '79330112775102f91e1010318bae2bd3',
                },
                {
                    url: '/_next/static/chunks/webpack-cda3724fe3b2066d.js',
                    revision: 'lEwmPGa-a1QB2gIk0OvNw',
                },
                {
                    url: '/_next/static/css/a2c9189ca33bdc86.css',
                    revision: 'a2c9189ca33bdc86',
                },
                {
                    url: '/_next/static/lEwmPGa-a1QB2gIk0OvNw/_buildManifest.js',
                    revision: 'a0ae24e7f29dd3809ab75b5dd91a79dc',
                },
                {
                    url: '/_next/static/lEwmPGa-a1QB2gIk0OvNw/_ssgManifest.js',
                    revision: 'b6652df95db52feb4daf4eca35380933',
                },
                {
                    url: '/_next/static/media/26a46d62cd723877-s.woff2',
                    revision: 'befd9c0fdfa3d8a645d5f95717ed6420',
                },
                {
                    url: '/_next/static/media/55c55f0601d81cf3-s.woff2',
                    revision: '43828e14271c77b87e3ed582dbff9f74',
                },
                {
                    url: '/_next/static/media/581909926a08bbc8-s.woff2',
                    revision: 'f0b86e7c24f455280b8df606b89af891',
                },
                {
                    url: '/_next/static/media/6d93bde91c0c2823-s.woff2',
                    revision: '621a07228c8ccbfd647918f1021b4868',
                },
                {
                    url: '/_next/static/media/97e0cb1ae144a2a9-s.woff2',
                    revision: 'e360c61c5bd8d90639fd4503c829c2dc',
                },
                {
                    url: '/_next/static/media/a34f9d1faa5f3315-s.p.woff2',
                    revision: 'd4fe31e6a2aebc06b8d6e558c9141119',
                },
                {
                    url: '/_next/static/media/df0a9ae256c0569c-s.woff2',
                    revision: 'd54db44de5ccb18886ece2fda72bdfe0',
                },
                {
                    url: '/fallback-ce627215c0e4a9af.js',
                    revision: 'a5281aa1504c5d6bcd7ba1097870376a',
                },
                {
                    url: '/github.svg',
                    revision: '8dcc6b5262f3b6138b1566b357ba89a9',
                },
                {
                    url: '/icon-192.png',
                    revision: 'afb1de96a6f83b986b6c6be4d32f4b40',
                },
                {
                    url: '/icon-256.png',
                    revision: '072cbd51538445086dff2e303507b0e6',
                },
                {
                    url: '/icon-512.png',
                    revision: '8ceee1f5c83b16e657fe17b547de5701',
                },
                {
                    url: '/logo.svg',
                    revision: '923211978690414430876a373af11697',
                },
                {
                    url: '/manifest.json',
                    revision: '7022e818a5a9a71e28c7fdca0d367663',
                },
                { url: '/offline', revision: 'lEwmPGa-a1QB2gIk0OvNw' },
                {
                    url: '/swe-worker-5c72df51bb1f6ee0.js',
                    revision: '5a47d90db13bb1309b25bdf7b363570e',
                },
            ],
            { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] }
        ),
        e.cleanupOutdatedCaches(),
        e.registerRoute(
            '/',
            new e.NetworkFirst({
                cacheName: 'start-url',
                plugins: [
                    {
                        cacheWillUpdate: async ({ response: e }) =>
                            e && 'opaqueredirect' === e.type
                                ? new Response(e.body, {
                                      status: 200,
                                      statusText: 'OK',
                                      headers: e.headers,
                                  })
                                : e,
                    },
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
            new e.CacheFirst({
                cacheName: 'google-fonts-webfonts',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 4,
                        maxAgeSeconds: 31536e3,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
            new e.StaleWhileRevalidate({
                cacheName: 'google-fonts-stylesheets',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 4,
                        maxAgeSeconds: 604800,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
            new e.StaleWhileRevalidate({
                cacheName: 'static-font-assets',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 4,
                        maxAgeSeconds: 604800,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
            new e.StaleWhileRevalidate({
                cacheName: 'static-image-assets',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 64,
                        maxAgeSeconds: 2592e3,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\/_next\/static.+\.js$/i,
            new e.CacheFirst({
                cacheName: 'next-static-js-assets',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 64,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\/_next\/image\?url=.+$/i,
            new e.StaleWhileRevalidate({
                cacheName: 'next-image',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 64,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\.(?:mp3|wav|ogg)$/i,
            new e.CacheFirst({
                cacheName: 'static-audio-assets',
                plugins: [
                    new e.RangeRequestsPlugin(),
                    new e.ExpirationPlugin({
                        maxEntries: 32,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\.(?:mp4|webm)$/i,
            new e.CacheFirst({
                cacheName: 'static-video-assets',
                plugins: [
                    new e.RangeRequestsPlugin(),
                    new e.ExpirationPlugin({
                        maxEntries: 32,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\.(?:js)$/i,
            new e.StaleWhileRevalidate({
                cacheName: 'static-js-assets',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 48,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\.(?:css|less)$/i,
            new e.StaleWhileRevalidate({
                cacheName: 'static-style-assets',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 32,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\/_next\/data\/.+\/.+\.json$/i,
            new e.StaleWhileRevalidate({
                cacheName: 'next-data',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 32,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            /\.(?:json|xml|csv)$/i,
            new e.NetworkFirst({
                cacheName: 'static-data-assets',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 32,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            ({ sameOrigin: e, url: { pathname: s } }) =>
                !(
                    !e ||
                    s.startsWith('/api/auth/callback') ||
                    !s.startsWith('/api/')
                ),
            new e.NetworkFirst({
                cacheName: 'apis',
                networkTimeoutSeconds: 10,
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 16,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            ({ request: e, url: { pathname: s }, sameOrigin: a }) =>
                '1' === e.headers.get('RSC') &&
                '1' === e.headers.get('Next-Router-Prefetch') &&
                a &&
                !s.startsWith('/api/'),
            new e.NetworkFirst({
                cacheName: 'pages-rsc-prefetch',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 32,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            ({ request: e, url: { pathname: s }, sameOrigin: a }) =>
                '1' === e.headers.get('RSC') && a && !s.startsWith('/api/'),
            new e.NetworkFirst({
                cacheName: 'pages-rsc',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 32,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            ({ url: { pathname: e }, sameOrigin: s }) =>
                s && !e.startsWith('/api/'),
            new e.NetworkFirst({
                cacheName: 'pages',
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 32,
                        maxAgeSeconds: 86400,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        e.registerRoute(
            ({ sameOrigin: e }) => !e,
            new e.NetworkFirst({
                cacheName: 'cross-origin',
                networkTimeoutSeconds: 10,
                plugins: [
                    new e.ExpirationPlugin({
                        maxEntries: 32,
                        maxAgeSeconds: 3600,
                    }),
                    {
                        handlerDidError: async ({ request: e }) =>
                            'undefined' != typeof self
                                ? self.fallback(e)
                                : Response.error(),
                    },
                ],
            }),
            'GET'
        ),
        (self.__WB_DISABLE_DEV_LOGS = !0)
})
