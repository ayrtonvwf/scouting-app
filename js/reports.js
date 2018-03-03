function sort_questions(a, b) {
    if (a.id == b.id) {
        return 0;
    }

    return a.id < b.id ? -1 : 1;
}

function select_question(event) {
    var selected_questions = app.selected_questions;

    if (selected_questions.length >= 5) {
        event.preventDefault();
        alert('You can only select 5 questions at once');
        return;
    }

    var question_id = event.target.name;
    var question = app.questions.find(function(question) {
        return question.id == question_id;
    });

    selected_questions.push(question);
    selected_questions.sort(sort_questions);

    app.selected_questions = selected_questions;

    event.target.setAttribute('onchange', 'unselect_question(event)');
}

function unselect_question(event) {
    var question_id = event.target.name;

    app.selected_questions = app.selected_questions.filter(function(selected_question) {
        return selected_question.id != question_id;
    });

    event.target.setAttribute('onchange', 'select_question(event)');
}

function select_team(event) {
    event.preventDefault();
    var form_data = new FormData(event.target);
    var input = event.target.querySelectorAll('input')[0];
    var team_number = form_data.get('team_number');

    var team = app.teams.find(function(team) {
        return parseInt(team.number) == parseInt(team_number);
    });

    if (!team) {
        alert('Team not found');
        return;
    }

    var selected_team = app.selected_teams.find(function(selected_team) {
        return selected_team.id == team.id;
    });

    if (selected_team) {
        alert('Team already selected');
        return;
    }

    app.selected_teams.push(team);
    input.value = '';
}

function unselect_team(event) {
    var team_id = event.target.dataset.id;

    app.selected_teams = app.selected_teams.filter(function(team) {
        return team.id != team_id;
    });
}