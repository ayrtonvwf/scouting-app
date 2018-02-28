var cache_name = 'scouting-cache';
var urlsToCache = [
    '/',
    '/evaluation.html',
    '/index.html',
    '/login.html',
    '/reports.html',
    '/user.html',

    '/css/style.css',
    
    '/js/create_account.js',
    '/js/evaluation.js',
    '/js/login.js',
    '/js/main.js',
    '/js/reports.js',
    '/js/user.js',
    
    '/font-awesome/css/font-awesome.min.css',
    '/font-awesome/fonts/fontawesome-webfont.eot',
    '/font-awesome/fonts/fontawesome-webfont.svg',
    '/font-awesome/fonts/fontawesome-webfont.ttf',
    '/font-awesome/fonts/fontawesome-webfont.woff',
    '/font-awesome/fonts/fontawesome-webfont.woff2',
    '/font-awesome/fonts/FontAwesome.otf'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(cache_name).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});