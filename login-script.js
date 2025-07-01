// login-script.js (Purple Theme - Final)

import { 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Corrected absolute path
import { auth } from '/Karma/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const googleSignInBtn = document.getElementById('googleSignInBtn');

    // Email/Password Login
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        signInWithEmailAndPassword(auth, email, password)
            .then(() => { window.location.href = '/Karma/karmago-social.html'; }) // Correct redirect path
            .catch(() => { console.error("Login failed"); });
    });

    // Google Sign-In
    googleSignInBtn.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then(() => { window.location.href = '/Karma/karmago-social.html'; }) // Correct redirect path
            .catch((error) => { console.error("Google Sign-In Error:", error); });
    });
});
