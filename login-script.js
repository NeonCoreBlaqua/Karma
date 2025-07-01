// login-script.js (Typo Corrected, Definitive Version)

import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// THIS LINE IS NOW CORRECTED
import { auth } from '/Karma/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get all the elements we need
    const loginForm = document.getElementById('loginForm');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const errorMessageDiv = document.getElementById('errorMessage');

    function showError(message) { /* ... same as before ... */ }
    function hideError() { /* ... same as before ... */ }

    // Email/Password Login
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            hideError();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            signInWithEmailAndPassword(auth, email, password)
                .then(() => { window.location.href = '/Karma/karmago-social.html'; })
                .catch(() => { showError('Login failed. Please check your email and password.'); });
        });
    }

    // Google Sign-In
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            hideError();
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider)
                .then(() => { window.location.href = '/Karma/karmago-social.html'; })
                .catch((error) => {
                    console.error("Google Sign-In Error:", error);
                    showError('Google sign-in failed. Please try again.');
                });
        });
    }

    // Create New Account
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', () => {
            hideError();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showError('Please enter an email and password to create an account.');
                return;
            }

            createUserWithEmailAndPassword(auth, email, password)
                .then(() => { window.location.href = '/Karma/karmago-social.html'; })
                .catch((error) => {
                    if (error.code === 'auth/email-already-in-use') {
                        showError('This email is already in use. Please log in.');
                    } else if (error.code === 'auth/weak-password') {
                        showError('Password should be at least 6 characters.');
                    } else {
                        showError('Failed to create account.');
                    }
                });
        });
    }
});

// Helper functions for showing/hiding error messages
function showError(message) {
    const errorMessageDiv = document.getElementById('errorMessage');
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
}

function hideError() {
    const errorMessageDiv = document.getElementById('errorMessage');
    errorMessageDiv.style.display = 'none';
}
