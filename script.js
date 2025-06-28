import { db, auth, storage } from './firebase-config.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log('Firebase imports loaded successfully');

let currentUserData = null;
let posts = [];
let isProfileView = false;
let currentProfileUser = null;

// Post creation variables
let selectedImage = null;

// Batching variables
let isInitialLoad = true;
let newPostsCount = 0;
let pendingPosts = [];
let lastKnownPostCount = 0;

// Store original body content before showing loading screen
const originalBodyContent = document.body.innerHTML;
console.log('Original body content stored, length:', originalBodyContent.length);

// Create smooth breathing overlay instead of replacing content
function showBreathingLoader() {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = 'breathing-overlay';
    overlay.innerHTML = `
        <div class="breathing-container">
            <div class="breathing-logo">
                <img src="images/KarmaGo.png" alt="KarmaGo" class="logo-image">
                <div class="breathing-circle"></div>
            </div>
            <div class="loading-text">Welcome to KarmaGo...</div>
            <div class="breathing-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </div>
    `;
    
    // Add breathing overlay styles
    const style = document.createElement('style');
    style.textContent = `
        #breathing-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
            backdrop-filter: blur(10px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            animation: fadeIn 0.8s ease-out forwards;
        }
        
        .breathing-container {
            text-align: center;
            color: white;
        }
        
        .breathing-logo {
            position: relative;
            margin-bottom: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .logo-image {
            height: 60px;
            width: auto;
            filter: drop-shadow(0 4px 20px rgba(0,0,0,0.3));
            margin-bottom: 20px;
            animation: breathe 3s ease-in-out infinite;
        }
        
        .breathing-circle {
            width: 80px;
            height: 80px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            margin: 0 auto;
            position: relative;
            animation: breatheCircle 3s ease-in-out infinite;
        }
        
        .breathing-circle::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            background: rgba(255,255,255,0.8);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: pulse 2s ease-in-out infinite;
        }
        
        .loading-text {
            font-size: 18px;
            margin: 20px 0;
            opacity: 0.9;
            animation: breatheText 2.5s ease-in-out infinite;
        }
        
        .breathing-dots {
            display: flex;
            justify-content: center;
            gap: 8px;
        }
        
        .dot {
            width: 8px;
            height: 8px;
            background: rgba(255,255,255,0.7);
            border-radius: 50%;
            animation: dotBreathe 1.5s ease-in-out infinite;
        }
        
        .dot:nth-child(2) {
            animation-delay: 0.3s;
        }
        
        .dot:nth-child(3) {
            animation-delay: 0.6s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(1.1); }
        }
        
        @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @keyframes breatheCircle {
            0%, 100% { transform: scale(1); border-color: rgba(255,255,255,0.3); }
            50% { transform: scale(1.1); border-color: rgba(255,255,255,0.6); }
        }
        
        @keyframes breatheText {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 0.6; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
            50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.4; }
        }
        
        @keyframes dotBreathe {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.4); opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    
    return overlay;
}

// Show breathing loader
const breathingOverlay = showBreathingLoader();
console.log('Breathing loader displayed');

// Authentication timeout (10 seconds)
const authTimeout = setTimeout(() => {
    console.warn('Authentication timeout after 10 seconds, redirecting to login...');
    window.location.replace('login.html');
}, 10000);

// --- Authentication & User Data ---
onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
    
    // Clear the timeout since auth state changed
    clearTimeout(authTimeout);
    
    if (user) {
        try {
            // User is signed in. Let's find their data document.
            const userDocRef = doc(db, "users", user.uid);
            let userDocSnap = await getDoc(userDocRef);

            // If the user's data document doesn't exist, create it.
            if (!userDocSnap.exists()) {
                console.warn("User document not found! Creating a new one.");
                const newUserData = {
                    username: user.displayName || user.email.split('@')[0],
                    profileImageUrl: user.photoURL || null,
                    zodiac: '',
                    followers: [],
                    following: [],
                    followersCount: 0,
                    followingCount: 0,
                    postsCount: 0,
                    isOnline: true,
                    lastSeen: serverTimestamp()
                };
                await setDoc(userDocRef, newUserData);
                userDocSnap = await getDoc(userDocRef);
                console.log("New user document created.");
            } else {
                // Update existing user document with new fields if they don't exist
                const userData = userDocSnap.data();
                const updates = {};
                
                if (!userData.hasOwnProperty('followers')) updates.followers = [];
                if (!userData.hasOwnProperty('following')) updates.following = [];
                if (!userData.hasOwnProperty('followersCount')) updates.followersCount = 0;
                if (!userData.hasOwnProperty('followingCount')) updates.followingCount = 0;
                if (!userData.hasOwnProperty('postsCount')) updates.postsCount = 0;
                if (!userData.hasOwnProperty('isOnline')) updates.isOnline = true;
                if (!userData.hasOwnProperty('lastSeen')) updates.lastSeen = serverTimestamp();
                
                // Update profile image if user has one from Google but database doesn't
                if (user.photoURL && !userData.profileImageUrl) {
                    updates.profileImageUrl = user.photoURL;
                }
                
                if (Object.keys(updates).length > 0) {
                    await updateDoc(userDocRef, updates);
                    userDocSnap = await getDoc(userDocRef);
                    console.log("User document updated with new fields.");
                }
                
                // Set user as online
                await updateDoc(userDocRef, {
                    isOnline: true,
                    lastSeen: serverTimestamp()
                });
            }

            currentUserData = userDocSnap.data();

            // Update profile display
            const profileImageUrl = user.photoURL || currentUserData.profileImageUrl || null;
            currentUserData.profileImageUrl = profileImageUrl;

            // SMOOTHLY FADE OUT the breathing overlay and restore content
            const overlay = document.getElementById('breathing-overlay');
            if (overlay) {
                overlay.style.animation = 'fadeOut 0.8s ease-out forwards';
                setTimeout(() => {
                    overlay.remove();
                    console.log('Breathing overlay removed smoothly');
                }, 800);
            }
            
            // Re-run initialization code that depends on DOM elements
            setTimeout(() => {
                initializeApp();
            }, 100);
            
        } catch (error) {
            console.error('Error during authentication process:', error);
            // Show error with breathing effect
            const overlay = document.getElementById('breathing-overlay');
            if (overlay) {
                overlay.innerHTML = `
                    <div class="breathing-container">
                        <div style="font-size: 48px; margin-bottom: 20px; animation: breathe 2s ease-in-out infinite;">⚠️</div>
                        <div style="font-size: 24px; margin-bottom: 15px; animation: breatheText 2.5s ease-in-out infinite;">Connection Error</div>
                        <div style="font-size: 16px; opacity: 0.8; animation: breatheText 3s ease-in-out infinite;">Redirecting to login...</div>
                    </div>
                `;
                setTimeout(() => {
                    overlay.style.animation = 'fadeOut 0.8s ease-out forwards';
                    setTimeout(() => {
                        window.location.replace('login.html');
                    }, 800);
                }, 2000);
            }
        }

    } else {
        console.log('User not authenticated, redirecting to login...');
        const overlay = document.getElementById('breathing-overlay');
        if (overlay) {
            const loadingText = overlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = 'Authentication required...';
            }
            setTimeout(() => {
                overlay.style.animation = 'fadeOut 0.8s ease-out forwards';
                setTimeout(() => {
                    window.location.replace('login.html');
                }, 800);
            }, 1000);
        }
    }
});

function initializeApp() {
    console.log('Initializing app with user:', currentUserData.username);
    
    // Update user display elements
    updateUserDisplay();
    
    // Setup navigation
    setupNavigation();
    
    // Setup post creation
    setupPostCreation();
    
    // Load posts
    loadPosts();
    
    // Load online users
    loadOnlineUsers();
    
    // Load trending data
    loadTrendingData();
    
    // Set up presence system
    setupPresenceSystem();
    
    // Initialize notification system
    initializeNotificationSystem();
    
    console.log('App initialization complete');
}

function updateUserDisplay() {
    // Update profile elements if they exist
    const profileUsername = document.getElementById('profile-username');
    const profileDisplayName = document.getElementById('profile-display-name');
    
    if (profileUsername) profileUsername.textContent = currentUserData.username;
    if (profileDisplayName) profileDisplayName.textContent = currentUserData.username;
    
    // Update avatar elements
    const userInitials = currentUserData.username.substring(0, 2).toUpperCase();
    updateAvatarElement('user-avatar', currentUserData.profileImageUrl, userInitials);
    updateAvatarElement('profile-avatar', currentUserData.profileImageUrl, userInitials);
    
    // Setup profile widget click handler after DOM is updated
    setTimeout(() => {
        const profileWidget = document.querySelector('.right-sidebar .friend-item');
        if (profileWidget && !profileWidget.hasAttribute('data-click-setup')) {
            profileWidget.setAttribute('data-click-setup', 'true');
            profileWidget.addEventListener('click', () => {
                if (auth.currentUser && currentUserData) {
                    showUserProfile(auth.currentUser.uid, currentUserData);
                }
            });
        }
    }, 100);
}

function updateAvatarElement(elementId, imageUrl, initials) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (imageUrl) {
        element.innerHTML = `<img src="${imageUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
        element.innerHTML = initials;
        element.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        element.style.color = 'white';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.fontWeight = 'bold';
    }
}

