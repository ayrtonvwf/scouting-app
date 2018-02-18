const app_url = 'http://localhost:8000';
const api_url = 'http://localhost/scouting';
const db_name = 'scoutingdb';
var db;
var api_headers = new Headers({'Accept': 'application/json'});

window.onload = function () {
    registerServiceWorker();
    var db_init_promise = dbInit();

    if (isOnLoginPage()) {
        return;
    }
    
    showLoading();
    requestLogin();

    db_init_promise
        .then(loadLayoutData)
        .then(function() {
            if (typeof page_default_function === "function") {
                page_default_function();
            }
            hideLoading();
        });
}

function registerServiceWorker() {
    navigator.serviceWorker.register('service_worker.js');
}

function loadLayoutData() {
    return getCurrentUser()
        .then(function(user) {
            fillInfo('user_name', user.name);
            var elements = getByClass('fill-user_name');
            for (i = 0; i < elements.length; i++) {
                elements[i].innerHTML = user.name;
            }
        })
        .then(getCurrentTeam)
        .then(function(team) {
            if (!team) {
                return;
            }
            fillInfo('team_number', team.number);
            fillInfo('team_name', team.name);
        })
        .then(loadNotifications);
        
}

function loadNotifications() {
    return getOfflineEvaluations().then(function(offline_evaluations) {
        var counter = queryFirst('.fill-notifications_counter');
        var notification_template = getTemplate('notification');

        if (!offline_evaluations.length) {
            counter.innerHTML = '0';
            counter.classList.add('hidden');
            var fill_notifications = queryFirst('.fill-notifications');
            fill_notifications.innerHTML = '';
            var notification_template_clone = document.importNode(notification_template, true);
            queryFirst('.fill-notification_title', notification_template_clone).innerHTML = 'Theres nothing here';
            queryFirst('.fill-notification_description', notification_template_clone).innerHTML = 'You have no notifications';
            fill_notifications.appendChild(notification_template_clone);
            return;
        }

        counter.innerHTML = offline_evaluations.length;
        counter.classList.remove('hidden');

        var promises = [];
        offline_evaluations.forEach(function(offline_evaluation) {
            promises.push(getTeamById(offline_evaluation.team_id).then(function(team) {
                var notification_template_clone = document.importNode(notification_template, true);
                queryFirst('.fill-notification_title', notification_template_clone).innerHTML = 'Submit '+team.name+' evaluation';
                queryFirst('.fill-notification_description', notification_template_clone).innerHTML = 'You made this evaluation offline.<br>Click here to submit it.';
                queryFirst('a', notification_template_clone).setAttribute('onclick', 'resubmit_evaluation('+offline_evaluation.team_id+')');
                return notification_template_clone;
            }));
        });
        return Promise.all(promises).then(function(notifications) {
            var fill_notifications = queryFirst('.fill-notifications');
            fill_notifications.innerHTML = '';
            notifications.forEach(function(notification) {
                fill_notifications.appendChild(notification);
            });
        });
    });
}

function resubmit_evaluation(team_id) {
    team_id = team_id+""; // to string

    getOfflineEvaluationByTeamId(team_id).then(function(data) {
        var method = parseInt(data.id) ? 'PUT' : 'POST';
    
        api_request('evaluation', method, data, false).then(function(response) {
            if (!response.ok) {
                alert('Theres something wrong with your answers. Try again'); 
            } else {
                alert('Evaluation submited!');
                return deleteOfflineEvaluationByTeamId(team_id).then(loadNotifications);
            }
        }).catch(function(error) {
            alert('Unable to submit the evaluation. Try again later');
        }).then(loadApiEvaluation);
    });
}

function fillInfo(name, info) {
    var elements = getByClass('fill-'+name);
    for (i = 0; i < elements.length; i++) {
        elements[i].innerHTML = info;
    }
}

