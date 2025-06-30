// KarmaGo - Instagram-Style Social Media Platform
class KarmaGo {
    constructor() {
        this.currentUser = {
            username: 'StreetKing_NYC',
            displayName: 'StreetKing_NYC',
            avatar: '../images/profilem.png',
            verified: true,
            followers: 12500,
            following: 850,
            posts: 342,
            bio: 'Brooklyn born & raised 🌆 | Music Producer | Street Culture'
        };
        
        // Initialize Firebase integration
        this.firebase = new KarmaGoFirebase();
        
        // Music Player State
        this.musicPlayer = {
            currentTrack: null,
            isPlaying: false,
            audioElement: new Audio(),
            playlist: [],
            currentIndex: 0,
            volume: 0.7
        };
        
        // Map State
        this.map = null;
        this.mapMarkers = [];
        this.userLocation = null;
        
        // Page navigation
        this.currentPage = 'home';
        
        this.posts = [
            {
                id: 1,
                user: {
                    username: 'DJ_Kool_NYC',
                    displayName: 'DJ Kool NYC',
                    avatar: '../images/profilew.png',
                    verified: true
                },
                content: 'Just dropped my new mixtape! The streets are talking 🔥 Link in bio for that real NYC sound #BrooklynVibes #HipHop #NewMusic',
                image: '../images/BlaquaCrown.png',
                timestamp: '2 hours ago',
                likes: 1547,
                comments: 89,
                shares: 234,
                liked: false,
                saved: false
            },
            {
                id: 2,
                user: {
                    username: 'FashionKilla_BK',
                    displayName: 'Fashion Killa',
                    avatar: '../images/profile.png',
                    verified: false
                },
                content: 'Streetwear meets high fashion. This fit is everything! 💯 Tag someone who needs to see this #StreetFashion #OOTD #Brooklyn #DrippedOut',
                image: '../images/BlaquaFist.png',
                timestamp: '4 hours ago',
                likes: 892,
                comments: 156,
                shares: 67,
                liked: true,
                saved: false
            },
            {
                id: 3,
                user: {
                    username: 'StreetChef_NYC',
                    displayName: 'Street Chef NYC',
                    avatar: '../images/profilem.png',
                    verified: true
                },
                content: 'Best halal spot in the city! This chicken over rice hits different at 2am 🌟 Who else knows about this spot? #NYCEats #StreetFood #Halal #LateNightEats',
                image: '../images/KoolG.png',
                timestamp: '6 hours ago',
                likes: 2341,
                comments: 312,
                shares: 89,
                liked: false,
                saved: true
            },
            {
                id: 4,
                user: {
                    username: 'MC_Brooklyn',
                    displayName: 'MC Brooklyn',
                    avatar: '../images/profilew.png',
                    verified: true
                },
                content: 'Cypher battle tonight at Times Square! Come through if you got bars 🎤 Starting at 9PM, bring that energy! #Cypher #HipHop #BattleRap #NYC #TimesSquare',
                image: null,
                timestamp: '8 hours ago',
                likes: 3456,
                comments: 567,
                shares: 234,
                liked: true,
                saved: false
            },
            {
                id: 5,
                user: {
                    username: 'UrbanExplorer_NY',
                    displayName: 'Urban Explorer',
                    avatar: '../images/profile.png',
                    verified: false
                },
                content: 'Found this amazing graffiti art in Queens! The talent in this city is unreal 🎨 Shoutout to all the artists keeping the culture alive #StreetArt #Queens #UrbanCulture #Graffiti',
                image: '../images/kar.png',
                timestamp: '12 hours ago',
                likes: 1789,
                comments: 203,
                shares: 145,
                liked: false,
                saved: false
            }
        ];
        
        this.stories = [
            {
                id: 1,
                user: 'DJ_Kool',
                avatar: '../images/profilew.png',
                hasStory: true,
                viewed: false
            },
            {
                id: 2,
                user: 'FashionKilla',
                avatar: '../images/profile.png',
                hasStory: true,
                viewed: true
            },
            {
                id: 3,
                user: 'StreetChef',
                avatar: '../images/profilem.png',
                hasStory: true,
                viewed: false
            },
            {
                id: 4,
                user: 'MC_Brooklyn',
                avatar: '../images/profilew.png',
                hasStory: false,
                viewed: false
            }
        ];
        
        this.suggestions = [
            {
                id: 1,
                username: 'MC_Brooklyn',
                displayName: 'MC Brooklyn',
                avatar: '../images/profilew.png',
                description: 'Hip-Hop Artist • Followed by DJ_Kool',
                verified: true,
                following: false
            },
            {
                id: 2,
                username: 'StreetChef_NYC',
                displayName: 'Street Chef NYC',
                avatar: '../images/profile.png',
                description: 'Food Blogger • Followed by 5 friends',
                verified: true,
                following: false
            },
            {
                id: 3,
                username: 'FashionKilla_BK',
                displayName: 'Fashion Killa',
                avatar: '../images/profilem.png',
                description: 'Style Influencer • Popular in Brooklyn',
                verified: false,
                following: false
            }
        ];
        
        this.trending = [
            { tag: '#BrooklynVibes', posts: '12.5K' },
            { tag: '#DrillMusic', posts: '8.2K' },
            { tag: '#NYCEats', posts: '15.1K' },
            { tag: '#StreetFashion', posts: '22.3K' }
        ];
        
        this.happeningNow = [
            {
                category: 'Music • Trending',
                title: 'New drill track drops tonight',
                stats: '15.2K people talking about this'
            },
            {
                category: 'NYC • Live',
                title: 'Block party in Harlem',
                stats: '8.5K people talking about this'
            },
            {
                category: 'Food • Trending',
                title: 'Best halal spots revealed',
                stats: '22.1K people talking about this'
            }
        ];
        
        this.init();
    }
    
