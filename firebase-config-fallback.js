// Fallback Firebase configuration for offline development
// This is a simplified version that will prevent loading errors

console.log('Loading fallback Firebase config...');

// Mock Firebase objects to prevent errors
const mockAuth = {
    currentUser: null,
    signOut: () => Promise.resolve(),
    onAuthStateChanged: (callback) => {
        // Simulate no user logged in
        setTimeout(() => callback(null), 100);
    }
};

const mockDb = {
    collection: () => ({
        doc: () => ({
            get: () => Promise.resolve({ exists: false, data: () => ({}) }),
            set: () => Promise.resolve(),
            update: () => Promise.resolve(),
            delete: () => Promise.resolve()
        }),
        add: () => Promise.resolve({ id: 'mock-id' }),
        get: () => Promise.resolve({ docs: [] }),
        onSnapshot: () => () => {} // Return unsubscribe function
    })
};

const mockStorage = {
    ref: () => ({
        child: () => mockStorage.ref(),
        put: () => Promise.resolve({
            ref: {
                getDownloadURL: () => Promise.resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNzc3Ii8+Cjwvc3ZnPgo=')
            }
        })
    })
};

// Export mock objects
export const app = { name: 'mock-app' };
export const db = mockDb;
export const auth = mockAuth;
export const storage = mockStorage;

// Also export Firebase functions as mocks
export const signOut = mockAuth.signOut;
export const onAuthStateChanged = mockAuth.onAuthStateChanged;

// Mock Firestore functions
export const collection = mockDb.collection;
export const doc = () => mockDb.collection().doc();
export const getDoc = () => Promise.resolve({ exists: false, data: () => ({}) });
export const getDocs = () => Promise.resolve({ docs: [] });
export const setDoc = () => Promise.resolve();
export const addDoc = () => Promise.resolve({ id: 'mock-id' });
export const updateDoc = () => Promise.resolve();
export const deleteDoc = () => Promise.resolve();
export const increment = (val) => val;
export const arrayUnion = (...items) => items;
export const arrayRemove = (...items) => items;
export const serverTimestamp = () => new Date();
export const query = () => ({});
export const orderBy = () => ({});
export const onSnapshot = () => () => {};

// Mock Storage functions
export const ref = mockStorage.ref;
export const uploadBytes = () => Promise.resolve({
    ref: {
        getDownloadURL: () => Promise.resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNzc3Ii8+Cjwvc3ZnPgo=')
    }
});
export const getDownloadURL = () => Promise.resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNzc3Ii8+Cjwvc3ZnPgo=');

console.log('Fallback Firebase config loaded successfully');
