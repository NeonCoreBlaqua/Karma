// karmago-social.js (Definitive, Complete Version)

// This function holds all the logic for your main application page.
function initializeApp(user) {
    console.log("Welcome! Initializing app for user:", user.displayName);

    // --- 1. Update UI with User Info ---
    const defaultAvatar = '/Karma/images/profilem.png'; // A fallback image
    const userAvatar = user.photoURL || defaultAvatar;
    const userName = user.displayName || 'KarmaGo User';
    
    document.getElementById('navProfilePic').src = userAvatar;
    document.getElementById('dropdownProfilePic').src = userAvatar;
    document.getElementById('sidebarAvatar').src = userAvatar;
    document.getElementById('createPostAvatar').src = userAvatar;
    document.getElementById('storyAvatar').src = userAvatar;
    document.getElementById('sidebarUsername').textContent = userName;
    document.getElementById('dropdownProfileName').textContent = userName;

    // --- 2. Logout Functionality ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            firebase.auth().signOut().catch((error) => console.error('Sign Out Error', error));
        });
    }

    // --- 3. Profile Dropdown Menu ---
    const profileMenuBtn = document.getElementById('profileMenuBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileMenuBtn && profileDropdown) {
        profileMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        window.addEventListener('click', () => {
            if (profileDropdown.classList.contains('active')) {
                profileDropdown.classList.remove('active');
            }
        });
    }
    
    // ... Any other app functionality (like creating posts) will go here ...
}

// --- THE AUTH GUARD ---
// This runs immediately and protects your page.
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (firebase) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    // User is signed in, so run the app.
                    initializeApp(user);
                } else {
                    // No user signed in, so redirect to login.
                    window.location.replace('/Karma/login.html');
                }
            });
        } else {
            console.error("Firebase is not defined. Redirecting to login.");
            window.location.replace('/Karma/login.html');
        }
    } catch (error) {
        console.error("Critical error during Firebase auth check:", error);
        window.location.replace('/Karma/login.html');
    }
});
