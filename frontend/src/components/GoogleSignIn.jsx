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
    <div
      style={{
        width: "100%",
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          onSuccess({ credential: credentialResponse.credential });
        }}
        onError={onError}
        useOneTap={false}
        theme="outline"
        shape="rectangular"
        size="large"
        width="100%"
        text="signin_with"
        logo_alignment="left"
      />
    </div>
  );
};

export default GoogleSignIn;
