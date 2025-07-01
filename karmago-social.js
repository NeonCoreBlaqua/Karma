// karmago-social.js (Final Corrected Paths)

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// CORRECTED ABSOLUTE PATH
import { auth } from '/Karma/firebase-config.js';

onAuthStateChanged(auth, user => {
    if (user) {
        initializeApp(user);
    } else {
        // CORRECTED ABSOLUTE PATH for redirect
        window.location.replace('/Karma/login.html');
    }
});

function initializeApp(currentUser) {
    // All your main app logic (creating posts, etc.) goes here
    console.log("App initialized for", currentUser.displayName);
}
