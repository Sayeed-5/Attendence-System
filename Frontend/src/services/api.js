import axios from "axios";
import { supabase } from "../config/supabase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://attendence-system-backend-1.onrender.com/api",
  timeout: 15000, // 15s timeout for mobile data
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

// Attach Supabase access token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      if (!supabase) return config;
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const token = data?.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Token error:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Prevent hard loops on login endpoint while still recovering from expired sessions.
      const reqUrl = String(error.config?.url || "");
      const isLoginApi = reqUrl.includes("/user/login");
      if (!isLoginApi) {
        void supabase?.auth?.signOut?.({ scope: "local" });
      }
      if (window.location.pathname !== "/login") {
        console.warn("Auth expired, redirecting to login");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
