// firebase-config.example.js
// THIS IS A PUBLIC TEMPLATE. DO NOT PASTE REAL KEYS HERE.
// Rename this file to firebase-config.js and add your keys to run the project locally.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "karmago-e4721.firebaseapp.com",
  projectId: "karmago-e4721",
  storageBucket: "karmago-e4721.appspot.com",
  messagingSenderId: "203472083344",
  appId: "1:20347208344:web:7066cf651bda70eadb7b15",
  measurementId: "G-JTL390HG3Y"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
