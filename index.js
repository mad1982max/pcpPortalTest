window.onload = function () {
    document.body.style.opacity = 1;
}

function logout() {
    window.localStorage.removeItem('token');
    auth_status_object.auth_check();
}