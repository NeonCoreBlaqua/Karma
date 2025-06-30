// KarmaGo - Urban Social Platform JavaScript
class KarmaGo {
    constructor() {
        this.currentUser = null;
        this.currentVibe = null;
        this.posts = [];
        this.characters = [];
        this.karmaScore = 2450;
        this.currentView = 'home';
        
        this.init();
    }
    
    init() {
        this.loadDefaultCharacters();
        this.loadSamplePosts();
        this.bindEvents();
        this.updateStats();
        this.loadTrendingContent();
        this.loadMusicContent();
        this.loadNewsContent();
        
        // Show initial view
        this.showView('home');
    }
    
    loadDefaultCharacters() {
        this.characters = [
            {
                id: 1,
                name: "DJ StreetKing",
                bio: "Producer, DJ, Street Legend",
                avatar: "SK",
                color: "#ff6b35",
                posts: 0,
                karma: 890,
                verified: true
            },
            {
                id: 2,
                name: "Maya Fierce",
                bio: "Fashion Icon & Entrepreneur",
                avatar: "MF",
                color: "#8c7ae6",
                posts: 0,
                karma: 1200,
                verified: true
            },
            {
                id: 3,
                name: "Chef Rico",
                bio: "Street Food King",
                avatar: "CR",
                color: "#2ed573",
                posts: 0,
                karma: 650,
                verified: false
            },
            {
                id: 4,
                name: "B-Girl Storm",
                bio: "Dancer, Choreographer, Teacher",
                avatar: "BS",
                color: "#3742fa",
                posts: 0,
                karma: 750,
                verified: true
            },
            {
                id: 5,
                name: "Marcus Truth",
                bio: "Street Journalist & Activist",
                avatar: "MT",
                color: "#ff4757",
                posts: 0,
                karma: 1100,
                verified: true
            }
        ];
        
        this.renderCharacters();
    }
    
    loadSamplePosts() {
        const samplePosts = [
            {
                characterId: 1,
                content: "Just dropped a new beat! 🔥 This one's for everyone grinding in the streets. Never stop believing in your dreams! #NewMusic #StreetBeats #Grind",
                vibe: "🔥 Fire",
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                likes: 243,
                shares: 67,
                comments: 89,
                media: { type: 'audio', url: '#' }
            },
            {
                characterId: 2,
                content: "Street fashion isn't just about looking good - it's about expressing who you are! Today's look: vintage meets futuristic ✨ #StreetFashion #Style #BossUp",
                vibe: "👑 Boss",
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                likes: 567,
                shares: 123,
                comments: 45,
                media: { type: 'image', url: '#' }
            },
            {
                characterId: 3,
                content: "New food truck location tomorrow! Corner of 5th and Main. Bringing that authentic flavor to the people! Who's pulling up? 🌮🔥 #FoodTruck #StreetFood #Community",
                vibe: "💯 Real",
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                likes: 189,
                shares: 234,
                comments: 78,
                media: { type: 'image', url: '#' }
            },
            {
                characterId: 4,
                content: "Teaching the next generation is everything! 🙏 These kids have so much talent and passion. The future of dance is in good hands! #Dance #Youth #Community #Passion",
                vibe: "🎵 Vibes",
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
                likes: 432,
                shares: 89,
                comments: 156,
                media: { type: 'video', url: '#' }
            },
            {
                characterId: 5,
                content: "Real talk: Our community deserves better opportunities. Change starts with us speaking up and taking action. Let's build something better together! 💪 #RealTalk #Community #Change",
                vibe: "💯 Real",
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
                likes: 678,
                shares: 245,
                comments: 234,
                media: null
            }
        ];
        
        samplePosts.forEach((postData, index) => {
            const character = this.characters.find(c => c.id === postData.characterId);
            const post = {
                id: Date.now() + index,
                characterId: character.id,
                characterName: character.name,
                characterAvatar: character.avatar,
                characterColor: character.color,
                verified: character.verified,
                content: postData.content,
                vibe: postData.vibe,
                timestamp: postData.timestamp,
                likes: postData.likes,
                shares: postData.shares,
                comments: postData.comments,
                media: postData.media,
                liked: false,
                shared: false
            };
            
            this.posts.push(post);
            character.posts++;
        });
        
        this.renderPosts();
    }
    
