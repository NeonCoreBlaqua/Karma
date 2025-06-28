import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const googleSignInButton = document.getElementById('google-signin'); // Make sure your Google button has this ID

// Hide the login page by default to prevent it from flashing.
document.body.style.visibility = 'hidden';

// This observer is the gatekeeper.
onAuthStateChanged(auth, (user) => {
    if (user) {
        // If a user is already logged in, redirect them to the main app.
        window.location.replace('index.html');
    } else {
        // If there is no user, it is safe to show the login page.
        document.body.style.visibility = 'visible';
    }
});

// --- Google Sign-In Handler ---
if (googleSignInButton) {
    googleSignInButton.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // CRITICAL: After Google sign-in, check if a user document exists.
            // If not, create one to prevent the redirect loop.
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                console.log("First time Google sign-in, creating user document...");
                const newUserData = {
                    username: user.displayName || user.email.split('@')[0],
                    profileImageUrl: user.photoURL, // Google provides a profile picture
                };
                await setDoc(userDocRef, newUserData);
            }
            // The onAuthStateChanged observer above will now handle the redirect.
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert("Google Sign-In failed: " + error.message);
        }
    });
}

// --- Email/Password Login Handler ---
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        signInWithEmailAndPassword(auth, email, password)
            .catch((error) => {
                console.error('Login Error:', error);
                alert("Login failed: " + error.message);
            });
    });
}
