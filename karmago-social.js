// karmago-social.js (With Auth Guard)

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from '/Karma/firebase-config.js';

// This is the auth guard. It runs as soon as the page loads.
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in, so we can run the app
        console.log("User is authenticated:", user.displayName);
        initializeApp(user);
    } else {
        // User is not logged in, redirect them to the login page
        console.log("No user found, redirecting to login.");
        window.location.replace('/Karma/login.html');
    }
});

// This function holds all the logic for your main app page
function initializeApp(currentUser) {
    console.log("KarmaGo App Initialized!");
    
    // Example: Add logout functionality to the dropdown menu
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                console.log("User signed out successfully.");
                // The onAuthStateChanged observer will automatically redirect to login
            }).catch((error) => {
                console.error("Sign out error", error);
            });
        });
    }

    // ... All your other app functionality (creating posts, etc.) will go here ...
}
