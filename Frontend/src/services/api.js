import axios from "axios";
import { auth } from "../config/firebase";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000, // 15s timeout for mobile data
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Firebase ID token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
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
      // Token expired — user needs to re-login
      console.warn("Auth expired, redirecting to login");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
