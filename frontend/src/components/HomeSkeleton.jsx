// components/HomeSkeleton.jsx
const HomeSkeleton = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
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

      {/* Main Container: Flips layout orientation on mobile */}
      <div className="main-container">
        {/* Main content skeleton */}
        <div
          style={{
            flex: 1,
            padding: "1.5rem",
            backgroundColor: "#f5f5f5",
          }}
        >
          {/* Parameter card skeleton: Shifts from 3 cols to 1 col */}
          <div className="parameter-grid">
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
                alignItems: "center",
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

            {/* Table rows skeleton: Simplifies column widths on mobile */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="table-row">
                {[1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    className={`table-cell cell-${j}`}
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

        {/* Sidebar skeleton: Stacks underneath main content on mobile */}
        <div className="sidebar-container">
          {/* History skeleton */}
          <div style={{ flex: 1 }}>
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
              <div style={{ flex: 1 }}>
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

      {/* Media Queries and Keyframes CSS */}
      <style>{`
        /* Base Desktop styles mapping to your layout choices */
        .main-container {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .parameter-grid {
          background-color: #fff;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .sidebar-container {
          width: 320px;
          border-left: 1px solid #e5e5e5;
          background-color: #fff;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .table-row {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f5f5f5;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 0.5fr;
          gap: 1rem;
          align-items: center;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* 📱 Mobile and Tablet Updates (< 768px) */
        @media (max-width: 768px) {
          .main-container {
            flex-direction: column;
            overflow: auto; /* Allow the entire viewport to scroll naturally */
          }
          
          .parameter-grid {
            grid-template-columns: 1fr; /* Stack inputs down a single row */
            gap: 1rem;
          }

          .sidebar-container {
            width: 100%;
            border-left: none;
            border-top: 1px solid #e5e5e5; /* Separate content cleanly */
            box-sizing: border-box;
          }

          .table-row {
            grid-template-columns: 2fr 1fr; /* Hide secondary layout noise on mobile arrays */
            gap: 0.75rem;
          }

          /* Hide minor table columns so layout doesn't break boundaries on narrow views */
          .cell-3, .cell-4 {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HomeSkeleton;
