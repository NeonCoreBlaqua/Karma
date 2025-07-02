// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Firebase...');
    
    // Firebase Configuration - MAKE SURE TO UPDATE WITH YOUR ACTUAL KEYS
    const firebaseConfig = {
        apiKey: "YOUR_ACTUAL_API_KEY_HERE",
        authDomain: "karmago-e4721.firebaseapp.com",
        projectId: "karmago-e4721",
        storageBucket: "karmago-e4721.appspot.com",
        messagingSenderId: "203472083344",
        appId: "1:203472083344:web:7066cf651bda70eadb7b15"
    };

    // Initialize Firebase
    try {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // Google Auth Provider
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');

    // DOM Elements - Get them after DOM is loaded
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorMessage = document.getElementById('errorMessage');

    // Check if elements exist
    if (!loginForm || !emailInput || !passwordInput || !googleLoginBtn) {
        console.error('Required DOM elements not found!');
        return;
    }

    console.log('All DOM elements found, setting up event listeners...');

    // Utility Functions
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    function showError(message) {
        console.error('Error:', message);
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
            setTimeout(() => {
                errorMessage.classList.add('hidden');
            }, 5000);
        } else {
            alert(message); // Fallback if error element doesn't exist
        }
    }

    function redirectToApp() {
        console.log('Redirecting to main app...');
        window.location.href = 'index.html';
    }

    // Email/Password Login - PREVENT FORM SUBMISSION
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent form from submitting normally
        console.log('Login form submitted');
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        console.log('Email:', email, 'Password length:', password.length);
        
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        showLoading();
        
        try {
            console.log('Attempting email/password sign in...');
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('User signed in successfully:', userCredential.user.email);
            
            // Update user's last login
            try {
                await db.collection('users').doc(userCredential.user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (dbError) {
                console.warn('Could not update user login time:', dbError);
                // Don't fail login for this
            }
            
            redirectToApp();
        } catch (error) {
            console.error('Login error:', error);
            let errorMsg = 'Login failed. Please try again.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMsg = 'No account found with this email address.';
                    break;
                case 'auth/wrong-password':
                    errorMsg = 'Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    errorMsg = 'Please enter a valid email address.';
                    break;
                case 'auth/too-many-requests':
                    errorMsg = 'Too many failed attempts. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    errorMsg = 'Network error. Please check your connection.';
                    break;
                default:
                    errorMsg = `Login failed: ${error.message}`;
            }
            
            showError(errorMsg);
        } finally {
            hideLoading();
        }
    });

    // Google Login Button - Direct event listener
    googleLoginBtn.addEventListener('click', async function() {
        console.log('Google login button clicked');
        showLoading();
        
        try {
            console.log('Attempting Google sign in...');
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;
            
            console.log('Google sign-in successful:', user.email);
            
            // Save/update user data in Firestore
            try {
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    signInMethod: 'google'
                }, { merge: true });
            } catch (dbError) {
                console.warn('Could not save user data:', dbError);
                // Don't fail login for this
            }
            
            redirectToApp();
        } catch (error) {
            console.error('Google sign-in error:', error);
            let errorMsg = 'Google sign-in failed. Please try again.';
            
            switch (error.code) {
                case 'auth/popup-blocked':
                    errorMsg = 'Popup blocked. Please allow popups for this site and try again.';
                    break;
                case 'auth/popup-closed-by-user':
                    errorMsg = 'Sign-in cancelled.';
                    break;
                case 'auth/network-request-failed':
                    errorMsg = 'Network error. Please check your connection.';
                    break;
                case 'auth/unauthorized-domain':
                    errorMsg = 'This domain is not authorized for OAuth operations.';
                    break;
                default:
                    errorMsg = `Google sign-in failed: ${error.message}`;
            }
            
            showError(errorMsg);
        } finally {
            hideLoading();
        }
    });

    // Create Account Button
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', function() {
            console.log('Create account button clicked');
            // You can create a register.html page or show registration form
            showError('Registration feature coming soon!');
        });
    }

    // Forgot Password Handler
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Forgot password clicked');
            
            const email = emailInput.value.trim();
            if (!email) {
                showError('Please enter your email address first.');
                return;
            }
            
            try {
                await auth.sendPasswordResetEmail(email);
                showError('Password reset email sent! Check your inbox.');
            } catch (error) {
                console.error('Password reset error:', error);
                showError('Failed to send password reset email. Please try again.');
            }
        });
    }

    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User already logged in:', user.email);
            redirectToApp();
        }
    });

    console.log('Login page initialization complete');
});
