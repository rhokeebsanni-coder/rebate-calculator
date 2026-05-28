// api/index.js
import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // sends the HttpOnly refresh token cookie automatically
});

// Request interceptor — attach access token from memory, not localStorage.
// Store the token in a module-level variable so it never touches the DOM.
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

API.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — on 401, attempt one silent refresh then retry.
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401s that haven't already been retried,
    // and skip the refresh endpoint itself to avoid infinite loops.
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh-token")
    ) {
      original._retry = true;

      if (isRefreshing) {
        // Queue subsequent 401s while a refresh is already in flight.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(original))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const { data } = await API.post("/auth/refresh-token");
        setAccessToken(data.accessToken);
        processQueue(null);
        return API(original);
      } catch (refreshError) {
        processQueue(refreshError);
        clearAccessToken();
        // Refresh failed — user needs to log in again.
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default API;
