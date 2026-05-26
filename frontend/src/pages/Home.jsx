import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/products";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [skus, setSkus] = useState([]);
  const [grossTotal, setGrossTotal] = useState();
  const [rebate, setRebate] = useState();
  const [history, setHistory] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [user, setUser] = useState({
    username: "Guest",
    image: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    role: "Guest User",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        if (token) {
          // User is authenticated
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
                image:
                  userData.image ||
                  "https://cdn-icons-png.flaticon.com/512/847/847969.png",
                role: userData.role || "System Operator",
              });
              setIsAuthenticated(true);
            }
          }

          if (results[1].status === "fulfilled") {
            setSkus(results[1].value.data?.materials || []);
          } else {
            // If materials fetch failed, use guest materials
            const savedSkus = localStorage.getItem("guestSkus");
            if (savedSkus) {
              setSkus(JSON.parse(savedSkus));
            }
          }

          if (results[2].status === "fulfilled") {
            setHistory(results[2].value.data?.snapshots || []);
          }

          // Save pending guest materials on login
          await savePendingMaterials(results[1].value.data?.materials || []);
        } else {
          // Guest user - load from localStorage
          setIsAuthenticated(false);
          const savedSkus = localStorage.getItem("guestSkus");
          if (savedSkus) {
            setSkus(JSON.parse(savedSkus));
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save guest materials to localStorage whenever they change
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
      const existingIds = existingMaterials.map((m) => m._id);

      for (const sku of guestSkus) {
        // Skip if already has real _id (already saved)
        if (sku._id && !sku._id.startsWith("guest-")) {
          continue;
        }

        // Create new material
        const response = await API.post("/materials", {
          name: sku.name,
          yieldPerTon: sku.yieldPerTon,
        });

        if (response.data?.material) {
          // Update the local state with the saved material
          setSkus((prev) =>
            prev.map((item) =>
              item._id === sku._id ? response.data.material : item,
            ),
          );
        }
      }

      // Clear guest storage after saving
      localStorage.removeItem("guestSkus");
    } catch (err) {
      console.error("Failed to save pending materials:", err);
    }
  };

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
      if (snapshot) {
        setHistory((prev) => [snapshot, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save snapshot:", err);
    }
  };

  const filteredSkus = skus.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="app-wrapper">
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
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
                    <th>Material</th>
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
                            Remove
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
                    src={
                      user.image ||
                      "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                    }
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
                </div>

                <div className="account-dropdown">
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      window.location.href = "/";
                    }}
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
