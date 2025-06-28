// Offline demo script for KarmaGo
// This script provides demo functionality when Firebase is not available

import { db, auth, storage } from './firebase-config-fallback.js';

console.log('Loading KarmaGo in offline demo mode...');

// Demo data
const demoUsers = [
    { id: 'user1', displayName: 'Alice Johnson', email: 'alice@demo.com' },
    { id: 'user2', displayName: 'Bob Smith', email: 'bob@demo.com' },
    { id: 'user3', displayName: 'Carol Davis', email: 'carol@demo.com' }
];

const demoPosts = [
    {
        id: 'post1',
        content: 'Welcome to KarmaGo! This is a demo post to show how the platform works. ✨',
        authorId: 'user1',
        authorName: 'Alice Johnson',
        timestamp: new Date(Date.now() - 3600000),
        likes: 12,
        comments: []
    },
    {
        id: 'post2',
        content: 'Just finished an amazing workout! Feeling energized and ready to take on the day. 💪 #fitness #motivation',
        authorId: 'user2',
        authorName: 'Bob Smith',
        timestamp: new Date(Date.now() - 7200000),
        likes: 8,
        comments: [
            { id: 'c1', authorName: 'Alice Johnson', content: 'Great job! Keep it up!', timestamp: new Date(Date.now() - 3600000) }
        ]
    },
    {
        id: 'post3',
        content: 'Beautiful sunset today! Sometimes you just need to stop and appreciate the simple things in life. 🌅',
        authorId: 'user3',
        authorName: 'Carol Davis',
        timestamp: new Date(Date.now() - 10800000),
        likes: 15,
        comments: []
    }
];

// Initialize demo mode
let currentUserData = { id: 'demo-user', displayName: 'Demo User', email: 'demo@karmago.com' };
let posts = [...demoPosts];

// Show demo notification
function showDemoNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #f39c12, #e67e22);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">🔌</span>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Demo Mode</div>
                <div style="font-size: 12px; opacity: 0.9;">Firebase offline - using demo data</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.style.transition = 'all 0.3s ease';
        notification.style.transform = 'translateX(350px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Initialize the app with demo data
function initializeDemoMode() {
    // Remove loading screen
    const breathingOverlay = document.getElementById('breathing-overlay');
    if (breathingOverlay) {
        breathingOverlay.remove();
    }
    
    // Show demo notification
    showDemoNotification();
    
    // Initialize with demo posts
    displayPosts();
    
    // Update user info
    updateUserInfo();
    
    console.log('Demo mode initialized successfully');
}

function displayPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = posts.map(post => `
        <div class="post" data-id="${post.id}">
            <div class="post-header">
                <div class="avatar">
                    ${post.authorName.charAt(0).toUpperCase()}
                </div>
                <div class="post-info">
                    <h4>${post.authorName}</h4>
                    <small>${formatTime(post.timestamp)}</small>
                </div>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            <div class="post-stats">
                <span>${post.likes} likes</span>
                <span>${post.comments.length} comments</span>
            </div>
            <div class="post-actions-bar">
                <button class="action-btn like-btn" onclick="toggleLike('${post.id}')">
                    <img src="images/like.png" alt="Like" width="20">
                    Like
                </button>
                <button class="action-btn" onclick="toggleComments('${post.id}')">
                    <img src="images/comment.png" alt="Comment" width="20">
                    Comment
                </button>
                <button class="action-btn">
                    <img src="images/share.png" alt="Share" width="20">
                    Share
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="comments-container">
                    ${post.comments.map(comment => `
                        <div class="comment-item">
                            <div class="avatar-small">${comment.authorName.charAt(0)}</div>
                            <div class="comment-content">
                                <div class="comment-header">
                                    <span class="comment-username">${comment.authorName}</span>
                                    <span class="comment-time">${formatTime(comment.timestamp)}</span>
                                </div>
                                <div class="comment-text">${comment.content}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="comment-input">
                    <div class="avatar-small">D</div>
                    <input type="text" placeholder="Write a comment..." onkeypress="handleCommentSubmit(event, '${post.id}')">
                    <button class="comment-btn" onclick="addComment('${post.id}')">Post</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateUserInfo() {
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = currentUserData.displayName;
    });
    
    const avatarElements = document.querySelectorAll('.user-avatar');
    avatarElements.forEach(el => {
        el.textContent = currentUserData.displayName.charAt(0).toUpperCase();
    });
}

function formatTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// Global functions for demo interactions
window.toggleLike = function(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.likes = Math.max(0, post.likes + (Math.random() > 0.5 ? 1 : -1));
        displayPosts();
    }
};

window.toggleComments = function(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) {
        commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
    }
};

window.addComment = function(postId) {
    const input = document.querySelector(`#comments-${postId} input`);
    const post = posts.find(p => p.id === postId);
    
    if (input.value.trim() && post) {
        post.comments.push({
            id: `c${Date.now()}`,
            authorName: currentUserData.displayName,
            content: input.value.trim(),
            timestamp: new Date()
        });
        input.value = '';
        displayPosts();
    }
};

window.handleCommentSubmit = function(event, postId) {
    if (event.key === 'Enter') {
        addComment(postId);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDemoMode);
} else {
    initializeDemoMode();
}
