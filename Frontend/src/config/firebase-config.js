import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import {initializeApp} from 'firebase/app';
const firebaseConfig = {
  apiKey: "AIzaSyA0fGAcSapYO2ULU5byh61ycCviM7fimgc",
  authDomain: "fir-fe16d.firebaseapp.com",
  projectId: "fir-fe16d",
  storageBucket: "fir-fe16d.firebasestorage.app",
  messagingSenderId: "542004982416",
  appId: "1:542004982416:web:6848f4a9f806d8a8431e15",
  measurementId: "G-NFNCC9VGM7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default auth;