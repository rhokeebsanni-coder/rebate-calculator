import { useGoogleLogin } from "@react-oauth/google";
import { isGoogleAuthConfigured } from "../config/googleAuth";

const GoogleSignIn = ({ onSuccess, onError, disabled }) => {
  if (!isGoogleAuthConfigured()) {
    return (
      <p
        style={{
          fontSize: "0.85rem",
          color: "#666",
          textAlign: "center",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Google sign-in not configured. Add GOOGLE_CLIENT_ID to .env and restart.
      </p>
    );
  }

  const login = useGoogleLogin({
    flow: "implicit",
    scope: "openid profile email",
    prompt: "select_account",
    onSuccess: (tokenResponse) => {
      if (!tokenResponse.access_token) {
        onError?.();
        return;
      }
      onSuccess({ accessToken: tokenResponse.access_token });
    },
    onError,
  });

  return (
    <button
      type="button"
      className="google-custom-btn"
      onClick={() => login()}
      disabled={disabled}
    >
      <span className="google-custom-btn__icon">G</span>
      <span className="google-custom-btn__label">Sign in with Google</span>
    </button>
  );
};

export default GoogleSignIn;