function dbInit() {
    return new Promise(function(resolve, reject) {
        db_open = indexedDB.open(db_name, 1);
        db_open.onupgradeneeded = function() {
            db = db_open.result;
            db.createObjectStore('User', {keyPath: 'id'});
            db.createObjectStore('Team', {keyPath: 'id'});
            db.createObjectStore('Period', {keyPath: 'id'});
            db.createObjectStore('QuestionType', {keyPath: 'id'});
            db.createObjectStore('Question', {keyPath: 'id'});
            db.createObjectStore('Evaluation', {keyPath: 'id'});
            db.createObjectStore('OfflineEvaluation', {keyPath: 'team_id'});
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

function loadDataToObjectStore(object_store_name, data) {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction(object_store_name, 'readwrite');
        var object_store = transaction.objectStore(object_store_name);
        var clear = object_store.clear();
        clear.onsuccess = function() {
            var promises = [];
            data.forEach(function(item) {
                promises.push(object_store.put(item));
            });
            Promise.all(promises).then(resolve);
        }
        clear.onerror = reject;
    });
}

function loadApiUser() {
    return api_request('user', 'GET').then(function(response) {
        return loadDataToObjectStore('User', response.result);
    });
}

function loadApiTeam() {
    return api_request('team', 'GET').then(function(response) {
        return loadDataToObjectStore('Team', response.result);
    });
}

function loadApiPeriod() {
    return api_request('period', 'GET').then(function(response) {
        return loadDataToObjectStore('Period', response.result);
    });
}

function loadApiQuestionType() {
    return api_request('question_type', 'GET').then(function(response) {
        return loadDataToObjectStore('QuestionType', response.result);
    });
}

function loadApiQuestion() {
    return api_request('question', 'GET').then(function(response) {
        return loadDataToObjectStore('Question', response.result);
    });
}

function loadApiEvaluation() {
    return api_request('evaluation', 'GET').then(function(response) {
        return loadDataToObjectStore('Evaluation', response.result);
    });
}

function loadApiData() {
    var promises = [
        loadApiUser(),
        loadApiTeam(),
        loadApiPeriod(),
        loadApiQuestionType(),
        loadApiQuestion(),
        loadApiEvaluation()
    ];

    return Promise.all(promises);
}

function getCurrentUser() {
    return new Promise(function(resolve, reject) {
        var user_id = localStorage.getItem('user_id');

        if (!user_id) {
            reject();
            return;
        }

        var transaction = db.transaction('User', 'readonly');
        var store = transaction.objectStore('User');
        var getUser = store.get(user_id);
        getUser.onsuccess = function() {
            getUser.result ? resolve(getUser.result) : reject();
        };
        getUser.onerror = reject;
    });
}

function getCurrentTeam() {
    return new Promise(function(resolve, reject) {
        getCurrentUser().then(function(user) {
            if (!user.teams.length) {
                reject();
                return;
            }
            
            var team_id = localStorage.getItem('team_id');
            if (!team_id) {
                team_id = user.teams[0].id;
                localStorage.setItem('team_id', team_id);
            }
            
            var team = user.teams.find(function(team) {
                return team.id == team_id;
            });
            
            team ? resolve(team) : reject();
        });
    });
}

function getPeriods() {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('Period', 'readonly');
        var store = transaction.objectStore('Period');
        var getPeriods = store.getAll();
        getPeriods.onsuccess = function() {
            getPeriods.result ? resolve(getPeriods.result) : reject();
        };
        getPeriods.onerror = reject;
    });
}

function getQuestions() {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('Question', 'readonly');
        var store = transaction.objectStore('Question');
        var getQuestions = store.getAll();
        getQuestions.onsuccess = function() {
            getQuestions.result ? resolve(getQuestions.result) : reject();
        };
        getQuestions.onerror = reject;
    });
}

function getQuestionById(id) {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('Question', 'readonly');
        var store = transaction.objectStore('Question');
        var getQuestion = store.get(id);
        getQuestion.onsuccess = function() {
            getQuestion.result ? resolve(getQuestion.result) : reject();
        };
        getQuestion.onerror = reject;
    });
}

function getTeamByNumber(number) {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('Team', 'readonly');
        var store = transaction.objectStore('Team');
        var getTeams = store.getAll();
        getTeams.onsuccess = function() {
            var team = getTeams.result.find(function(team) {
                return team.number == number;
            });
            return team ? resolve(team) : reject();
        };
        getTeams.onerror = reject;
    });
}

function getTeamById(id) {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('Team', 'readonly');
        var store = transaction.objectStore('Team');
        var getTeam = store.get(id);
        getTeam.onsuccess = function() {
            return getTeam.result ? resolve(getTeam.result) : reject();
        };
        getTeam.onerror = reject;
    });
}

function getEvaluations() {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('Evaluation', 'readonly');
        var store = transaction.objectStore('Evaluation');
        var getEvaluations = store.getAll();
        getEvaluations.onsuccess = function() {
            getEvaluations.result ? resolve(getEvaluations.result) : reject();
        };
        getEvaluations.onerror = reject;
    });
}

function getOfflineEvaluationByTeamId(team_id) {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('OfflineEvaluation', 'readonly');
        var store = transaction.objectStore('OfflineEvaluation');
        var getOfflineEvaluations = store.get(team_id);
        getOfflineEvaluations.onsuccess = function() {
            getOfflineEvaluations.result ? resolve(getOfflineEvaluations.result) : reject();
        };
        getOfflineEvaluations.onerror = reject;
    });
}

function deleteOfflineEvaluationByTeamId(team_id) {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('OfflineEvaluation', 'readwrite');
        var store = transaction.objectStore('OfflineEvaluation');
        var getOfflineEvaluations = store.delete(team_id);
        getOfflineEvaluations.onsuccess = resolve;
        getOfflineEvaluations.onerror = reject;
    });
}

function getOfflineEvaluations() {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('OfflineEvaluation', 'readonly');
        var store = transaction.objectStore('OfflineEvaluation');
        var getOfflineEvaluations = store.getAll();
        getOfflineEvaluations.onsuccess = function() {
            getOfflineEvaluations.result ? resolve(getOfflineEvaluations.result) : reject();
        };
        getOfflineEvaluations.onerror = reject;
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

function api_request(url, method, data, parsejson) {
    if (parsejson == undefined) {
        parsejson = true;
    }
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
    if (parsejson) {
        return fetch(request).then(function(response) {
            return response.json();
        });
    } else {
        return fetch(request);
    }
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

function showLoading() {
    getById('loading_status').removeAttribute('hidden');
}

function hideLoading() {
    getById('loading_status').setAttribute('hidden', '');
}

function getTemplate(name) {
    var id = 'template-'+name;
    return getById(id).content;
}

function queryFirst(selector, context) {
    if (context == undefined) {
        context = document;
    }

    var elements = context.querySelectorAll(selector);
    return elements.length ? elements[0] : undefined;
}

function getById(id) {
    return document.getElementById(id);
}

function getByClass(class_name) {
    return document.getElementsByClassName(class_name);
}