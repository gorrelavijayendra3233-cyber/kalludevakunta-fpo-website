import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home as HomeIcon, 
  User, 
  LogOut, 
  MapPin, 
  Phone, 
  Sprout, 
  Save, 
  Lock,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import LocationSelector from "../components/LocationSelector/LocationSelector";
import "./FarmerDashboard.css"; // Reuse dashboard layout styling

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

const CROP_OPTIONS = [
  "Paddy (Rice)", "Maize", "Red Gram (Tur Dal)", "Groundnut",
  "Sunflower", "Soybean", "Cotton", "Tomato", "Chilli", "Onion",
  "Banana", "Turmeric", "Jowar", "Bajra", "Wheat", "Other"
];

function FarmerProfile() {
  const [farmer, setFarmer] = useState(null);
  const [form, setForm] = useState({
    farmerName: "",
    landArea: "",
    primaryCrop: "",
    state: "",
    district: "",
    mandal: "",
    village: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      toast.error("Please login as a farmer to access settings.");
      navigate("/farmer-login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/farmer/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 401 || response.status === 403) {
          handleLogout();
          return;
        }

        const data = await response.json();
        if (response.ok && data.success) {
          setFarmer(data.farmer);
          
          setForm({
            farmerName: data.farmer.farmerName || data.farmer.name || "",
            state: data.farmer.state || "Andhra Pradesh",
            district: data.farmer.district || "",
            mandal: data.farmer.mandal || "",
            village: data.farmer.village || "",
            landArea: data.farmer.landArea || "",
            primaryCrop: data.farmer.primaryCrop || data.farmer.cropType || ""
          });
        } else {
          toast.error(data.message || "Failed to load profile.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Server connection failed.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token");
    if (!token) {
      navigate("/farmer-login");
      return;
    }

    if (!form.farmerName || !form.state || !form.district || !form.mandal || !form.village) {
      toast.error("Name, State, District, Mandal, and Village are required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/farmer/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          farmerName: form.farmerName,
          state: form.state,
          district: form.district,
          mandal: form.mandal,
          village: form.village,
          landArea: form.landArea,
          primaryCrop: form.primaryCrop
        })
      });

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        setFarmer(data.farmer);
        localStorage.setItem("farmer_data", JSON.stringify(data.farmer));
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="farmer-dashboard-loading">
        <div className="pulse-loader">
          <Loader2 size={40} className="pulse-icon animate-spin" style={{ color: "var(--admin-accent-green, #16a34a)" }} />
          <p>Syncing farmer portal...</p>
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
            <h1>Farmer Profile Settings</h1>
            <p>Update your personal information and agricultural details</p>
          </div>
          <div className="portal-status-badge">
            <span className="status-dot"></span>
            <span>Secured Session</span>
          </div>
        </header>

        <div className="farmer-tab-content">
          <div className="tab-pane fade-in">
            <div className="profile-details-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
              <div className="profile-detail-card glass-panel" style={{ padding: "30px" }}>
                <div className="profile-detail-header" style={{ marginBottom: "24px" }}>
                  <User size={22} className="header-icon" />
                  <h3>Edit Profile Details</h3>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="profile-form-grid-2">
                    {/* Name */}
                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label className="form-label" htmlFor="farmerName" style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                        Farmer Name / రైతు పేరు *
                      </label>
                      <div className="input-field-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <User size={18} style={{ position: "absolute", left: "16px", color: "#64748b" }} />
                        <input
                          id="farmerName"
                          name="farmerName"
                          type="text"
                          className="form-input"
                          value={form.farmerName}
                          onChange={handleChange}
                          required
                          disabled={saving}
                          style={{ width: "100%", height: "48px", padding: "0 16px 0 48px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none" }}
                        />
                      </div>
                    </div>

                    {/* Mobile (Read-only) */}
                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label className="form-label" htmlFor="phone" style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                        Mobile Number / ఫోన్ నంబర్ (Locked)
                      </label>
                      <div className="input-field-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <Phone size={18} style={{ position: "absolute", left: "16px", color: "#64748b" }} />
                        <input
                          id="phone"
                          name="phone"
                          type="text"
                          className="form-input"
                          value={farmer.phone}
                          disabled
                          style={{ width: "100%", height: "48px", padding: "0 16px 0 48px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px", color: "#64748b", fontSize: "14px", cursor: "not-allowed" }}
                        />
                        <Lock size={16} style={{ position: "absolute", right: "16px", color: "#64748b" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <LocationSelector
                      value={{
                        state: form.state,
                        district: form.district,
                        mandal: form.mandal,
                        village: form.village
                      }}
                      onChange={(loc) => setForm({ ...form, ...loc })}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }} className="profile-form-grid-2">
                    {/* Primary Crop */}
                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label className="form-label" htmlFor="primaryCrop" style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                        Primary Crop / ప్రధాన పంట
                      </label>
                      <div className="input-field-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <Sprout size={18} style={{ position: "absolute", left: "16px", color: "#64748b" }} />
                        <select
                          id="primaryCrop"
                          name="primaryCrop"
                          value={form.primaryCrop}
                          onChange={handleChange}
                          disabled={saving}
                          style={{ width: "100%", height: "48px", padding: "0 16px 0 48px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", appearance: "none" }}
                        >
                          <option value="" style={{ background: "#0a1f10" }}>Select Crop</option>
                          {CROP_OPTIONS.map((c) => (
                            <option key={c} value={c} style={{ background: "#0a1f10" }}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Land Area */}
                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label className="form-label" htmlFor="landArea" style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                        Land Area / సాగు భూమి
                      </label>
                      <div className="input-field-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <Sprout size={18} style={{ position: "absolute", left: "16px", color: "#64748b" }} />
                        <input
                          id="landArea"
                          name="landArea"
                          type="text"
                          placeholder="e.g. 5 Acres"
                          value={form.landArea}
                          onChange={handleChange}
                          disabled={saving}
                          style={{ width: "100%", height: "48px", padding: "0 16px 0 48px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button 
                    type="submit" 
                    disabled={saving} 
                    style={{ 
                      height: "48px", 
                      marginTop: "12px",
                      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", 
                      border: "none", 
                      borderRadius: "10px", 
                      color: "#fff", 
                      fontWeight: "600", 
                      fontSize: "15px", 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      gap: "8px",
                      boxShadow: "0 8px 16px rgba(22, 163, 74, 0.2)",
                      transition: "all 0.3s ease"
                    }}
                    className="login-submit-btn"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FarmerProfile;
