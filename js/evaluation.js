var page_default_function = function() {
    
}

function select_evaluation_team(event) {
    event.preventDefault();
    var team_number = event.target.querySelectorAll('input')[0].value;
    getTeamByNumber(team_number).then(function(team) {
        prepare_evaluation_form(team);
        getById('evaluation-select_team_alert').setAttribute('hidden', true);
    }).catch(function() {
        alert('Team not found');  
    });
}

function prepare_evaluation_form(team) {
    Promise.all([getPeriods(), getQuestions(), getEvaluations(), team]).then(function(data) {
        var periods = data[0];
        var questions = data[1];
        var team = data[3];

        getById('evaluation_submit_button_wrapper').removeAttribute('hidden');

        for (var i = 0; i < periods.length; i++) {
            periods[i].questions = questions.filter(function(question) {
                return question.period_id == periods[i].id;
            });
        }

        build_evaluation_questions(periods);
        
        var evaluation = data[2].find(function(evaluation) {
            return evaluation.self == "1" && evaluation.team_id == team.id;
        });
        if (evaluation) {
            getById('input_evaluation_id').value = evaluation.id;
            populate_evaluation_answers(evaluation.answers);
        }
        getById('input_evaluation_team_id').value = team.id;
    });
}

function build_evaluation_questions(periods) {
    var evaluation_periods_fill = getByClass('fill-evaluation_periods')[0];
    evaluation_periods_fill.innerHTML = '';

    var period, period_template, period_template_clone, question, question_template, question_template_clone, question_i;
    for (var period_i = 0; period_i < periods.length; period_i++) {
        period = periods[period_i];
        period_template = getTemplate('evaluation_period');
        period_template_clone = document.importNode(period_template, true);
        queryFirst('.fill-evaluation_period_name', period_template_clone).textContent = period.name;
        for (question_i = 0; question_i < period.questions.length; question_i++) {
            question = period.questions[question_i];
            switch (question.question_type_id) {
                case "1":
                    question_template = getTemplate('evaluation_question_boolean');
                    question_template.querySelectorAll('input')[0].setAttribute('name', question.id);
                    question_template.querySelectorAll('input')[1].setAttribute('name', question.id);
                    break;
                case "2":
                    question_template = getTemplate('evaluation_question_integer');
                    question_template.querySelectorAll('input')[0].setAttribute('name', question.id);
                    break;
                case "3":
                    question_template = getTemplate('evaluation_question_percent');
                    question_template.querySelectorAll('input')[0].setAttribute('name', question.id);
                    break;
                case "4":
                    question_template = getTemplate('evaluation_question_phrase');
                    question_template.querySelectorAll('input')[0].setAttribute('name', question.id);
                    break;
                case "5":
                    question_template = getTemplate('evaluation_question_text');
                    question_template.querySelectorAll('textarea')[0].setAttribute('name', question.id);
                    break;
            }
            queryFirst('.fill-evaluation_question_description', question_template).textContent = question.description;
            question_template_clone = document.importNode(question_template, true);
            queryFirst('.fill-evaluation_questions', period_template_clone).appendChild(question_template_clone);
        }
        evaluation_periods_fill.appendChild(period_template_clone);
    }
}

function populate_evaluation_answers(answers) {
    answers.forEach(function(answer) {
        getQuestionById(answer.question_id).then(function(question) {
            switch (question.question_type_id) {
                case "1":
                    if (parseInt(answer.value)) {
                        queryFirst('input[name="'+question.id+'"][value="1"]').setAttribute('checked', true);
                        queryFirst('input[name="'+question.id+'"][value="0"]').removeAttribute('checked');
                    } else {
                        queryFirst('input[name="'+question.id+'"][value="0"]').setAttribute('checked', true);
                        queryFirst('input[name="'+question.id+'"][value="1"]').removeAttribute('checked');
                    }
                    break;
                case "5":
                    queryFirst('textarea[name="'+question.id+'"]').innerHTML = answer.value;
                    break;
                default:
                    queryFirst('input[name="'+question.id+'"]').value = answer.value;
            }
        });
    });
}

function submit_evaluation(event) {
    event.preventDefault();

    var form_data = new FormData(event.target);
    var data = {
        answers: [],
        id: form_data.get('id'),
        team_id: form_data.get('team_id')
    };
    form_data.delete('team_id');
    form_data.delete('id');

    var method = parseInt(data.id) ? 'PUT' : 'POST';
    
    form_data.forEach(function(value, question_id) {
        data.answers.push({question_id: question_id, value: value});
    });

    api_request('evaluation', method, data, false).then(function(response) {
        if (!response.ok) {
            alert('Theres something wrong with your answers. Try again'); 
        } else {
            alert('Evaluation submited!');
        }
    }).catch(function(error) {
        save_offline_evaluation(data).then(function() {
            alert('Unable to submit the evaluation. Your answers were saved and will be re-submited again when online');
        }).then(loadNotifications)
        .catch(function() {
            alert('Unable to submit the evaluation, and also unable to save it for re-submiting later');
        });
    }).then(loadApiEvaluation);
}

function save_offline_evaluation(evaluation) {
    return new Promise(function(resolve, reject) {
        var transaction = db.transaction('OfflineEvaluation', 'readwrite');
        var store = transaction.objectStore('OfflineEvaluation');
        putEvaluation = store.put(evaluation);
        putEvaluation.onsuccess = resolve;
        putEvaluation.onerror = function(error) {
            throw error;
        };
    });
}