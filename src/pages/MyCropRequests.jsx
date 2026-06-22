import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home as HomeIcon, 
  User, 
  LogOut, 
  Sprout, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign
} from "lucide-react";
import toast from "react-hot-toast";
import "./FarmerDashboard.css"; // Reuse dashboard layout styling

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

function MyCropRequests() {
  const [cropRequests, setCropRequests] = useState([]);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("farmer_token");
    localStorage.removeItem("farmerToken");
    localStorage.removeItem("farmer_data");
    toast.success("Logged out successfully");
    window.dispatchEvent(new Event("storage"));
    navigate("/farmer-login");
  };

  useEffect(() => {
    const token = localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token");
    if (!token) {
      toast.error("Please login as a farmer to access crop requests.");
      navigate("/farmer-login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch farmer profile
        const profileRes = await fetch(`${API_BASE}/farmer/profile`, { headers });
        if (!profileRes.ok) {
          if (profileRes.status === 401 || profileRes.status === 403) {
            handleLogout();
            return;
          }
          throw new Error("Failed to load profile.");
        }
        const profileData = await profileRes.json();
        setFarmer(profileData.farmer);

        // Fetch crop requests
        const salesRes = await fetch(`${API_BASE}/crop-sales/my`, { headers });
        if (salesRes.ok) {
          setCropRequests(await salesRes.json());
        }
      } catch (err) {
        console.error(err);
        toast.error("Server connection failed.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved": return "status-badge approved";
      case "Rejected": return "status-badge rejected";
      case "Completed": return "status-badge completed";
      default: return "status-badge pending";
    }
  };

  const renderTimeline = (req) => {
    const steps = [
      { key: "submitted", label: "Submitted / దాఖలైంది", desc: new Date(req.submittedAt || req.createdAt).toLocaleDateString("en-IN"), done: true },
      { 
        key: "approved", 
        label: req.status === "Rejected" ? "Rejected / తిరస్కరించబడింది" : "Approved / ఆమోదించబడింది", 
        desc: req.approvedAt ? new Date(req.approvedAt).toLocaleDateString("en-IN") : (req.status === "Rejected" ? "Review Completed" : "Waiting for review"),
        done: req.status === "Approved" || req.status === "Completed" || req.status === "Rejected",
        error: req.status === "Rejected"
      },
      { 
        key: "completed", 
        label: "Completed / పూర్తయింది", 
        desc: req.status === "Completed" ? "Process Finished" : (req.status === "Rejected" ? "Cancelled" : "Pending collection"),
        done: req.status === "Completed",
        error: req.status === "Rejected"
      }
    ];

    return (
      <div className="timeline-container glass-panel fade-in" style={{ padding: "20px", marginTop: "15px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "15px", color: "var(--text-primary)" }}>Request Timeline — {req.cropSaleId}</h4>
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }} className="timeline-steps">
          {steps.map((step, idx) => (
            <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, textAlign: "center", position: "relative" }}>
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div style={{
                  position: "absolute",
                  left: "50%",
                  top: "16px",
                  right: "-50%",
                  height: "2px",
                  background: step.done && steps[idx+1].done ? (steps[idx+1].error ? "var(--admin-accent-red, #dc2626)" : "var(--admin-accent-green, #16a34a)") : "rgba(255, 255, 255, 0.1)",
                  zIndex: 1
                }} />
              )}
              {/* Step circle */}
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: step.done ? (step.error ? "rgba(220, 38, 38, 0.15)" : "rgba(22, 163, 74, 0.15)") : "rgba(255, 255, 255, 0.05)",
                border: step.done ? (step.error ? "2px solid var(--admin-accent-red, #dc2626)" : "2px solid var(--admin-accent-green, #16a34a)") : "2px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                color: step.done ? (step.error ? "var(--admin-accent-red, #dc2626)" : "var(--admin-accent-green, #16a34a)") : "#64748b"
              }}>
                {step.done ? (
                  step.error ? <XCircle size={16} /> : <CheckCircle size={16} />
                ) : (
                  <Clock size={16} />
                )}
              </div>
              <span style={{ fontSize: "12px", fontWeight: "600", marginTop: "8px", color: step.done ? "#fff" : "#94a3b8" }}>{step.label}</span>
              <span style={{ fontSize: "10px", opacity: 0.6, marginTop: "2px" }}>{step.desc}</span>
            </div>
          ))}
        </div>
        {req.status === "Rejected" && req.adminRemarks && (
          <div style={{ marginTop: "20px", padding: "12px", background: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.15)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px" }}>
            <strong>Rejection Remarks:</strong> {req.adminRemarks}
          </div>
        )}
        {req.status === "Approved" && (
          <div style={{ marginTop: "20px", padding: "12px", background: "rgba(22, 163, 74, 0.05)", border: "1px solid rgba(22, 163, 74, 0.15)", borderRadius: "8px", color: "#86efac", fontSize: "13px" }}>
            <strong>FPO Update:</strong> Approved! Our procurement team will contact you shortly to schedule pickup/delivery.
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="farmer-dashboard-loading">
        <div className="pulse-loader">
          <Sprout size={40} className="pulse-icon animate-bounce" style={{ color: "var(--admin-accent-green, #16a34a)" }} />
          <p>Loading crop requests...</p>
        </div>
      </div>
    );
  }

  if (!farmer) return null;

  return (
    <div className="farmer-dashboard-container">
      {/* ── Sidebar ── */}
      <aside className="farmer-sidebar glass-panel">
        <div className="farmer-profile-summary">
          <div className="avatar-wrap">
            <User size={28} />
          </div>
          <div className="farmer-meta">
            <h4>{farmer.farmerName || farmer.name}</h4>
            <span className="farmer-id">{farmer.farmerId}</span>
          </div>
        </div>

        <nav className="farmer-sidebar-nav">
          <button 
            className="nav-item"
            onClick={() => navigate("/farmer-dashboard")}
          >
            <HomeIcon size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            className="nav-item active"
            onClick={() => navigate("/my-crop-requests")}
          >
            <Sprout size={18} />
            <span>My Crop Requests</span>
          </button>

          <button 
            className="nav-item"
            onClick={() => navigate("/farmer-profile")}
          >
            <User size={18} />
            <span>My Profile</span>
          </button>

          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── Main Panel ── */}
      <main className="farmer-main">
        <header className="farmer-header glass-panel">
          <div>
            <h1>My Crop Selling Requests</h1>
            <p>Track statuses and details of your submitted crop sales requests</p>
          </div>
          <button className="add-new-btn" onClick={() => navigate("/sell-crop")} style={{ height: "40px", padding: "0 16px", borderRadius: "8px", background: "var(--admin-accent-green, #16a34a)", border: "none", color: "#fff", fontWeight: "600", cursor: "pointer" }}>
            + New Sell Request
          </button>
        </header>

        <div className="farmer-tab-content">
          <div className="tab-pane fade-in">
            {cropRequests.length === 0 ? (
              <div className="empty-state glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                <Sprout size={48} className="empty-icon" style={{ opacity: 0.3, marginBottom: "15px" }} />
                <h3>No crop sales requests found</h3>
                <p>Submit your crop details to receive optimal rates directly from the FPO.</p>
                <button onClick={() => navigate("/sell-crop")} className="cta-btn primary" style={{ marginTop: "15px" }}>Sell Crop Now</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: selectedRequest ? "1.2fr 1fr" : "1fr", gap: "25px" }} className="my-crops-grid">
                
                {/* Table list */}
                <div className="table-responsive-wrapper glass-panel" style={{ padding: "20px", borderRadius: "12px" }}>
                  <table className="farmer-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Crop</th>
                        <th>Quantity</th>
                        <th>Expected (₹/unit)</th>
                        <th>Est. Value</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cropRequests.map((c) => (
                        <tr 
                          key={c._id} 
                          onClick={() => setSelectedRequest(c)}
                          style={{ cursor: "pointer", background: selectedRequest?._id === c._id ? "rgba(255,255,255,0.03)" : "transparent" }}
                        >
                          <td><span className="font-semibold text-accent">{c.cropSaleId || "CS---"}</span></td>
                          <td className="font-semibold">{c.cropName}</td>
                          <td>{c.quantity} {c.unit}</td>
                          <td>₹{c.expectedPrice}</td>
                          <td><strong style={{ color: "var(--admin-accent-green, #16a34a)" }}>₹{c.estimatedValue || (c.quantity * c.expectedPrice)}</strong></td>
                          <td>
                            <span className={getStatusClass(c.status)}>{c.status}</span>
                          </td>
                          <td>{new Date(c.submittedAt || c.createdAt).toLocaleDateString("en-IN")}</td>
                          <td><ChevronRight size={16} style={{ opacity: 0.5 }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Detailed Timeline Panel */}
                {selectedRequest && (
                  <div className="glass-panel" style={{ padding: "20px", borderRadius: "12px", height: "fit-content" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px", marginBottom: "15px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Request Details</h3>
                      <button onClick={() => setSelectedRequest(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}>Close Details</button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>Crop / పంట:</span>
                        <strong style={{ fontSize: "13px" }}>{selectedRequest.cropName}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>Quantity / పరిమాణం:</span>
                        <strong style={{ fontSize: "13px" }}>{selectedRequest.quantity} {selectedRequest.unit}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>Expected Price:</span>
                        <strong style={{ fontSize: "13px" }}>₹{selectedRequest.expectedPrice} / {selectedRequest.unit}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>Estimated Total Value:</span>
                        <strong style={{ fontSize: "14px", color: "var(--admin-accent-green, #16a34a)" }}>₹{selectedRequest.estimatedValue || (selectedRequest.quantity * selectedRequest.expectedPrice)}</strong>
                      </div>
                      {selectedRequest.description && (
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", marginTop: "5px" }}>
                          <span style={{ color: "#94a3b8", fontSize: "12px", display: "block", marginBottom: "4px" }}>Farmer Notes / గమనిక:</span>
                          <p style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.5" }}>{selectedRequest.description}</p>
                        </div>
                      )}
                    </div>

                    {renderTimeline(selectedRequest)}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MyCropRequests;
