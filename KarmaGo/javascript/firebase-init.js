// Firebase initialization and helper functions for KarmaGo
// This file provides Firebase setup utilities and default data

class FirebaseInitializer {
    constructor() {
        this.isInitialized = false;
    }
    
    // Initialize Firebase with configuration check
    init(config) {
        try {
            if (!config || !config.apiKey || !config.projectId) {
                throw new Error('Invalid Firebase configuration');
            }
            
            firebase.initializeApp(config);
            this.isInitialized = true;
            console.log('🔥 Firebase initialized successfully!');
            
            // Set up initial collections and security
            this.setupInitialData();
            
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }
    
    // Create initial data structure
    async setupInitialData() {
        try {
            const db = firebase.firestore();
            
            // Check if we need to create initial data
            const usersCollection = await db.collection('users').limit(1).get();
            
            if (usersCollection.empty) {
                console.log('Setting up initial data...');
                await this.createSampleData();
            }
        } catch (error) {
            console.error('Error setting up initial data:', error);
        }
    }
    
    // Create sample data for demonstration
    async createSampleData() {
        const db = firebase.firestore();
        
        // Sample trending music
        const sampleTracks = [
            {
                title: 'Brooklyn Drill Anthem',
                artist: 'DJ_Kool_NYC',
                genre: 'Drill',
                plays: 12500,
                likes: 890,
                duration: 204, // 3:24 in seconds
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                tags: ['drill', 'brooklyn', 'hip-hop']
            },
            {
                title: 'Harlem Nights',
                artist: 'MC_Brooklyn',
                genre: 'Hip-Hop',
                plays: 8900,
                likes: 567,
                duration: 178, // 2:58 in seconds
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                tags: ['harlem', 'hip-hop', 'classic']
            },
            {
                title: 'Queens Flow',
                artist: 'StreetBeats_QNS',
                genre: 'Trap',
                plays: 15200,
                likes: 1234,
                duration: 225, // 3:45 in seconds
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                tags: ['queens', 'trap', 'beats']
            }
        ];
        
        // Sample places
        const samplePlaces = [
            {
                name: 'Brooklyn Beat Studio',
                type: 'music',
                description: 'Professional recording studio in the heart of Brooklyn',
                address: '123 Brooklyn Ave, Brooklyn, NY',
                coordinates: { lat: 40.6782, lng: -73.9442 },
                rating: 4.8,
                reviews: 47,
                verified: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'Harlem Night Market',
                type: 'food',
                description: 'Best street food in uptown Manhattan',
                address: '456 Harlem St, New York, NY',
                coordinates: { lat: 40.8176, lng: -73.9482 },
                rating: 4.6,
                reviews: 123,
                verified: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'Queens Culture Center',
                type: 'events',
                description: 'Community center hosting urban culture events',
                address: '789 Queens Blvd, Queens, NY',
                coordinates: { lat: 40.7282, lng: -73.7949 },
                rating: 4.9,
                reviews: 89,
                verified: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        try {
            // Add sample tracks
            const musicCollection = db.collection('music');
            for (const track of sampleTracks) {
                await musicCollection.add(track);
            }
            
            // Add sample places
            const placesCollection = db.collection('places');
            for (const place of samplePlaces) {
                await placesCollection.add(place);
            }
            
            console.log('✅ Sample data created successfully!');
        } catch (error) {
            console.error('Error creating sample data:', error);
        }
    }
    
    // Validate Firebase configuration
    validateConfig(config) {
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
        
        for (const field of requiredFields) {
            if (!config[field] || config[field].includes('your-')) {
                return {
                    valid: false,
                    message: `Please update ${field} in your Firebase configuration`
                };
            }
        }
        
        return { valid: true, message: 'Configuration is valid' };
    }
    
    // Get Firebase status
    getStatus() {
        return {
            initialized: this.isInitialized,
            auth: firebase.auth ? firebase.auth().currentUser : null,
            timestamp: new Date().toISOString()
        };
    }
}

// Export for use in main application
window.FirebaseInitializer = FirebaseInitializer;

// Auto-initialize if Firebase config is already available
if (typeof firebaseConfig !== 'undefined') {
    const initializer = new FirebaseInitializer();
    initializer.init(firebaseConfig);
}
