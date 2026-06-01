import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/products";
import HomeSkeleton from "../components/HomeSkeleton";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user, isAuthenticated, isAuthLoading, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [skus, setSkus] = useState([]);
  const [grossTotal, setGrossTotal] = useState("");
  const [rebate, setRebate] = useState("");
  const [history, setHistory] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Add timeout to prevent hanging on API calls
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Fetch timeout")), 10000),
        );

        const apiPromise = Promise.allSettled([
          API.get("/materials"),
          API.get("/snapshots"),
        ]);

        const results = await Promise.race([apiPromise, timeoutPromise]);

        if (results[0].status === "fulfilled") {
          setSkus(results[0].value.data?.materials || []);
        } else {
          const savedSkus = localStorage.getItem("guestSkus");
          if (savedSkus) setSkus(JSON.parse(savedSkus));
        }

        if (results[1].status === "fulfilled") {
          setHistory(results[1].value.data?.snapshots || []);
        }

        if (isAuthenticated) {
          await savePendingMaterials(results[0].value?.data?.materials || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading) fetchData(); // wait for auth before fetching
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && skus.length > 0) {
      localStorage.setItem("guestSkus", JSON.stringify(skus));
    }
  }, [skus, isAuthenticated]);

  // Scroll lock when sidebar is open on mobile
  useEffect(() => {
    const isMobile = () => window.innerWidth < 768;

    if (isSidebarOpen && isMobile()) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const savePendingMaterials = async (existingMaterials) => {
    try {
      const savedSkus = localStorage.getItem("guestSkus");
      if (!savedSkus) return;

      const guestSkus = JSON.parse(savedSkus);

      for (const sku of guestSkus) {
        if (sku._id && !sku._id.startsWith("guest-")) {
          continue;
        }

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

  if (isAuthLoading || isLoading) {
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
        if (material) {
          setSkus((prev) => [...prev, material]);
        }
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
    if (!isAuthenticated) {
      return;
    }

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
      if (snapshot) {
        setHistory((prev) => [snapshot, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save snapshot:", err);
    }
  };

  const handleSignOut = async () => {
    await logout();
    window.location.href = "/";
  };

  const filteredSkus = skus.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="app-wrapper">
      {/* Overlay — no inline display:none, CSS handles mobile-only visibility */}
      {window.innerWidth < 768 && isSidebarOpen && (
        <div
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
          <div
            className={`status-badge ${isAuthenticated ? "status-authenticated" : "status-guest"}`}
          >
            <span className="status-dot"></span>
            <span className="status-text">
              {isAuthenticated ? "Live Sync Active" : "Guest Mode"}
            </span>
          </div>
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
                  disabled={isLoading}
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
                    <th className="w-actions"></th>
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
                            placeholder="e.g. 16mm Steel Rod"
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
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ width: "18px", height: "18px" }}
                            >
                              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
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
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginBottom: "20px",
            }}
          >
            {isAuthenticated ? (
              <>
                <div className="account-profile-trigger">
                  <img
                    src={user.image}
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
                        whiteSpace: "nowrap", // 🛡️ Prevents text from crunching or wrapping
                        padding: "0.25rem 0.5rem", // Gives it a small click target padding
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
                  Create Account
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
