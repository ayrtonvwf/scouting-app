var cache_name = 'scouting-cache';
var urlsToCache = [
    '/',
    'about.html',
    'evaluation.html',
    'index.html',
    'login.html',
    'reports.html',
    'team.html',
    'user.html',
    'css/style.css',
    'js/login.js',
    'js/main.js',
    'js/user.js',
    'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
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