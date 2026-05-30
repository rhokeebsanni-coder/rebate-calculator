import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import API, { setAccessToken, clearAccessToken } from "../api/products";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = unknown, false = guest
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // true until silent refresh resolves

  // Called after login / google sign-in
  const login = useCallback((accessToken, userData) => {
    setAccessToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await API.post("/auth/logout");
    } catch (_) {}
    clearAccessToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // On every app load, try to restore the session silently via the
  // HttpOnly refresh token cookie — this is what replaces localStorage.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await API.post("/auth/refresh-token");
        setAccessToken(data.accessToken);

        const { data: meData } = await API.get("/auth/me");
        setUser(meData.user);
        setIsAuthenticated(true);
      } catch (_) {
        // No valid session — stay as guest
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    // Listen for forced logouts from the axios interceptor
    window.addEventListener("auth:logout", logout);
    return () => window.removeEventListener("auth:logout", logout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
