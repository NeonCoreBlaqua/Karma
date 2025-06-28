// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVA51QgdGfVja7CxJ-zn62ypayjSGsgWA",
  authDomain: "karmago-e4721.firebaseapp.com",
  projectId: "karmago-e4721",
  storageBucket: "karmago-e4721.firebasestorage.app",
  messagingSenderId: "203472083344",
  appId: "1:203472083344:web:7066cf651bda70eadb7b15",
  measurementId: "G-JTL390HG3Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export the initialized app and services to be used in other files
export { app, db, auth, storage };
