const form = document.getElementById("loginForm");

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (email === "") {
        alert("Please enter your email.");
    }
    else if (password === "") {
        alert("Please enter your password.");
    }
    else if (role === "") {
        alert("Please select your role.");
    }
    else {
        try {
            const response = await fetch("http://localhost:8000/api/v1/users/login",
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
            });

            const data = await response.json();

             if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                alert("Login successful!");

                if (role === "admin") {
                    window.location.href = "sign in.html";
                }
                else if (role === "student") {
                    alert("Student login successful. Dashboard linking is next.");
                }
                else if (role === "lecturer") {
                    alert("Lecturer login successful. Dashboard linking is next.");
                }
            }
            else {
                alert(data.message || "Login failed. Please try again.");
            }

        }
        catch (error) {
            alert("Could not connect to the backend. Please check if the server is running.");
            console.error(error);
        }
    }
});
