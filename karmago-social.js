// KarmaGo - Instagram-Style Social Media Platform
class KarmaGo {
    constructor() {
        this.currentUser = {
            username: 'StreetKing_NYC',
            displayName: 'StreetKing_NYC',
            avatar: 'assets/images/profilem.png',
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
                    avatar: 'assets/images/profilew.png',
                    verified: true
                },
                content: 'Just dropped my new mixtape! The streets are talking 🔥 Link in bio for that real NYC sound #BrooklynVibes #HipHop #NewMusic',
                image: 'assets/images/BlaquaCrown.png',
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
                    avatar: 'assets/images/profile.png',
                    verified: false
                },
                content: 'Streetwear meets high fashion. This fit is everything! 💯 Tag someone who needs to see this #StreetFashion #OOTD #Brooklyn #DrippedOut',
                image: 'assets/images/BlaquaFist.png',
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
                    avatar: 'assets/images/profilem.png',
                    verified: true
                },
                content: 'Best halal spot in the city! This chicken over rice hits different at 2am 🌟 Who else knows about this spot? #NYCEats #StreetFood #Halal #LateNightEats',
                image: 'assets/images/KoolG.png',
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
                    avatar: 'assets/images/profilew.png',
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
                    avatar: 'assets/images/profile.png',
                    verified: false
                },
                content: 'Found this amazing graffiti art in Queens! The talent in this city is unreal 🎨 Shoutout to all the artists keeping the culture alive #StreetArt #Queens #UrbanCulture #Graffiti',
                image: 'assets/images/kar.png',
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
                avatar: 'assets/images/profilew.png',
                hasStory: true,
                viewed: false
            },
            {
                id: 2,
                user: 'FashionKilla',
                avatar: 'assets/images/profile.png',
                hasStory: true,
                viewed: true
            },
            {
                id: 3,
                user: 'StreetChef',
                avatar: 'assets/images/profilem.png',
                hasStory: true,
                viewed: false
            },
            {
                id: 4,
                user: 'MC_Brooklyn',
                avatar: 'assets/images/profilew.png',
                hasStory: false,
                viewed: false
            }
        ];
        
        this.suggestions = [
            {
                id: 1,
                username: 'MC_Brooklyn',
                displayName: 'MC Brooklyn',
                avatar: 'assets/images/profilew.png',
                description: 'Hip-Hop Artist • Followed by DJ_Kool',
                verified: true,
                following: false
            },
            {
                id: 2,
                username: 'StreetChef_NYC',
                displayName: 'Street Chef NYC',
                avatar: 'assets/images/profile.png',
                description: 'Food Blogger • Followed by 5 friends',
                verified: true,
                following: false
            },
            {
                id: 3,
                username: 'FashionKilla_BK',
                displayName: 'Fashion Killa',
                avatar: 'assets/images/profilem.png',
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
                        <img src="assets/images/BlaquaCrown.png" alt="Track Cover">
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
        this.loadCityNews();
        this.loadCityEvents();
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
    
    async loadCityNews() {
        try {
            const news = await this.firebase.getCityNews(10);
            this.renderCityNews(news);
            
            // Load sample news if no real data
            if (news.length === 0) {
                this.loadSampleNews();
            }
        } catch (error) {
            console.error('Error loading city news:', error);
            this.loadSampleNews();
        }
    }
    
    async loadCityEvents() {
        try {
            const events = await this.firebase.getLiveEvents();
            this.renderCityEvents(events);
            
            // Load sample events if no real data
            if (events.length === 0) {
                this.loadSampleEvents();
            }
        } catch (error) {
            console.error('Error loading city events:', error);
            this.loadSampleEvents();
        }
    }
    
    loadSampleNews() {
        const sampleNews = [
            {
                id: 'news1',
                title: 'New Music Venue Opens in Brooklyn',
                content: 'The Vibe House opens its doors this weekend featuring local underground artists',
                category: 'music',
                location: 'Brooklyn, NY',
                priority: 'high',
                createdAt: { toDate: () => new Date(Date.now() - 2 * 60 * 60 * 1000) },
                tags: ['music', 'venue', 'brooklyn']
            },
            {
                id: 'news2',
                title: 'Street Food Festival This Weekend',
                content: 'Queens hosts its annual street food festival with vendors from around the world',
                category: 'events',
                location: 'Queens, NY',
                priority: 'normal',
                createdAt: { toDate: () => new Date(Date.now() - 4 * 60 * 60 * 1000) },
                tags: ['food', 'festival', 'queens']
            },
            {
                id: 'news3',
                title: 'Subway Delays on Line 2',
                content: 'Expect 15-20 minute delays due to signal problems. Use alternative routes',
                category: 'breaking',
                location: 'NYC',
                priority: 'breaking',
                createdAt: { toDate: () => new Date(Date.now() - 30 * 60 * 1000) },
                tags: ['transit', 'delays', 'mta']
            }
        ];
        
        this.renderCityNews(sampleNews);
    }
    
    loadSampleEvents() {
        const sampleEvents = [
            {
                id: 'event1',
                title: 'Cypher Battle Tonight',
                description: 'Hip-hop cypher battle in Times Square',
                type: 'music',
                location: 'Times Square, NYC',
                isLive: true,
                startTime: { toDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000) },
                attendees: ['user1', 'user2', 'user3'],
                tags: ['cypher', 'hip-hop', 'battle']
            },
            {
                id: 'event2',
                title: 'Food Truck Friday',
                description: 'Weekly food truck gathering in Washington Square',
                type: 'food',
                location: 'Washington Square Park',
                isLive: false,
                startTime: { toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
                attendees: ['user4', 'user5'],
                tags: ['food', 'trucks', 'park']
            },
            {
                id: 'event3',
                title: 'Pop-up Fashion Show',
                description: 'Underground streetwear showcase in Soho',
                type: 'fashion',
                location: 'Soho, NYC',
                isLive: true,
                startTime: { toDate: () => new Date(Date.now() + 60 * 60 * 1000) },
                attendees: ['user6', 'user7', 'user8', 'user9'],
                tags: ['fashion', 'streetwear', 'soho']
            }
        ];
        
        this.renderCityEvents(sampleEvents);
    }
    
    renderCityNews(news) {
        const container = document.getElementById('cityNews');
        if (!container) return;
        
        container.innerHTML = news.map(item => `
            <div class="news-item ${item.priority}" onclick="karmaGo.viewNewsDetails('${item.id}')">
                <div class="news-header">
                    <span class="news-category ${item.category}">${this.getCategoryIcon(item.category)} ${item.category.toUpperCase()}</span>
                    <span class="news-time">${this.getTimeAgo(item.createdAt)}</span>
                </div>
                <h4 class="news-title">${item.title}</h4>
                <p class="news-content">${item.content}</p>
                <div class="news-footer">
                    <span class="news-location">📍 ${item.location}</span>
                    ${item.priority === 'breaking' ? '<span class="breaking-badge">🔴 BREAKING</span>' : ''}
                </div>
            </div>
        `).join('');
    }
    
    renderCityEvents(events) {
        const container = document.getElementById('cityTrends');
        if (!container) return;
        
        container.innerHTML = events.map(event => `
            <div class="event-item ${event.isLive ? 'live' : ''}" onclick="karmaGo.viewEventDetails('${event.id}')">
                <div class="event-header">
                    <span class="event-type ${event.type}">${this.getEventIcon(event.type)} ${event.type.toUpperCase()}</span>
                    ${event.isLive ? '<span class="live-badge">🔴 LIVE</span>' : ''}
                </div>
                <h4 class="event-title">${event.title}</h4>
                <p class="event-description">${event.description}</p>
                <div class="event-footer">
                    <span class="event-location">📍 ${event.location}</span>
                    <span class="event-time">⏰ ${this.getEventTime(event.startTime)}</span>
                    <span class="event-attendees">👥 ${event.attendees ? event.attendees.length : 0} going</span>
                </div>
            </div>
        `).join('');
    }
    
    getCategoryIcon(category) {
        const icons = {
            music: '🎵',
            events: '🎉',
            food: '🍕',
            fashion: '👕',
            breaking: '🚨',
            local: '🏙️',
            transit: '🚇'
        };
        return icons[category] || '📰';
    }
    
    getEventIcon(type) {
        const icons = {
            music: '🎵',
            food: '🍕',
            fashion: '👕',
            party: '🎉',
            art: '🎨',
            sports: '⚽'
        };
        return icons[type] || '📅';
    }
    
    getTimeAgo(timestamp) {
        if (!timestamp || !timestamp.toDate) return 'Just now';
        const now = new Date();
        const time = timestamp.toDate();
        const diff = Math.floor((now - time) / 1000);
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }
    
    getEventTime(timestamp) {
        if (!timestamp || !timestamp.toDate) return 'TBD';
        const time = timestamp.toDate();
        const now = new Date();
        const diff = time - now;
        
        if (diff < 0) return 'Started';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return `${Math.floor(diff / 86400000)}d`;
    }
    
    viewNewsDetails(newsId) {
        this.showNotification(`📰 Opening news: ${newsId}`);
        // TODO: Implement news details modal
    }
    
    viewEventDetails(eventId) {
        this.showNotification(`🎉 Opening event: ${eventId}`);
        // TODO: Implement event details modal
    }
}