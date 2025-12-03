import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import {initializeApp} from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDLw0Rm5J5SS_rvVbGNM8QEY7eGQQ9Xu38",
  authDomain: "eventizer-500af.firebaseapp.com",
  projectId: "eventizer-500af",
  storageBucket: "eventizer-500af.firebasestorage.app",
  messagingSenderId: "727257688523",
  appId: "1:727257688523:web:8e5b648d31d1fdbf21ae4e",
  measurementId: "G-Y4FP956FJ1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default auth;