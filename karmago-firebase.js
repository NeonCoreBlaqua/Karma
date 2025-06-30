// KarmaGo Firebase Integration
class KarmaGoFirebase {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.storage = firebase.storage();
        this.currentUser = null;
        
        // Collections
        this.usersCollection = this.db.collection('users');
        this.postsCollection = this.db.collection('posts');
        this.musicCollection = this.db.collection('music');
        this.placesCollection = this.db.collection('places');
        this.eventsCollection = this.db.collection('events');
        this.newsCollection = this.db.collection('news');
        
        this.init();
    }
    
    init() {
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserData();
            } else {
                this.currentUser = null;
                this.showLoginPrompt();
            }
        });
        
        // Initialize real-time listeners
        this.setupRealtimeListeners();
    }
    
    // Authentication Methods
    async signUp(email, password, userData) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user document
            await this.usersCollection.doc(user.uid).set({
                uid: user.uid,
                email: email,
                username: userData.username,
                displayName: userData.displayName,
                bio: userData.bio || '',
                avatar: userData.avatar || 'assets/images/profile.png',
                verified: false,
                followers: 0,
                following: 0,
                posts: 0,
                location: userData.location || '',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                karma: 100
            });
            
            this.showNotification('Account created successfully! 🎉');
            return user;
        } catch (error) {
            this.showNotification('Error creating account: ' + error.message);
            throw error;
        }
    }
    
    async signIn(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            this.showNotification('Welcome back! 🔥');
            return userCredential.user;
        } catch (error) {
            this.showNotification('Error signing in: ' + error.message);
            throw error;
        }
    }
    
    async signOut() {
        try {
            await this.auth.signOut();
            this.showNotification('Signed out successfully');
        } catch (error) {
            this.showNotification('Error signing out: ' + error.message);
        }
    }
    
    // Posts Methods
    async createPost(postData) {
        if (!this.currentUser) {
            this.showNotification('Please sign in to create posts');
            return;
        }
        
        try {
            const post = {
                userId: this.currentUser.uid,
                content: postData.content,
                image: postData.image || null,
                music: postData.music || null,
                location: postData.location || null,
                mood: postData.mood || null,
                likes: 0,
                comments: 0,
                shares: 0,
                likedBy: [],
                savedBy: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await this.postsCollection.add(post);
            
            // Update user post count
            await this.usersCollection.doc(this.currentUser.uid).update({
                posts: firebase.firestore.FieldValue.increment(1)
            });
            
            this.showNotification('Post shared successfully! 🔥');
            return docRef.id;
        } catch (error) {
            this.showNotification('Error creating post: ' + error.message);
            throw error;
        }
    }
    
    async likePost(postId) {
        if (!this.currentUser) return;
        
        try {
            const postRef = this.postsCollection.doc(postId);
            const postDoc = await postRef.get();
            
            if (postDoc.exists) {
                const postData = postDoc.data();
                const likedBy = postData.likedBy || [];
                const isLiked = likedBy.includes(this.currentUser.uid);
                
                if (isLiked) {
                    // Unlike
                    await postRef.update({
                        likes: firebase.firestore.FieldValue.increment(-1),
                        likedBy: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid)
                    });
                } else {
                    // Like
                    await postRef.update({
                        likes: firebase.firestore.FieldValue.increment(1),
                        likedBy: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid)
                    });
                }
                
                return !isLiked;
            }
        } catch (error) {
            this.showNotification('Error updating like: ' + error.message);
        }
    }
    
    async savePost(postId) {
        if (!this.currentUser) return;
        
        try {
            const postRef = this.postsCollection.doc(postId);
            const postDoc = await postRef.get();
            
            if (postDoc.exists) {
                const postData = postDoc.data();
                const savedBy = postData.savedBy || [];
                const isSaved = savedBy.includes(this.currentUser.uid);
                
                if (isSaved) {
                    // Unsave
                    await postRef.update({
                        savedBy: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid)
                    });
                    this.showNotification('Post removed from saved');
                } else {
                    // Save
                    await postRef.update({
                        savedBy: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid)
                    });
                    this.showNotification('Post saved! 📌');
                }
                
                return !isSaved;
            }
        } catch (error) {
            this.showNotification('Error saving post: ' + error.message);
        }
    }
    
    // Music Methods
    async uploadTrack(trackData, audioFile) {
        if (!this.currentUser) {
            this.showNotification('Please sign in to upload tracks');
            return;
        }
        
        try {
            // Upload audio file to Firebase Storage
            const storageRef = this.storage.ref();
            const audioRef = storageRef.child(`music/${this.currentUser.uid}/${Date.now()}_${audioFile.name}`);
            
            this.showNotification('Uploading track... 🎵');
            
            const uploadTask = audioRef.put(audioFile);
            
            // Monitor upload progress
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload progress: ' + progress + '%');
                },
                (error) => {
                    this.showNotification('Upload failed: ' + error.message);
                },
                async () => {
                    // Upload completed
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Save track metadata to Firestore
                    const track = {
                        userId: this.currentUser.uid,
                        title: trackData.title,
                        artist: trackData.artist,
                        description: trackData.description || '',
                        audioUrl: downloadURL,
                        duration: 0, // Will be updated when track is loaded
                        plays: 0,
                        likes: 0,
                        likedBy: [],
                        genre: trackData.genre || 'Hip-Hop',
                        tags: trackData.tags || [],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    const docRef = await this.musicCollection.add(track);
                    this.showNotification('Track uploaded successfully! 🎉');
                    return docRef.id;
                }
            );
        } catch (error) {
            this.showNotification('Error uploading track: ' + error.message);
            throw error;
        }
    }
    
    async getTrendingTracks(limit = 20) {
        try {
            const snapshot = await this.musicCollection
                .orderBy('plays', 'desc')
                .limit(limit)
                .get();
            
            const tracks = [];
            snapshot.forEach(doc => {
                tracks.push({ id: doc.id, ...doc.data() });
            });
            
            return tracks;
        } catch (error) {
            console.error('Error getting trending tracks:', error);
            return [];
        }
    }
    
    async playTrack(trackId) {
        try {
            // Increment play count
            await this.musicCollection.doc(trackId).update({
                plays: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error updating play count:', error);
        }
    }
    
    // Map/Places Methods
    async addPlace(placeData) {
        if (!this.currentUser) {
            this.showNotification('Please sign in to add places');
            return;
        }
        
        try {
            const place = {
                userId: this.currentUser.uid,
                name: placeData.name,
                type: placeData.type, // music, food, events, fashion
                description: placeData.description,
                address: placeData.address,
                coordinates: {
                    lat: placeData.lat,
                    lng: placeData.lng
                },
                rating: 0,
                reviews: 0,
                photos: placeData.photos || [],
                verified: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await this.placesCollection.add(place);
            this.showNotification('Place added successfully! 📍');
            return docRef.id;
        } catch (error) {
            this.showNotification('Error adding place: ' + error.message);
            throw error;
        }
    }
    
    async getNearbyPlaces(lat, lng, radius = 10, type = null) {
        try {
            let query = this.placesCollection;
            
            if (type) {
                query = query.where('type', '==', type);
            }
            
            const snapshot = await query.get();
            const places = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const distance = this.calculateDistance(lat, lng, data.coordinates.lat, data.coordinates.lng);
                
                if (distance <= radius) {
                    places.push({
                        id: doc.id,
                        ...data,
                        distance: distance
                    });
                }
            });
            
            // Sort by distance
            return places.sort((a, b) => a.distance - b.distance);
        } catch (error) {
            console.error('Error getting nearby places:', error);
            return [];
        }
    }
    
    // Events Methods
    async createEvent(eventData) {
        if (!this.currentUser) {
            this.showNotification('Please sign in to create events');
            return;
        }
        
        try {
            const event = {
                userId: this.currentUser.uid,
                title: eventData.title,
                description: eventData.description,
                type: eventData.type, // concert, party, cypher, etc.
                location: eventData.location,
                coordinates: eventData.coordinates,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                attendees: [],
                maxAttendees: eventData.maxAttendees || null,
                isLive: false,
                tags: eventData.tags || [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await this.eventsCollection.add(event);
            this.showNotification('Event created successfully! 🎉');
            return docRef.id;
        } catch (error) {
            this.showNotification('Error creating event: ' + error.message);
            throw error;
        }
    }
    
    async getLiveEvents() {
        try {
            const snapshot = await this.eventsCollection
                .where('isLive', '==', true)
                .orderBy('startTime', 'desc')
                .get();
            
            const events = [];
            snapshot.forEach(doc => {
                events.push({ id: doc.id, ...doc.data() });
            });
            
            return events;
        } catch (error) {
            console.error('Error getting live events:', error);
            return [];
        }
    }
    
    // News Methods
    async createNews(newsData) {
        if (!this.currentUser) {
            this.showNotification('Please sign in to create news');
            return;
        }
        
        try {
            const news = {
                userId: this.currentUser.uid,
                title: newsData.title,
                content: newsData.content,
                category: newsData.category, // breaking, local, music, events, etc.
                location: newsData.location,
                coordinates: newsData.coordinates || null,
                priority: newsData.priority || 'normal', // breaking, high, normal, low
                tags: newsData.tags || [],
                views: 0,
                likes: 0,
                likedBy: [],
                verified: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                expiresAt: newsData.expiresAt || null
            };
            
            const docRef = await this.newsCollection.add(news);
            this.showNotification('News posted successfully! 📰');
            return docRef.id;
        } catch (error) {
            this.showNotification('Error creating news: ' + error.message);
            throw error;
        }
    }
    
    async getCityNews(limit = 10) {
        try {
            const snapshot = await this.newsCollection
                .orderBy('priority', 'desc')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const news = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Check if news hasn't expired
                if (!data.expiresAt || data.expiresAt.toDate() > new Date()) {
                    news.push({ id: doc.id, ...data });
                }
            });
            
            return news;
        } catch (error) {
            console.error('Error getting city news:', error);
            return [];
        }
    }
    
    async getEventsByLocation(location, limit = 5) {
        try {
            const snapshot = await this.eventsCollection
                .where('location', '==', location)
                .orderBy('startTime', 'asc')
                .limit(limit)
                .get();
            
            const events = [];
            const now = new Date();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const startTime = data.startTime ? data.startTime.toDate() : new Date();
                
                // Only include future or currently live events
                if (startTime >= now || data.isLive) {
                    events.push({ id: doc.id, ...data });
                }
            });
            
            return events;
        } catch (error) {
            console.error('Error getting events by location:', error);
            return [];
        }
    }
    
    // Real-time Listeners
    setupRealtimeListeners() {
        // Listen for new posts
        this.postsCollection
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                const posts = [];
                snapshot.forEach(doc => {
                    posts.push({ id: doc.id, ...doc.data() });
                });
                
                // Update UI with new posts
                if (window.karmaGoApp) {
                    window.karmaGoApp.updatePosts(posts);
                }
            });
        
        // Listen for live events
        this.eventsCollection
            .where('isLive', '==', true)
            .onSnapshot((snapshot) => {
                const events = [];
                snapshot.forEach(doc => {
                    events.push({ id: doc.id, ...doc.data() });
                });
                
                // Update UI with live events
                if (window.karmaGoApp) {
                    window.karmaGoApp.updateLiveEvents(events);
                }
            });
        
        // Listen for city news
        this.newsCollection
            .orderBy('createdAt', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                const news = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Check if news hasn't expired
                    if (!data.expiresAt || data.expiresAt.toDate() > new Date()) {
                        news.push({ id: doc.id, ...data });
                    }
                });
                
                // Update UI with city news
                if (window.karmaGoApp) {
                    window.karmaGoApp.updateCityNews(news);
                }
            });
    }
    
    // Utility Methods
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLng = this.degreesToRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            const userDoc = await this.usersCollection.doc(this.currentUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Update UI with user data
                if (window.karmaGoApp) {
                    window.karmaGoApp.updateUserInfo(userData);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    showLoginPrompt() {
        // For now, we'll create a demo user
        // In production, show proper login/signup forms
        this.signIn('demo@karmago.com', 'password123').catch(() => {
            this.signUp('demo@karmago.com', 'password123', {
                username: 'StreetKing_NYC',
                displayName: 'StreetKing NYC',
                location: 'Brooklyn, NY'
            });
        });
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #262626;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideInNotification 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutNotification 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize Firebase integration
window.firebaseApp = new KarmaGoFirebase();
