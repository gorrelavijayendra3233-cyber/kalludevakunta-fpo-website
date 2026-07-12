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
  Loader2,
  KeyRound,
  ShieldCheck,
  ChevronDown
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
    surveyNumber: "",
    aadharNumber: "",
    state: "",
    district: "",
    mandal: "",
    village: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
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
            surveyNumber: data.farmer.surveyNumber || "",
            aadharNumber: data.farmer.aadharNumber || ""
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

  // Click outside to close profile dropdown
  useEffect(() => {
    if (!showProfileDropdown) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".farmer-profile-summary")) {
        setShowProfileDropdown(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [showProfileDropdown]);

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

    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber.trim())) {
      toast.error("Aadhar number must be exactly 12 digits.");
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
          surveyNumber: form.surveyNumber,
          aadharNumber: form.aadharNumber
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
        <div 
          className="farmer-profile-summary clickable" 
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          style={{ 
            position: "relative", 
            cursor: "pointer", 
            userSelect: "none", 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "12px 16px",
            borderRadius: "10px",
            transition: "all 0.3s ease",
            background: showProfileDropdown ? "rgba(255, 255, 255, 0.05)" : "transparent"
          }}
        >
          <div className="avatar-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#fff" }}>
            <User size={20} />
          </div>
          <div className="farmer-meta" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <h4 style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: 0, fontSize: "14px", fontWeight: "600", color: "#fff", width: "100%" }}>
              <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "100px" }}>{farmer.farmerName || farmer.name}</span>
              <ChevronDown size={14} style={{ transition: "transform 0.3s ease", transform: showProfileDropdown ? "rotate(180deg)" : "none", color: "rgba(255,255,255,0.6)" }} />
            </h4>
            <span className="farmer-id" style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{farmer.farmerId}</span>
          </div>

          {showProfileDropdown && (
            <div className="profile-dropdown-menu glass-panel" style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: "0",
              right: "0",
              zIndex: 999,
              background: "rgba(10, 25, 15, 0.95)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderRadius: "12px",
              padding: "6px 0",
              boxShadow: "0 10px 30px -8px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              backdropFilter: "blur(12px)",
              animation: "slideDown 0.2s ease-out"
            }} onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => { navigate("/farmer-profile"); setShowProfileDropdown(false); }} 
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "none", border: "none", color: "#e2e8f0", width: "100%", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "all 0.2s" }}
                className="dropdown-item"
                onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={(e) => e.target.style.background = "none"}
              >
                <User size={15} style={{ color: "#22c55e" }} />
                <span>My Profile / నా ప్రొఫైల్</span>
              </button>
              <button 
                onClick={() => { navigate("/my-crop-requests"); setShowProfileDropdown(false); }} 
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "none", border: "none", color: "#e2e8f0", width: "100%", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "all 0.2s" }}
                className="dropdown-item"
                onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={(e) => e.target.style.background = "none"}
              >
                <Sprout size={15} style={{ color: "#22c55e" }} />
                <span>My Crop Requests / నా పంటలు</span>
              </button>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
              <button 
                onClick={handleLogout} 
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "none", border: "none", color: "#f87171", width: "100%", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }}
                className="dropdown-item logout"
                onMouseEnter={(e) => e.target.style.background = "rgba(239, 68, 68, 0.08)"}
                onMouseLeave={(e) => e.target.style.background = "none"}
              >
                <LogOut size={15} />
                <span>Logout / లాగ్అవుట్</span>
              </button>
            </div>
          )}
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

                    {/* Survey Number */}
                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label className="form-label" htmlFor="surveyNumber" style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                        Survey Number / సర్వే నంబర్
                      </label>
                      <div className="input-field-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <KeyRound size={18} style={{ position: "absolute", left: "16px", color: "#64748b" }} />
                        <input
                          id="surveyNumber"
                          name="surveyNumber"
                          type="text"
                          placeholder="e.g. 123/A"
                          value={form.surveyNumber}
                          onChange={handleChange}
                          disabled={saving}
                          style={{ width: "100%", height: "48px", padding: "0 16px 0 48px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    {/* Aadhar Number */}
                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label className="form-label" htmlFor="aadharNumber" style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                        Aadhar Number / ఆధార్ నంబర్
                      </label>
                      <div className="input-field-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <ShieldCheck size={18} style={{ position: "absolute", left: "16px", color: "#64748b" }} />
                        <input
                          id="aadharNumber"
                          name="aadharNumber"
                          type="text"
                          maxLength={12}
                          placeholder="12-digit number"
                          value={form.aadharNumber}
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
