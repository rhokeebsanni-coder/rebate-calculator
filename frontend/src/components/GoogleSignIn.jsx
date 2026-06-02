import { GoogleLogin } from "@react-oauth/google";
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

  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        onSuccess({ credential: credentialResponse.credential });
      }}
      onError={onError}
      useOneTap={false}
      iframeProps={{ title: "reCAPTCHA" }}
      theme="outline"
      shape="pill"
      size="large"
      text="continue_with"
      logo_alignment="left"
    />
  );
};

export default GoogleSignIn;
