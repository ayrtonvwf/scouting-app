var cache_name = 'scouting-v0.12';
var urlsToCache = [
    // html pages
    '.',
    './create_account.html',
    './evaluation.html',
    './index.html',
    './login.html',
    './reports.html',
    './user.html',

    // browser config manifest
    './manifest.json',
    './browserconfig.xml',

    // layout css
    './css/style.css',
    './css/custom.css',

    // icons
    './favicon.ico',
    './images/icons/icon-16x16.png',
    './images/icons/icon-32x32.png',
    './images/icons/icon-36x36.png',
    './images/icons/icon-48x48.png',
    './images/icons/icon-57x57.png',
    './images/icons/icon-60x60.png',
    './images/icons/icon-70x70.png',
    './images/icons/icon-72x72.png',
    './images/icons/icon-76x76.png',
    './images/icons/icon-96x96.png',
    './images/icons/icon-114x114.png',
    './images/icons/icon-120x120.png',
    './images/icons/icon-128x128.png',
    './images/icons/icon-144x144.png',
    './images/icons/icon-150x150.png',
    './images/icons/icon-152x152.png',
    './images/icons/icon-180x180.png',
    './images/icons/icon-192x192.png',
    './images/icons/icon-310x310.png',
    './images/icons/icon-384x384.png',
    './images/icons/icon-512x512.png',
    
    // js
    './js/create_account.js',
    './js/evaluation.js',
    './js/login.js',
    './js/main.js',
    './js/reports.js',
    './js/tablesort.min.js',
    './js/tablesort.number.min.js',
    './js/user.js',
    './js/vue.js',
    
    // fontawesome
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