function setupNavigation() {
    // Logout functionality
    const logoutBtn = document.querySelector('[data-action="logout"]');
    const logoutBtnById = document.getElementById('logout-button');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.replace('login.html');
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }
    
    if (logoutBtnById) {
        logoutBtnById.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.replace('login.html');
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }

    // Profile navigation - Header
    const headerProfileLinks = document.querySelectorAll('[onclick="goToProfile()"]');
    headerProfileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (auth.currentUser && currentUserData) {
                showUserProfile(auth.currentUser.uid, currentUserData);
            }
        });
    });

    // Profile navigation - Sidebar
    const sidebarNavItems = document.querySelectorAll('.nav-item');
    sidebarNavItems.forEach(item => {
        if (item.textContent.includes('Profile')) {
            item.addEventListener('click', () => {
                if (auth.currentUser && currentUserData) {
                    showUserProfile(auth.currentUser.uid, currentUserData);
                    // Update active state
                    sidebarNavItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        } else if (item.textContent.includes('Home')) {
            item.addEventListener('click', () => {
                showHome();
                // Update active state
                sidebarNavItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        }
    });

    // Right sidebar profile widget - make it clickable
    const profileWidget = document.querySelector('.right-sidebar .friend-item');
    if (profileWidget) {
        profileWidget.style.cursor = 'pointer';
        profileWidget.addEventListener('click', () => {
            if (auth.currentUser && currentUserData) {
                showUserProfile(auth.currentUser.uid, currentUserData);
            }
        });
    }
}

function setupPostCreation() {
    // Post creation functionality
    window.createPost = async function() {
        const textArea = document.getElementById('postText');
        if (!textArea) return;
        
        const content = textArea.value.trim();
        if (!content && !selectedImage) {
            showToast('Please write something or select an image!', 'error');
            return;
        }

        const user = auth.currentUser;
        if (!user || !currentUserData) {
            showToast('You must be logged in to post.', 'error');
            return;
        }

        const postBtn = document.querySelector('.post-btn');
        if (postBtn) {
            postBtn.disabled = true;
            postBtn.innerHTML = '<span class="loading-spinner"></span> Posting...';
        }

        try {
            let imageUrl = null;
            
            // Upload image if selected
            if (selectedImage) {
                const imageRef = ref(storage, `posts/${Date.now()}_${selectedImage.name}`);
                const snapshot = await uploadBytes(imageRef, selectedImage);
                imageUrl = await getDownloadURL(snapshot.ref);
            }
            
            await addDoc(collection(db, "posts"), {
                uid: user.uid,
                username: currentUserData.username,
                userProfileImage: currentUserData.profileImageUrl || null,
                caption: content,
                imageurl: imageUrl,
                privacy: 'public',
                likedBy: [],
                likes: 0,
                commentsCount: 0,
                timestamp: serverTimestamp()
            });

            // Update user's post count
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                postsCount: increment(1)
            });

            // Update current user data
            currentUserData.postsCount = (currentUserData.postsCount || 0) + 1;

            textArea.value = '';
            removeImagePreview('main');
            
            showToast('Post created successfully!', 'success');
            
            // Post will be included in the next batch refresh when 3 posts accumulate
            
        } catch (error) {
            console.error("Error creating post: ", error);
            showToast('Failed to create post. Please try again.', 'error');
        } finally {
            if (postBtn) {
                postBtn.disabled = false;
                postBtn.innerHTML = 'Post';
            }
        }
    }
}

function loadPosts() {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        const postsData = [];
        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            postsData.push(post);
        });
        
        // Handle initial load or batch updates
        handlePostUpdates(postsData);
    });
}

function handlePostUpdates(postsData) {
    if (isInitialLoad) {
        // First time loading - render all posts immediately
        posts = postsData;
        renderPosts(postsData);
        lastKnownPostCount = postsData.length;
        isInitialLoad = false;
        console.log('Initial posts loaded:', postsData.length);
    } else {
        // Check for new posts
        const currentPostCount = postsData.length;
        const newPostsDetected = currentPostCount - lastKnownPostCount;
        
        if (newPostsDetected > 0) {
            newPostsCount += newPostsDetected;
            pendingPosts = postsData;
            
            console.log(`New posts detected: ${newPostsDetected}, Total pending: ${newPostsCount}`);
            
            // Show notification for new posts
            showNewPostsNotification(newPostsCount);
            
            // Check if we should batch update (strictly every 3 posts only)
            if (newPostsCount >= 3) {
                applyPendingUpdates();
            }
        }
    }
}

function wasUserPost(postsData) {
    // Check if the newest post is from the current user
    if (postsData.length > 0 && auth.currentUser) {
        const newestPost = postsData[0];
        return newestPost.uid === auth.currentUser.uid;
    }
    return false;
}

function applyPendingUpdates() {
    if (pendingPosts.length > 0) {
        posts = pendingPosts;
        renderPosts(pendingPosts);
        lastKnownPostCount = pendingPosts.length;
        newPostsCount = 0;
        pendingPosts = [];
        
        // Hide the notification and reset page title
        hideNewPostsNotification();
        document.title = 'KarmaGo';
        
        console.log('Posts updated with pending changes');
    }
}

