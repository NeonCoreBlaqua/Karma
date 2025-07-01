// firebase-config.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU4bnRqgYLopb221Q5zBhjcOeLWUF3FjY", // IMPORTANT: Paste your actual API key here
  authDomain: "karmago-e4721.firebaseapp.com",
  projectId: "karmago-e4721",
  storageBucket: "karmago-e4721.appspot.com", // Corrected this based on documentation [4]
  messagingSenderId: "203472083344",
  appId: "1:203472083344:web:7066cf651bda70eadb7b15",
  measurementId: "G-JTL390HG3Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
