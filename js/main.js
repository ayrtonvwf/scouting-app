const app_url = 'https://ayrtonvwf.github.io/scouting-app';
const api_url = 'https://scouting-api.infomec.net.br';
const db_name = 'scoutingdb';
var api_headers = new Headers({'Accept': 'application/json'});
var db, app;

window.onload = function () {
    if ('serviceWorker' in navigator) {
        registerServiceWorker();
    }
    
    var db_init_promise = dbInit();
    if (isOnLoginPage()) {
        return;
    }
    
    db_init_promise
        .then(requestLogin)
        .then(loadData)
        .then(function(data) {
            app = new Vue({
                el: '#app',
                data: data,
                methods: {
                    getTeamById: function(id) {
                        return this.teams.find(function(team) {
                            return team.id == id;
                        });
                    },
                    getAnswer: function(question_id) {
                        if (!this.evaluation) {
                            return undefined;
                        }

                        var answer = this.evaluation.answers.find(function(answer) {
                            return answer.question_id == question_id;
                        });

                        return answer ? answer.value : undefined;
                    },
                    getReport: function(team_id, question_id) {
                        var evaluations = app.evaluations.filter(function(evaluation) {
                            return evaluation.team_id == team_id;
                        });

                        var answers = evaluations.map(function(evaluation) {
                            var answer = evaluation.answers.find(function(answer) {
                                return answer.question_id == question_id;
                            });
                            return parseInt(answer.value);
                        });

                        if (!answers.length) {
                            return undefined;
                        }

                        var question = app.questions.find(function(question) {
                            return question.id == question_id;
                        });

                        if (question.question_type_id == 1) {
                            var positive = answers.filter(function(answer) {
                                return answer;
                            });

                            var positive_percent = (positive.length/answers.length)*100;

                            return positive_percent+'%';
                        }

                        var sum = 0;
                        answers.forEach(function(answer) {
                            sum += answer;
                        });

                        return sum/answers.length;
                    },
                    log: function(data) {
                        console.log(data);
                    }
                }
            });
        });
}

function registerServiceWorker() {
    navigator.serviceWorker.register('service_worker.js');
}

function loadData() {
    var promises = [
        getCurrentUser(),
        getAllFromDb('Team'),
        getAllFromDb('QuestionType'),
        getAllFromDb('Question'),
        getAllFromDb('Evaluation'),
        getAllFromDb('OfflineEvaluation')
    ];

    return Promise.all(promises).then(function(data) {
        var max_team_number = 0;
        data[1].forEach(function(team) {
            var team_number = parseInt(team.number);
            if (max_team_number < team_number) {
                max_team_number = team_number;
            }
        });

        return {
            user: data[0],
            teams: data[1],
            question_types: data[2],
            questions: data[3],
            evaluations: data[4],
            offline_evaluations: data[5],
            is_loading: false,
            max_team_number: max_team_number,
            selected_team: null,
            evaluation: null,
            selected_questions: [],
            selected_teams: [],
            reports: [],
            supports_service_worker: ('serviceWorker' in navigator)
        };
    });
}

function resubmit_evaluation(element) {
    var team_id = element.dataset.id;

    showLoading();
    getOfflineEvaluationByTeamId(team_id).then(function(data) {
        var method = parseInt(data.id) ? 'PUT' : 'POST';
    
        api_request('evaluation', method, data, false).then(function(response) {
            if (!response.ok) {
                alert('Theres something wrong with your answers. Try again'); 
            } else {
                alert('Evaluation submited!');
                return deleteOfflineEvaluationByTeamId(team_id);
            }
        }).catch(function(error) {
            hideLoading();
            alert('Unable to submit the evaluation. Try again later');
        }).then(loadApiEvaluation);
    });
}

function dbInit() {
    return new Promise(function(resolve, reject) {
        db_open = indexedDB.open(db_name, 1);
        db_open.onupgradeneeded = function() {
            db = db_open.result;
            db.createObjectStore('User', {keyPath: 'id'});
            db.createObjectStore('Team', {keyPath: 'id'});
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

function loadApiToObjectStore(resource_name, object_store_name) {
    return api_request(resource_name, 'GET').then(function(response) {
        if (!(response.result instanceof Array)) {
            response.result = [response.result];
        }
        return loadDataToObjectStore(object_store_name, response.result);
    });
}

function loadApiData() {
    var promises = [
        loadApiToObjectStore('user', 'User'),
        loadApiToObjectStore('team', 'Team'),
        loadApiToObjectStore('question_type', 'QuestionType'),
        loadApiToObjectStore('question', 'Question'),
        loadApiToObjectStore('evaluation', 'Evaluation')
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

function getAllFromDb(object_store_name) {
    return new Promise(function(resolve) {
        var transaction = db.transaction(object_store_name, 'readonly');
        var store = transaction.objectStore(object_store_name);
        var operation = store.getAll();
        operation.onsuccess = function() {
            resolve(operation.result);
        };
        operation.onerror = function() {
            throw 'Cannot load all from '+object_store_name;
        };
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

function isOnLoginPage() {
    var whitelist = [
        app_url + '/login.html',
        app_url + '/create_account.html'
    ];
    return whitelist.indexOf(location.href) != -1;
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
    app.is_loading = true;
}

function hideLoading() {
    app.is_loading = false;
}