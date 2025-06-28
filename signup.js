import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    setDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const zodiac = document.getElementById('zodiac').value;

    if (!zodiac) {
        errorMessage.textContent = 'Please select your zodiac sign.';
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;

            // Now, save the extra user info to Firestore
            // Using "profileImageUrl" to be consistent with the rest of the app
            return setDoc(doc(db, "users", user.uid), {
                username: username,
                email: email,
                zodiac: zodiac,
                profileImageUrl: 'images/profile.png' // Default profile picture
            });
        })
        .then(() => {
            // Redirect to the main page after successful signup and data save
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorMessage.textContent = error.message;
        });
});
