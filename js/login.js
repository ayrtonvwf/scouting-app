function login(event) {
    event.preventDefault();
    var form_data = new FormData(event.target);
    var data = {
        email: form_data.get('email'),
        password: form_data.get('password')
    }
    
    var button = event.target.querySelector('button');
    button.setAttribute('disabled', '');
    button.textContent = 'Loging in...';
    
    api_request('auth', 'POST', data).then(function(response) {
        if (response.error_code) {
            button.textContent = 'Enter';
            button.removeAttribute('disabled');
            alert('User not found. Try again');
            return;
        }
        
        button.textContent = 'Loading data...';

        window.localStorage.setItem('token', response.token);
        window.localStorage.setItem('user_id', response.user_id);
        window.localStorage.setItem('token_expiration', Date.now() + 43200);
        
        isLoggedIn();
        
        loadApiData().then(function() {
            location.href = app_url;
        });
    });
}