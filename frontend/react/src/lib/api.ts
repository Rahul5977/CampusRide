/* -----------------------------------------------------------------------
 * Axios instance with JWT interceptor.
 *
 * Every request automatically gets the `Authorization: Bearer <token>`
 * header attached from localStorage. If any response returns 401, the
 * token is cleared and the user is bounced to the login page.
 * ----------------------------------------------------------------------- */

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ---- Request interceptor: attach JWT ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ct_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: handle 401 globally ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ct_token");
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== "/") {
        window.location.href = "/?error=session_expired";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
