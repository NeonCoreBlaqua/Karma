// login-script.js (Final Correct Version)

import { 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const errorMessageDiv = document.getElementById('errorMessage');

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    function hideError() {
        errorMessageDiv.style.display = 'none';
    }

    // Email/Password Login
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        hideError();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                window.location.href = 'karmago-social.html';
            })
            .catch((error) => {
                showError('Invalid email or password. Please try again.');
            });
    });

    // Google Sign-In
    googleSignInBtn.addEventListener('click', () => {
        hideError();
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log('Successfully logged in with Google:', result.user.displayName);
                window.location.href = 'karmago-social.html';
            }).catch((error) => {
                console.error("Google Sign-In Error:", error.code, error.message);
                if (error.code !== 'auth/popup-closed-by-user') {
                    showError('An error occurred during Google sign-in. Please check configuration.');
                }
            });
    });

    // Create Account Button
    createAccountBtn.addEventListener('click', () => {
        alert('Create Account page is not yet built.');
    });
});
