
function validateForm() {

    const email = document.getElementById("email").value.trim();
    const contact = document.getElementById("contact").value.trim();

    if (email === "") {
        alert("Please enter your email address.");
    }
    else if (!email.includes("@") || !email.includes(".")) {
        alert("Please enter a valid email address.");
    }
    else if (contact === "") {
        alert("Please enter your contact number.");
    }
    else if (!/^[0-9]{10}$/.test(contact)) {
        alert("Please enter a valid 10-digit contact number.");
    }
    else {
        window.location.href = "sign in2.html";
    }

}
