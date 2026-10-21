
const form = document.querySelector("form");

form.addEventListener("submit", function(event) {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (username === "") {
        alert("Please enter your username.");
        event.preventDefault();
    }
    else if (password === "") {
        alert("Please enter your password.");
        event.preventDefault();
    }
    else if (role === "") {
        alert("Please select your role.");
        event.preventDefault();
    }

});
