import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import API from "./api/products.js";

const PublicRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Attempt to fetch user data. If successful, user is authenticated.
        // The API interceptor will attach the in-memory access token and handle refreshes.
        await API.get("/auth/me");
        setIsAuthenticated(true);
      } catch {
        // Request failed (no valid token), so allow access to public routes
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Loading state — don't render anything until we check authentication
  if (isAuthenticated === null) {
    return null;
  }

  // If authenticated, redirect to home; otherwise show public route
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
