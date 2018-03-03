function user_submit(event) {
    event.preventDefault();
    var form_data = new FormData(event.target);
    var data = {
        name: form_data.get('name'),
        email: form_data.get('email'),
        password: form_data.get('password')
    }

    var new_password = form_data.get('new_password');

    if (new_password != form_data.get('re_password')) {
        alert('Your fields "New password" and "New password again" are not equal');
        return;
    }

    if (new_password) {
        data.new_password = new_password;
    }

    var password_inputs = document.querySelectorAll('[type=password]');
    for (i = 0; i < password_inputs.length; i++) {
        password_inputs[i].value = '';
    }
    
    showLoading();
    api_request('user', 'PUT', data, false).then(function(response) {
        if (response.ok) {
            app.user.name = data.name;
            app.user.email = data.email;
            loadApiToObjectStore('user', 'User').then(hideLoading);
            alert('User updated!');
        } else {
            hideLoading();
            alert('Cannot update. Try again');
        }
    });
}