    init() {
        this.loadPosts();
        this.setupEventListeners();
        this.setupPageNavigation();
        this.initializeMusicPlayer();
        this.initializeMap();
        this.loadTrendingMusic();
        this.getUserLocation();
        
        // Auto-refresh content
        setInterval(() => {
            if (this.currentPage === 'home') {
                this.loadPosts();
            } else if (this.currentPage === 'music') {
                this.loadTrendingMusic();
            } else if (this.currentPage === 'map') {
                this.loadNearbyPlaces();
            }
        }, 30000); // Refresh every 30 seconds
    }
    
    setupEventListeners() {
        // Post interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.like-btn')) {
                const postId = e.target.closest('.post-card').dataset.postId;
                this.toggleLike(postId);
            }
            
            if (e.target.closest('.save-btn')) {
                const postId = e.target.closest('.post-card').dataset.postId;
                this.toggleSave(postId);
            }
            
            if (e.target.closest('.comment-btn')) {
                const postId = e.target.closest('.post-card').dataset.postId;
                this.openComments(postId);
            }
            
            if (e.target.closest('.share-btn')) {
                const postId = e.target.closest('.post-card').dataset.postId;
                this.sharePost(postId);
            }
            
            if (e.target.closest('.follow-btn')) {
                const userId = e.target.closest('.suggestion-item').dataset.userId;
                this.toggleFollow(userId, e.target);
            }
        });
        
        // Navigation
        document.querySelectorAll('.nav-icon, .bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleNavigation(item);
            });
        });
        
        // Story clicks
        document.querySelectorAll('.story-item').forEach(story => {
            story.addEventListener('click', () => {
                if (story.classList.contains('your-story')) {
                    this.createStory();
                } else {
                    this.viewStory(story.dataset.userId);
                }
            });
        });
        
        // Create post
        const createInput = document.querySelector('.create-input');
        if (createInput) {
            createInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.createPost(createInput.value);
                    createInput.value = '';
                }
            });
        }
        
        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.search(e.target.value);
            });
        }
        
        // Action buttons
        document.querySelectorAll('.action-button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleActionButton(btn);
            });
        });
        
        // Music player controls
        const playPauseBtn = document.querySelector('.music-player .play-pause');
        const nextBtn = document.querySelector('.music-player .next');
        const prevBtn = document.querySelector('.music-player .prev');
        const volumeSlider = document.querySelector('.music-player .volume-slider');
        
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextTrack();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.prevTrack();
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value);
            });
        }
        
        // Map interactions
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            this.initMap(mapContainer);
        }
    }
    
    // Music Player Methods
    initializeMusicPlayer() {
        const audioElement = this.musicPlayer.audioElement;
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const progressFill = document.getElementById('progressFill');
        
        // Set initial volume
        audioElement.volume = this.musicPlayer.volume;
        volumeSlider.value = this.musicPlayer.volume * 100;
        
        // Play/Pause button
        playPauseBtn?.addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        // Previous/Next buttons
        prevBtn?.addEventListener('click', () => {
            this.playPreviousTrack();
        });
        
        nextBtn?.addEventListener('click', () => {
            this.playNextTrack();
        });
        
        // Volume control
        volumeSlider?.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            audioElement.volume = volume;
            this.musicPlayer.volume = volume;
        });
        
        // Audio events
        audioElement.addEventListener('loadstart', () => {
            console.log('Loading track...');
        });
        
        audioElement.addEventListener('canplay', () => {
            this.updateTrackInfo();
        });
        
        audioElement.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        
        audioElement.addEventListener('ended', () => {
            this.playNextTrack();
        });
        
        audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showNotification('Error playing track');
        });
    }
    
    async loadTrendingMusic() {
        try {
            const tracks = await this.firebase.getTrendingTracks(20);
            this.renderTrendingTracks(tracks);
            
            // Load sample tracks if no real data
            if (tracks.length === 0) {
                this.loadSampleTracks();
            }
        } catch (error) {
            console.error('Error loading trending music:', error);
            this.loadSampleTracks();
        }
    }
    
    loadSampleTracks() {
        const sampleTracks = [
            {
                id: 'sample1',
                title: 'Brooklyn Drill Anthem',
                artist: 'DJ_Kool_NYC',
                plays: 12500,
                likes: 890,
                duration: '3:24',
                genre: 'Drill',
                audioUrl: null // For demo purposes
            },
            {
                id: 'sample2',
                title: 'Harlem Nights',
                artist: 'MC_Brooklyn',
                plays: 8900,
                likes: 567,
                duration: '2:58',
                genre: 'Hip-Hop',
                audioUrl: null
            },
            {
                id: 'sample3',
                title: 'Queens Flow',
                artist: 'StreetBeats_QNS',
                plays: 15200,
                likes: 1234,
                duration: '3:45',
                genre: 'Trap',
                audioUrl: null
            }
        ];
        
        this.renderTrendingTracks(sampleTracks);
    }
    
    renderTrendingTracks(tracks) {
        const container = document.getElementById('trendingTracks');
        if (!container) return;
        
        container.innerHTML = tracks.map(track => `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-info">
                    <div class="track-cover">
                        <img src="../images/BlaquaCrown.png" alt="Track Cover">
                        <div class="play-overlay" onclick="karmaGo.playTrack('${track.id}', ${JSON.stringify(track).replace(/"/g, '&quot;')})">
                            <span class="play-icon">▶️</span>
                        </div>
                    </div>
                    <div class="track-details">
                        <h4 class="track-title">${track.title}</h4>
                        <p class="track-artist">${track.artist}</p>
                        <div class="track-stats">
                            <span class="plays">🎧 ${this.formatNumber(track.plays)} plays</span>
                            <span class="likes">❤️ ${this.formatNumber(track.likes)}</span>
                            <span class="duration">⏱️ ${track.duration}</span>
                        </div>
                    </div>
                </div>
                <div class="track-actions">
                    <button class="action-btn like-btn" onclick="karmaGo.likeTrack('${track.id}')">
                        ❤️
                    </button>
                    <button class="action-btn share-btn" onclick="karmaGo.shareTrack('${track.id}')">
                        📤
                    </button>
                    <button class="action-btn download-btn" onclick="karmaGo.downloadTrack('${track.id}')">
                        ⬇️
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async playTrack(trackId, trackData) {
        try {
            this.musicPlayer.currentTrack = trackData;
            
            if (trackData.audioUrl) {
                this.musicPlayer.audioElement.src = trackData.audioUrl;
                await this.musicPlayer.audioElement.play();
                this.musicPlayer.isPlaying = true;
                
                // Update Firebase play count
                await this.firebase.playTrack(trackId);
            } else {
                // Demo mode - simulate playing
                this.musicPlayer.isPlaying = true;
                this.showNotification(`🎵 Now playing: ${trackData.title} by ${trackData.artist}`);
            }
            
            this.updatePlayerUI();
            this.updateTrackInfo();
        } catch (error) {
            console.error('Error playing track:', error);
            this.showNotification('Error playing track');
        }
    }
    
    togglePlayPause() {
        const audioElement = this.musicPlayer.audioElement;
        
        if (this.musicPlayer.isPlaying) {
            audioElement.pause();
            this.musicPlayer.isPlaying = false;
        } else {
            audioElement.play();
            this.musicPlayer.isPlaying = true;
        }
        
        this.updatePlayerUI();
    }
    
    updatePlayerUI() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.textContent = this.musicPlayer.isPlaying ? '⏸️' : '▶️';
        }
    }
    
    updateTrackInfo() {
        const titleElement = document.getElementById('currentTrackTitle');
        const artistElement = document.getElementById('currentTrackArtist');
        
        if (this.musicPlayer.currentTrack) {
            if (titleElement) titleElement.textContent = this.musicPlayer.currentTrack.title;
            if (artistElement) artistElement.textContent = this.musicPlayer.currentTrack.artist;
        }
    }
    
    updateProgress() {
        const audioElement = this.musicPlayer.audioElement;
        const progressFill = document.getElementById('progressFill');
        const currentTimeElement = document.getElementById('currentTime');
        const totalTimeElement = document.getElementById('totalTime');
        
        if (audioElement.duration) {
            const progress = (audioElement.currentTime / audioElement.duration) * 100;
            if (progressFill) progressFill.style.width = `${progress}%`;
            
            if (currentTimeElement) currentTimeElement.textContent = this.formatTime(audioElement.currentTime);
            if (totalTimeElement) totalTimeElement.textContent = this.formatTime(audioElement.duration);
        }
    }
    
    // Map Methods
    initializeMap() {
        if (typeof google !== 'undefined' && google.maps) {
            this.initGoogleMap();
        } else {
            // Fallback for demo
            this.initDemoMap();
        }
    }
    
    initGoogleMap() {
        const mapElement = document.getElementById('streetMap');
        if (!mapElement) return;
        
        // Default to NYC coordinates
        const defaultLocation = { lat: 40.7128, lng: -74.0060 };
        
        this.map = new google.maps.Map(mapElement, {
            zoom: 13,
            center: defaultLocation,
            styles: [
                {
                    featureType: 'all',
                    elementType: 'geometry.fill',
                    stylers: [{ color: '#1a1a1a' }]
                },
                {
                    featureType: 'road',
                    elementType: 'geometry',
                    stylers: [{ color: '#2a2a2a' }]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [{ color: '#0f1419' }]
                }
            ]
        });
        
        // Add click listener for adding new places
        this.map.addListener('click', (event) => {
            this.showAddPlaceDialog(event.latLng);
        });
        
        this.loadNearbyPlaces();
    }
    
    initDemoMap() {
        const mapElement = document.getElementById('streetMap');
        if (!mapElement) return;
        
        mapElement.innerHTML = `
            <div class="demo-map">
                <div class="map-placeholder">
                    <h3>🗺️ KarmaGo Street Map</h3>
                    <p>Connect your Google Maps API key to see the interactive map</p>
                    <div class="demo-locations">
                        <div class="demo-location music" onclick="karmaGo.showLocationDetails('music1')">
                            <span class="location-icon">🎵</span>
                            <div class="location-info">
                                <h4>Studio 54 Revival</h4>
                                <p>0.2 miles away • Music Venue</p>
                            </div>
                        </div>
                        <div class="demo-location food" onclick="karmaGo.showLocationDetails('food1')">
                            <span class="location-icon">🍕</span>
                            <div class="location-info">
                                <h4>Harlem Soul Food</h4>
                                <p>0.5 miles away • Restaurant</p>
                            </div>
                        </div>
                        <div class="demo-location events" onclick="karmaGo.showLocationDetails('event1')">
                            <span class="location-icon">🎉</span>
                            <div class="location-info">
                                <h4>Block Party Tonight</h4>
                                <p>0.8 miles away • Live Event</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.loadNearbyPlaces();
    }
    
    async loadNearbyPlaces() {
        try {
            const places = await this.firebase.getNearbyPlaces(this.userLocation);
            this.renderNearbyPlaces(places);
            
            // Load sample places if no real data
            if (places.length === 0) {
                this.loadSamplePlaces();
            }
        } catch (error) {
            console.error('Error loading nearby places:', error);
            this.loadSamplePlaces();
        }
    }
    
    loadSamplePlaces() {
        const samplePlaces = [
            {
                id: 'place1',
                name: 'Brooklyn Beat Studio',
                type: 'music',
                description: 'Professional recording studio in the heart of Brooklyn',
                distance: '0.3 miles',
                rating: 4.8,
                isLive: false
            },
            {
                id: 'place2',
                name: 'Harlem Night Market',
                type: 'food',
                description: 'Best street food in uptown Manhattan',
                distance: '0.7 miles',
                rating: 4.6,
                isLive: true
            },
            {
                id: 'place3',
                name: 'Queens Culture Fest',
                type: 'events',
                description: 'Live music and art festival happening now',
                distance: '1.2 miles',
                rating: 4.9,
                isLive: true
            }
        ];
        
        this.renderNearbyPlaces(samplePlaces);
    }
    
    renderNearbyPlaces(places) {
        const container = document.getElementById('nearbyPlaces');
        if (!container) return;
        
        container.innerHTML = places.map(place => `
            <div class="place-item ${place.type}" onclick="karmaGo.showLocationDetails('${place.id}')">
                <div class="place-icon">
                    ${this.getPlaceIcon(place.type)}
                    ${place.isLive ? '<span class="live-indicator">🔴</span>' : ''}
                </div>
                <div class="place-info">
                    <h4>${place.name}</h4>
                    <p>${place.description}</p>
                    <div class="place-stats">
                        <span class="distance">📍 ${place.distance}</span>
                        <span class="rating">⭐ ${place.rating}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getPlaceIcon(type) {
        const icons = {
            music: '🎵',
            food: '🍕',
            events: '🎉',
            fashion: '👕'
        };
        return icons[type] || '📍';
    }
    
    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('User location obtained:', this.userLocation);
                    this.loadNearbyPlaces();
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    // Use default NYC location
                    this.userLocation = { lat: 40.7128, lng: -74.0060 };
                }
            );
        }
    }
    
    loadPosts() {
        const postsContainer = document.getElementById('postsContainer');
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
            '<span style="color: #0095f6; margin-left: 4px;">✓</span>' : '';
        
        const postImage = post.image ? 
            `<img src="${post.image}" alt="Post image" class="post-image">` : '';
        
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-user">
                    <img src="${post.user.avatar}" alt="${post.user.username}" class="post-user-avatar">
                    <div class="post-user-info">
                        <h4>${post.user.displayName}${verifiedBadge}</h4>
                        <span>${post.timestamp}</span>
                    </div>
                </div>
                <button class="post-menu">⋯</button>
            </div>
            
            ${postImage}
            
            <div class="post-actions">
                <div class="post-actions-left">
                    <button class="post-action like-btn ${post.liked ? 'liked' : ''}">
                        <img src="../images/like.png" alt="Like">
                    </button>
                    <button class="post-action comment-btn">
                        <img src="../images/comment.png" alt="Comment">
                    </button>
                    <button class="post-action share-btn">
                        <img src="../images/share.png" alt="Share">
                    </button>
                </div>
                <button class="post-action save-btn ${post.saved ? 'saved' : ''}">
                    <img src="../images/private.png" alt="Save">
                </button>
            </div>
            
            <div class="post-likes">
                ${this.formatNumber(post.likes)} likes
            </div>
            
            <div class="post-caption">
                <span class="username">${post.user.displayName}</span>
                ${post.content}
            </div>
            
            <div class="post-time">
                ${post.timestamp}
            </div>
        `;
        
        return postDiv;
    }
    
    toggleLike(postId) {
        const post = this.posts.find(p => p.id == postId);
        if (!post) return;
        
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        const likeButton = postElement.querySelector('.like-btn');
        const likesCount = postElement.querySelector('.post-likes');
        
        if (post.liked) {
            post.liked = false;
            post.likes--;
            likeButton.classList.remove('liked');
        } else {
            post.liked = true;
            post.likes++;
            likeButton.classList.add('liked');
            this.animateHeart(likeButton);
        }
        
        likesCount.textContent = `${this.formatNumber(post.likes)} likes`;
        
        // Send to backend
        this.apiCall('POST', `/posts/${postId}/like`, { liked: post.liked });
    }
    
    toggleSave(postId) {
        const post = this.posts.find(p => p.id == postId);
        if (!post) return;
        
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        const saveButton = postElement.querySelector('.save-btn');
        
        post.saved = !post.saved;
        saveButton.classList.toggle('saved', post.saved);
        
        this.showNotification(post.saved ? 'Post saved!' : 'Post removed from saved');
        
        // Send to backend
        this.apiCall('POST', `/posts/${postId}/save`, { saved: post.saved });
    }
    
    toggleFollow(userId, button) {
        const suggestion = this.suggestions.find(s => s.id == userId);
        if (!suggestion) return;
        
        suggestion.following = !suggestion.following;
        
        if (suggestion.following) {
            button.textContent = 'Following';
            button.style.background = '#efefef';
            button.style.color = '#262626';
            this.showNotification(`You're now following ${suggestion.displayName}!`);
        } else {
            button.textContent = 'Follow';
            button.style.background = '#0095f6';
            button.style.color = 'white';
            this.showNotification(`Unfollowed ${suggestion.displayName}`);
        }
        
        // Send to backend
        this.apiCall('POST', `/users/${userId}/follow`, { following: suggestion.following });
    }
    
    loadSuggestions() {
        const suggestionsContainer = document.querySelector('.suggestions-card');
        if (!suggestionsContainer) return;
        
        const suggestionsHTML = this.suggestions.map(user => `
            <div class="suggestion-item" data-user-id="${user.id}">
                <img src="${user.avatar}" alt="${user.username}" class="suggestion-avatar">
                <div class="suggestion-info">
                    <h5>${user.displayName}${user.verified ? ' ✓' : ''}</h5>
                    <p>${user.description}</p>
                </div>
                <button class="follow-btn">${user.following ? 'Following' : 'Follow'}</button>
            </div>
        `).join('');
        
        suggestionsContainer.querySelector('.card-header').insertAdjacentHTML('afterend', suggestionsHTML);
    }
    
    loadTrending() {
        const trendingContainer = document.querySelector('.trending-section');
        if (!trendingContainer) return;
        
        const trendingHTML = this.trending.map(trend => `
            <div class="trending-item">
                <span class="trend-tag">${trend.tag}</span>
                <span class="trend-count">${trend.posts} posts</span>
            </div>
        `).join('');
        
        trendingContainer.querySelector('h4').insertAdjacentHTML('afterend', trendingHTML);
    }
    
    loadHappeningNow() {
        const happeningContainer = document.querySelector('.whats-happening-card');
        if (!happeningContainer) return;
        
        const happeningHTML = this.happeningNow.map(item => `
            <div class="happening-item">
                <div class="happening-category">${item.category}</div>
                <div class="happening-title">${item.title}</div>
                <div class="happening-stats">${item.stats}</div>
            </div>
        `).join('');
        
        happeningContainer.querySelector('.card-header').insertAdjacentHTML('afterend', happeningHTML);
    }
    
    createPost(content) {
        if (!content.trim()) return;
        
        const newPost = {
            id: Date.now(),
            user: {
                username: this.currentUser.username,
                displayName: this.currentUser.displayName,
                avatar: this.currentUser.avatar,
                verified: this.currentUser.verified
            },
            content: content,
            image: null,
            timestamp: 'now',
            likes: 0,
            comments: 0,
            shares: 0,
            liked: false,
            saved: false
        };
        
        this.posts.unshift(newPost);
        this.loadPosts();
        
        this.showNotification('Post shared successfully! 🔥');
        
        // Send to backend
        this.apiCall('POST', '/posts', newPost);
    }
    
    animateHeart(button) {
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
        
        // Create floating heart effect
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.cssText = `
            position: absolute;
            font-size: 20px;
            animation: floatHeart 1s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        `;
        
        const rect = button.getBoundingClientRect();
        heart.style.left = rect.left + 'px';
        heart.style.top = rect.top + 'px';
        
        document.body.appendChild(heart);
        
        setTimeout(() => heart.remove(), 1000);
    }
    
    // Utility Methods
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num;
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    showLocationDetails(locationId) {
        // Show detailed information about a location
        this.showNotification(`📍 Showing details for location: ${locationId}`);
        // TODO: Implement location details modal
    }
    
    async likeTrack(trackId) {
        try {
            const liked = await this.firebase.likeTrack(trackId);
            const likeBtn = document.querySelector(`[onclick*="${trackId}"] .like-btn`);
            if (likeBtn) {
                likeBtn.style.color = liked ? '#ff3040' : '#8e8e8e';
            }
        } catch (error) {
            console.error('Error liking track:', error);
        }
    }
    
    shareTrack(trackId) {
        if (navigator.share) {
            navigator.share({
                title: 'Check out this track on KarmaGo',
                text: 'Listen to this amazing track I found!',
                url: `${window.location.origin}?track=${trackId}`
            });
        } else {
            // Fallback - copy to clipboard
            const url = `${window.location.origin}?track=${trackId}`;
            navigator.clipboard.writeText(url);
            this.showNotification('Track link copied to clipboard! 📋');
        }
    }
    
    downloadTrack(trackId) {
        this.showNotification('Download feature coming soon! 📥');
        // TODO: Implement track download
    }
    
    playPreviousTrack() {
        if (this.musicPlayer.playlist.length > 0) {
            this.musicPlayer.currentIndex = (this.musicPlayer.currentIndex - 1 + this.musicPlayer.playlist.length) % this.musicPlayer.playlist.length;
            const prevTrack = this.musicPlayer.playlist[this.musicPlayer.currentIndex];
            this.playTrack(prevTrack.id, prevTrack);
        }
    }
    
    playNextTrack() {
        if (this.musicPlayer.playlist.length > 0) {
            this.musicPlayer.currentIndex = (this.musicPlayer.currentIndex + 1) % this.musicPlayer.playlist.length;
            const nextTrack = this.musicPlayer.playlist[this.musicPlayer.currentIndex];
            this.playTrack(nextTrack.id, nextTrack);
        }
    }
    
    async loadFeaturedArtists() {
        // TODO: Load from Firebase
        const sampleArtists = [
            {
                id: 'artist1',
                name: 'DJ_Kool_NYC',
                genre: 'Hip-Hop/Drill',
                followers: '12.5K',
                tracks: 47,
                avatar: '../images/profilew.png'
            },
            {
                id: 'artist2',
                name: 'MC_Brooklyn',
                genre: 'Rap/Hip-Hop',
                followers: '8.9K',
                tracks: 23,
                avatar: '../images/profilem.png'
            }
        ];
        
        const container = document.getElementById('featuredArtists');
        if (container) {
            container.innerHTML = sampleArtists.map(artist => `
                <div class="artist-card">
                    <img src="${artist.avatar}" alt="${artist.name}" class="artist-avatar">
                    <h4>${artist.name}</h4>
                    <p>${artist.genre}</p>
                    <div class="artist-stats">
                        <span>👥 ${artist.followers} followers</span>
                        <span>🎵 ${artist.tracks} tracks</span>
                    </div>
                    <button class="follow-artist-btn">Follow</button>
                </div>
            `).join('');
        }
    }
    
    async loadPlaylists() {
        // TODO: Load from Firebase
        const samplePlaylists = [
            {
                id: 'playlist1',
                name: 'Brooklyn Drill Hits',
                tracks: 25,
                creator: 'KarmaGo',
                cover: '../images/BlaquaCrown.png'
            },
            {
                id: 'playlist2',
                name: 'NYC Underground',
                tracks: 18,
                creator: 'DJ_Kool_NYC',
                cover: '../images/BlaquaFist.png'
            }
        ];
        
        const container = document.getElementById('playlistsGrid');
        if (container) {
            container.innerHTML = samplePlaylists.map(playlist => `
                <div class="playlist-card">
                    <img src="${playlist.cover}" alt="${playlist.name}" class="playlist-cover">
                    <h4>${playlist.name}</h4>
                    <p>${playlist.tracks} tracks • by ${playlist.creator}</p>
                    <button class="play-playlist-btn">▶️ Play</button>
                </div>
            `).join('');
        }
    }
}

// Initialize the app
const karmaGo = new KarmaGo();

// Notification System
class NotificationSystem {
    static show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

// Add notification method to KarmaGo class
KarmaGo.prototype.showNotification = function(message, type = 'info') {
    NotificationSystem.show(message, type);
};

// Global error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    NotificationSystem.show('An error occurred. Please try again.', 'error');
});

// Service Worker for offline functionality (optional)
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

console.log("🔥 KarmaGo loaded successfully! Welcome to the streets! 🌆");
