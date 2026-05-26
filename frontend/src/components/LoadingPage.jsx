// components/LoadingPage.jsx
const LoadingPage = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#f5f5f5",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <div
        style={{
          width: "60px",
          height: "60px",
          border: "4px solid #e5e5e5",
          borderTop: "4px solid #171717",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ color: "#666", fontSize: "1rem" }}>Loading...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingPage;
