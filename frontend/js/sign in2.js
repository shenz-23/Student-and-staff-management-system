
const form = document.querySelector("form");

form.addEventListener("submit", function(event) {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const role = document.getElementById("role").value;

    if (username === "") {
        alert("Please enter a username.");
        event.preventDefault();
    }
    else if (password === "") {
        alert("Please enter a password.");
        event.preventDefault();
    }
    else if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        event.preventDefault();
    }
    else if (confirmPassword === "") {
        alert("Please confirm your password.");
        event.preventDefault();
    }
    else if (password !== confirmPassword) {
        alert("Passwords do not match.");
        event.preventDefault();
    }
    else if (role === "") {
        alert("Please select an account type.");
        event.preventDefault();
    }

});
