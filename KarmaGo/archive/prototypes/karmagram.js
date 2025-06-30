// KarmaGram Main JavaScript Functions

// Sample avatars to get you started - you can modify these!
let avatars = [
    {
        id: 1,
        name: "Victoria Nightshade",
        bio: "Mysterious vampire queen with a dark past",
        avatar: "VN",
        color: "#8e44ad",
        posts: 0,
        likes: 0
    },
    {
        id: 2,
        name: "Marcus Steel",
        bio: "Tough detective solving supernatural crimes",
        avatar: "MS",
        color: "#2c3e50",
        posts: 0,
        likes: 0
    },
    {
        id: 3,
        name: "Luna Moonwhisper",
        bio: "Ethereal fairy with healing powers",
        avatar: "LM",
        color: "#9b59b6",
        posts: 0,
        likes: 0
    },
    {
        id: 4,
        name: "Rex Thunderborn",
        bio: "Dragon shifter, protector of the realm",
        avatar: "RT",
        color: "#e74c3c",
        posts: 0,
        likes: 0
    },
    {
        id: 5,
        name: "Sophia Winters",
        bio: "Ice mage with a warm heart",
        avatar: "SW",
        color: "#3498db",
        posts: 0,
        likes: 0
    }
];

let posts = [];
let currentAvatar = null;
let currentMood = null;

// Initialize the app
function init() {
    loadAvatars();
    loadPosts();
    updateStats();
    
    // Add some sample posts to get you started
    if (posts.length === 0) {
        addSamplePosts();
    }
}

function loadAvatars() {
    const container = document.getElementById('avatarProfiles');
    container.innerHTML = '';
    
    avatars.forEach(avatar => {
        const avatarCard = document.createElement('div');
        avatarCard.className = 'avatar-card';
        avatarCard.onclick = () => selectAvatar(avatar);
        
        avatarCard.innerHTML = `
            <div class="avatar-pic" style="background: ${avatar.color}">${avatar.avatar}</div>
            <div>
                <div style="font-weight: bold;">${avatar.name}</div>
                <div style="font-size: 12px; color: #666;">${avatar.posts} posts</div>
            </div>
        `;
        
        container.appendChild(avatarCard);
    });
}

function selectAvatar(avatar) {
    currentAvatar = avatar;
    
    // Update UI
    document.getElementById('currentAvatarPic').textContent = avatar.avatar;
    document.getElementById('currentAvatarPic').style.background = avatar.color;
    document.getElementById('currentAvatarName').textContent = avatar.name;
    
    // Update active state
    document.querySelectorAll('.avatar-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.avatar-card').classList.add('active');
}

function createPost() {
    if (!currentAvatar) {
        alert('Please select an avatar first!');
        return;
    }
    
    const content = document.getElementById('postInput').value.trim();
    if (!content) {
        alert('Please write something for your post!');
        return;
    }
    
    const post = {
        id: Date.now(),
        avatarId: currentAvatar.id,
        avatarName: currentAvatar.name,
        avatarPic: currentAvatar.avatar,
        avatarColor: currentAvatar.color,
        content: content,
        mood: currentMood || '📝 Story',
        timestamp: new Date(),
        likes: 0,
        comments: [],
        liked: false
    };
    
    posts.unshift(post);
    currentAvatar.posts++;
    
    // Clear form
    document.getElementById('postInput').value = '';
    currentMood = null;
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    
    loadPosts();
    loadAvatars();
    updateStats();
}

function loadPosts() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '';
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <h3>No posts yet!</h3>
                <p>Select an avatar and start sharing your story moments!</p>
            </div>
        `;
        return;
    }
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        
        const timeAgo = getTimeAgo(post.timestamp);
        
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-avatar" style="background: ${post.avatarColor}">${post.avatarPic}</div>
                <div class="post-info">
                    <h3>${post.avatarName}</h3>
                    <div class="post-time">${timeAgo}</div>
                </div>
                <div class="post-mood">${post.mood}</div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
                <button class="action-btn ${post.liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    ❤️ ${post.likes} Likes
                </button>
                <button class="action-btn" onclick="replyToPost(${post.id})">
                    💬 Reply
                </button>
                <button class="action-btn" onclick="sharePost(${post.id})">
                    🔄 Share
                </button>
            </div>
        `;
        
        container.appendChild(postElement);
    });
}

