var cache_name = 'scouting-v0.1';
var urlsToCache = [
    '.',
    './create_account.html',
    './evaluation.html',
    './index.html',
    './login.html',
    './reports.html',
    './user.html',

    './manifest.json',

    './css/style.css',

    './images/icons/icon-72x72.png',
    './images/icons/icon-96x96.png',
    './images/icons/icon-128x128.png',
    './images/icons/icon-144x144.png',
    './images/icons/icon-152x152.png',
    './images/icons/icon-192x192.png',
    './images/icons/icon-384x384.png',
    './images/icons/icon-512x512.png',
    
    './js/create_account.js',
    './js/evaluation.js',
    './js/login.js',
    './js/main.js',
    './js/reports.js',
    './js/user.js',
    
    './font-awesome/css/font-awesome.min.css',
    './font-awesome/fonts/fontawesome-webfont.eot',
    './font-awesome/fonts/fontawesome-webfont.svg',
    './font-awesome/fonts/fontawesome-webfont.ttf',
    './font-awesome/fonts/fontawesome-webfont.woff',
    './font-awesome/fonts/fontawesome-webfont.woff2',
    './font-awesome/fonts/FontAwesome.otf'
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