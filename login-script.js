// login-script.js (Final Corrected Paths)

import { 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// CORRECTED ABSOLUTE PATH to your config file
import { auth } from '/Karma/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // The rest of the script is correct and remains the same
    const loginForm = document.getElementById('loginForm');
    const googleSignInBtn = document.getElementById('googleSignInBtn');

    // Email/Password Login
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        signInWithEmailAndPassword(auth, email, password)
            .then(() => { window.location.href = '/Karma/karmago-social.html'; }) // Also correct redirect path
            .catch(() => { console.error("Login failed"); });
    });

    // Google Sign-In
    googleSignInBtn.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then(() => { window.location.href = '/Karma/karmago-social.html'; }) // Also correct redirect path
            .catch((error) => { console.error("Google Sign-In Error:", error); });
    });
});
