var app_url = 'http://localhost:8000';
var api_url = 'http://localhost/scouting';
var api_headers = new Headers({'Accept': 'application/json'});

window.onload = function () {
    if (isOnLoginPage()) {
        return;
    }

    requestLogin();
    getCurrentUser().then(function(user) {
        var elements = document.getElementsByClassName('fill-user_name');
        for (i = 0; i < elements.length; i++) {
            elements[i].innerHTML = user.name;
        }
    });
}

function getCurrentUser() {
    var user_id = localStorage.getItem('user_id');
    var url = 'user?id='+user_id;
    return api_request(url, 'GET', {user_id: user_id}).then(function(response) {
        return response.json();
    }).then(function(response) {
        return response.result[0];
    });
}

function isOnLoginPage() {
    return location.href == app_url + '/login.html';
}

function requestLogin() {
    if (!isLoggedIn()) {
        location.href = app_url + '/login.html';
    }
}

function isLoggedIn() {
    var expiration = localStorage.getItem('token_expiration');
    
    if (!expiration) {
        return false;
    }

    if (new Date(expiration) < new Date()) {
        return false;
    }

    api_headers.append('Token', localStorage.getItem('token'));

    return true;
}

function api_request(url, method, data) {
    var request_url = api_url + '/' + url;
    var request_init = {
        method: method,
        headers: api_headers,
        mode: 'cors'
    };

    if (method != 'GET') {
        request_init.body = JSON.stringify(data);
    }

    var request = new Request(request_url, request_init);
    
    return fetch(request);
}

serializeQueryString({a: 'b'});

function serializeQueryString(json) {
    return serialized = Object.keys(json).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
    }).join('&');
}