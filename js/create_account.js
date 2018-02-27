function create_account(event) {
    event.preventDefault();
    var data = {
        name: getById('name').value,
        email: getById('email').value,
        password: getById('password').value
    }

    if (data.password != getById('re_password').value) {
        alert('The field "Password Again" must be the same as "Password"');
        return;
    }
    
    api_request('user', 'POST', data, false).then(function(response) {
        if (response.error_code) {
            alert('Cannot create user. Try again');
            return;
        }
        
        alert('User created. You can log in now');
        location.href = app_url+'/login.html';
    });
}