function showNewPostsNotification(count) {
    // Remove existing notification
    const existingNotification = document.getElementById('new-posts-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Update page title with pending posts count
    document.title = `(${count}) KarmaGo`;
    
    // Create new notification
    const notification = document.createElement('div');
    notification.id = 'new-posts-notification';
    notification.className = 'new-posts-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-text">${count} new post${count > 1 ? 's' : ''} available</span>
            <button class="notification-btn" onclick="applyPendingUpdates()">Load Now</button>
            <button class="notification-close" onclick="hideNewPostsNotification()">&times;</button>
        </div>
    `;
    
    // Insert at the top of main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(notification, mainContent.firstChild);
    }
}

function hideNewPostsNotification() {
    const notification = document.getElementById('new-posts-notification');
    if (notification) {
        notification.style.animation = 'slideUp 0.3s ease-out forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
}

// Manual refresh function for user-initiated updates
window.refreshPosts = function() {
    applyPendingUpdates();
}

// Global functions for notifications
window.applyPendingUpdates = applyPendingUpdates;
window.hideNewPostsNotification = hideNewPostsNotification;

function renderPosts(postsData) {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '';
    const currentUserId = auth.currentUser.uid;

    postsData.forEach(post => {
        const postElement = createPostElement(post, currentUserId);
        postsContainer.appendChild(postElement);
    });
}

function createPostElement(post, currentUserId) {
    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(currentUserId);
    const userInitials = post.username ? post.username.substring(0, 2).toUpperCase() : 'KG';
    
    const postElement = document.createElement('article');
    postElement.className = 'post';
    postElement.dataset.id = post.id;
    
    const imageHTML = post.imageurl ? `<img src="${post.imageurl}" alt="Post Image" class="post-image">` : '';
    const avatarHTML = post.userProfileImage ? 
        `<img src="${post.userProfileImage}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
        userInitials;
    
    postElement.innerHTML = `
        <div class="post-header">
            <div class="avatar clickable-user" onclick="showUserProfile('${post.uid}', {username: '${post.username}', profileImageUrl: '${post.userProfileImage || ''}', uid: '${post.uid}'})">${avatarHTML}</div>
            <div class="post-info">
                <h4 class="clickable-user" onclick="showUserProfile('${post.uid}', {username: '${post.username}', profileImageUrl: '${post.userProfileImage || ''}', uid: '${post.uid}'})" style="cursor: pointer;">${post.username}</h4>
                <small>${formatTimestamp(post.timestamp)} • 🌍</small>
            </div>
            ${post.uid === currentUserId ? `
                <div class="post-actions-menu">
                    <button class="post-menu-btn" onclick="editPost('${post.id}')">
                        <img src="images/edit.png" alt="Edit" style="width: 16px; height: 16px; filter: brightness(0.6);">
                    </button>
                    <button class="post-menu-btn delete-btn" onclick="deletePost('${post.id}')">
                        <img src="images/delete.png" alt="Delete" style="width: 16px; height: 16px; filter: brightness(0.6);">
                    </button>
                </div>
            ` : ''}
        </div>
        <div class="post-content">
            <div class="post-text" id="post-text-${post.id}">${formatTextWithLinks(post.caption)}</div>
            <div class="post-edit-form" id="post-edit-${post.id}" style="display: none;">
                <textarea class="edit-textarea" id="edit-textarea-${post.id}" onkeydown="handleEditKeydown(event, '${post.id}')">${post.caption}</textarea>
                <div class="edit-actions">
                    <button class="save-edit-btn" onclick="savePostEdit('${post.id}')">Save</button>
                    <button class="cancel-edit-btn" onclick="cancelPostEdit('${post.id}')">Cancel</button>
                </div>
            </div>
            ${imageHTML}
        </div>
        <div class="post-stats">
            <span>👍 ${likedBy.length} likes</span>
            <span>${post.commentsCount || 0} comments • 0 shares</span>
        </div>
        <div class="post-actions-bar">
            <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}', this)">
                <span>👍</span>
                <span>Like</span>
            </button>
            <button class="action-btn" onclick="toggleComments('${post.id}')">
                <span>💬</span>
                <span>Comment</span>
            </button>
            <button class="action-btn">
                <span>📤</span>
                <span>Share</span>
            </button>
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
            <div class="comment-input">
                <div class="avatar-small">${currentUserData.profileImageUrl ? 
                    `<img src="${currentUserData.profileImageUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                    currentUserData.username.substring(0, 2).toUpperCase()
                }</div>
                <input type="text" placeholder="Write a comment..." onkeypress="handleCommentKeypress(event, '${post.id}')" id="comment-input-${post.id}">
                <button onclick="addComment('${post.id}')" class="comment-btn">Post</button>
            </div>
            <div class="comments-list" id="comments-list-${post.id}">
                <!-- Comments will be loaded here -->
            </div>
        </div>
    `;
    
    return postElement;
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const postDate = timestamp.toDate();
    const seconds = Math.floor((now - postDate) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;
    return 'Just now';
}

// Global functions that can be called from HTML
window.toggleLike = async function(postId, button) {
    const currentUserId = auth.currentUser.uid;
    const postRef = doc(db, 'posts', postId);
    const isLiked = button.classList.contains('liked');

    try {
        if (isLiked) {
            await updateDoc(postRef, { likedBy: arrayRemove(currentUserId) });
        } else {
            await updateDoc(postRef, { likedBy: arrayUnion(currentUserId) });
        }
    } catch (error) {
        console.error("Error toggling like:", error);
    }
}

// Comments functionality
window.toggleComments = function(postId) {
    const commentsSection = document.getElementById('comments-' + postId);
    if (!commentsSection) return;
    
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        loadComments(postId);
    } else {
        commentsSection.style.display = 'none';
    }
}

window.handleCommentKeypress = function(event, postId) {
    if (event.key === 'Enter') {
        addComment(postId);
    }
}

window.addComment = async function(postId) {
    const commentInput = document.getElementById('comment-input-' + postId);
    if (!commentInput) return;
    
    const text = commentInput.value.trim();
    if (!text) return;
    
    const user = auth.currentUser;
    if (!user || !currentUserData) {
        alert('You must be logged in to comment.');
        return;
    }
    
    try {
        // Add comment to subcollection
        const commentsRef = collection(db, 'posts', postId, 'comments');
        await addDoc(commentsRef, {
            uid: user.uid,
            username: currentUserData.username,
            userProfileImage: currentUserData.profileImageUrl || null,
            text: text,
            timestamp: serverTimestamp()
        });
        
        // Update comment count on the post
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            commentsCount: increment(1)
        });
        
        commentInput.value = '';
        
    } catch (error) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment.");
    }
}

function loadComments(postId) {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));
    
    onSnapshot(q, (snapshot) => {
        const commentsList = document.getElementById('comments-list-' + postId);
        if (!commentsList) return;
        
        commentsList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const comment = { id: doc.id, ...doc.data() };
            const commentElement = createCommentElement(comment, postId);
            commentsList.appendChild(commentElement);
        });
    });
}

function createCommentElement(comment, postId) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    commentElement.dataset.commentId = comment.id;
    
    const userInitials = comment.username ? comment.username.substring(0, 2).toUpperCase() : 'KG';
    const avatarHTML = comment.userProfileImage ? 
        '<img src="' + comment.userProfileImage + '" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">' :
        userInitials;
    
    const isCurrentUserComment = auth.currentUser && comment.uid === auth.currentUser.uid;
    const commentActions = isCurrentUserComment ? `
        <div class="comment-actions">
            <button class="comment-action-btn edit-comment-btn" onclick="editComment('${comment.id}', '${postId}')" title="Edit">
                <img src="images/edit.png" alt="Edit" style="width: 12px; height: 12px;">
            </button>
            <button class="comment-action-btn delete-comment-btn" onclick="deleteComment('${comment.id}', '${postId}')" title="Delete">
                <img src="images/delete.png" alt="Delete" style="width: 12px; height: 12px;">
            </button>
        </div>
    ` : '';
    
    commentElement.innerHTML = `
        <div class="avatar-small clickable-user" onclick="showUserProfile('${comment.uid}', {username: '${comment.username}', profileImageUrl: '${comment.userProfileImage || ''}', uid: '${comment.uid}'})">${avatarHTML}</div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-username clickable-user" onclick="showUserProfile('${comment.uid}', {username: '${comment.username}', profileImageUrl: '${comment.userProfileImage || ''}', uid: '${comment.uid}'})">${comment.username}</span>
                <span class="comment-time">${formatTimestamp(comment.timestamp)}</span>
                ${commentActions}
            </div>
            <div class="comment-text" id="comment-text-${comment.id}">${formatTextWithLinks(comment.text)}</div>
            <div class="comment-edit-form" id="comment-edit-${comment.id}" style="display: none;">
                <textarea class="edit-comment-textarea" id="edit-comment-textarea-${comment.id}">${comment.text}</textarea>
                <div class="comment-edit-actions">
                    <button class="save-comment-btn" onclick="saveCommentEdit('${comment.id}', '${postId}')">Save</button>
                    <button class="cancel-comment-btn" onclick="cancelCommentEdit('${comment.id}')">Cancel</button>
                </div>
            </div>
            <div class="comment-footer">
                <button class="comment-reply-btn" onclick="toggleCommentReply('${comment.id}', '${postId}')">Reply</button>
                <div class="comment-reply-form" id="reply-form-${comment.id}" style="display: none;">
                    <input type="text" class="reply-input" id="reply-input-${comment.id}" placeholder="Write a reply..." onkeypress="handleReplyKeypress(event, '${comment.id}', '${postId}')">
                    <button class="reply-submit-btn" onclick="submitReply('${comment.id}', '${postId}')">Reply</button>
                </div>
            </div>
            <div class="comment-replies" id="replies-${comment.id}">
                <!-- Replies will be loaded here -->
            </div>
        </div>
    `;
    
    return commentElement;
}

function loadOnlineUsers() {
    const onlineUsersContainer = document.getElementById('online-users-container');
    if (!onlineUsersContainer) return;

    const usersCollection = collection(db, 'users');
    const q = query(usersCollection);

    onSnapshot(q, (snapshot) => {
        const onlineUsers = [];
        snapshot.forEach(doc => {
            const userData = { id: doc.id, ...doc.data() };
            if (userData.isOnline && doc.id !== auth.currentUser.uid) {
                onlineUsers.push(userData);
            }
        });

        if (onlineUsers.length === 0) {
            onlineUsersContainer.innerHTML = '<div class="no-users">No friends online</div>';
            return;
        }

        onlineUsersContainer.innerHTML = '';
        onlineUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'friend-item';
            userElement.onclick = () => showUserProfile(user.id, user);
            
            const userInitials = user.username ? user.username.substring(0, 2).toUpperCase() : 'KG';
            const avatarHTML = user.profileImageUrl ? 
                `<img src="${user.profileImageUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                userInitials;

            userElement.innerHTML = `
                <div class="friend-avatar">${avatarHTML}</div>
                <div class="friend-info">
                    <div class="friend-name">${user.username}</div>
                    <div class="friend-status" style="color: #42b883;">● Online</div>
                </div>
                <div class="online-dot"></div>
            `;
            
            onlineUsersContainer.appendChild(userElement);
        });
    });
}

