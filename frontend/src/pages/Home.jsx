import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API, { clearAccessToken } from "../api/products";
import HomeSkeleton from "../components/HomeSkeleton";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [skus, setSkus] = useState([]);
  const [grossTotal, setGrossTotal] = useState("");
  const [rebate, setRebate] = useState("");
  const [history, setHistory] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const [user, setUser] = useState({
    username: "Guest",
    image: "/assets/default-avatar.png",
    role: "Guest User",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // FIX — No longer checking localStorage for a token. Instead attempt
        // the authenticated requests directly; the interceptor in api/index.js
        // will attach the in-memory access token if one exists, and will
        // silently refresh via the HttpOnly cookie if it has expired.
        const results = await Promise.allSettled([
          API.get("/auth/me"),
          API.get("/materials"),
          API.get("/snapshots"),
        ]);

        if (results[0].status === "fulfilled") {
          const userData = results[0].value.data?.user;
          if (userData) {
            setUser({
              username: userData.username || "Unknown",
              image: userData.image || "/assets/default-avatar.png",
              role: userData.role || "System Operator",
            });
            setIsAuthenticated(true);
          }
        } else {
          // /auth/me failed — treat as guest, don't redirect.
          setIsAuthenticated(false);
          const savedSkus = localStorage.getItem("guestSkus");
          if (savedSkus) setSkus(JSON.parse(savedSkus));
        }

        if (results[1].status === "fulfilled") {
          setSkus(results[1].value.data?.materials || []);
        } else if (results[0].status !== "fulfilled") {
          // Only fall back to guest skus if we're actually a guest.
          const savedSkus = localStorage.getItem("guestSkus");
          if (savedSkus) setSkus(JSON.parse(savedSkus));
        }

        if (results[2].status === "fulfilled") {
          setHistory(results[2].value.data?.snapshots || []);
        }

        if (results[0].status === "fulfilled") {
          await savePendingMaterials(
            results[1].status === "fulfilled"
              ? results[1].value.data?.materials || []
              : [],
          );
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
        setHasInitialized(true);
      }
    };

    // FIX — Listen for forced logout events dispatched by the API interceptor
    // when a refresh attempt fails (e.g. refresh token expired).
    const handleForcedLogout = () => {
      setIsAuthenticated(false);
      setUser({
        username: "Guest",
        image: "/assets/default-avatar.png",
        role: "Guest User",
      });
      navigate("/login", { replace: true });
    };

    window.addEventListener("auth:logout", handleForcedLogout);
    fetchData();

    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  useEffect(() => {
    if (!isAuthenticated && skus.length > 0) {
      localStorage.setItem("guestSkus", JSON.stringify(skus));
    }
  }, [skus, isAuthenticated]);

  const savePendingMaterials = async (existingMaterials) => {
    try {
      const savedSkus = localStorage.getItem("guestSkus");
      if (!savedSkus) return;

      const guestSkus = JSON.parse(savedSkus);

      for (const sku of guestSkus) {
        if (sku._id && !sku._id.startsWith("guest-")) continue;

        const response = await API.post("/materials", {
          name: sku.name,
          yieldPerTon: sku.yieldPerTon,
        });

        if (response.data?.material) {
          setSkus((prev) =>
            prev.map((item) =>
              item._id === sku._id ? response.data.material : item,
            ),
          );
        }
      }

      localStorage.removeItem("guestSkus");
    } catch (err) {
      console.error("Failed to save pending materials:", err);
    }
  };

  if (isLoading && !hasInitialized) {
    return <HomeSkeleton />;
  }

  const netTotal = grossTotal - (grossTotal * rebate) / 100;

  const handleAddNewRow = async () => {
    const newMaterial = {
      _id: `guest-${Date.now()}`,
      name: "New Material",
      yieldPerTon: 1,
    };

    if (isAuthenticated) {
      try {
        const response = await API.post("/materials", {
          name: newMaterial.name,
          yieldPerTon: newMaterial.yieldPerTon,
        });
        const material = response.data?.material;
        if (material) setSkus((prev) => [...prev, material]);
      } catch (err) {
        console.error("Failed to add material:", err);
      }
    } else {
      setSkus((prev) => [...prev, newMaterial]);
    }
  };

  const handleRowChange = (id, fieldName, value) => {
    setSkus((prev) =>
      prev.map((item) => {
        if (item._id === id) {
          return {
            ...item,
            [fieldName]:
              fieldName === "yieldPerTon" ? Number(value) || 0 : value,
          };
        }
        return item;
      }),
    );
  };

  const handlePersistRowUpdates = async (item) => {
    if (!isAuthenticated) return;

    try {
      const response = await API.put(`/materials/${item._id}`, {
        name: item.name,
        yieldPerTon: item.yieldPerTon,
      });
      const updated = response.data?.material;
      if (updated) {
        setSkus((prev) =>
          prev.map((row) => (row._id === updated._id ? updated : row)),
        );
      }
    } catch (err) {
      console.error("Failed to save material:", err);
    }
  };

  const handleDeleteRow = async (id) => {
    if (!isAuthenticated) {
      setSkus((prev) => prev.filter((item) => item._id !== id));
      return;
    }

    try {
      await API.delete(`/materials/${id}`);
      setSkus((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Failed to delete material:", err);
    }
  };

  const handleLogCalculation = async () => {
    setIsSidebarOpen(true);
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const validItems = skus.filter(
      (item) => item.name && Number(item.yieldPerTon) > 0,
    );

    if (validItems.length === 0) {
      console.error("Add at least one material with yield before saving.");
      return;
    }

    try {
      const response = await API.post("/snapshots", {
        grossTotal,
        rebate,
        netTotal,
        skus: validItems.map((item) => ({
          name: item.name,
          yieldperton: item.yieldPerTon,
        })),
      });
      const snapshot = response.data?.snapshot;
      if (snapshot) setHistory((prev) => [snapshot, ...prev]);
    } catch (err) {
      console.error("Failed to save snapshot:", err);
    }
  };

  // FIX — Call the logout endpoint to clear the HttpOnly cookie and
  // invalidate the refresh token server-side, then clear in-memory token.
  const handleSignOut = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      // Even if the server call fails, clear local state.
      console.error("Logout error:", err);
    } finally {
      clearAccessToken();
      setIsAuthenticated(false);
      setUser({
        username: "Guest",
        image: "/assets/default-avatar.png",
        role: "Guest User",
      });
      navigate("/", { replace: true });
    }
  };

  const filteredSkus = skus.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="app-wrapper">
      {isSidebarOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 40,
            display: "none",
          }}
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <header className="app-header">
        <div className="header-brand">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="sidebar-toggle-btn"
            title="Toggle Sidebar"
          >
            <svg
              className="sidebar-toggle-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ width: "24px", height: "24px" }}
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
          <h1 className="header-title">Wholesale Pricing Engine</h1>
        </div>

        <nav className="nav-actions">
          <span
            style={{ marginRight: "1rem", fontSize: "0.9rem", color: "#666" }}
          >
            {isAuthenticated ? "Logged In" : "Guest Mode"}
          </span>
        </nav>
      </header>

      <div className="main-layout">
        <main className="workspace-panel">
          <section className="parameter-card">
            <div className="parameter-grid">
              <div className="input-group">
                <label className="input-label">Gross Total (₦)</label>
                <input
                  type="number"
                  value={grossTotal}
                  onChange={(e) => setGrossTotal(Number(e.target.value))}
                  className="financial-input"
                  disabled={isLoading}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Rebate (%)</label>
                <input
                  type="number"
                  value={rebate}
                  onChange={(e) => setRebate(Number(e.target.value))}
                  className="financial-input"
                  disabled={isLoading}
                />
              </div>
              <div className="net-display-box">
                <div className="text-right-md">
                  <span className="input-label">Net Total</span>
                  <span className="net-total-output">
                    ₦
                    {netTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="ledger-container">
            <div className="ledger-header">
              <div>
                <h2 className="ledger-title">Material Breakdown</h2>
                <p className="ledger-subtitle">
                  Calculations update automatically as fields are modified.
                </p>
                <div style={{ marginTop: "0.75rem" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.85rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #d4d4d4",
                      outline: "none",
                      width: "240px",
                    }}
                  />
                </div>
              </div>
              <div className="ledger-actions">
                <button
                  onClick={handleLogCalculation}
                  className="btn-secondary"
                  disabled={isLoading || !isAuthenticated}
                  title={!isAuthenticated ? "Sign in to save snapshots" : ""}
                >
                  💾 Save Snapshot
                </button>
                <button
                  onClick={handleAddNewRow}
                  className="btn-primary"
                  disabled={isLoading}
                >
                  ➕ Add Material
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="matrix-table">
                <thead>
                  <tr className="table-head-row">
                    <th className="w-yield">Material</th>
                    <th className="w-yield">Yield Per Ton</th>
                    <th className="w-price">Unit Price</th>
                    <th className="w-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSkus.map((item) => {
                    const unitPrice =
                      item.yieldPerTon > 0 ? netTotal / item.yieldPerTon : 0;
                    return (
                      <tr key={item._id} className="table-body-row">
                        <td>
                          <input
                            type="text"
                            placeholder="e.g Height"
                            value={item.name}
                            onChange={(e) =>
                              handleRowChange(item._id, "name", e.target.value)
                            }
                            onBlur={() => handlePersistRowUpdates(item)}
                            className="cell-input-text"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            placeholder="0"
                            value={item.yieldPerTon || ""}
                            onChange={(e) =>
                              handleRowChange(
                                item._id,
                                "yieldPerTon",
                                e.target.value,
                              )
                            }
                            onBlur={() => handlePersistRowUpdates(item)}
                            className="cell-input-num"
                          />
                        </td>
                        <td>
                          <span className="price-output">
                            ₦
                            {unitPrice.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => handleDeleteRow(item._id)}
                            className="btn-delete"
                            title="delete material"
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isLoading && (
              <div
                style={{ textAlign: "center", padding: "2rem", color: "#666" }}
              >
                Loading...
              </div>
            )}

            {!isLoading && skus.length === 0 && (
              <div className="empty-state-pane">
                <p className="empty-text">No materials added yet.</p>
                <button onClick={handleAddNewRow} className="btn-inline-link">
                  Add your first material
                </button>
              </div>
            )}
          </section>
        </main>

        <aside
          className={`app-sidebar ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        >
          <div className="history-section">
            <div className="history-header">
              <h3 className="history-title">Calculation History</h3>
              <span className="history-badge">
                {isAuthenticated ? history.length : "0"}
              </span>
            </div>

            {isAuthenticated && history.length > 0 ? (
              <div className="history-list">
                {history.map((log) => {
                  const logId = log._id;
                  const displayDate = log.createdAt
                    ? new Date(log.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })
                    : "Today";
                  const displayTime = log.createdAt
                    ? new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Now";

                  return (
                    <div key={logId} className="history-item">
                      <div className="history-item-meta">
                        <span>
                          {displayDate} • {displayTime}
                        </span>
                        <span className="history-item-count">
                          {log.items?.length || 0} items
                        </span>
                      </div>
                      <div className="history-item-amount">
                        ₦
                        {(log.netTotal || 0).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{ padding: "1rem", textAlign: "center", color: "#666" }}
              >
                {isAuthenticated
                  ? "No saved calculations yet"
                  : "Sign in to save calculations"}
              </div>
            )}
          </div>

          <div
            className="account-widget"
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {isAuthenticated ? (
              <>
                <div className="account-profile-trigger">
                  <img
                    src={user.image || "/assets/default-avatar.png"}
                    alt="User Avatar"
                    className="account-avatar"
                  />
                  <div className="account-info">
                    <span className="account-name">{user.username}</span>
                    <span className="account-badge">
                      <span className="badge-pulse"></span>
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={handleSignOut}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#666",
                        fontSize: "0.9rem",
                        textDecoration: "underline",
                      }}
                      title="Sign out"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                <div className="account-dropdown">
                  <button
                    onClick={handleSignOut}
                    className="dropdown-item logout-highlight"
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span className="dropdown-item-icon">🚪</span>
                    <div className="dropdown-item-text">
                      <span className="dropdown-item-title">Sign Out</span>
                      <span className="dropdown-item-desc">
                        End your session
                      </span>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#7a5e3e",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/register")}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#f0f0f0",
                    color: "#333",
                    border: "1px solid #d4d4d4",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  Create a new account
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;
