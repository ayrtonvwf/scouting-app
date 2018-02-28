function user_submit(event) {
    event.preventDefault();
    var data = {
        name: getById('input-user_name').value,
        email: getById('input-user_email').value,
        new_password: getById('input-user_new_password').value,
        re_password: getById('input-user_re_password').value,
        password: getById('input-user_password').value
    }

    var password_inputs = document.querySelectorAll('[type=password]');
    for (i = 0; i < password_inputs.length; i++) {
        password_inputs[i].value = '';
    }
    
    api_request('user', 'PUT', data, false).then(function(response) {
        if (response.ok) {
            loadApiUser()
                .then(getCurrentUser)
                .then(loadLayoutData)
                .then(function() {
                    alert('User updated!');
                });
        } else {
            alert('Cannot update. Try again');
        }
    });
}

var page_default_function = function() {
    getCurrentUser().then(function(user) {
        getById('input-user_name').value = user.name;
        getById('input-user_email').value = user.email;
    });
}