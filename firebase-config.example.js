// firebase-config.example.js
// THIS IS A PUBLIC TEMPLATE. DO NOT PASTE REAL KEYS HERE.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_NEW_API_KEY_HERE",
  authDomain: "karmago-e4721.firebaseapp.com",
  // ... etc
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
