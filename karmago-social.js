// karmago-social.js

// Import the necessary Firebase auth function
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from './firebase-config.js'; // Ensure this path is correct

// --- 1. Authentication Guard ---
// This is the most important part. It checks the user's login status.
onAuthStateChanged(auth, user => {
    if (user) {
        // User is signed in. We can let them see the page.
        console.log("Welcome,", user.displayName);
        // We can now initialize the rest of the app's functionality
        initializeApp(user); 
    } else {
        // No user is signed in.
        console.log("No user signed in. Redirecting to login page.");
        // Immediately redirect them to the login page
        window.location.replace('login.html');
    }
});

// --- 2. Main App Logic ---
// We wrap all our app logic in a function that only runs if the user is logged in.
function initializeApp(currentUser) {
    // --- Page Navigation (same as before) ---
    const navTriggers = document.querySelectorAll('[data-page]');
    // ... all your navigation logic ...

    // --- Create Post Functionality (NOW USES REAL USER DATA) ---
    const postInput = document.querySelector('.create-input');
    const postButton = document.getElementById('postBtn');
    const postsContainer = document.getElementById('postsContainer');

    postInput.addEventListener('input', () => {
        postButton.disabled = postInput.value.trim() === '';
    });

    postButton.addEventListener('click', () => {
        const postContent = postInput.value.trim();
        if (postContent) {
            // Pass the logged-in user object to the create function
            const newPost = createPostElement(postContent, currentUser);
            postsContainer.prepend(newPost);
            postInput.value = '';
            postButton.disabled = true;
        }
    });

    /**
     * Creates the HTML for a new post using the logged-in user's data.
     * @param {string} content - The text of the post.
     * @param {object} user - The Firebase user object.
     * @returns {HTMLElement} The post card element.
     */
    function createPostElement(content, user) {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        
        // Use the user's actual display name and photo URL
        const username = user.displayName || "Anonymous User";
        const avatarSrc = user.photoURL || "images/profilem.png"; // Fallback to a default image

        postCard.innerHTML = `
            <div class="post-header">
                <img src="${avatarSrc}" alt="User Avatar" class="post-avatar">
                <div class="post-user-info">
                    <h5>${username}</h5>
                </div>
            </div>
            <p class="post-content">${content.replace(/\n/g, '<br>')}</p>
            <div class="post-actions">
                <button class="post-action-btn"><img src="images/like.png" alt="Like"> Like</button>
                <button class="post-action-btn"><img src="images/comment.png" alt="Comment"> Comment</button>
                <button class="post-action-btn"><img src="images/share.png" alt="Share"> Share</button>
            </div>
        `;
        return postCard;
    }
    
    console.log("KarmaGo app initialized for logged-in user.");
}
