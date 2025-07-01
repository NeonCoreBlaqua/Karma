// karmago-social.js (Typo Corrected)

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// THIS LINE IS NOW CORRECTED
import { auth } from '/Karma/firebase-config.js';

onAuthStateChanged(auth, (user) => {
    if (user) {
        initializeApp(user);
    } else {
        window.location.replace('/Karma/login.html');
    }
});

function initializeApp(currentUser) {
    console.log("KarmaGo App Initialized for", currentUser.displayName);
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).catch((error) => console.error("Sign out error", error));
        });
    }
    // ... all your other app logic for posts, etc. goes here ...
}
