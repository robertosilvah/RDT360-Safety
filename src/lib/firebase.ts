// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA58WZHhyhX-JZ2UlFdIfsiR6_rMP1vRfU",
  authDomain: "rdt360-safety.firebaseapp.com",
  projectId: "rdt360-safety",
  storageBucket: "rdt360-safety.appspot.com",
  messagingSenderId: "949644180482",
  appId: "1:949644180482:web:58393615e49c106502fb1b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
