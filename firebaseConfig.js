import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyBTDgV4wtG6t0ncPVI18_NQdDQxqklbd6s",
  authDomain: "quanlychitieu-a7053.firebaseapp.com",
  projectId: "quanlychitieu-a7053",
  storageBucket: "quanlychitieu-a7053.firebasestorage.app",
  messagingSenderId: "239624035516",
  appId: "1:239624035516:web:bf80a64b1b1d1ee7fe84b9",
  measurementId: "G-L6LVTTTPJM"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];


// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