    bindEvents() {
        // Navigation events
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.showView(view);
            });
        });
        
        // Vibe button events
        document.querySelectorAll('.vibe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.vibe-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentVibe = e.target.dataset.vibe;
            });
        });
        
        // Search events
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value);
            }
        });
        
        document.querySelector('.search-btn').addEventListener('click', () => {
            const query = document.getElementById('searchInput').value;
            this.performSearch(query);
        });
        
        // Media button events
        document.querySelectorAll('.media-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.onclick?.toString().match(/\w+(?=\(\))/)?.[0];
                if (action) {
                    this[action]?.();
                }
            });
        });
    }
    
    renderCharacters() {
        const container = document.getElementById('characterList');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.characters.forEach(character => {
            const characterElement = document.createElement('div');
            characterElement.className = 'character-item';
            characterElement.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: rgba(22, 33, 62, 0.6);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
            `;
            
            characterElement.innerHTML = `
                <div style="
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: ${character.color};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                    font-size: 16px;
                ">${character.avatar}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: white; display: flex; align-items: center; gap: 5px;">
                        ${character.name}
                        ${character.verified ? '<span style="color: #ffd700;">✓</span>' : ''}
                    </div>
                    <div style="font-size: 12px; color: #718096;">${character.posts} posts • ${character.karma} karma</div>
                </div>
            `;
            
            characterElement.addEventListener('click', () => this.selectCharacter(character));
            characterElement.addEventListener('mouseenter', () => {
                characterElement.style.background = 'rgba(255, 107, 53, 0.2)';
                characterElement.style.borderColor = '#ff6b35';
                characterElement.style.transform = 'translateX(5px)';
            });
            characterElement.addEventListener('mouseleave', () => {
                characterElement.style.background = 'rgba(22, 33, 62, 0.6)';
                characterElement.style.borderColor = 'transparent';
                characterElement.style.transform = 'translateX(0)';
            });
            
            container.appendChild(characterElement);
        });
    }
    
    selectCharacter(character) {
        this.currentUser = character;
        
        // Update UI
        const avatarElement = document.getElementById('currentAvatar');
        const nameElement = document.getElementById('currentUserName');
        
        if (avatarElement) {
            avatarElement.textContent = character.avatar;
            avatarElement.style.background = character.color;
        }
        
        if (nameElement) {
            nameElement.textContent = character.name;
        }
        
        // Update character selection in sidebar
        document.querySelectorAll('.character-item').forEach(item => {
            item.style.borderColor = 'transparent';
        });
        
        event.target.closest('.character-item').style.borderColor = '#ff6b35';
        
        this.showNotification(`Now posting as ${character.name}!`);
    }
    
    renderPosts() {
        const container = document.getElementById('feedPosts');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'feed-post';
            postElement.style.cssText = `
                background: rgba(26, 26, 46, 0.9);
                border: 1px solid #16213e;
                border-radius: 20px;
                padding: 25px;
                margin-bottom: 25px;
                backdrop-filter: blur(15px);
                transition: all 0.3s ease;
            `;
            
            const timeAgo = this.getTimeAgo(post.timestamp);
            
            postElement.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        background: ${post.characterColor};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        color: white;
                        margin-right: 15px;
                        border: 2px solid #16213e;
                    ">${post.characterAvatar}</div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                            <span style="font-weight: 700; color: white; font-size: 16px;">${post.characterName}</span>
                            ${post.verified ? '<span style="color: #ffd700; font-size: 14px;">✓</span>' : ''}
                            <span style="color: #718096; font-size: 12px;">• ${timeAgo}</span>
                        </div>
                        <div style="color: #718096; font-size: 14px;">${post.vibe}</div>
                    </div>
                </div>
                
                <div style="color: white; line-height: 1.6; margin-bottom: 20px; font-size: 15px;">
                    ${post.content}
                </div>
                
                ${post.media ? this.renderMedia(post.media) : ''}
                
                <div style="display: flex; gap: 25px; padding-top: 15px; border-top: 1px solid #16213e;">
                    <button class="post-action-btn" onclick="karmaGo.toggleLike(${post.id})" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: none;
                        border: none;
                        color: ${post.liked ? '#ff4757' : '#718096'};
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s ease;
                        padding: 8px 12px;
                        border-radius: 8px;
                    ">
                        ❤️ ${post.likes}
                    </button>
                    <button class="post-action-btn" onclick="karmaGo.showComments(${post.id})" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: none;
                        border: none;
                        color: #718096;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s ease;
                        padding: 8px 12px;
                        border-radius: 8px;
                    ">
                        💬 ${post.comments}
                    </button>
                    <button class="post-action-btn" onclick="karmaGo.sharePost(${post.id})" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: none;
                        border: none;
                        color: ${post.shared ? '#2ed573' : '#718096'};
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s ease;
                        padding: 8px 12px;
                        border-radius: 8px;
                    ">
                        🔄 ${post.shares}
                    </button>
                    <button class="post-action-btn" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: none;
                        border: none;
                        color: #718096;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s ease;
                        padding: 8px 12px;
                        border-radius: 8px;
                        margin-left: auto;
                    ">
                        📤 Share
                    </button>
                </div>
            `;
            
            // Add hover effects
            postElement.addEventListener('mouseenter', () => {
                postElement.style.borderColor = '#ff6b35';
                postElement.style.transform = 'translateY(-2px)';
                postElement.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.2)';
            });
            
            postElement.addEventListener('mouseleave', () => {
                postElement.style.borderColor = '#16213e';
                postElement.style.transform = 'translateY(0)';
                postElement.style.boxShadow = 'none';
            });
            
            container.appendChild(postElement);
        });
    }
    
    renderMedia(media) {
        switch (media.type) {
            case 'image':
                return `<div style="margin-bottom: 15px; border-radius: 12px; overflow: hidden; background: #16213e; height: 200px; display: flex; align-items: center; justify-content: center; color: #718096;">📸 Image Content</div>`;
            case 'video':
                return `<div style="margin-bottom: 15px; border-radius: 12px; overflow: hidden; background: #16213e; height: 250px; display: flex; align-items: center; justify-content: center; color: #718096;">🎥 Video Content</div>`;
            case 'audio':
                return `<div style="margin-bottom: 15px; border-radius: 12px; overflow: hidden; background: #16213e; height: 80px; display: flex; align-items: center; justify-content: center; color: #718096;">🎵 Audio Track</div>`;
            default:
                return '';
        }
    }
    
    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.content-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            }
        });
        
        this.currentView = viewName;
    }
    
    createMainPost() {
        if (!this.currentUser) {
            this.showNotification('Please select a character first!', 'error');
            return;
        }
        
        const content = document.getElementById('mainPostInput').value.trim();
        if (!content) {
            this.showNotification('Please write something for your post!', 'error');
            return;
        }
        
        const post = {
            id: Date.now(),
            characterId: this.currentUser.id,
            characterName: this.currentUser.name,
            characterAvatar: this.currentUser.avatar,
            characterColor: this.currentUser.color,
            verified: this.currentUser.verified,
            content: content,
            vibe: this.currentVibe || '💯 Real',
            timestamp: new Date(),
            likes: 0,
            shares: 0,
            comments: 0,
            media: null,
            liked: false,
            shared: false
        };
        
        this.posts.unshift(post);
        this.currentUser.posts++;
        
        // Clear form
        document.getElementById('mainPostInput').value = '';
        this.currentVibe = null;
        document.querySelectorAll('.vibe-btn').forEach(btn => btn.classList.remove('active'));
        
        this.renderPosts();
        this.renderCharacters();
        this.updateStats();
        
        this.showNotification('Your post is live! 🔥');
    }
    
    toggleLike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            if (post.liked) {
                post.likes--;
                post.liked = false;
            } else {
                post.likes++;
                post.liked = true;
                this.karmaScore += 5; // Gain karma for engaging
            }
            this.renderPosts();
            this.updateStats();
        }
    }
    
    sharePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            post.shares++;
            post.shared = true;
            this.karmaScore += 10; // Gain karma for sharing
            this.renderPosts();
            this.updateStats();
            this.showNotification('Post shared! 🔄');
        }
    }
    
    showComments(postId) {
        this.showNotification('Comments feature coming soon! 💬');
    }
    
    updateStats() {
        const elements = {
            totalPosts: document.getElementById('totalPosts'),
            totalLikes: document.getElementById('totalLikes'),
            totalShares: document.getElementById('totalShares'),
            totalViews: document.getElementById('totalViews'),
            karmaScore: document.getElementById('karmaScore')
        };
        
        if (elements.totalPosts) elements.totalPosts.textContent = this.posts.length;
        if (elements.totalLikes) elements.totalLikes.textContent = this.posts.reduce((sum, post) => sum + post.likes, 0);
        if (elements.totalShares) elements.totalShares.textContent = this.posts.reduce((sum, post) => sum + post.shares, 0);
        if (elements.totalViews) elements.totalViews.textContent = (this.posts.length * 147).toLocaleString(); // Simulated views
        if (elements.karmaScore) elements.karmaScore.textContent = this.karmaScore.toLocaleString();
    }
    
    loadTrendingContent() {
        // Trending content loaded dynamically
        console.log('Loading trending content...');
    }
    
    loadMusicContent() {
        // Music content loaded dynamically
        console.log('Loading music content...');
    }
    
    loadNewsContent() {
        // News content loaded dynamically
        console.log('Loading news content...');
    }
    
    performSearch(query) {
        if (!query.trim()) return;
        
        this.showNotification(`Searching for: "${query}"...`);
        // Implement search functionality
    }
    
    getTimeAgo(timestamp) {
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
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#ff4757' : '#2ed573'};
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Media functions (placeholders)
    addPhoto() { this.showNotification('Photo upload coming soon! 📸'); }
    addVideo() { this.showNotification('Video upload coming soon! 🎥'); }
    addMusic() { this.showNotification('Music upload coming soon! 🎵'); }
    addLocation() { this.showNotification('Location tagging coming soon! 📍'); }
    goLive() { this.showNotification('Live streaming coming soon! 📹'); }
    showMarketplace() { this.showNotification('Marketplace coming soon! 💰'); }
    showCreateProfile() { this.showNotification('Profile creator coming soon! 👤'); }
}

// Initialize KarmaGo
const karmaGo = new KarmaGo();

// Global functions for onclick handlers
function createMainPost() { karmaGo.createMainPost(); }
function showCreateProfile() { karmaGo.showCreateProfile(); }
function goLive() { karmaGo.goLive(); }
function showMarketplace() { karmaGo.showMarketplace(); }
function addPhoto() { karmaGo.addPhoto(); }
function addVideo() { karmaGo.addVideo(); }
function addMusic() { karmaGo.addMusic(); }
function addLocation() { karmaGo.addLocation(); }

// Add some CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .post-action-btn:hover {
        background: rgba(255, 107, 53, 0.2) !important;
        color: #ff6b35 !important;
        transform: translateY(-1px);
    }
`;
document.head.appendChild(style);
