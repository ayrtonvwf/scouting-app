var app_url = 'http://localhost:8000';
var api_url = 'http://localhost/scouting';
var api_headers = new Headers({'Accept': 'application/json'});
var db;
var current_user;
var current_team;
const db_name = 'scoutingdb';

window.onload = function () {
    if (isOnLoginPage()) {
        return;
    }
    requestLogin();

    dbInit().then(function() {
        loadLayoutData();
    });
}

function loadLayoutData() {
    getCurrentUser().then(function(user) {
        var elements = document.getElementsByClassName('fill-user_name');
        for (i = 0; i < elements.length; i++) {
            elements[i].innerHTML = user.name;
        }
    }).then(function() {
        getCurrentTeam().then(function(team) {
            var elements = document.getElementsByClassName('fill-team_number');
            for (i = 0; i < elements.length; i++) {
                elements[i].innerHTML = team.number;
            }
        });
    });
}

function dbInit() {
    return new Promise(function(resolve, reject) {
        db_open = indexedDB.open(db_name, 1);
        db_open.onupgradeneeded = function() {
            db = db_open.result;
            var store = db.createObjectStore('User', {keyPath: 'id'});
            var index = store.createIndex('UserId', ['user.id']);
        };
        db_open.onsuccess = function() {
            db = db_open.result;
            resolve();
        }
        db_open.onerror = function() {
            alert('Cannot open database');
        }
    });
}

function getCurrentUser() {
    return new Promise(function(resolve, reject) {
        if (current_user) {
            resolve(current_user);
            return;
        }

        var user_id = localStorage.getItem('user_id');
        var transaction = db.transaction('User', 'readonly');
        var store = transaction.objectStore('User');
        var getUser = store.get(user_id);
        getUser.onsuccess = function() {
            if (getUser.result) {
                current_user = getUser.result;
                resolve(current_user);
            }
            
            return api_request('user', 'GET', {id: user_id}).then(function(response) {
                return response.json();
            }).then(function(response) {
                current_user = response.result[0];
                transaction = db.transaction('User', 'readwrite');
                store = transaction.objectStore('User');
                store.put(current_user);
                if (!getUser.result) {
                    resolve(current_user);
                }
            });
        };
    });
}

function getCurrentTeam() {
    return new Promise(function(resolve, reject) {
        if (current_team) {
            resolve(current_team);
            return;
        }

        getCurrentUser().then(function(user) {
            if (team_id = localStorage.getItem('team_id')) {
                current_team = user.teams.filter(function(team) {
                    return team.id == team_id;
                })[0];
            } else {
                current_team = user.teams[0];
            }
            resolve(current_team);
            localStorage.setItem('team_id', current_team.id);
        });
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

    if (method == 'GET' && data) {
        request_url += '?' + serializeQueryString(data);
    } else if (data) {
        request_init.body = JSON.stringify(data);
    }

    var request = new Request(request_url, request_init);
    
    return fetch(request);
}

function serializeQueryString(json) {
    return serialized = Object.keys(json).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
    }).join('&');
}

function logout() {
    if (!confirm('Are you sure you want to log out?')) {
        return;
    }

    localStorage.clear();
    db.close();
    var db_delete = window.indexedDB.deleteDatabase(db_name);
    db_delete.onsuccess = function(event) {
        location.href = app_url + '/login.html';
    };
}