import { useState, useEffect } from "react";
import API from "../api/products";

const VerifyOTP = ({ email, onVerificationSuccess, onCancel }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(900);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const fullCode = otp.join("");
    if (fullCode.length !== 6) {
      return setErrorMsg("Please enter a 6-digit code.");
    }

    try {
      setIsSubmitting(true);
      await API.post("/auth/verify-email", { email, otp: fullCode });
      setSuccessMsg("Email verified!");

      setTimeout(() => {
        onVerificationSuccess();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendToken = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // Adjusted endpoint reference payload targets cleanly
      await API.post("/auth/resend-otp", { email });
      setSuccessMsg("Verification code sent to your email.");
      setTimer(900);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-input-0").focus();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to resend code.");
    }
  };

  return (
    <div
      className="auth-card"
      style={{ maxWidth: "420px", margin: "40px auto", padding: "2.5rem" }}
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#333", fontWeight: "700" }}>
          Verify Email
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.5rem" }}>
          A verification code was sent to{" "}
          <strong style={{ color: "#7a5e3e" }}>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleVerifySubmit}>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-input-${index}`}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleInputChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{
                width: "48px",
                height: "54px",
                fontSize: "1.5rem",
                textAlign: "center",
                borderRadius: "0.375rem",
                border: "2px solid #e2e8f0",
                fontWeight: "600",
                outline: "none",
                background: "#f8fafc",
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div
            style={{
              color: "#ef4444",
              fontSize: "0.85rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              color: "#10b981",
              fontSize: "0.85rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#666",
            marginBottom: "1.5rem",
          }}
        >
          {timer > 0 ? (
            <span>
              Code expires in:{" "}
              <strong style={{ color: "#7a5e3e" }}>{formatTime(timer)}</strong>
            </span>
          ) : (
            <span style={{ color: "#ef4444", fontWeight: "600" }}>
              Code expired.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || timer === 0}
          className="btn-primary"
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1.5rem",
          fontSize: "0.85rem",
        }}
      >
        <button
          onClick={handleResendToken}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#7a5e3e",
            fontWeight: "600",
          }}
        >
          🔄 Resend Code
        </button>
        <button
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#94a3b8",
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;
