import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyDoF0ArE5t7INoIp4crN37BqUR4Dq8eq9c",
  authDomain: "expense-manage-project-5e615.firebaseapp.com",
  projectId: "expense-manage-project-5e615",
  storageBucket: "expense-manage-project-5e615.firebasestorage.app",
  messagingSenderId: "1012932391363",
  appId: "1:1012932391363:web:01c98235a66fa948834d76"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;