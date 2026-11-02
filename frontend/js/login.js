const form = document.getElementById("loginForm");

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (email === "") {
        alert("Please enter your email.");
        return;
    }

    if (password === "") {
        alert("Please enter your password.");
        return;
    }

    if (role === "") {
        alert("Please select your role.");
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:8000/api/v1/users/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: role
                })
            }
        );

        const data = await response.json();

        if (response.ok) {

            // Save login information.
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("Login successful!");

            // Redirect according to the user's role.
            if (data.user.role === "student") {
                window.location.href = "student/student-dashboard.html";
            }

            else if (data.user.role === "lecturer") {
                window.location.href = "lecturer/staff-dashboard.html";
            }

            else if (data.user.role === "admin") {
                window.location.href = "sign in.html";
            }

        } else {
            alert(data.message || "Login failed. Please try again.");
        }

    } catch (error) {
        alert("Could not connect to the backend. Please check if the server is running.");
        console.error(error);
    }
});
