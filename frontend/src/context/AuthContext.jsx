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
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((accessToken, refreshToken, userData) => {
    setAccessToken(accessToken);
    console.log("access token set")
    localStorage.setItem("refreshToken", refreshToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.log(error)
    }
    clearAccessToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (!storedRefreshToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await API.post("/auth/refresh-token", {
          refreshToken: storedRefreshToken,
        });
        setAccessToken(data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        const { data: meData } = await API.get("/auth/me");
        setUser(meData.user);
        setIsAuthenticated(true);
      } catch {
        clearAccessToken();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
    window.addEventListener("auth:logout", logout);
    return () => window.removeEventListener("auth:logout", logout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isAuthLoading: isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
