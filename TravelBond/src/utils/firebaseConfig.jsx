

// Firebase Configuration
// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//   databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
//   projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.REACT_APP_FIREBASE_APP_ID,
//   measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
// };


// src/firebaseConfig.jsx
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCxT2lNX9yNghcf3Jz6kJAPQLGmvUJzatI",
  authDomain: "travelbond-2ac86.firebaseapp.com",
  databaseURL: "https://travelbond-2ac86-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "travelbond-2ac86",
  storageBucket: "travelbond-2ac86.firebasestorage.app",
  messagingSenderId: "1068921192627",
  appId: "1:1068921192627:web:e5a40b4ebb8d8d6ff530c6",
  measurementId: "G-6RWKRLNXGT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, db, storage, analytics, RecaptchaVerifier };