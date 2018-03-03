function select_evaluation_team(event) {
    event.preventDefault();
    var form_data = new FormData(event.target);
    var team_number = form_data.get('team_number');
    var team = app.teams.find(function(team) {
        return team.number == team_number;
    });

    if (!team) {
        alert('Team not found');  
    }

    app.selected_team = team;

    var offline_evaluation = app.offline_evaluations.find(function(offline_evaluation) {
        return offline_evaluation.team_id == team.id;
    });

    if (offline_evaluation) {
        app.evaluation = offline_evaluation;
        return;
    }

    app.evaluation = app.evaluations.find(function(evaluation) {
        return parseInt(evaluation.self) && evaluation.team_id == team.id;
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
        response.ok
            ? alert('Evaluation submited!')
            : alert('Theres something wrong with your answers. Try again');
    }).catch(function(error) {
        loadDataToObjectStore('OfflineEvaluation', data).then(function() {
            alert('Unable to submit the evaluation. Your answers were saved and will be re-submited again when online');
        }).catch(function() {
            alert('Unable to submit the evaluation, and also unable to save it for re-submiting later');
        });
    }).then(function() {
        loadApiToObjectStore('evaluation', 'Evaluation');
    });
}