function loadTrendingData() {
    const trendingContainer = document.getElementById('trending-container');
    if (!trendingContainer) return;

    // Load trending hashtags
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        const hashtags = {};
        const mentions = {};
        
        snapshot.forEach(doc => {
            const post = doc.data();
            if (post.caption) {
                // Extract hashtags
                const hashtagMatches = post.caption.match(/#(\w+)/g);
                if (hashtagMatches) {
                    hashtagMatches.forEach(hashtag => {
                        const tag = hashtag.toLowerCase();
                        hashtags[tag] = (hashtags[tag] || 0) + 1;
                    });
                }
                
                // Extract mentions
                const mentionMatches = post.caption.match(/@(\w+)/g);
                if (mentionMatches) {
                    mentionMatches.forEach(mention => {
                        const user = mention.toLowerCase();
                        mentions[user] = (mentions[user] || 0) + 1;
                    });
                }
            }
        });

        // Sort and display trending items
        const sortedHashtags = Object.entries(hashtags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const sortedMentions = Object.entries(mentions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        let trendingHTML = '';
        
        if (sortedHashtags.length > 0) {
            trendingHTML += '<div style="margin-bottom: 15px; font-weight: bold; color: #65676b;">Trending Hashtags</div>';
            sortedHashtags.forEach(([hashtag, count]) => {
                trendingHTML += `
                    <div class="trending-item" onclick="searchHashtag('${hashtag.substring(1)}')">
                        <div class="trending-text">${hashtag}</div>
                        <div class="trending-count">${count}</div>
                    </div>
                `;
            });
        }

        if (sortedMentions.length > 0) {
            trendingHTML += '<div style="margin: 15px 0 10px; font-weight: bold; color: #65676b;">Popular Mentions</div>';
            sortedMentions.forEach(([mention, count]) => {
                trendingHTML += `
                    <div class="trending-item" onclick="searchMention('${mention.substring(1)}')">
                        <div class="trending-text">${mention}</div>
                        <div class="trending-count">${count}</div>
                    </div>
                `;
            });
        }

        if (!trendingHTML) {
            trendingHTML = '<div class="no-users">No trending topics yet</div>';
        }

        trendingContainer.innerHTML = trendingHTML;
    });
}

function setupPresenceSystem() {
    if (!auth.currentUser) return;
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    // Set user as online when page loads
    updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp()
    });

    // Set user as offline when page unloads
    window.addEventListener('beforeunload', () => {
        updateDoc(userRef, {
            isOnline: false,
            lastSeen: serverTimestamp()
        });
    });

    // Update last seen every minute
    setInterval(() => {
        if (auth.currentUser) {
            updateDoc(userRef, {
                lastSeen: serverTimestamp()
            });
        }
    }, 60000);
}

// Profile functionality
function showUserProfile(userId, userData) {
    console.log('Showing profile for:', userData.username);
    
    // Show breathing transition
    const transition = showPageTransition('Loading profile...');
    
    setTimeout(() => {
        isProfileView = true;
        currentProfileUser = userData;
        
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            hidePageTransition();
            return;
        }
        
        mainContent.innerHTML = `
            <div class="profile-page">
                <div class="profile-header">
                    <div class="profile-cover">
                        <div class="profile-avatar-large" id="profile-avatar-large">
                            ${userData.profileImageUrl ? 
                                `<img src="${userData.profileImageUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                                userData.username.substring(0, 2).toUpperCase()
                            }
                        </div>
                    </div>
                    <div class="profile-info-section">
                        <h1>${userData.username}</h1>
                        <p>@${userData.username}</p>
                        <div class="profile-stats">
                            <div class="stat" onclick="showUserPosts('${userId}')">
                                <strong>${userData.postsCount || 0}</strong>
                                <span>Posts</span>
                            </div>
                            <div class="stat clickable-stat" onclick="showFollowers('${userId}')">
                                <strong>${userData.followersCount || 0}</strong>
                                <span>Followers</span>
                            </div>
                            <div class="stat clickable-stat" onclick="showFollowing('${userId}')">
                                <strong>${userData.followingCount || 0}</strong>
                                <span>Following</span>
                            </div>
                        </div>
                        ${userId === auth.currentUser.uid ? 
                            '<button class="edit-profile-btn">Edit Profile</button>' :
                            '<button class="profile-follow-btn follow" onclick="toggleFollow(\'' + userId + '\', this)">Follow</button>'
                        }
                    </div>
                </div>
                <div class="profile-tabs">
                    <button class="tab-btn active" onclick="showProfileTab('posts')">Posts</button>
                    <button class="tab-btn" onclick="showProfileTab('about')">About</button>
                    <button class="tab-btn" onclick="showProfileTab('photos')">Photos</button>
                </div>
                <div class="profile-content" id="profile-content">
                    ${userId === auth.currentUser.uid ? `
                        <!-- Post Creator for Own Profile -->
                        <div class="post-creator" style="margin-bottom: 20px;">
                            <div class="post-input">
                                <div class="avatar" id="profile-user-avatar">
                                    ${userData.profileImageUrl ? 
                                        `<img src="${userData.profileImageUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                                        userData.username.substring(0, 2).toUpperCase()
                                    }
                                </div>
                                <textarea id="profilePostText" placeholder="Share something on your profile..." rows="3"></textarea>
                            </div>
                            <div class="post-actions">
                                <div class="post-options">
                                    <button class="option-btn" onclick="selectImageFromProfile()">
                                        <span>📷</span>
                                        <span>Photo</span>
                                    </button>
                                    <button class="option-btn">
                                        <span>😊</span>
                                        <span>Feeling</span>
                                    </button>
                                    <button class="option-btn">
                                        <span>📍</span>
                                        <span>Location</span>
                                    </button>
                                </div>
                                <button class="post-btn" onclick="createPostFromProfile()">Post</button>
                            </div>
                        </div>
                    ` : ''}
                    <div id="profile-posts">Loading posts...</div>
                </div>
            </div>
        `;
        
        // Load user posts
        loadUserPosts(userId);
        
        // Update follow button if not current user
        if (userId !== auth.currentUser.uid) {
            updateFollowButton(userId);
        }
        
        // Hide transition after content is loaded
        hidePageTransition();
    }, 500);
}

