import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let accessToken = localStorage.getItem("accessToken") || null;

export const setAccessToken = (token) => {
  accessToken = token;
  localStorage.setItem("accessToken", token);
};

export const clearAccessToken = () => {
  accessToken = null;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

API.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh-token")
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(original))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const { data } = await API.post("/auth/refresh-token", {
          refreshToken: storedRefreshToken,
        });
        setAccessToken(data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        processQueue(null);
        return API(original);
      } catch (refreshError) {
        processQueue(refreshError);
        clearAccessToken();
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
