{
    const form = document.getElementsByTagName('form')[0];
    const loginUrl = 'https://pcp-portal.ga/login.php';
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // disable page reload on form submit
        const elements = event.currentTarget.elements;
        const username = elements['username'].value;
        const password = elements['password'].value;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', loginUrl, true);
        xhr.responseType = 'json';
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        xhr.send(formData);

        xhr.onload = function () {
            if (xhr.status === 200) {
                const token = xhr.response.token;
                console.log('token', token);
                window.localStorage.setItem('token', token);
                auth_status_object.auth_check();
            } else {
                alert('authorisation failed!');
            }
        };
    });
}