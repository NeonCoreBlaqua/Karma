// login-script.js

import { 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged // Import the auth state observer
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    // First, check if the user is already logged in.
    onAuthStateChanged(auth, user => {
        if (user) {
            // If user is already logged in, don't show the login page.
            // Redirect them immediately to the main app.
            console.log("User already logged in. Redirecting to app...");
            window.location.replace('karmago-social.html');
        }
    });

    // --- Get Elements ---
    const loginForm = document.getElementById('loginForm');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const errorMessageDiv = document.getElementById('errorMessage');

    function showError(message) { /* ... unchanged ... */ }
    function hideError() { /* ... unchanged ... */ }

    // --- Email/Password Login ---
    loginForm.addEventListener('submit', (event) => {
        // ... this logic remains the same ...
        event.preventDefault(); hideError();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        signInWithEmailAndPassword(auth, email, password)
            .then(() => window.location.href = 'karmago-social.html')
            .catch(() => showError('Invalid email or password.'));
    });

    // --- Google Sign-In ---
    googleSignInBtn.addEventListener('click', () => {
        hideError();
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then(() => {
                // On successful login, Firebase automatically handles the session,
                // and our onAuthStateChanged logic will redirect.
                // We can also redirect here for faster response.
                window.location.href = 'karmago-social.html';
            }).catch((error) => {
                console.error("Google Sign-In Error:", error);
                showError('An error occurred during Google sign-in. Please try again.');
            });
    });
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
