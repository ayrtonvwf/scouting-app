function create_account(event) {
    event.preventDefault();
    var form_data = new FormData(event.target);
    var data = {
        name: form_data.get('name'),
        email: form_data.get('email'),
        password: form_data.get('password')
    }

    if (data.password != form_data.get('re_password')) {
        alert('Your fields "Password" and "Password again" are not equal');
        return;
    }
    
    var button = event.target.querySelector('button');
    button.setAttribute('disabled', '');
    button.textContent = 'Creating account...';
    
    api_request('user', 'POST', data, false).then(function(response) {
        if (response.error_code) {
            button.textContent = 'Enter';
            button.removeAttribute('disabled');
            alert('Cannot create user. Try again');
            return;
        }
        
        alert('User created. You can log in now');
        location.href = app_url+'/login.html';
    });
}