// KarmaGo Prototype - Urban Culture & Street Life
class KarmaGoApp {
    constructor() {
        this.currentUser = {
            username: 'StreetKing_NYC',
            avatar: '../images/profilem.png',
            verified: true,
            followers: 1200,
            following: 850,
            location: 'Brooklyn'
        };
        
        this.posts = [
            {
                id: 1,
                user: {
                    username: 'DJ_Kool_NYC',
                    avatar: '../images/profilew.png',
                    verified: true,
                    location: 'Manhattan'
                },
                content: 'Just dropped my new mixtape! The streets are talking 🔥 #BrooklynVibes #HipHop #NewMusic',
                image: null,
                music: {
                    title: 'Street Dreams',
                    artist: 'DJ_Kool_NYC',
                    duration: '3:45'
                },
                timestamp: '2 hours ago',
                likes: 1547,
                comments: 89,
                shares: 234,
                liked: false,
                category: 'music'
            },
            {
                id: 2,
                user: {
                    username: 'FashionKilla_BK',
                    avatar: '../images/profile.png',
                    verified: false,
                    location: 'Brooklyn'
                },
                content: 'Streetwear meets high fashion. This fit is everything! 💯 Where my fashion lovers at? #StreetFashion #OOTD #Brooklyn',
                image: '../images/BlaquaCrown.png',
                timestamp: '4 hours ago',
                likes: 892,
                comments: 156,
                shares: 67,
                liked: true,
                category: 'fashion'
            },
            {
                id: 3,
                user: {
                    username: 'StreetChef_NYC',
                    avatar: '../images/profilem.png',
                    verified: true,
                    location: 'Harlem'
                },
                content: 'Best halal spot in the city! This chicken over rice hits different at 2am 🌟 #NYCEats #StreetFood #Halal',
                image: null,
                timestamp: '6 hours ago',
                likes: 2341,
                comments: 312,
                shares: 89,
                liked: false,
                category: 'food'
            },
            {
                id: 4,
                user: {
                    username: 'MC_Brooklyn',
                    avatar: '../images/profilew.png',
                    verified: true,
                    location: 'Brooklyn'
                },
                content: 'Cypher battle tonight at Times Square! Come through if you got bars 🎤 #Cypher #HipHop #BattleRap #NYC',
                image: null,
                timestamp: '8 hours ago',
                likes: 3456,
                comments: 567,
                shares: 234,
                liked: true,
                category: 'events'
            },
            {
                id: 5,
                user: {
                    username: 'UrbanExplorer_NY',
                    avatar: '../images/profile.png',
                    verified: false,
                    location: 'Queens'
                },
                content: 'Found this amazing graffiti art in Queens! The talent in this city is unreal 🎨 #StreetArt #Queens #UrbanCulture',
                image: '../images/BlaquaFist.png',
                timestamp: '12 hours ago',
                likes: 1789,
                comments: 203,
                shares: 145,
                liked: false,
                category: 'art'
            }
        ];
        
        this.stories = [
            {
                id: 1,
                user: 'DJ_Kool_NYC',
                avatar: '../images/profilew.png',
                active: true,
                timestamp: '2h'
            },
            {
                id: 2,
                user: 'FashionKilla',
                avatar: '../images/profilem.png',
                active: false,
                timestamp: '5h'
            },
            {
                id: 3,
                user: 'FoodieLife',
                avatar: '../images/profile.png',
                active: false,
                timestamp: '8h'
            }
        ];
        
        this.liveEvents = [
            {
                id: 1,
                title: 'Hip-Hop Cypher Battle',
                location: 'Times Square',
                viewers: 2100,
                host: 'MC_Brooklyn',
                avatar: '../images/profilew.png',
                category: 'music'
            },
            {
                id: 2,
                title: 'Street Fashion Show',
                location: 'Brooklyn',
                viewers: 890,
                host: 'FashionKilla_BK',
                avatar: '../images/profilem.png',
                category: 'fashion'
            }
        ];
        
        this.cityNews = [
            {
                id: 1,
                category: 'MUSIC',
                title: 'New drill track drops tomorrow from BK\'s finest',
                timestamp: '2h ago',
                source: 'HipHopNYC'
            },
            {
                id: 2,
                category: 'FOOD',
                title: 'Best halal spots in Manhattan - Local guide',
                timestamp: '4h ago',
                source: 'NYCEats'
            },
            {
                id: 3,
                category: 'EVENTS',
                title: 'Block party this weekend in Harlem',
                timestamp: '6h ago',
                source: 'CityEvents'
            }
        ];
        
        this.suggestions = [
            {
                id: 1,
                username: 'MC_Brooklyn',
                avatar: '../images/profilew.png',
                description: 'Hip-Hop Artist',
                verified: true,
                mutualFriends: 23
            },
            {
                id: 2,
                username: 'StreetChef_NYC',
                avatar: '../images/profile.png',
                description: 'Food Blogger',
                verified: true,
                mutualFriends: 12
            }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadPosts();
        this.updateUserInfo();
        this.loadLiveEvents();
        this.loadCityNews();
        this.loadSuggestions();
        this.startRealTimeUpdates();
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });
        
