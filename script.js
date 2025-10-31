// script.js — safer version
document.addEventListener("DOMContentLoaded", function () {
  // ---------- Registration / Subscribe Form ----------
  const form = document.getElementById("registration-form");
  if (form) {
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");

    form.addEventListener("submit", function (event) {
      event.preventDefault(); // prevent so we can validate

      const errors = [];

      // Username validation
      if (!usernameInput || usernameInput.value.trim().length < 3) {
        errors.push("Username must be at least 3 characters long.");
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput || !emailRegex.test(emailInput.value.trim())) {
        errors.push("Please enter a valid email address.");
      }

      // Password validation
      if (!passwordInput || passwordInput.value.length < 6) {
        errors.push("Password must be at least 6 characters long.");
      }

      // Confirm Password validation
      if (!confirmPasswordInput || passwordInput.value !== confirmPasswordInput.value) {
        errors.push("Passwords do not match.");
      }

      if (errors.length > 0) {
        alert(errors.join("\n"));
        return;
      }

      // If validation passed, show success and redirect to blog page
      alert("Thank you for joining our newsletter!");
      // Ensure filename matches your blog page — change if you've chosen a different name
      window.location.href = "FinalBlog.html";
    });
  }

  // ---------- Login Form ----------
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    const loginUsernameInput = document.getElementById("login-username");
    const loginPasswordInput = document.getElementById("login-password");

    // demo hardcoded user (only for demo - do NOT use on production)
    const validUser = {
      username: "parentUser",
      password: "parentPass123"
    };

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const enteredUsername = loginUsernameInput ? loginUsernameInput.value.trim() : "";
      const enteredPassword = loginPasswordInput ? loginPasswordInput.value : "";

      if (enteredUsername === validUser.username && enteredPassword === validUser.password) {
        alert("Login successful! Redirecting to blog page...");
        window.location.href = "FinalBlog.html";
      } else {
        alert("Invalid username or password. Please try again.");
      }
    });
  }
});