async function updateFollowButton(userId) {
    const followBtn = document.querySelector('.profile-follow-btn');
    if (!followBtn || !currentUserData.following) return;
    
    const isFollowing = currentUserData.following.includes(userId);
    
    if (isFollowing) {
        followBtn.textContent = 'Unfollow';
        followBtn.classList.remove('follow');
        followBtn.classList.add('unfollow');
    } else {
        followBtn.textContent = 'Follow';
        followBtn.classList.remove('unfollow');
        followBtn.classList.add('follow');
    }
}

function loadUserPosts(userId) {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        const userPosts = [];
        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            if (post.uid === userId) {
                userPosts.push(post);
            }
        });
        
        const profilePostsContainer = document.getElementById('profile-posts');
        if (profilePostsContainer) {
            if (userPosts.length === 0) {
                profilePostsContainer.innerHTML = '<div class="no-posts"><h3>No posts yet</h3><p>This user hasn\'t posted anything yet.</p></div>';
            } else {
                profilePostsContainer.innerHTML = '';
                userPosts.forEach(post => {
                    const postElement = createPostElement(post, auth.currentUser.uid);
                    profilePostsContainer.appendChild(postElement);
                });
            }
        }
    });
}

// Tab functionality
window.showProfileTab = function(tab) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const profileContent = document.getElementById('profile-content');
    
    switch(tab) {
        case 'posts':
            const isCurrentUser = currentProfileUser.uid === auth.currentUser.uid;
            profileContent.innerHTML = `
                ${isCurrentUser ? `
                    <!-- Post Creator for Own Profile -->
                    <div class="post-creator" style="margin-bottom: 20px;">
                        <div class="post-input">
                            <div class="avatar" id="profile-user-avatar">
                                ${currentProfileUser.profileImageUrl ? 
                                    `<img src="${currentProfileUser.profileImageUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                                    currentProfileUser.username.substring(0, 2).toUpperCase()
                                }
                            </div>
                            <textarea id="profilePostText" placeholder="Share something on your profile..." rows="3"></textarea>
                        </div>
                        <div class="post-actions">
                            <div class="post-options">
                                <button class="option-btn" onclick="selectImageFromProfile()">
                                    <span>📷</span>
                                    <span>Photo</span>
                                </button>
                                <button class="option-btn">
                                    <span>😊</span>
                                    <span>Feeling</span>
                                </button>
                                <button class="option-btn">
                                    <span>📍</span>
                                    <span>Location</span>
                                </button>
                            </div>
                            <button class="post-btn" onclick="createPostFromProfile()">Post</button>
                        </div>
                    </div>
                ` : ''}
                <div id="profile-posts">Loading posts...</div>
            `;
            loadUserPosts(currentProfileUser.uid || auth.currentUser.uid);
            break;
        case 'about':
            profileContent.innerHTML = `
                <div class="about-section">
                    <h3>About</h3>
                    <div class="about-item">
                        <strong>Username</strong>
                        <p>@${currentProfileUser.username}</p>
                    </div>
                    <div class="about-item">
                        <strong>Member since</strong>
                        <p>2025</p>
                    </div>
                </div>
            `;
            break;
        case 'photos':
            profileContent.innerHTML = `
                <div class="photos-section">
                    <h3>Photos</h3>
                    <div class="no-photos">No photos to show</div>
                </div>
            `;
            break;
    }
}

window.showUserPosts = function(userId) {
    showProfileTab('posts');
}

// Home navigation
function showHome() {
    // Show breathing transition
    const transition = showPageTransition('Loading home...');
    
    setTimeout(() => {
        isProfileView = false;
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            hidePageTransition();
            return;
        }
        
        mainContent.innerHTML = `
            <!-- Post Creator -->
            <div class="post-creator">
                <div class="post-input">
                    <div class="avatar" id="user-avatar-main">${currentUserData.username.substring(0, 2).toUpperCase()}</div>
                    <textarea id="postText" placeholder="What's on your mind?" rows="3"></textarea>
                </div>
                <div class="post-actions">
                    <div class="post-options">
                        <button class="option-btn">
                            <img src="images/photo.png" alt="Photo" style="width: 16px; height: 16px;">
                            <span>Photo</span>
                        </button>
                        <button class="option-btn">
                            <span>😊</span>
                            <span>Feeling</span>
                        </button>
                        <button class="option-btn">
                            <span>📍</span>
                            <span>Location</span>
                        </button>
                    </div>
                    <button class="post-btn" onclick="createPost()">Post</button>
                </div>
            </div>

            <!-- Posts Container -->
            <div id="postsContainer">
                <!-- Posts will be loaded here -->
            </div>
            
            <!-- Manual Refresh Button (hidden by default) -->
            <div id="manual-refresh" class="manual-refresh" style="display: none;">
                <button class="refresh-btn" onclick="refreshPosts()">
                    <span>🔄</span>
                    <span>Load New Posts</span>
                </button>
            </div>
        `;
        
        // Reset batching system for fresh home load
        isInitialLoad = true;
        newPostsCount = 0;
        pendingPosts = [];
        hideNewPostsNotification();
        
        updateAvatarElement('user-avatar-main', currentUserData.profileImageUrl, currentUserData.username.substring(0, 2).toUpperCase());
        loadPosts();
        
        // Hide transition after content is loaded
        hidePageTransition();
    }, 300);
}

// Search functions
window.searchHashtag = function(hashtag) {
    console.log('Searching hashtag:', hashtag);
    
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="search-results">
            <div class="search-header">
                <h2>Posts with #${hashtag}</h2>
                <button class="back-btn" onclick="showHome()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">← Back to Home</button>
            </div>
            <div id="hashtag-results">Loading...</div>
        </div>
    `;
    
    // Search for posts containing the hashtag
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        const hashtagPosts = [];
        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            if (post.caption && post.caption.toLowerCase().includes(`#${hashtag.toLowerCase()}`)) {
                hashtagPosts.push(post);
            }
        });
        
        const resultsContainer = document.getElementById('hashtag-results');
        if (!resultsContainer) return;
        
        if (hashtagPosts.length === 0) {
            resultsContainer.innerHTML = '<div class="no-posts"><h3>No posts found</h3><p>No posts contain this hashtag yet.</p></div>';
        } else {
            resultsContainer.innerHTML = '';
            hashtagPosts.forEach(post => {
                const postElement = createPostElement(post, auth.currentUser.uid);
                resultsContainer.appendChild(postElement);
            });
        }
    });
}

