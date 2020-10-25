window.addEventListener("load", loadFn)

function loadFn() {
    document.body.style.opacity = 1;
}

function logout() {
    window.localStorage.removeItem('token');
    auth_status_object.auth_check();
}