import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDi-HwDmrDtZxf2h1GiRXsNJwliDhup3mQ",
  authDomain: "attendance-system-6c1d1.firebaseapp.com",
  projectId: "attendance-system-6c1d1",
  storageBucket: "attendance-system-6c1d1.firebasestorage.app",
  messagingSenderId: "86627363979",
  appId: "1:86627363979:web:6e20cb47a4347d1fc4388e",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
export default app;
