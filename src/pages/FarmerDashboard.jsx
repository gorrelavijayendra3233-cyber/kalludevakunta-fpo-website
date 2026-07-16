import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home as HomeIcon, 
  Sprout, 
  Tractor, 
  ShoppingCart, 
  User, 
  LogOut, 
  Calendar,
  Phone,
  Layers,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Coins,
  Bell,
  FolderOpen,
  Search,
  Download,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import "./FarmerDashboard.css";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [farmer, setFarmer] = useState(null);
  const [cropRequests, setCropRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [searchDoc, setSearchDoc] = useState("");
  const [filterDocCategory, setFilterDocCategory] = useState("All");
  const [announcementCategory, setAnnouncementCategory] = useState("All");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out? / మీరు ఖచ్చితంగా లాగ్ అవుట్ చేయాలనుకుంటున్నారా?")) {
      localStorage.removeItem("farmer_token");
      localStorage.removeItem("farmerToken");
      localStorage.removeItem("farmer_data");
      toast.success("Logged out successfully");
      // Dispatch custom storage event to update navbar instantly
      window.dispatchEvent(new Event("storage"));
      navigate("/farmer-login");
    }
  };

  // Sync tab state with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["dashboard", "crops", "bookings", "orders", "profile", "documents"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Click outside to close profile dropdown
  useEffect(() => {
    if (!showProfileDropdown) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".farmer-profile-summary") && !e.target.closest(".header-farmer-dropdown-container")) {
        setShowProfileDropdown(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [showProfileDropdown]);

  // Route protection check and data fetching
  useEffect(() => {
    const token = localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token");
    if (!token) {
      toast.error("Please login as a farmer to access the dashboard.");
      navigate("/farmer-login");
      return;
    }

    const fetchFarmerData = async () => {
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

        // Fetch user transaction history, notifications, and announcements
        const [cropsRes, bookingsRes, ordersRes, notifsRes, announcementsRes, documentsRes] = await Promise.all([
          fetch(`${API_BASE}/farmer/crop-requests`, { headers }),
          fetch(`${API_BASE}/farmer/bookings`, { headers }),
          fetch(`${API_BASE}/farmer/orders`, { headers }),
          fetch(`${API_BASE}/farmer/notifications`, { headers }),
          fetch(`${API_BASE}/announcements`, { headers }),
          fetch(`${API_BASE}/documents`, { headers })
        ]);

        if (cropsRes.status === 401 || cropsRes.status === 403 ||
            bookingsRes.status === 401 || bookingsRes.status === 403 ||
            ordersRes.status === 401 || ordersRes.status === 403 ||
            notifsRes.status === 401 || notifsRes.status === 403 ||
            announcementsRes.status === 401 || announcementsRes.status === 403) {
          handleLogout();
          return;
        }

        if (cropsRes.ok) setCropRequests(await cropsRes.json());
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (notifsRes.ok) setNotifications(await notifsRes.json());
        if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
        if (documentsRes.ok) setDocuments(await documentsRes.json());

      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerData();
  }, [navigate]);

  const handleMarkAsRead = async (id) => {
    const token = localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/farmer/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/farmer/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
        toast.success("All notifications marked as read.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (["confirmed", "active", "success", "completed", "approved"].includes(s)) {
      return "badge-status success";
    }
    if (["pending", "warning", "low stock"].includes(s)) {
      return "badge-status warning";
    }
    return "badge-status danger"; // Cancelled, inactive, failed, rejected
  };

  const formatLastLogin = (dateString) => {
    if (!dateString) return "First login / ఈరోజే లాగిన్";
    try {
      const d = new Date(dateString);
      return d.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const formatDateNice = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata"
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="farmer-dashboard-loading">
        <div className="pulse-loader">
          <Sprout size={40} className="pulse-icon" />
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
              <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "100px" }}>{farmer.name}</span>
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
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <HomeIcon size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            className="nav-item"
            onClick={() => navigate("/my-crop-requests")}
          >
            <Sprout size={18} />
            <span>My Crop Requests</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <Tractor size={18} />
            <span>My Bookings</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingCart size={18} />
            <span>My Orders</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "documents" ? "active" : ""}`}
            onClick={() => setActiveTab("documents")}
          >
            <FolderOpen size={18} />
            <span>Document Center</span>
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
        <header className="farmer-header glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ margin: "0 0 6px 0", fontSize: "24px", fontWeight: "700" }}>Kalludevakunta FPO Portal</h1>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", fontSize: "13px", color: "#a0a7a1" }}>
              <span>Welcome back,</span>
              <div className="header-farmer-dropdown-container" style={{ position: "relative", display: "inline-block" }}>
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  style={{
                    background: "rgba(22, 163, 74, 0.1)",
                    border: "1px solid rgba(22, 163, 74, 0.22)",
                    color: "#ffffff",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "150px" }}>{farmer.name}</span>
                  <ChevronDown size={14} style={{ transition: "transform 0.2s ease", transform: showProfileDropdown ? "rotate(180deg)" : "none", color: "var(--admin-accent-green, #16a34a)" }} />
                </button>

                {showProfileDropdown && (
                  <div className="profile-dropdown-menu glass-panel" style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: "0",
                    minWidth: "210px",
                    zIndex: 999,
                    background: "rgba(10, 25, 15, 0.96)",
                    border: "1px solid rgba(34, 197, 94, 0.25)",
                    borderRadius: "8px",
                    padding: "6px 0",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    backdropFilter: "blur(12px)",
                    animation: "slideDown 0.2s ease-out"
                  }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ padding: "6px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "4px" }}>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Farmer ID</div>
                      <div style={{ fontSize: "12px", color: "var(--admin-accent-green, #16a34a)", fontWeight: "700" }}>{farmer.farmerId}</div>
                    </div>
                    <button 
                      onClick={() => { navigate("/farmer-profile"); setShowProfileDropdown(false); }} 
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px", background: "none", border: "none", color: "#e2e8f0", width: "100%", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "all 0.2s" }}
                      className="dropdown-item"
                    >
                      <User size={15} style={{ color: "#22c55e" }} />
                      <span>My Profile / నా ప్రొఫైల్</span>
                    </button>
                    <button 
                      onClick={() => { navigate("/my-crop-requests"); setShowProfileDropdown(false); }} 
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px", background: "none", border: "none", color: "#e2e8f0", width: "100%", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "all 0.2s" }}
                      className="dropdown-item"
                    >
                      <Sprout size={15} style={{ color: "#22c55e" }} />
                      <span>My Crop Requests / నా పంటలు</span>
                    </button>
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
                    <button 
                      onClick={handleLogout} 
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px", background: "none", border: "none", color: "#f87171", width: "100%", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }}
                      className="dropdown-item logout"
                    >
                      <LogOut size={15} />
                      <span>Logout / లాగ్అవుట్</span>
                    </button>
                  </div>
                )}
              </div>
              <span>— registered FPO member</span>
            </div>
          </div>
          <div className="farmer-header-right">
            {/* Bell Icon Notification Center */}
            <div className="notification-bell-wrapper" style={{ position: "relative", zIndex: showNotifDropdown ? 1001 : 1 }}>
              {showNotifDropdown && (
                <div 
                  className="notification-backdrop" 
                  onClick={() => setShowNotifDropdown(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 999,
                    background: "rgba(0, 0, 0, 0.45)",
                    backdropFilter: "blur(2.5px)",
                    cursor: "default"
                  }}
                />
              )}
              <button 
                className={`notification-bell-btn ${showNotifDropdown ? "active" : ""}`}
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                title="Notifications"
                style={{
                  background: showNotifDropdown ? "var(--admin-accent-green, #16a34a)" : "rgba(255, 255, 255, 0.03)",
                  borderColor: showNotifDropdown ? "var(--admin-accent-green, #16a34a)" : "rgba(255, 255, 255, 0.08)",
                  color: showNotifDropdown ? "#ffffff" : "#ffffff",
                  position: "relative",
                  zIndex: 1000
                }}
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-badge" style={{ zIndex: 1001 }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="notification-dropdown" style={{ zIndex: 1000 }}>
                  <div className="notification-dropdown-header">
                    <h4>Notifications ({notifications.filter(n => !n.read).length} unread)</h4>
                    {notifications.length > 0 && (
                      <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">No notifications yet.</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id} 
                          className={`notification-item ${!notif.read ? "unread" : ""}`}
                          onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                        >
                          <div className="notification-item-content">
                            <div className="notification-item-title">{notif.title}</div>
                            <div className="notification-item-msg">{notif.message}</div>
                            <div className="notification-item-time">
                              {new Date(notif.createdAt).toLocaleDateString("en-IN")} {new Date(notif.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {!notif.read && (
                            <button 
                              className="notification-item-action" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notif._id);
                              }}
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="portal-status-badge">
              <span className="status-dot"></span>
              <span>Secured Session</span>
            </div>
          </div>
        </header>

        {/* Tab Panel contents */}
        <div className="farmer-tab-content">
          
          {/* Tab 1: Dashboard */}
          {activeTab === "dashboard" && (
            <div className="tab-pane fade-in">
              <div className="welcome-hero-banner glass-panel">
                <h2>Namaskaram, {farmer.name}!</h2>
                <p>Access your personalized dashboard to manage crop selling requests, lease advanced agricultural machinery, and purchase organic seeds and fertilizers directly from your FPO portal.</p>
                <div className="hero-cta-group">
                  <button onClick={() => navigate("/sell-crop")} className="cta-btn primary">Sell Crops</button>
                  <button onClick={() => navigate("/equipment-booking")} className="cta-btn secondary">Book Equipment</button>
                  <button onClick={() => navigate("/products")} className="cta-btn secondary">Order Products</button>
                </div>
              </div>

              {/* Section: Overview Metrics */}
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "15px", color: "var(--text-primary)", marginTop: "20px" }}>My FPO Overview</h3>
              <div className="summary-cards-grid" style={{ marginBottom: "25px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div className="summary-card glass-panel" onClick={() => setActiveTab("crops")} style={{ cursor: "pointer" }}>
                  <div className="card-top">
                    <div className="icon-wrap green"><Sprout size={20} /></div>
                    <span className="count">{cropRequests.length}</span>
                  </div>
                  <h3>My Crop Requests</h3>
                  <p>Crop sale offers submitted</p>
                </div>

                <div className="summary-card glass-panel" onClick={() => setActiveTab("bookings")} style={{ cursor: "pointer" }}>
                  <div className="card-top">
                    <div className="icon-wrap green"><Tractor size={20} /></div>
                    <span className="count">{bookings.length}</span>
                  </div>
                  <h3>Equipment Bookings</h3>
                  <p>Machinery rentals registered</p>
                </div>

                <div className="summary-card glass-panel" onClick={() => setActiveTab("orders")} style={{ cursor: "pointer" }}>
                  <div className="card-top">
                    <div className="icon-wrap green"><ShoppingCart size={20} /></div>
                    <span className="count">{orders.length}</span>
                  </div>
                  <h3>Product Orders</h3>
                  <p>Seed & fertilizer purchases</p>
                </div>

                <div className="summary-card glass-panel" style={{ background: "linear-gradient(135deg, rgba(230, 81, 0, 0.15) 0%, rgba(13, 35, 21, 0.6) 100%)", border: "1px solid rgba(230, 81, 0, 0.2)" }}>
                  <div className="card-top">
                    <div className="icon-wrap orange"><Coins size={20} /></div>
                    <span className="count" style={{ fontSize: "20px" }}>
                      ₹{cropRequests.filter(c => c.status === "Approved" || c.status === "Completed").reduce((sum, c) => sum + (c.estimatedValue || c.quantity * (c.expectedPrice || c.price || 0)), 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <h3>Estimated Earnings</h3>
                  <p>Approved & completed sales</p>
                </div>
              </div>



              {/* Farmer Notice Board */}
              <div className="notice-board-section" style={{ marginTop: "30px", marginBottom: "25px" }}>
                <div className="section-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Bell size={18} style={{ color: "var(--harvest-lt)" }} /> FPC Notice Board / సమాచార బోర్డు
                  </h3>
                  {/* Category filters */}
                  <div className="category-filters-scroll" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", maxWidth: "100%" }}>
                    {["All", "Training", "Government Schemes", "Market Prices", "Events", "General"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setAnnouncementCategory(cat)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          border: announcementCategory === cat ? "1px solid var(--harvest-lt)" : "1px solid rgba(255,255,255,0.08)",
                          background: announcementCategory === cat ? "rgba(46, 125, 50, 0.2)" : "rgba(255,255,255,0.02)",
                          color: announcementCategory === cat ? "var(--harvest-lt)" : "var(--text-secondary)",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {announcements.filter(a => announcementCategory === "All" || a.category === announcementCategory).length === 0 ? (
                  <div className="glass-panel" style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)", borderRadius: "12px" }}>
                    No notices published in this category.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                    {announcements
                      .filter(a => announcementCategory === "All" || a.category === announcementCategory)
                      .map(a => (
                        <div
                          key={a._id}
                          className="glass-panel hover-3d"
                          style={{
                            padding: "20px",
                            borderRadius: "12px",
                            display: "flex",
                            gap: "20px",
                            alignItems: "flex-start",
                            flexDirection: "row",
                            flexWrap: "wrap",
                            borderLeft: a.priority === "high" ? "4px solid #ef4444" : a.priority === "medium" ? "4px solid #f59e0b" : "4px solid #10b981",
                            background: "rgba(13, 35, 21, 0.45)",
                            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)"
                          }}
                        >
                          {a.imageUrl && (
                            <div style={{ flexShrink: 0, width: "120px", height: "90px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <img src={a.imageUrl} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          )}
                          <div style={{ flex: "1 1 250px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                              <h4 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>{a.title}</h4>
                              <span style={{
                                fontSize: "10px",
                                fontWeight: "700",
                                padding: "3px 8px",
                                borderRadius: "10px",
                                background: a.priority === "high" ? "rgba(239, 68, 68, 0.15)" : a.priority === "medium" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                color: a.priority === "high" ? "#f87171" : a.priority === "medium" ? "#fbbf24" : "#34d399",
                                border: a.priority === "high" ? "1px solid rgba(239, 68, 68, 0.2)" : a.priority === "medium" ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)"
                              }}>
                                {a.priority.toUpperCase()}
                              </span>
                            </div>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "12px", whiteSpace: "pre-wrap" }}>
                              {a.description}
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "rgba(255,255,255,0.45)", flexWrap: "wrap", gap: "8px" }}>
                              <span style={{ background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: "4px", color: "var(--harvest-lt)", fontWeight: "600" }}>{a.category}</span>
                              <span>{new Date(a.createdAt).toLocaleDateString("en-IN")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* FPO Contact Quick card */}
              <div className="quick-help-card glass-panel">
                <h3>Need Assistance?</h3>
                <p>If you need help with bookings, crop registrations, or updating profile details, contact FPO Support immediately.</p>
                <div className="contact-info">
                  <Phone size={16} /> <span>+91 90144 88562 (Bheemaiah)</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Crop Requests */}
          {activeTab === "crops" && (
            <div className="tab-pane fade-in">
              <div className="tab-pane-header">
                <h2>My Crop Requests</h2>
                <button className="add-new-btn" onClick={() => navigate("/sell-crops")}>+ New Request</button>
              </div>

              {cropRequests.length === 0 ? (
                <div className="empty-state glass-panel">
                  <Sprout size={48} className="empty-icon" />
                  <h3>No crop requests submitted</h3>
                  <p>Register your crops to sell them directly to the FPO at optimal prices.</p>
                  <button onClick={() => navigate("/sell-crops")} className="cta-btn primary" style={{ marginTop: "15px" }}>Sell Crop Now</button>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="farmer-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Crop Name</th>
                        <th>Quantity</th>
                        <th>Expected Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cropRequests.map((c) => (
                        <tr key={c._id}>
                          <td><span className="font-semibold text-accent">{c.cropSaleId || "CS---"}</span></td>
                          <td>{new Date(c.submittedAt || c.createdAt).toLocaleDateString("en-IN")}</td>
                          <td className="font-semibold">{c.cropName}</td>
                          <td>{c.quantity} {c.unit || "Qtls"}</td>
                          <td>₹{c.expectedPrice || c.price} / {c.unit || "Qtl"}</td>
                          <td>
                            <span className={getStatusClass(c.status)}>{c.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Equipment Bookings */}
          {activeTab === "bookings" && (
            <div className="tab-pane fade-in">
              <div className="tab-pane-header">
                <h2>My Machinery Bookings</h2>
                <button className="add-new-btn" onClick={() => navigate("/equipment-booking")}>+ Book Machinery</button>
              </div>

              {bookings.length === 0 ? (
                <div className="empty-state glass-panel">
                  <Tractor size={48} className="empty-icon" />
                  <h3>No machinery bookings found</h3>
                  <p>Rent tractors, rotavators, sprayers, and seed drills at customized member rates.</p>
                  <button onClick={() => navigate("/equipment-booking")} className="cta-btn primary" style={{ marginTop: "15px" }}>Book Machinery Now</button>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="farmer-table">
                    <thead>
                      <tr>
                        <th>Booking Date</th>
                        <th>Equipment Name</th>
                        <th>Lease Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b._id}>
                          <td>{typeof formatDateNice === 'function' ? formatDateNice(b.bookingDate) : b.bookingDate}</td>
                          <td className="font-semibold">{b.equipmentName}</td>
                          <td>{b.duration}</td>
                          <td>
                            <span className={getStatusClass(b.status)}>{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Product Orders */}
          {activeTab === "orders" && (
            <div className="tab-pane fade-in">
              <div className="tab-pane-header">
                <h2>My Seed & Fertilizer Orders</h2>
                <button className="add-new-btn" onClick={() => navigate("/products")}>+ Order Products</button>
              </div>

              {orders.length === 0 ? (
                <div className="empty-state glass-panel">
                  <ShoppingCart size={48} className="empty-icon" />
                  <h3>No product orders placed</h3>
                  <p>Order high-yield seeds and organic fertilizers from the FPO store.</p>
                  <button onClick={() => navigate("/products")} className="cta-btn primary" style={{ marginTop: "15px" }}>Shop Catalog</button>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="farmer-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Total Cost</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id}>
                          <td className="font-semibold text-primary">{o.bookingId}</td>
                          <td>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                          <td className="font-semibold">{o.productName}</td>
                          <td>{o.quantity} units</td>
                          <td>₹{o.totalPrice}</td>
                          <td>
                            <span className={getStatusClass(o.status)}>{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Document Center */}
          {activeTab === "documents" && (
            <div className="tab-pane fade-in">
              <div className="tab-pane-header">
                <h2>Document Center / పత్రాల కేంద్రం</h2>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Official guides, schemes, manuals, and application forms.</span>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "400px" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "rgba(255, 255, 255, 0.4)" }} />
                  <input 
                    type="text" 
                    placeholder="Search documents by title... / శోధించండి..." 
                    value={searchDoc}
                    onChange={(e) => setSearchDoc(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 36px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      color: "#fff",
                      outline: "none",
                      fontSize: "14px"
                    }}
                  />
                </div>
                <select
                  value={filterDocCategory}
                  onChange={(e) => setFilterDocCategory(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(13, 35, 21, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#fff",
                    outline: "none",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  <option value="All">All Categories / అన్ని విభాగాలు</option>
                  <option value="Government Schemes">Government Schemes / ప్రభుత్వ పథకాలు</option>
                  <option value="Training Manuals">Training Manuals / శిక్షణ మాన్యువల్లు</option>
                  <option value="Crop Guides">Crop Guides / పంటల సమాచారం</option>
                  <option value="FPO Forms">FPO Forms / ఎఫ్.పి.ఓ పత్రాలు</option>
                  <option value="KDKFPCL Forms">KDKFPCL Forms / కేడీకేఎఫ్‌పీసీఎల్ పత్రాలు</option>
                  <option value="Other">Other / ఇతరాలు</option>
                </select>
              </div>

              {documents.filter(d => {
                const matchesSearch = d.title.toLowerCase().includes(searchDoc.toLowerCase()) || (d.description && d.description.toLowerCase().includes(searchDoc.toLowerCase()));
                const matchesCat = filterDocCategory === "All" || d.category === filterDocCategory;
                return matchesSearch && matchesCat;
              }).length === 0 ? (
                <div className="empty-state glass-panel">
                  <FolderOpen size={48} className="empty-icon" style={{ opacity: 0.5 }} />
                  <h3>No Documents Available</h3>
                  <p>Check back later for updated guides, brochures, and application files.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                  {documents.filter(d => {
                    const matchesSearch = d.title.toLowerCase().includes(searchDoc.toLowerCase()) || (d.description && d.description.toLowerCase().includes(searchDoc.toLowerCase()));
                    const matchesCat = filterDocCategory === "All" || d.category === filterDocCategory;
                    return matchesSearch && matchesCat;
                  }).map((doc) => {
                    return (
                      <div key={doc._id} className="glass-panel hover-3d" style={{ padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "rgba(13, 35, 21, 0.45)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", background: "rgba(76, 175, 80, 0.15)", color: "var(--harvest-lt)", padding: "2px 8px", borderRadius: "4px", border: "1px solid rgba(76,175,80,0.2)" }}>{doc.category}</span>
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{doc.fileSize}</span>
                          </div>
                          <h4 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", margin: "0 0 6px 0" }}>{doc.title}</h4>
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4", margin: "0 0 16px 0" }}>{doc.description || "No description available."}</p>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", marginTop: "12px" }}>
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>Uploaded: {new Date(doc.createdAt).toLocaleDateString("en-IN")}</span>
                          <a 
                            href={`${API_BASE.replace("/api", "")}${doc.fileUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              color: "var(--harvest-lt)",
                              fontWeight: "600",
                              textDecoration: "none",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              background: "rgba(76, 175, 80, 0.1)",
                              transition: "background 0.2s"
                            }}
                          >
                            <Download size={14} /> Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab Removed (redirected to /farmer-profile page) */}

        </div>
      </main>
    </div>
  );
}

export default FarmerDashboard;
