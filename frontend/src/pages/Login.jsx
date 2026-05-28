import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API, { setAccessToken } from "../api/index";
import VerifyOTP from "../components/VerifyOTP";
import GoogleSignIn from "../components/GoogleSignIn";
import "../Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const response = await API.post("/auth/login", { email, password });

      if (response.data?.requiresVerification) {
        setRequiresVerification(true);
      } else {
        // FIX — store access token in memory, not localStorage.
        // The refresh token is handled automatically via HttpOnly cookie.
        setAccessToken(response.data.accessToken);
        navigate("/", { replace: true });
      }
    } catch (error) {
      setError(error.response?.data?.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (requiresVerification) {
    return (
      <div className="auth-viewport">
        <VerifyOTP
          email={email}
          onVerificationSuccess={() => {
            setRequiresVerification(false);
            setSuccessMsg("Account verified! Please sign in.");
          }}
          onCancel={() => setRequiresVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className="auth-viewport">
      <div className="auth-card-frame">
        <div className="auth-header-block">
          <h2 className="auth-main-title">Welcome Back</h2>
          <p className="auth-sub-title">
            Log in to access your wholesale pricing dashboard
          </p>
        </div>

        {error && (
          <div className="auth-alert-banner">
            <svg
              className="alert-banner-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#16a34a",
              padding: "0.75rem 1rem",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-core-form">
          <div className="auth-field-group">
            <label className="auth-field-label">Email Address</label>
            <input
              type="email"
              value={email}
              placeholder="name@company.com"
              onChange={(e) => setEmail(e.target.value)}
              className="auth-field-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="auth-field-group">
            <label className="auth-field-label">Password</label>
            <div className="input-positional-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="auth-field-input password-input-padding"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="auth-input-visibility-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                    <line x1="2" y1="2" x2="22" y2="22"></line>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-trigger"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-ui-divider">
          <span className="ui-divider-line"></span>
          <span className="ui-divider-text">or continue with</span>
          <span className="ui-divider-line"></span>
        </div>

        <div className="google-btn-wrapper">
          <GoogleSignIn
            disabled={isLoading}
            onSuccess={async (credentialResponse) => {
              try {
                const response = await API.post("/auth/google", {
                  credential: credentialResponse.credential,
                });
                // FIX — same as above, memory only.
                setAccessToken(response.data.accessToken);
                navigate("/", { replace: true });
              } catch (error) {
                setError(
                  error.response?.data?.message || "Google sign-in failed.",
                );
              }
            }}
            onError={() => setError("Google sign-in failed.")}
          />
        </div>

        <p className="auth-footer-redirect-hint">
          Don't have an account?{" "}
          <Link to="/register" className="auth-footer-redirect-link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