window.searchMention = function(username) {
    console.log('Searching mention:', username);
    
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="search-results">
            <div class="search-header">
                <h2>Posts mentioning @${username}</h2>
                <button class="back-btn" onclick="showHome()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">← Back to Home</button>
            </div>
            <div id="mention-results">Loading...</div>
        </div>
    `;
    
    // Search for posts containing the mention
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        const mentionPosts = [];
        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            if (post.caption && post.caption.toLowerCase().includes(`@${username.toLowerCase()}`)) {
                mentionPosts.push(post);
            }
        });
        
        const resultsContainer = document.getElementById('mention-results');
        if (!resultsContainer) return;
        
        if (mentionPosts.length === 0) {
            resultsContainer.innerHTML = '<div class="no-posts"><h3>No posts found</h3><p>No posts mention this user yet.</p></div>';
        } else {
            resultsContainer.innerHTML = '';
            mentionPosts.forEach(post => {
                const postElement = createPostElement(post, auth.currentUser.uid);
                resultsContainer.appendChild(postElement);
            });
        }
    });
}

// Follow/Unfollow functionality
window.toggleFollow = async function(targetUserId, button) {
    const currentUserId = auth.currentUser.uid;
    if (currentUserId === targetUserId) return;
    
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    
    const isFollowing = button.classList.contains('unfollow');
    
    button.disabled = true;
    
    try {
        if (isFollowing) {
            // Unfollow
            await updateDoc(currentUserRef, {
                following: arrayRemove(targetUserId),
                followingCount: increment(-1)
            });
            await updateDoc(targetUserRef, {
                followers: arrayRemove(currentUserId),
                followersCount: increment(-1)
            });
            
            button.textContent = 'Follow';
            button.classList.remove('unfollow');
            button.classList.add('follow');
            
        } else {
            // Follow
            await updateDoc(currentUserRef, {
                following: arrayUnion(targetUserId),
                followingCount: increment(1)
            });
            await updateDoc(targetUserRef, {
                followers: arrayUnion(currentUserId),
                followersCount: increment(1)
            });
            
            button.textContent = 'Unfollow';
            button.classList.remove('follow');
            button.classList.add('unfollow');
        }
        
        // Update current user data
        const userDocSnap = await getDoc(currentUserRef);
        if (userDocSnap.exists()) {
            currentUserData = userDocSnap.data();
        }
        
    } catch (error) {
        console.error("Error toggling follow:", error);
        alert("Failed to update follow status.");
    } finally {
        button.disabled = false;
    }
}

// Enhanced profile functionality with followers/following
window.showFollowers = function(userId) {
    showFollowersModal(userId, 'followers');
}

window.showFollowing = function(userId) {
    showFollowersModal(userId, 'following');
}

async function showFollowersModal(userId, type) {
    const modal = document.getElementById('followers-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalUserList = document.getElementById('modal-user-list');
    
    modalTitle.textContent = type === 'followers' ? 'Followers' : 'Following';
    modalUserList.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';
    modal.style.display = 'block';
    
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            modalUserList.innerHTML = '<div class="no-users">User not found</div>';
            return;
        }
        
        const userData = userDoc.data();
        const userIds = userData[type] || [];
        
        if (userIds.length === 0) {
            modalUserList.innerHTML = '<div class="no-users">No ' + type + ' yet</div>';
            return;
        }
        
        modalUserList.innerHTML = '';
        
        for (const userId of userIds) {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const user = { id: userId, ...userDoc.data() };
                const userElement = createModalUserElement(user);
                modalUserList.appendChild(userElement);
            }
        }
        
    } catch (error) {
        console.error('Error loading followers/following:', error);
        modalUserList.innerHTML = '<div class="no-users">Error loading users</div>';
    }
}

function createModalUserElement(user) {
    const userElement = document.createElement('div');
    userElement.className = 'friend-item';
    userElement.style.marginBottom = '10px';
    
    const userInitials = user.username ? user.username.substring(0, 2).toUpperCase() : 'KG';
    const avatarHTML = user.profileImageUrl ? 
        '<img src="' + user.profileImageUrl + '" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">' :
        userInitials;
    
    const isCurrentUser = user.id === auth.currentUser.uid;
    const isFollowing = currentUserData.following && currentUserData.following.includes(user.id);
    
    userElement.innerHTML = 
        '<div class="friend-avatar" onclick="showUserProfile(\'' + user.id + '\', ' + JSON.stringify(user) + ')">' + avatarHTML + '</div>' +
        '<div class="friend-info" onclick="showUserProfile(\'' + user.id + '\', ' + JSON.stringify(user) + ')">' +
            '<div class="friend-name">' + user.username + '</div>' +
            '<div class="friend-status">' + (user.isOnline ? '● Online' : '○ Offline') + '</div>' +
        '</div>' +
        (!isCurrentUser ? 
            '<button class="follow-btn ' + (isFollowing ? 'unfollow' : '') + '" onclick="toggleFollow(\'' + user.id + '\', this)">' +
                (isFollowing ? '−' : '+') +
            '</button>' : ''
        );
    
    return userElement;
}

window.closeFollowersModal = function() {
    const modal = document.getElementById('followers-modal');
    modal.style.display = 'none';
}

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById('followers-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Format text with hashtags and mentions
function formatTextWithLinks(text) {
    if (!text) return '';
    
    // Replace hashtags
    text = text.replace(/#(\w+)/g, '<span style="color: #667eea; font-weight: bold; cursor: pointer;" onclick="searchHashtag(\'$1\')">#$1</span>');
    
    // Replace mentions
    text = text.replace(/@(\w+)/g, '<span style="color: #667eea; font-weight: bold; cursor: pointer;" onclick="searchMention(\'$1\')">@$1</span>');
    
    return text;
}

console.log('KarmaGo script loaded successfully');

// Global search functionality
window.performGlobalSearch = function() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    console.log('Performing global search for:', query);
    
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="search-results">
            <div class="search-header">
                <h2>Search results for "${query}"</h2>
                <button class="back-btn" onclick="showHome()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">← Back to Home</button>
            </div>
            <div class="search-tabs">
                <button class="search-tab active" onclick="showSearchTab('posts', '${query}')">Posts</button>
                <button class="search-tab" onclick="showSearchTab('users', '${query}')">Users</button>
                <button class="search-tab" onclick="showSearchTab('hashtags', '${query}')">Hashtags</button>
            </div>
            <div id="search-results-content">Loading...</div>
        </div>
    `;
    
    // Start with posts search
    showSearchTab('posts', query);
    searchInput.value = '';
}

window.showSearchTab = function(type, searchQuery) {
    const searchTabs = document.querySelectorAll('.search-tab');
    searchTabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const resultsContainer = document.getElementById('search-results-content');
    resultsContainer.innerHTML = 'Loading...';
    
    switch(type) {
        case 'posts':
            searchPosts(searchQuery);
            break;
        case 'users':
            searchUsers(searchQuery);
            break;
        case 'hashtags':
            searchHashtagsGlobal(searchQuery);
            break;
    }
}

function searchPosts(searchQuery) {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        const matchingPosts = [];
        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            if (post.caption && post.caption.toLowerCase().includes(searchQuery.toLowerCase())) {
                matchingPosts.push(post);
            }
        });
        
        const resultsContainer = document.getElementById('search-results-content');
        if (!resultsContainer) return;
        
        if (matchingPosts.length === 0) {
            resultsContainer.innerHTML = '<div class="no-posts"><h3>No posts found</h3><p>No posts match your search.</p></div>';
        } else {
            resultsContainer.innerHTML = '';
            matchingPosts.forEach(post => {
                const postElement = createPostElement(post, auth.currentUser.uid);
                resultsContainer.appendChild(postElement);
            });
        }
    });
}

function searchUsers(searchQuery) {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection);
    
    onSnapshot(q, (snapshot) => {
        const matchingUsers = [];
        snapshot.forEach(doc => {
            const user = { id: doc.id, ...doc.data() };
            if (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()) && doc.id !== auth.currentUser.uid) {
                matchingUsers.push(user);
            }
        });
        
        const resultsContainer = document.getElementById('search-results-content');
        if (!resultsContainer) return;
        
        if (matchingUsers.length === 0) {
            resultsContainer.innerHTML = '<div class="no-users">No users found matching your search</div>';
        } else {
            resultsContainer.innerHTML = '';
            matchingUsers.forEach(user => {
                const userElement = createSearchUserElement(user);
                resultsContainer.appendChild(userElement);
            });
        }
    });
}

