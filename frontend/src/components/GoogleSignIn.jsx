import { GoogleLogin } from "@react-oauth/google";
import { isGoogleAuthConfigured } from "../config/googleAuth";

const GoogleSignIn = ({ onSuccess, onError, text = "signin_with" }) => {
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

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="outline"
        shape="rectangular"
        size="large"
        text={text}
        width="100%"
      />
    </div>
  );
};

export default GoogleSignIn;
