
const form = document.getElementById("signupForm");

const emailInput = document.getElementById("email");
const contactInput = document.getElementById("contact");
const roleInput = document.getElementById("role");

emailInput.value = sessionStorage.getItem("newEmail") || "";
contactInput.value = sessionStorage.getItem("newContact") || "";

roleInput.addEventListener("change", function() {
    document.getElementById("lecturerFields").hidden =
        roleInput.value !== "lecturer";

    document.getElementById("studentFields").hidden =
        roleInput.value !== "student";
});

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("id").value;
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = emailInput.value.trim();
    const contactNo = contactInput.value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const role = roleInput.value;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        alert("Please enter a valid ID.");
        return;
    }

    if (password.length < 8) {
        alert("Password must be at least 8 characters.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    if (!/^[0-9]{10}$/.test(contactNo)) {
        alert("Please enter a valid 10-digit contact number.");
        return;
    }

    const token = localStorage.getItem("token");
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !savedUser || savedUser.role !== "admin") {
        alert("Only an admin who has logged in can create accounts. Please log in as admin.");
        return;
    }

    const details = {
        role: role,
        id: Number(id),
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        contactNo: contactNo,
        nic: document.getElementById("nic").value.trim() || null,
        address: document.getElementById("address").value.trim() || null
    };

    if (role === "student") {
        details.bod = document.getElementById("studentBod").value || null;

        const age = document.getElementById("studentAge").value;
        details.age = age === "" ? null : Number(age);
    }
    else if (role === "lecturer") {
        details.qualification =
            document.getElementById("qualification").value.trim() || null;

        details.bod = document.getElementById("bod").value || null;

        const age = document.getElementById("age").value;
        details.age = age === "" ? null : Number(age);

        const salary = document.getElementById("salary").value;
        details.salary = salary === "" ? null : Number(salary);
    }
    else {
        alert("Please select Student or Lecturer.");
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:8000/api/v1/users/accounts",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(details)
            }
        );

        const data = await response.json();

        if (response.ok) {
            alert(data.message);

            form.reset();
            sessionStorage.removeItem("newEmail");
            sessionStorage.removeItem("newContact");

            document.getElementById("lecturerFields").hidden = true;
            document.getElementById("studentFields").hidden = true;
        }
        else {
            alert(data.message || "Could not create the account.");
        }
    }
    catch (error) {
        console.error(error);
        alert("Could not connect to the backend. Check that the server is running.");
    }
});