function searchHashtagsGlobal(searchQuery) {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        const hashtags = {};
        
        snapshot.forEach(doc => {
            const post = doc.data();
            if (post.caption) {
                const hashtagMatches = post.caption.match(/#(\w+)/g);
                if (hashtagMatches) {
                    hashtagMatches.forEach(hashtag => {
                        const tag = hashtag.toLowerCase();
                        if (tag.includes('#' + searchQuery.toLowerCase())) {
                            hashtags[tag] = (hashtags[tag] || 0) + 1;
                        }
                    });
                }
            }
        });

        const resultsContainer = document.getElementById('search-results-content');
        if (!resultsContainer) return;
        
        const sortedHashtags = Object.entries(hashtags).sort((a, b) => b[1] - a[1]);
        
        if (sortedHashtags.length === 0) {
            resultsContainer.innerHTML = '<div class="no-users">No hashtags found matching your search</div>';
        } else {
            resultsContainer.innerHTML = '';
            sortedHashtags.forEach(([hashtag, count]) => {
                const hashtagElement = document.createElement('div');
                hashtagElement.className = 'trending-item';
                hashtagElement.style.marginBottom = '10px';
                hashtagElement.onclick = () => searchHashtag(hashtag.substring(1));
                hashtagElement.innerHTML = `
                    <div class="trending-text">${hashtag}</div>
                    <div class="trending-count">${count} posts</div>
                `;
                resultsContainer.appendChild(hashtagElement);
            });
        }
    });
}

function createSearchUserElement(user) {
    const userElement = document.createElement('div');
    userElement.className = 'friend-item';
    userElement.style.marginBottom = '15px';
    userElement.style.padding = '15px';
    userElement.style.background = 'white';
    userElement.style.borderRadius = '10px';
    userElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    
    const userInitials = user.username ? user.username.substring(0, 2).toUpperCase() : 'KG';
    const avatarHTML = user.profileImageUrl ? 
        `<img src="${user.profileImageUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
        userInitials;
    
    const isFollowing = currentUserData.following && currentUserData.following.includes(user.id);
    
    userElement.innerHTML = `
        <div class="friend-avatar" onclick="showUserProfile('${user.id}', ${JSON.stringify(user).replace(/"/g, '&quot;')})" style="width: 50px; height: 50px;">${avatarHTML}</div>
        <div class="friend-info" onclick="showUserProfile('${user.id}', ${JSON.stringify(user).replace(/"/g, '&quot;')})">
            <div class="friend-name" style="font-size: 16px; font-weight: bold;">${user.username}</div>
            <div class="friend-status">${user.isOnline ? '● Online' : '○ Offline'} • ${user.followersCount || 0} followers</div>
        </div>
        <button class="follow-btn ${isFollowing ? 'unfollow' : ''}" onclick="toggleFollow('${user.id}', this)" style="width: auto; height: auto; padding: 8px 16px; border-radius: 20px; font-size: 14px;">
            ${isFollowing ? 'Unfollow' : 'Follow'}
        </button>
    `;
    
    return userElement;
}

// Enhanced page transition functions
function showPageTransition(message = 'Loading...') {
    const existingTransition = document.getElementById('page-transition');
    if (existingTransition) return;
    
    const transition = document.createElement('div');
    transition.id = 'page-transition';
    transition.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
        backdrop-filter: blur(5px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        animation: quickFadeIn 0.3s ease-out forwards;
    `;
    
    transition.innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px; animation: breathe 2s ease-in-out infinite;">${message}</div>
            <div style="width: 40px; height: 40px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; margin: 0 auto; animation: breatheCircle 2s ease-in-out infinite;"></div>
        </div>
    `;
    
    document.body.appendChild(transition);
    return transition;
}

function hidePageTransition() {
    const transition = document.getElementById('page-transition');
    if (transition) {
        transition.style.animation = 'quickFadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            transition.remove();
        }, 300);
    }
}

// Add quick transition styles to head
const quickTransitionStyles = document.createElement('style');
quickTransitionStyles.textContent = `
    @keyframes quickFadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes quickFadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(1.05); }
    }
