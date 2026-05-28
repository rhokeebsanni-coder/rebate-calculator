import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");


  if (!token || token === "undefined" || token === "null") {
    return children;
  }

  return <Navigate to="/" replace />;
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
