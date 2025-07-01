// karmago-social.js

// This function will hold all the logic for your main application page.
// It will only run if the user is confirmed to be logged in.
function initializeApp(user) {
    console.log("Welcome! App is initializing for user:", user.displayName);

    // --- Logout Functionality ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Stop the link from trying to navigate
            
            // Use the signOut method from the Firebase auth object
            firebase.auth().signOut().then(() => {
                console.log('User signed out successfully.');
                // The onAuthStateChanged listener below will automatically handle the redirect.
            }).catch((error) => {
                console.error('Sign Out Error', error);
            });
        });
    }

    // --- Profile Dropdown Menu Functionality ---
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

    // ... All of your other app logic (like creating posts) will go here in the future ...
}


// --- THE AUTH GUARD ---
// This code runs immediately. It checks the user's login state.
// We are using the reliable "compat" library syntax.
document.addEventListener('DOMContentLoaded', () => {
    try {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // User is signed in.
                // We can now safely run the main application logic.
                initializeApp(user);
            } else {
                // No user is signed in.
                // Redirect them to the login page.
                console.log("No user is signed in. Redirecting to login page.");
                // Use the full path for a reliable redirect.
                window.location.replace('/Karma/login.html');
            }
        });
    } catch (error) {
        console.error("Firebase not initialized or other critical error:", error);
        // If Firebase fails to load, redirect to login to be safe.
        window.location.replace('/Karma/login.html');
    }
});