function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        if (post.liked) {
            post.likes--;
            post.liked = false;
        } else {
            post.likes++;
            post.liked = true;
        }
        loadPosts();
        updateStats();
    }
}

function updateStats() {
    document.getElementById('totalAvatars').textContent = avatars.length;
    document.getElementById('totalPosts').textContent = posts.length;
    document.getElementById('totalLikes').textContent = posts.reduce((total, post) => total + post.likes, 0);
    
    // Active today (posts from today)
    const today = new Date().toDateString();
    const todayPosts = posts.filter(post => post.timestamp.toDateString() === today);
    document.getElementById('activeToday').textContent = todayPosts.length;
}

function getTimeAgo(timestamp) {
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

function addSamplePosts() {
    // Add some dramatic sample posts to get you started!
    const samplePosts = [
        {
            avatarId: 1,
            content: "The shadows whisper secrets tonight... Marcus is getting too close to the truth. Should I reveal myself or let him discover what he's truly hunting? 🌙",
            mood: "😱 Drama"
        },
        {
            avatarId: 2,
            content: "Another body found with mysterious bite marks. This case is unlike anything I've seen in 15 years on the force. Time to dig deeper into the supernatural underworld. 🔍",
            mood: "🕵️ Mystery"
        },
        {
            avatarId: 3,
            content: "The healing circle was beautiful tonight! So many wounded souls found peace under the moonlight. But I sense darkness approaching our sanctuary... 🌸",
            mood: "😌 Peaceful"
        },
        {
            avatarId: 4,
            content: "ENOUGH! The vampire queen threatens innocent lives. Time to unleash the dragon's fury! No one messes with my territory! 🔥🐉",
            mood: "⚔️ Action"
        }
    ];
    
    samplePosts.forEach((sample, index) => {
        const avatar = avatars.find(a => a.id === sample.avatarId);
        const post = {
            id: Date.now() + index,
            avatarId: avatar.id,
            avatarName: avatar.name,
            avatarPic: avatar.avatar,
            avatarColor: avatar.color,
            content: sample.content,
            mood: sample.mood,
            timestamp: new Date(Date.now() - (index * 3600000)), // Stagger posts by hours
            likes: Math.floor(Math.random() * 15) + 1,
            comments: [],
            liked: false
        };
        posts.push(post);
        avatar.posts++;
    });
}

// Mood button functionality
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMood = this.dataset.mood;
        });
    });
});

function showCreateAvatar() {
    const name = prompt('Enter avatar name:');
    if (name) {
        const bio = prompt('Enter avatar bio/description:') || 'A mysterious character in your story';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const colors = ['#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#f39c12', '#1abc9c', '#34495e'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const newAvatar = {
            id: Date.now(),
            name: name,
            bio: bio,
            avatar: initials,
            color: color,
            posts: 0,
            likes: 0
        };
        
        avatars.push(newAvatar);
        loadAvatars();
        updateStats();
        alert(`${name} has been added to your story! Start posting as this character!`);
    }
}

function exportStory() {
    const storyData = {
        avatars: avatars,
        posts: posts,
        exportDate: new Date()
    };
    
    const dataStr = JSON.stringify(storyData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-roleplay-story.json';
    link.click();
    
    alert('Your story has been exported! Perfect for backing up your Netflix-worthy content! 🎬');
}

function showAllPosts() {
    // Filter functionality can be added here
    loadPosts();
}

// Placeholder functions for future features
function replyToPost(postId) {
    alert('Reply feature coming soon!');
}

function sharePost(postId) {
    alert('Share feature coming soon!');
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

// Initialize the app when page loads
window.addEventListener('load', init);
