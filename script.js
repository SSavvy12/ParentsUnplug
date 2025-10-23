document.addEventListener("DOMContentLoaded", function () {
  // Registration Form
  const form = document.getElementById("registration-form");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");

  form.addEventListener("submit", function (event) {
    const errors = [];

    // Username validation
    if (usernameInput.value.length < 3) {
      errors.push("Username must be at least 3 characters long.");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      errors.push("Please enter a valid email address.");
    }

    // Password validation
    if (passwordInput.value.length < 6) {
      errors.push("Password must be at least 6 characters long.");
    }

    // Confirm Password validation
    if (passwordInput.value !== confirmPasswordInput.value) {
      errors.push("Passwords do not match.");
    }

    if (errors.length > 0) {
      event.preventDefault();
      alert(errors.join("\n"));
    } else {
      event.preventDefault();
      alert("Thank you for joining our newsletter!");
      window.location.href = "FinalBlogs.html";
    }
  });

  // Login Form
  const loginForm = document.getElementById("login-form");
  const loginUsernameInput = document.getElementById("login-username");
  const loginPasswordInput = document.getElementById("login-password");

  // For demo purposes, hardcoded user credentials:
  const validUser = {
    username: "parentUser",
    password: "parentPass123"
  };

  loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const enteredUsername = loginUsernameInput.value.trim();
    const enteredPassword = loginPasswordInput.value;

    if (enteredUsername === validUser.username && enteredPassword === validUser.password) {
      alert("Login successful! Redirecting to blog page...");
      window.location.href = "FinalBlogs.html";
    } else {
      alert("Invalid username or password. Please try again.");
    }
  });
});

