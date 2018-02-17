function user_submit(event) {
    event.preventDefault();
    var data = {
        name: document.getElementById('input-user_name').value,
        email: document.getElementById('input-user_email').value,
        new_password: document.getElementById('input-user_new_password').value,
        re_password: document.getElementById('input-user_re_password').value,
        password: document.getElementById('input-user_password').value
    }

    var password_inputs = document.querySelectorAll('[type=password]');
    for (i = 0; i < password_inputs.length; i++) {
        password_inputs[i].value = '';
    }
    
    api_request('user', 'PUT', data, false).then(function(response) {
        if (response.ok) {
            getCurrentUser(true).then(function(user) {
                loadLayoutData();
                alert('User updated!');
            });
        } else {
            alert('Cannot update. Try again');
        }
    });
}

var page_default_function = function() {
    getCurrentUser().then(function(user) {
        document.getElementById('input-user_name').value = user.name;
        document.getElementById('input-user_email').value = user.email;
        document.getElementsByClassName('fill-user_teams')[0].innerHTML = '';

        var team_template = document.getElementById('template-user_team');
        var template_clone, team;
        for (i = 0; i < user.teams.length; i++) {
            team = user.teams[i];
            team_template.content.querySelectorAll('tr')[0].setAttribute('id', 'user_team_row-'+team.id);
            team_template.content.querySelectorAll('.fill-user_team_name')[0].textContent = team.name;
            team_template.content.querySelectorAll('.fill-user_team_number')[0].textContent = team.number;
            team_template.content.querySelectorAll('.user_team_leave_button')[0].setAttribute('onclick', 'leave_team('+team.id+')');
            template_clone = document.importNode(team_template.content, true);
            document.querySelectorAll('.fill-user_teams')[0].appendChild(template_clone);
        }
    });
}

function leave_team(id) {
    if (!confirm('Are you sure you want to leave this team?')) {
        return;
    }
    showLoading();
    api_request('team', 'DELETE', {id: id}, false).then(function(response) {
        if (!response.ok) {
            alert('Unable to leave the team. Try again later');
            hideLoading();
            return;
        }
        
        getCurrentUser(true).then(function() {
            page_default_function();
            hideLoading();
        });
    });
}

function join_team(event) {
    event.preventDefault();

    if (!confirm('Are you sure you want to join this team?')) {
        return;
    }
    showLoading();
    
    var team_number = document.getElementById('user-join_team_number').value;
    api_request('team', 'GET', {number_start: team_number, number_end: team_number}).then(function(response) {
        if (!response.result.length) {
            alert('Team not found!');
            hideLoading();
            return;
        }

        var team_id = response.result[0].id
        api_request('team', 'POST', {id: team_id}, false).then(function(response) {
            if (!response.ok) {
                alert('Unable to join the team. Try again later');
                hideLoading();
                return;
            }
    
            getCurrentUser(true).then(function() {
                page_default_function();
                hideLoading();
            });
        });
    });
}