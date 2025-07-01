// login-script.js (Definitive, Fully Functional Version)

// Import all the Firebase Auth functions we need
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Correctly import auth from your config file
import { auth } from '/Karma/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get all the elements we need to interact with
    const loginForm = document.getElementById('loginForm');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Helper function to show errors to the user
    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    // Helper function to hide the error box
    function hideError() {
        errorMessageDiv.style.display = 'none';
    }

    // --- 1. Email/Password Login ---
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Stop the page from reloading
            hideError();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // On success, redirect to the main app
                    window.location.href = '/Karma/karmago-social.html';
                })
                .catch((error) => {
                    console.error("Login Error:", error.code);
                    showError('Login failed. Please check your email and password.');
                });
        });
    }

    // --- 2. Google Sign-In ---
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            hideError();
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider)
                .then((result) => {
                    // On success, redirect to the main app
                    window.location.href = '/Karma/karmago-social.html';
                })
                .catch((error) => {
                    console.error("Google Sign-In Error:", error);
                    showError('Google sign-in failed. Please try again.');
                });
        });
    }

    // --- 3. Create New Account with Email/Password ---
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', () => {
            hideError();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Basic validation
            if (!email || !password) {
                showError('Please enter an email and password to create an account.');
                return;
            }

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Account created & signed in
                    console.log('Account created successfully:', userCredential.user);
                    // On success, redirect to the main app
                    window.location.href = '/Karma/karmago-social.html';
                })
                .catch((error) => {
                    console.error("Account Creation Error:", error.code, error.message);
                    if (error.code === 'auth/email-already-in-use') {
                        showError('This email is already in use. Please log in instead.');
                    } else if (error.code === 'auth/weak-password') {
                        showError('Password is too weak. It should be at least 6 characters.');
                    } else {
                        showError('Failed to create account. Please try again.');
                    }
                });
        });
    }
});
