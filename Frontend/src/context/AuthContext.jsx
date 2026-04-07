import { createContext, useContext, useState, useEffect } from "react";
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [user, setUser] = useState(null); // MongoDB user profile
    const [loading, setLoading] = useState(true);

    // Listen for Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                try {
                    // Fetch or create user in our backend
                    const res = await api.post("/user/login", {});
                    setUser(res.data);
                } catch (err) {
                    console.error("Backend login failed:", err);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // Backend auto-assigns "student" role for google sign-ins
            const res = await api.post("/user/login", {});
            setUser(res.data);
            return res.data;
        } catch (err) {
            console.error("Google login failed:", err);
            throw err;
        }
    };

    const loginTeacher = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            // Backend auto-assigns "teacher" role for password sign-ins
            const res = await api.post("/user/login", {});
            setUser(res.data);
            return res.data;
        } catch (err) {
            console.error("Teacher login failed:", err);
            throw err;
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
    };

    const updateProfile = async (data) => {
        const res = await api.put("/user/profile", data);
        setUser(res.data);
        return res.data;
    };

    const refreshUser = async () => {
        try {
            const res = await api.get("/user/me");
            setUser(res.data);
        } catch (err) {
            console.error("Refresh user failed:", err);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                firebaseUser,
                user,
                loading,
                loginWithGoogle,
                loginTeacher,
                logout,
                updateProfile,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
