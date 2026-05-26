import { GoogleLogin } from "@react-oauth/google";
import { isGoogleAuthConfigured } from "../config/googleAuth";

const GoogleSignIn = ({ onSuccess, onError }) => {
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
      theme="outline" // Clean white background with border
      shape="rectangular" // Matches your inputs (or change to "pill" if desired)
      size="large" // Gives it maximum height (40px)
      width="100%" // ⚡ Forces the native button to fill the container 100%
      text="signin_with" // Tells it to cleanly display "Sign in with Google"
      logo_alignment="left" // Keeps the 'G' logo perfectly aligned on the left
    />
  );
};

export default GoogleSignIn;
