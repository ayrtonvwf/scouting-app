var selected_teams = [];
var selected_questions = [];
var text_questions = [];

var page_default_function = function() {
    getQuestions().then(build_questions_modal);
}

function show_questions() {
    var fill_questions = getById('fill-selected_questions');
    fill_questions.innerHTML = '';

    if (selected_questions.length) {
        getById('reports_select_questions_alert').setAttribute('hidden', 'true');
    } else {
        getById('reports_select_questions_alert').removeAttribute('hidden');
    }
    
    var question_template = getTemplate('selected_question');
    var question_template_clone;
    selected_questions.forEach(function(question) {
        question_template_clone = document.importNode(question_template, true);
        queryFirst('.fill-selected_question_description', question_template_clone).textContent = question.description;
        fill_questions.appendChild(question_template_clone);
    });
}

function load_report() {
    if (!selected_questions.length || !selected_teams.length) {
        getById('report_result_box').setAttribute('hidden', 'true');
        return;
    }

    var questions_fill = queryFirst('.fill-header_questions');
    questions_fill.innerHTML = '';

    var question_template = getTemplate('report_question');
    var question_template_clone = document.importNode(question_template, true);
    queryFirst('.fill-report_question_description', question_template_clone).textContent = 'Team';
    questions_fill.appendChild(question_template_clone);

    selected_questions.forEach(function(selected_question) {
        question_template_clone = document.importNode(question_template, true);
        queryFirst('.fill-report_question_description', question_template_clone).textContent = selected_question.description;
        questions_fill.appendChild(question_template_clone);
    });

    var report_fill = queryFirst('.fill-report_answers');
    report_fill.innerHTML = '';

    var answer_result_template = getTemplate('report_answer_result');
    var answer_template = getTemplate('report_answer');
    var answer_result_template_clone, answer_template_clone;

    selected_teams.forEach(function(team) {
        getEvaluationsByTeamId(team.id).then(function(evaluations) {
            if (!evaluations.length) {
                return;
            }
            
            var answers = {};
            
            evaluations.forEach(function(evaluation) {
                evaluation.answers.forEach(function(answer) {
                    var selected_question = selected_questions.find(function(selected_question) {
                        return selected_question.id == answer.question_id;
                    });

                    if (selected_question == undefined) {
                        return;
                    }

                    if (answers[answer.question_id] == undefined) {
                        answers[answer.question_id] = [];
                    }
                    
                    answers[answer.question_id].push(answer.value);
                });
            });
            

            answer_template_clone = document.importNode(answer_template, true);
            answer_result_template_clone = document.importNode(answer_result_template, true);
            queryFirst('.fill-report_answer_result', answer_result_template_clone).textContent = team.number;
            queryFirst('.fill-report_answer', answer_template_clone).appendChild(answer_result_template_clone);
            
            selected_questions.forEach(function(selected_question) {
                answer_result_template_clone = document.importNode(answer_result_template, true);
                var answer_result;
                if (selected_question.question_type_id == 1) {
                    var true_answers = answers[selected_question.id].filter(function(answer) { return answer == "1" }).length;
                    var false_answers = answers[selected_question.id].filter(function(answer) { return answer == "0" }).length;

                    if (true_answers == false_answers) {
                        answer_result = 'not sure';
                    } else {
                        answer_result = true_answers > false_answers ? 'yes' : 'no';
                    }
                } else {
                    answer_result = 0;
                    answers[selected_question.id].forEach(function(answer) {
                        answer_result += parseInt(answer);
                    });
                    answer_result /= answers[selected_question.id].length;

                    if (selected_question.question_type_id == 3) {
                        answer_result += "%";
                    }
                }
                queryFirst('.fill-report_answer_result', answer_result_template_clone).textContent = answer_result;
                queryFirst('.fill-report_answer', answer_template_clone).appendChild(answer_result_template_clone);
            });

            report_fill.appendChild(answer_template_clone);
        });
    });
    
    new Tablesort(getById('report_table'));
    getById('report_result_box').removeAttribute('hidden');
}

function sort_questions(a, b) {
    if (a.id == b.id) {
        return 0;
    }

    return a.id < b.id ? -1 : 1;
}

function select_question(event) {
    if (selected_questions.length >= 5) {
        event.preventDefault();
        alert('You can only select 5 questions at once');
        return;
    }

    var question_id = event.target.name;
    getQuestionById(question_id).then(function(question) {
        selected_questions.push(question);
        selected_questions.sort(sort_questions);
        event.target.setAttribute('onclick', 'unselect_question(event)');
        show_questions();
        load_report();
    });
}

function unselect_question(event) {
    question_id = event.target.name;

    getQuestionById(question_id).then(function(question) {
        var index = selected_questions.findIndex(function(selected_question) {
            return selected_question.id == question_id;
        });

        selected_questions.splice(index, 1);
        event.target.setAttribute('onclick', 'select_question(event)');
        show_questions();
        load_report();
    });
}

function build_questions_modal(questions) {
    var question_template = getTemplate('reports_select_question');
    var fill_select_questions = getById('fill-select_questions');
    var question_template_clone;

    questions.forEach(function(question) {
        if (question.question_type_id >= 4) {
            text_questions.push(question);
            return;
        }
        question_template_clone = document.importNode(question_template, true);
        queryFirst('.fill-select_question_description', question_template_clone).textContent = question.description;
        queryFirst('input', question_template_clone).setAttribute('name', question.id);
        fill_select_questions.appendChild(question_template_clone);
    });

    if (text_questions.length) {
        queryFirst('.fill-ignored_questions').textContent = text_questions.length;
    } else {
        getById('text_questions_link').setAttribute('hidden', 'true');
    }
}

function select_report_team(event) {
    event.preventDefault();
    var input = queryFirst('input', event.target);
    var team_number = input.value;
    getTeamByNumber(team_number).then(function(team) {
        select_team(team);
        getById('reports_select_teams_alert').setAttribute('hidden', true);
        input.value = '';
    }).catch(function(error) {
        alert('Team not found');
    });
}

function select_team(team) {
    var is_selected = selected_teams.find(function(selected_team) {
        return selected_team.id == team.id;
    });

    if (is_selected) {
        return;
    }
    
    selected_teams.push(team);
    
    show_selected_teams();
    load_report();
}

function show_selected_teams() {
    var fill_selected_teams = queryFirst('.fill-selected_teams');
    fill_selected_teams.innerHTML = '';

    if (!selected_teams.length) {
        getById('reports_select_teams_alert').removeAttribute('hidden');
        return;
    }

    getById('reports_select_teams_alert').setAttribute('hidden', 'true');

    var template = getTemplate('selected_team');
    var template_clone;
    selected_teams.forEach(function(team) {
        template_clone = document.importNode(template, true);
        queryFirst('.fill-selected_team_name', template_clone).textContent = team.name; 
        queryFirst('.fill-selected_team_number', template_clone).textContent = team.number;
        queryFirst('button', template_clone).setAttribute('onclick', 'unselect_team('+team.id+')');
        fill_selected_teams.appendChild(template_clone);
    });
}

function unselect_team(id) {
    getTeamById(id).then(function(team) {
        var selected_index = selected_teams.findIndex(function(selected_team) {
            return selected_team.id == team.id;
        });

        if (selected_index == undefined) {
            return;
        }

        selected_teams.splice(selected_index, 1);

        show_selected_teams();
        load_report();
    });
}