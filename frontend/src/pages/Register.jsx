import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API, { setAccessToken } from "../api/index";
import VerifyOTP from "../components/VerifyOTP";
import GoogleSignIn from "../components/GoogleSignIn";
import "../Register.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await API.post("/auth/register", {
        username,
        email,
        password,
        confirmPassword: password,
      });

      if (response.data?.requiresVerification) {
        setRequiresVerification(true);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Registration failed. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (requiresVerification) {
    return (
      <div className="register-viewport">
        <VerifyOTP
          email={email}
          password={password}
          onVerificationSuccess={async () => {
            setRequiresVerification(false);
            try {
              const response = await API.post("/auth/login", {
                email,
                password,
              });
              // FIX — memory only, no localStorage.
              setAccessToken(response.data.accessToken);
              navigate("/", { replace: true });
            } catch (err) {
              console.error("Auto-login failed:", err);
              navigate("/login", { replace: true });
            }
          }}
          onCancel={() => setRequiresVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className="register-viewport">
      <div className="register-card-frame">
        <div className="register-header-block">
          <h2 className="register-main-title">Create Account</h2>
          <p className="register-sub-title">
            Set up a profile to manage pricing matrices
          </p>
        </div>

        {error && (
          <div className="register-alert-banner">
            <svg
              className="register-alert-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        <form onSubmit={handleSubmit} className="register-core-form">
          <div className="register-field-group">
            <label className="register-field-label">Full Name</label>
            <input
              type="text"
              value={username}
              placeholder="John Doe"
              onChange={(e) => setUsername(e.target.value)}
              className="register-field-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="register-field-group">
            <label className="register-field-label">Email Address</label>
            <input
              type="email"
              value={email}
              placeholder="name@company.com"
              onChange={(e) => setEmail(e.target.value)}
              className="register-field-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="register-field-group">
            <label className="register-field-label">Password</label>
            <div className="register-input-positional-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="register-field-input register-password-padding"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="register-input-visibility-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
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
            disabled={isLoading}
            className="register-submit-trigger"
          >
            {isLoading ? "Creating Profile..." : "Create Account"}
          </button>
        </form>

        <div className="register-ui-divider">
          <span className="register-divider-line"></span>
          <span className="register-divider-text">or</span>
          <span className="register-divider-line"></span>
        </div>

        <div className="google-btn-wrapper">
          <GoogleSignIn
            disabled={isLoading}
            onSuccess={async (credentialResponse) => {
              try {
                const response = await API.post("/auth/google", {
                  credential: credentialResponse.credential,
                });
                // FIX — memory only, no localStorage.
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

        <p className="register-footer-redirect-hint">
          Already registered?{" "}
          <Link to="/login" className="register-footer-redirect-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