        // Mobile navigation
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.setActiveNavItem(item);
            });
        });
        
        // Post actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.post-action[data-action="like"]') || e.target.closest('.post-action[data-action="like"]')) {
                const postId = e.target.closest('.post-card').dataset.postId;
                this.toggleLike(postId);
            }
            
            if (e.target.matches('.post-action[data-action="comment"]') || e.target.closest('.post-action[data-action="comment"]')) {
                const postId = e.target.closest('.post-card').dataset.postId;
                this.openComments(postId);
            }
            
            if (e.target.matches('.post-action[data-action="share"]') || e.target.closest('.post-action[data-action="share"]')) {
                const postId = e.target.closest('.post-card').dataset.postId;
                this.sharePost(postId);
            }
        });
        
        // Follow buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.follow-btn')) {
                this.followUser(e.target);
            }
        });
        
        // Story clicks
        document.querySelectorAll('.story-item').forEach(story => {
            story.addEventListener('click', () => {
                if (story.classList.contains('add-story')) {
                    this.addStory();
                } else {
                    this.viewStory(story.dataset.userId);
                }
            });
        });
        
        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.search(e.target.value);
            });
        }
        
        // Post creator
        const postInput = document.querySelector('.post-input');
        if (postInput) {
            postInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.createPost(postInput.value);
                    postInput.value = '';
                }
            });
        }
        
        // Action buttons in post creator
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleCreatorAction(btn);
            });
        });
    }
    
    switchSection(section) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Load section content
        switch(section) {
            case 'feed':
                this.loadFeed();
                break;
            case 'music':
                this.loadMusicSection();
                break;
            case 'news':
                this.loadNewsSection();
                break;
            case 'fashion':
                this.loadFashionSection();
                break;
            case 'food':
                this.loadFoodSection();
                break;
            case 'avatars':
                this.loadAvatarsSection();
                break;
        }
        
        // Analytics
        this.trackSectionView(section);
    }
    
    loadPosts() {
        const postsContainer = document.getElementById('postsFeed');
        if (!postsContainer) return;
        
        postsContainer.innerHTML = '';
        
        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    }
    
    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post-card';
        postDiv.dataset.postId = post.id;
        
        const verifiedBadge = post.user.verified ? 
            '<span style="color: #00ffff; margin-left: 5px;">✓</span>' : '';
        
        const mediaContent = post.image ? 
            `<img src="${post.image}" alt="Post media" class="post-media">` : '';
        
        const musicContent = post.music ? 
            `<div class="post-music">
                <div class="music-player">
                    <span class="icon">🎵</span>
                    <div class="music-info">
                        <strong>${post.music.title}</strong>
                        <span>by ${post.music.artist} • ${post.music.duration}</span>
                    </div>
                    <button class="play-btn">▶️</button>
                </div>
            </div>` : '';
        
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-user">
                    <img src="${post.user.avatar}" alt="${post.user.username}" class="post-avatar">
                    <div class="post-user-info">
                        <h4>${post.user.username}${verifiedBadge}</h4>
                        <span>${post.user.location} • ${post.timestamp}</span>
                    </div>
                </div>
                <button class="post-menu">⋯</button>
            </div>
            <div class="post-content">
                <div class="post-text">${post.content}</div>
                ${mediaContent}
                ${musicContent}
            </div>
            <div class="post-actions">
                <button class="post-action ${post.liked ? 'liked' : ''}" data-action="like">
                    <img src="../images/like.png" alt="Like">
                    <span>${this.formatNumber(post.likes)}</span>
                </button>
                <button class="post-action" data-action="comment">
                    <img src="../images/comment.png" alt="Comment">
                    <span>${this.formatNumber(post.comments)}</span>
                </button>
                <button class="post-action" data-action="share">
                    <img src="../images/share.png" alt="Share">
                    <span>${this.formatNumber(post.shares)}</span>
                </button>
                <button class="post-action" data-action="save">
                    <span class="icon">🔖</span>
                </button>
            </div>
        `;
        
        return postDiv;
    }
    
    toggleLike(postId) {
        const post = this.posts.find(p => p.id == postId);
        if (!post) return;
        
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        const likeButton = postElement.querySelector('[data-action="like"]');
        const likeCount = likeButton.querySelector('span');
        
        if (post.liked) {
            post.liked = false;
            post.likes--;
            likeButton.classList.remove('liked');
        } else {
            post.liked = true;
            post.likes++;
            likeButton.classList.add('liked');
            this.animateLike(likeButton);
        }
        
        likeCount.textContent = this.formatNumber(post.likes);
        
        // Send to backend
        this.updatePostLike(postId, post.liked);
    }
    
    animateLike(button) {
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
    
    followUser(button) {
        const isFollowing = button.textContent === 'Following';
        
        if (isFollowing) {
            button.textContent = 'Follow';
            button.style.background = 'linear-gradient(45deg, #00ffff, #0088ff)';
            button.style.color = '#000';
        } else {
            button.textContent = 'Following';
            button.style.background = 'rgba(255, 255, 255, 0.2)';
            button.style.color = '#fff';
        }
        
        // Analytics
        this.trackUserAction('follow', button.dataset.userId);
    }
    
    createPost(content) {
        if (!content.trim()) return;
        
        const newPost = {
            id: Date.now(),
            user: this.currentUser,
            content: content,
            timestamp: 'now',
            likes: 0,
            comments: 0,
            shares: 0,
            liked: false,
            category: 'general'
        };
        
        this.posts.unshift(newPost);
        this.loadPosts();
        
        // Send to backend
        this.submitPost(newPost);
        
        // Show success message
        this.showNotification('Post shared successfully! 🔥');
    }
    
    loadMusicSection() {
        const feedContainer = document.getElementById('feedContainer');
        feedContainer.innerHTML = `
            <div class="section-header">
                <h2>🎵 Music & Beats</h2>
                <p>Discover the hottest tracks from the streets</p>
            </div>
            
            <div class="music-grid">
                <div class="music-card featured">
                    <img src="../images/BlaquaCrown.png" alt="Album Cover">
                    <div class="music-info">
                        <h3>Street Dreams</h3>
                        <p>DJ_Kool_NYC</p>
                        <div class="music-stats">
                            <span>🔥 2.1M plays</span>
                            <span>💬 567 comments</span>
                        </div>
                    </div>
                    <button class="play-button">▶️</button>
                </div>
                
                <div class="music-categories">
                    <button class="category-btn active">All</button>
                    <button class="category-btn">Hip-Hop</button>
                    <button class="category-btn">Drill</button>
                    <button class="category-btn">R&B</button>
                    <button class="category-btn">Afrobeats</button>
                </div>
                
                <div class="trending-tracks">
                    <h3>🔥 Trending Now</h3>
                    ${this.generateTrendingTracks()}
                </div>
            </div>
        `;
    }
    
    generateTrendingTracks() {
        const tracks = [
            { title: "Brooklyn Nights", artist: "MC_Brooklyn", plays: "890K", duration: "3:45" },
            { title: "Street Legends", artist: "DrillKing_BX", plays: "1.2M", duration: "4:12" },
            { title: "City Lights", artist: "QueensRapper", plays: "756K", duration: "3:28" },
            { title: "Hustle Hard", artist: "BronxBeast", plays: "2.1M", duration: "4:05" }
        ];
        
        return tracks.map(track => `
            <div class="track-item">
                <div class="track-info">
                    <h4>${track.title}</h4>
                    <p>${track.artist}</p>
                </div>
                <div class="track-stats">
                    <span>${track.plays} plays</span>
                    <span>${track.duration}</span>
                </div>
                <button class="track-play">▶️</button>
            </div>
        `).join('');
    }
    
    loadFeed() {
        const feedContainer = document.getElementById('feedContainer');
        feedContainer.innerHTML = `
            <!-- Story Bar -->
            <div class="stories-bar">
                <div class="story-item add-story">
                    <div class="story-ring">
                        <img src="../images/camera.png" alt="Add Story">
                    </div>
                    <span>Your Story</span>
                </div>
                <div class="story-item">
                    <div class="story-ring active">
                        <img src="../images/profilew.png" alt="Story">
                    </div>
                    <span>DJ_Kool_NYC</span>
                </div>
                <div class="story-item">
                    <div class="story-ring">
                        <img src="../images/profilem.png" alt="Story">
                    </div>
                    <span>FashionKilla</span>
                </div>
                <div class="story-item">
                    <div class="story-ring">
                        <img src="../images/profile.png" alt="Story">
                    </div>
                    <span>FoodieLife</span>
                </div>
            </div>

            <!-- Post Creator -->
            <div class="post-creator">
                <div class="creator-header">
                    <img src="../images/profilem.png" alt="User" class="creator-avatar">
                    <input type="text" placeholder="What's happening in the streets?" class="post-input">
                </div>
                <div class="creator-actions">
                    <button class="action-btn">
                        <img src="../images/image.png" alt="Photo">
                        Photo
                    </button>
                    <button class="action-btn">
                        <span class="icon">🎵</span>
                        Music
                    </button>
                    <button class="action-btn">
                        <span class="icon">📍</span>
                        Location
                    </button>
                    <button class="action-btn">
                        <img src="../images/emoji.png" alt="Mood">
                        Mood
                    </button>
                </div>
            </div>

            <!-- Posts Feed -->
            <div class="posts-feed" id="postsFeed">
                <!-- Posts will be dynamically loaded here -->
            </div>
        `;
        
        this.loadPosts();
    }
    
    updateUserInfo() {
        const userElements = document.querySelectorAll('.user-info h3');
        userElements.forEach(el => {
            if (el) el.textContent = this.currentUser.username;
        });
        
        const statsElements = document.querySelectorAll('.user-stats');
        statsElements.forEach(el => {
            if (el) {
                el.innerHTML = `
                    <span>${this.formatNumber(this.currentUser.followers)} Followers</span>
                    <span>${this.formatNumber(this.currentUser.following)} Following</span>
                `;
            }
        });
    }
    
    loadLiveEvents() {
        const liveContainer = document.querySelector('.live-events');
        if (!liveContainer) return;
        
        liveContainer.innerHTML = this.liveEvents.map(event => `
            <div class="live-event">
                <img src="${event.avatar}" alt="Live">
                <div class="event-info">
                    <strong>${event.title}</strong>
                    <span>${event.location} • ${this.formatNumber(event.viewers)} watching</span>
                </div>
            </div>
        `).join('');
    }
    
    loadCityNews() {
        const newsContainer = document.querySelector('.news-items');
        if (!newsContainer) return;
        
        newsContainer.innerHTML = this.cityNews.map(news => `
            <div class="news-item">
                <span class="news-tag">${news.category}</span>
                <p>${news.title}</p>
                <span class="news-time">${news.timestamp}</span>
            </div>
        `).join('');
    }
    
    loadSuggestions() {
        const suggestionsContainer = document.querySelector('.suggestions');
        if (!suggestionsContainer) return;
        
        suggestionsContainer.innerHTML = this.suggestions.map(user => `
            <div class="suggestion-item">
                <img src="${user.avatar}" alt="${user.username}">
                <div class="suggestion-info">
                    <strong>${user.username}</strong>
                    <span>${user.description}</span>
                </div>
                <button class="follow-btn" data-user-id="${user.id}">Follow</button>
            </div>
        `).join('');
    }
    
    startRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            this.updateLiveViewers();
        }, 30000); // Update every 30 seconds
        
        setInterval(() => {
            this.checkNewPosts();
        }, 60000); // Check for new posts every minute
    }
    
    updateLiveViewers() {
        this.liveEvents.forEach(event => {
            event.viewers += Math.floor(Math.random() * 50) - 25;
            if (event.viewers < 0) event.viewers = 0;
        });
        this.loadLiveEvents();
    }
    
    checkNewPosts() {
        // Simulate new posts from followed users
        const randomPost = {
            id: Date.now(),
            user: {
                username: 'NewUser_' + Math.floor(Math.random() * 1000),
                avatar: '../images/profile.png',
                verified: Math.random() > 0.7,
                location: ['Brooklyn', 'Manhattan', 'Queens', 'Bronx'][Math.floor(Math.random() * 4)]
            },
            content: 'Just posted something new! 🔥 #StreetLife #NYC',
            timestamp: 'now',
            likes: Math.floor(Math.random() * 1000),
            comments: Math.floor(Math.random() * 100),
            shares: Math.floor(Math.random() * 50),
            liked: false,
            category: 'general'
        };
        
        // Occasionally add new posts
        if (Math.random() > 0.8) {
            this.posts.unshift(randomPost);
            this.loadPosts();
            this.showNotification('New posts available! 📱');
        }
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(45deg, #00ffff, #0088ff);
            color: #000;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Placeholder methods for future implementation
    openComments(postId) {
        this.showNotification('Comments feature coming soon! 💬');
    }
    
    sharePost(postId) {
        this.showNotification('Post shared! 📤');
    }
    
    addStory() {
        this.showNotification('Story creation coming soon! 📸');
    }
    
    viewStory(userId) {
        this.showNotification('Story viewer coming soon! 👀');
    }
    
    search(query) {
        if (query.length > 2) {
            console.log('Searching for:', query);
            // Implement search functionality
        }
    }
    
    handleCreatorAction(button) {
        const action = button.textContent.trim();
        this.showNotification(`${action} feature coming soon! ⚡`);
    }
    
    // Analytics methods
    trackSectionView(section) {
        console.log('Section viewed:', section);
        // Send analytics data
    }
    
    trackUserAction(action, userId) {
        console.log('User action:', action, userId);
        // Send analytics data
    }
    
    // API methods (placeholders for backend integration)
    async submitPost(post) {
        console.log('Submitting post:', post);
        // Send to backend API
    }
    
    async updatePostLike(postId, liked) {
        console.log('Updating like:', postId, liked);
        // Send to backend API
    }
    
    setActiveNavItem(item) {
        document.querySelectorAll('.mobile-nav-item').forEach(navItem => {
            navItem.classList.remove('active');
        });
        item.classList.add('active');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new KarmaGoApp();
    
    // Add some custom styles for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .music-grid {
            display: grid;
            gap: 20px;
            margin-top: 20px;
        }
        
        .music-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            border: 1px solid rgba(0, 255, 255, 0.2);
        }
        
        .music-card img {
            width: 60px;
            height: 60px;
            border-radius: 10px;
        }
        
        .music-info {
            flex: 1;
        }
        
        .music-info h3 {
            color: #00ffff;
            margin-bottom: 5px;
        }
        
        .music-stats {
            display: flex;
            gap: 20px;
            margin-top: 8px;
            font-size: 12px;
            color: #888;
        }
        
        .play-button {
            background: linear-gradient(45deg, #ff6b35, #f7931e);
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .play-button:hover {
            transform: scale(1.1);
        }
        
        .section-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .section-header h2 {
            font-size: 28px;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #00ffff, #ff6b35);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .music-categories {
            display: flex;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .category-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 255, 0.2);
            color: #ccc;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .category-btn.active,
        .category-btn:hover {
            background: rgba(0, 255, 255, 0.2);
            color: #00ffff;
            border-color: #00ffff;
        }
        
        .trending-tracks {
            margin-top: 30px;
        }
        
        .track-item {
            display: flex;
            align-items: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin-bottom: 10px;
            transition: all 0.3s ease;
        }
        
        .track-item:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
        }
        
        .track-info {
            flex: 1;
        }
        
        .track-info h4 {
            color: #fff;
            margin-bottom: 3px;
        }
        
        .track-info p {
            color: #888;
            font-size: 14px;
        }
        
        .track-stats {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 3px;
            margin-right: 15px;
            font-size: 12px;
            color: #888;
        }
        
        .track-play {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .track-play:hover {
            background: rgba(0, 255, 255, 0.2);
        }
    `;
    
    document.head.appendChild(style);
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