`;
document.head.appendChild(quickTransitionStyles);

// Profile navigation functions
window.goToProfile = function() {
    if (auth.currentUser && currentUserData) {
        showUserProfile(auth.currentUser.uid, currentUserData);
    }
}

window.goToMyProfile = function() {
    if (auth.currentUser && currentUserData) {
        showUserProfile(auth.currentUser.uid, currentUserData);
    }
}

// Logo error handling
document.addEventListener('DOMContentLoaded', function() {
    const logoImages = document.querySelectorAll('.logo img, .logo-image');
    logoImages.forEach(img => {
        img.addEventListener('error', function() {
            console.log('Logo image failed to load, using text fallback');
            const textFallback = document.createElement('span');
            textFallback.textContent = 'KarmaGo';
            textFallback.style.cssText = 'font-size: 28px; font-weight: bold; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3);';
            this.parentNode.replaceChild(textFallback, this);
        });
    });
});

// Post Edit/Delete Functionality
let currentEditingPostId = null;
let currentDeletingPostId = null;

function editPost(postId) {
    // Hide the post text and show the edit form
    const postText = document.getElementById(`post-text-${postId}`);
    const editForm = document.getElementById(`post-edit-${postId}`);
    
    if (postText && editForm) {
        postText.style.display = 'none';
        editForm.style.display = 'block';
        
        // Focus on the textarea
        const textarea = document.getElementById(`edit-textarea-${postId}`);
        if (textarea) {
            textarea.focus();
            // Set cursor to end of text
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
        
        currentEditingPostId = postId;
    }
}

function cancelPostEdit(postId) {
    // Show the post text and hide the edit form
    const postText = document.getElementById(`post-text-${postId}`);
    const editForm = document.getElementById(`post-edit-${postId}`);
    
    if (postText && editForm) {
        postText.style.display = 'block';
        editForm.style.display = 'none';
        
        // Reset textarea to original value by finding the post data
        const textarea = document.getElementById(`edit-textarea-${postId}`);
        if (textarea && posts) {
            const post = posts.find(p => p.id === postId);
            if (post) {
                textarea.value = post.caption;
            }
        }
    }
    
    currentEditingPostId = null;
}

async function savePostEdit(postId) {
    const textarea = document.getElementById(`edit-textarea-${postId}`);
    if (!textarea) return;
    
    const newCaption = textarea.value.trim();
    if (!newCaption) {
        alert('Post content cannot be empty!');
        return;
    }
    
    try {
        // Update post in Firestore
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            caption: newCaption,
            lastModified: serverTimestamp()
        });
        
        // Update the UI
        const postText = document.getElementById(`post-text-${postId}`);
        const editForm = document.getElementById(`post-edit-${postId}`);
        
        if (postText && editForm) {
            postText.innerHTML = formatTextWithLinks(newCaption);
            postText.style.display = 'block';
            editForm.style.display = 'none';
            
            // Add a subtle highlight animation to show the post was updated
            const postElement = document.querySelector(`[data-id="${postId}"]`);
            if (postElement) {
                setTimeout(() => {
                    postElement.style.transform = '';
                    postElement.style.boxShadow = '';
                }, 500);
            }
        }
        
        currentEditingPostId = null;
        console.log('Post updated successfully');
        
        // Show success message
        showToast('Post updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating post:', error);
        showToast('Failed to update post. Please try again.', 'error');
    }
}

function deletePost(postId) {
    currentDeletingPostId = postId;
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal) {
        deleteModal.style.display = 'block';
    }
}

function cancelDelete() {
    currentDeletingPostId = null;
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal) {
        deleteModal.style.display = 'none';
    }
}

async function confirmDelete() {
    if (!currentDeletingPostId) return;
    
    try {
        // Delete post from Firestore
        const postRef = doc(db, 'posts', currentDeletingPostId);
        await deleteDoc(postRef);
        
        // Remove post from UI
        const postElement = document.querySelector(`[data-id="${currentDeletingPostId}"]`);
        if (postElement) {
            postElement.style.transform = 'scale(0.8)';
            postElement.style.opacity = '0';
            setTimeout(() => {
                postElement.remove();
            }, 300);
        }
        
        console.log('Post deleted successfully');
        showToast('Post deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting post:', error);
        showToast('Failed to delete post. Please try again.', 'error');
    }
    
    // Close modal
    cancelDelete();
}

// Comment Management Functions
let currentEditingCommentId = null;

window.editComment = function(commentId, postId) {
    const commentText = document.getElementById(`comment-text-${commentId}`);
    const editForm = document.getElementById(`comment-edit-${commentId}`);
    
    if (commentText && editForm) {
        commentText.style.display = 'none';
        editForm.style.display = 'block';
        
        const textarea = document.getElementById(`edit-comment-textarea-${commentId}`);
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
        
        currentEditingCommentId = commentId;
    }
}

window.cancelCommentEdit = function(commentId) {
    const commentText = document.getElementById(`comment-text-${commentId}`);
    const editForm = document.getElementById(`comment-edit-${commentId}`);
    
    if (commentText && editForm) {
        commentText.style.display = 'block';
        editForm.style.display = 'none';
    }
    
    currentEditingCommentId = null;
}

window.saveCommentEdit = async function(commentId, postId) {
    const textarea = document.getElementById(`edit-comment-textarea-${commentId}`);
    if (!textarea) return;
    
    const newText = textarea.value.trim();
    if (!newText) {
        showToast('Comment cannot be empty!', 'error');
        return;
    }
    
    try {
        // Update comment in Firestore
        const commentRef = doc(db, 'posts', postId, 'comments', commentId);
        await updateDoc(commentRef, {
            text: newText,
            lastModified: serverTimestamp()
        });
        
        // Update the UI
        const commentText = document.getElementById(`comment-text-${commentId}`);
        const editForm = document.getElementById(`comment-edit-${commentId}`);
        
        if (commentText && editForm) {
            commentText.innerHTML = formatTextWithLinks(newText);
            commentText.style.display = 'block';
            editForm.style.display = 'none';
        }
        
        currentEditingCommentId = null;
        showToast('Comment updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating comment:', error);
        showToast('Failed to update comment. Please try again.', 'error');
    }
}

window.deleteComment = async function(commentId, postId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    try {
        // Delete comment from Firestore
        const commentRef = doc(db, 'posts', postId, 'comments', commentId);
        await deleteDoc(commentRef);
        
        // Update comment count on the post
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            commentsCount: increment(-1)
        });
        
        showToast('Comment deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        showToast('Failed to delete comment. Please try again.', 'error');
    }
}

window.toggleCommentReply = function(commentId, postId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (!replyForm) return;
    
    if (replyForm.style.display === 'none') {
        replyForm.style.display = 'block';
        const replyInput = document.getElementById(`reply-input-${commentId}`);
        if (replyInput) {
            replyInput.focus();
        }
    } else {
        replyForm.style.display = 'none';
    }
}

window.handleReplyKeypress = function(event, commentId, postId) {
    if (event.key === 'Enter') {
        submitReply(commentId, postId);
    }
}

window.submitReply = async function(commentId, postId) {
    const replyInput = document.getElementById(`reply-input-${commentId}`);
    if (!replyInput) return;
    
    const text = replyInput.value.trim();
    if (!text) return;
    
    const user = auth.currentUser;
    if (!user || !currentUserData) {
        showToast('You must be logged in to reply.', 'error');
        return;
    }
    
    try {
        // Add reply to comments subcollection with parent reference
        const commentsRef = collection(db, 'posts', postId, 'comments');
        await addDoc(commentsRef, {
            uid: user.uid,
            username: currentUserData.username,
            userProfileImage: currentUserData.profileImageUrl || null,
            text: text,
            timestamp: serverTimestamp(),
            parentCommentId: commentId,
            isReply: true
        });
        
        // Update comment count on the post
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            commentsCount: increment(1)
        });
        
        replyInput.value = '';
        
        // Hide the reply form
        const replyForm = document.getElementById(`reply-form-${commentId}`);
        if (replyForm) {
            replyForm.style.display = 'none';
        }
        
        showToast('Reply added successfully!', 'success');
        
    } catch (error) {
        console.error("Error adding reply:", error);
        showToast('Failed to add reply. Please try again.', 'error');
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.getElementById('toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast styles
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#42b883' : type === 'error' ? '#e74c3c' : '#667eea'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10002;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Close delete modal when clicking outside
document.addEventListener('click', (e) => {
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal && e.target === deleteModal) {
        cancelDelete();
    }
});

// Handle escape key to cancel editing/delete
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (currentEditingPostId) {
            cancelPostEdit(currentEditingPostId);
        }
        if (currentDeletingPostId) {
            cancelDelete();
        }
    }
});

// Handle keyboard shortcuts in edit mode
function handleEditKeydown(event, postId) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        savePostEdit(postId);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelPostEdit(postId);
    }
}

// Profile posting functionality
let profileSelectedImage = null;

function selectImageFromProfile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            profileSelectedImage = file;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                showImagePreview(e.target.result, 'profile');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function showImagePreview(imageSrc, source = 'main') {
    const textareaId = source === 'profile' ? 'profilePostText' : 'postText';
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    
    // Remove existing preview
    const existingPreview = textarea.parentNode.querySelector('.image-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    // Create preview element
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.style.cssText = `
        position: relative;
        margin-top: 10px;
        border-radius: 10px;
        overflow: hidden;
        max-width: 300px;
    `;
    
    preview.innerHTML = `
        <img src="${imageSrc}" style="width: 100%; height: auto; display: block;">
        <button onclick="removeImagePreview('${source}')" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0,0,0,0.7);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">&times;</button>
    `;
    
    textarea.parentNode.appendChild(preview);
}

function removeImagePreview(source = 'main') {
    if (source === 'profile') {
        profileSelectedImage = null;
        const preview = document.querySelector('#profilePostText').parentNode.querySelector('.image-preview');
        if (preview) preview.remove();
    } else {
        selectedImage = null;
        const preview = document.querySelector('#postText').parentNode.querySelector('.image-preview');
        if (preview) preview.remove();
    }
}

async function createPostFromProfile() {
    const postText = document.getElementById('profilePostText');
    const postBtn = document.querySelector('.profile-content .post-btn');
    
    if (!postText || !currentUserData) return;
    
    const caption = postText.value.trim();
    if (!caption && !profileSelectedImage) {
        showToast('Please write something or select an image!', 'error');
        return;
    }
    
    // Disable button and show loading
    postBtn.disabled = true;
    postBtn.innerHTML = '<span class="loading-spinner"></span> Posting...';
    
    try {
        let imageUrl = null;
        
        // Upload image if selected
        if (profileSelectedImage) {
            const imageRef = ref(storage, `posts/${Date.now()}_${profileSelectedImage.name}`);
            const snapshot = await uploadBytes(imageRef, profileSelectedImage);
            imageUrl = await getDownloadURL(snapshot.ref);
        }
        
        // Create post document
        const postData = {
            uid: auth.currentUser.uid,
            username: currentUserData.username,
            userProfileImage: currentUserData.profileImageUrl || null,
            caption: caption,
            imageurl: imageUrl,
            timestamp: serverTimestamp(),
            likedBy: [],
            commentsCount: 0
        };
        
        // Add to Firestore
        await addDoc(collection(db, 'posts'), postData);
        
        // Clear form
        postText.value = '';
        removeImagePreview('profile');
        
        // Show success message
        showToast('Post created successfully!', 'success');
        
        // Post will be included in the next batch refresh when 3 posts accumulate
        
        // Reload profile posts to show the new post
        if (currentProfileUser && currentProfileUser.uid === auth.currentUser.uid) {
            loadUserPosts(auth.currentUser.uid);
        }
        
    } catch (error) {
        console.error('Error creating post from profile:', error);
        showToast('Failed to create post. Please try again.', 'error');
    } finally {
        // Re-enable button
        postBtn.disabled = false;
        postBtn.innerHTML = 'Post';
    }
}

// Update the existing selectImage function to use the new preview system
window.selectImage = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            selectedImage = file;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                showImagePreview(e.target.result, 'main');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}