import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../config/supabase";
import api from "../services/api";

const AuthContext = createContext(null);

const siteUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, "");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function forceLocalLogout() {
    try {
        await supabase?.auth?.signOut?.({ scope: "local" });
    } catch {
        // ignore
    }
    try {
        Object.keys(window.localStorage).forEach((key) => {
            if (key.startsWith("sb-") || key.includes("supabase")) {
                window.localStorage.removeItem(key);
            }
        });
    } catch {
        // ignore
    }
}

async function getSessionWithTimeout(timeoutMs = 5000) {
    if (!supabase) return { session: null, timedOut: false, error: new Error("Supabase client not configured") };

    let timeoutHandle;
    const timeoutPromise = new Promise((resolve) => {
        timeoutHandle = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
    });

    try {
        const result = await Promise.race([supabase.auth.getSession(), timeoutPromise]);
        if (result?.timedOut) return { session: null, timedOut: true, error: new Error("Session restore timeout") };
        const { data, error } = result;
        if (error) return { session: null, timedOut: false, error };
        return { session: data?.session || null, timedOut: false, error: null };
    } finally {
        clearTimeout(timeoutHandle);
    }
}

export function AuthProvider({ children }) {
    const [authUser, setAuthUser] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [bootId, setBootId] = useState(0);

    const isLoadingTooLong = useMemo(() => {
        if (!loading) return false;
        return true;
    }, [loading]);

    useEffect(() => {
        let isMounted = true;

        const bootstrap = async () => {
            setAuthError(null);
            setLoading(true);
            try {
                const { session, timedOut, error } = await getSessionWithTimeout(5000);
                if (!isMounted) return;

                if (timedOut || error) {
                    console.error("Session restore failed:", error?.message || error);
                    await forceLocalLogout();
                    if (!isMounted) return;
                    setAuthUser(null);
                    setUser(null);
                    setAuthError(error || new Error("Session restore failed"));
                    return;
                }

                const sessionUser = session?.user || null;
                setAuthUser(sessionUser);

                if (sessionUser) {
                    try {
                        const res = await api.post("/user/login", {});
                        if (isMounted) setUser(res.data);
                    } catch (err) {
                        // If backend profile fetch fails, treat session as invalid to avoid stuck states.
                        console.error("Backend login failed:", err);
                        await forceLocalLogout();
                        if (!isMounted) return;
                        setAuthUser(null);
                        setUser(null);
                        setAuthError(new Error("Backend login failed"));
                    }
                } else {
                    setUser(null);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        bootstrap();

        const {
            data: { subscription },
        } = supabase
            ? supabase.auth.onAuthStateChange(async (_event, session) => {
                  if (!isMounted) return;
                  setAuthError(null);
                  try {
                      const nextUser = session?.user || null;
                      setAuthUser(nextUser);
                      if (nextUser) {
                          try {
                              const res = await api.post("/user/login", {});
                              if (isMounted) setUser(res.data);
                          } catch (err) {
                              console.error("Backend login failed:", err);
                              await forceLocalLogout();
                              if (!isMounted) return;
                              setAuthUser(null);
                              setUser(null);
                              setAuthError(new Error("Backend login failed"));
                          }
                      } else {
                          setUser(null);
                      }
                  } finally {
                      if (isMounted) setLoading(false);
                  }
              })
            : { data: { subscription: { unsubscribe: () => {} } } };

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [bootId]);

    const loginWithGoogle = async () => {
        try {
            if (!supabase) throw new Error("Supabase client not configured");
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${siteUrl}/login`,
                    skipBrowserRedirect: false,
                },
            });
            if (error) throw error;
            return null;
        } catch (err) {
            console.error("Email/password login failed:", err);
            throw err;
        }
    };

    const loginWithEmailPassword = async (email, password) => {
        try {
            if (!supabase) throw new Error("Supabase client not configured");
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            const res = await api.post("/user/login", {});
            setUser(res.data);
            return res.data;
        } catch (err) {
            console.error("Google login failed:", err);
            throw err;
        }
    };

    const logout = async () => {
        await forceLocalLogout();
        setUser(null);
        setAuthUser(null);
        setLoading(false);
    };

    const retryAuth = async () => {
        setBootId((x) => x + 1);
    };

    const resetAuth = async () => {
        await forceLocalLogout();
        setBootId((x) => x + 1);
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
                authUser,
                user,
                loading,
                authError,
                retryAuth,
                resetAuth,
                loginWithGoogle,
                loginWithEmailPassword,
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
