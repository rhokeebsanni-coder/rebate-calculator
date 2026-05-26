// components/HomeSkeleton.jsx
const HomeSkeleton = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header skeleton */}
      <div
        style={{
          height: "70px",
          borderBottom: "1px solid #e5e5e5",
          backgroundColor: "#fff",
          padding: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "200px",
            height: "30px",
            backgroundColor: "#e5e5e5",
            borderRadius: "8px",
            animation: "pulse 2s infinite",
          }}
        />
        <div
          style={{
            width: "100px",
            height: "24px",
            backgroundColor: "#e5e5e5",
            borderRadius: "8px",
            animation: "pulse 2s infinite",
          }}
        />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Main content skeleton */}
        <div
          style={{
            flex: 1,
            padding: "2rem",
            overflow: "auto",
            backgroundColor: "#f5f5f5",
          }}
        >
          {/* Parameter card skeleton */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div
                  style={{
                    height: "12px",
                    backgroundColor: "#e5e5e5",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                    width: "80px",
                    animation: "pulse 2s infinite",
                  }}
                />
                <div
                  style={{
                    height: "40px",
                    backgroundColor: "#e5e5e5",
                    borderRadius: "8px",
                    animation: "pulse 2s infinite",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid #f5f5f5",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  width: "150px",
                  height: "20px",
                  backgroundColor: "#e5e5e5",
                  borderRadius: "4px",
                  animation: "pulse 2s infinite",
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "80px",
                      height: "32px",
                      backgroundColor: "#e5e5e5",
                      borderRadius: "6px",
                      animation: "pulse 2s infinite",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Table rows skeleton */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid #f5f5f5",
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 0.5fr",
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                {[1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    style={{
                      height: "20px",
                      backgroundColor: "#e5e5e5",
                      borderRadius: "4px",
                      animation: "pulse 2s infinite",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div
          style={{
            width: "320px",
            borderLeft: "1px solid #e5e5e5",
            backgroundColor: "#fff",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {/* History skeleton */}
          <div>
            <div
              style={{
                height: "16px",
                backgroundColor: "#e5e5e5",
                borderRadius: "4px",
                marginBottom: "1rem",
                animation: "pulse 2s infinite",
              }}
            />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: "1rem",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px",
                  marginBottom: "0.75rem",
                  animation: "pulse 2s infinite",
                }}
              >
                <div
                  style={{
                    height: "12px",
                    backgroundColor: "#e5e5e5",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                  }}
                />
                <div
                  style={{
                    height: "20px",
                    backgroundColor: "#e5e5e5",
                    borderRadius: "4px",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Account widget skeleton */}
          <div
            style={{
              paddingTop: "1rem",
              borderTop: "1px solid #e5e5e5",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#e5e5e5",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              />
              <div
                style={{
                  flex: 1,
                }}
              >
                <div
                  style={{
                    height: "14px",
                    backgroundColor: "#e5e5e5",
                    borderRadius: "4px",
                    marginBottom: "0.25rem",
                    animation: "pulse 2s infinite",
                  }}
                />
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "#e5e5e5",
                    borderRadius: "4px",
                    animation: "pulse 2s infinite",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default HomeSkeleton;
