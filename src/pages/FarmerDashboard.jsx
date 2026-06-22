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
  Bell
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
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("farmer_token");
    localStorage.removeItem("farmerToken");
    localStorage.removeItem("farmer_data");
    toast.success("Logged out successfully");
    // Dispatch custom storage event to update navbar instantly
    window.dispatchEvent(new Event("storage"));
    navigate("/farmer-login");
  };

  // Sync tab state with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["dashboard", "crops", "bookings", "orders", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

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

        // Fetch user transaction history and notifications
        const [cropsRes, bookingsRes, ordersRes, notifsRes] = await Promise.all([
          fetch(`${API_BASE}/farmer/crop-requests`, { headers }),
          fetch(`${API_BASE}/farmer/bookings`, { headers }),
          fetch(`${API_BASE}/farmer/orders`, { headers }),
          fetch(`${API_BASE}/farmer/notifications`, { headers })
        ]);

        if (cropsRes.status === 401 || cropsRes.status === 403 ||
            bookingsRes.status === 401 || bookingsRes.status === 403 ||
            ordersRes.status === 401 || ordersRes.status === 403 ||
            notifsRes.status === 401 || notifsRes.status === 403) {
          handleLogout();
          return;
        }

        if (cropsRes.ok) setCropRequests(await cropsRes.json());
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (notifsRes.ok) setNotifications(await notifsRes.json());

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
        <div className="farmer-profile-summary">
          <div className="avatar-wrap">
            <User size={28} />
          </div>
          <div className="farmer-meta">
            <h4>{farmer.name}</h4>
            <span className="farmer-id">{farmer.farmerId}</span>
          </div>
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
        <header className="farmer-header glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Kalludevakunta FPO Portal</h1>
            <p>Welcome back, <strong>{farmer.name}</strong> — registered FPO member</p>
          </div>
          <div className="farmer-header-right">
            {/* Bell Icon Notification Center */}
            <div className="notification-bell-wrapper">
              <button 
                className="notification-bell-btn" 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                title="Notifications"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-badge">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="notification-dropdown">
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

              {/* Section: Crop Selling Overview */}
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "15px", color: "var(--text-primary)", marginTop: "20px" }}>Crop Selling Overview</h3>
              <div className="summary-cards-grid" style={{ marginBottom: "25px" }}>
                <div className="summary-card glass-panel" onClick={() => navigate("/my-crop-requests")}>
                  <div className="card-top">
                    <div className="icon-wrap green"><Sprout size={20} /></div>
                    <span className="count">{cropRequests.length}</span>
                  </div>
                  <h3>Total Crop Requests</h3>
                  <p>All submitted listings</p>
                </div>

                <div className="summary-card glass-panel" onClick={() => navigate("/my-crop-requests")}>
                  <div className="card-top">
                    <div className="icon-wrap warning"><Clock size={20} /></div>
                    <span className="count">{cropRequests.filter(c => c.status === "Pending").length}</span>
                  </div>
                  <h3>Pending Requests</h3>
                  <p>Awaiting FPO review</p>
                </div>

                <div className="summary-card glass-panel" onClick={() => navigate("/my-crop-requests")}>
                  <div className="card-top">
                    <div className="icon-wrap green"><CheckCircle size={20} /></div>
                    <span className="count">{cropRequests.filter(c => c.status === "Approved").length}</span>
                  </div>
                  <h3>Approved Requests</h3>
                  <p>Verified crop approvals</p>
                </div>

                <div className="summary-card glass-panel" onClick={() => navigate("/my-crop-requests")}>
                  <div className="card-top">
                    <div className="icon-wrap green"><CheckCircle size={20} /></div>
                    <span className="count">{cropRequests.filter(c => c.status === "Completed").length}</span>
                  </div>
                  <h3>Completed Requests</h3>
                  <p>Procured & completed sales</p>
                </div>

                <div className="summary-card glass-panel" style={{ background: "linear-gradient(135deg, rgba(230, 81, 0, 0.1) 0%, rgba(13, 35, 21, 0.6) 100%)", border: "1px solid rgba(230, 81, 0, 0.2)" }}>
                  <div className="card-top">
                    <div className="icon-wrap orange"><Coins size={20} /></div>
                    <span className="count" style={{ fontSize: "20px" }}>
                      ₹{cropRequests.filter(c => c.status !== "Rejected").reduce((sum, c) => sum + (c.estimatedValue || c.quantity * (c.expectedPrice || c.price || 0)), 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <h3>Total Expected Revenue</h3>
                  <p>Active expected payout</p>
                </div>
              </div>

              {/* Section: Other Services */}
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "15px", color: "var(--text-primary)" }}>Other FPO Services</h3>
              <div className="summary-cards-grid">
                <div className="summary-card glass-panel" onClick={() => setActiveTab("bookings")}>
                  <div className="card-top">
                    <div className="icon-wrap green"><Tractor size={20} /></div>
                    <span className="count">{bookings.length}</span>
                  </div>
                  <h3>Total Equipment Bookings</h3>
                  <p>Machinery booking entries</p>
                </div>

                <div className="summary-card glass-panel" onClick={() => setActiveTab("orders")}>
                  <div className="card-top">
                    <div className="icon-wrap green"><ShoppingCart size={20} /></div>
                    <span className="count">{orders.length}</span>
                  </div>
                  <h3>Total Product Orders</h3>
                  <p>Seed & Fertilizer orders</p>
                </div>

                <div className="summary-card glass-panel" onClick={() => setActiveTab("profile")}>
                  <div className="card-top">
                    <div className="icon-wrap green"><Clock size={20} /></div>
                  </div>
                  <h3>Last Login</h3>
                  <p style={{ marginTop: "12px", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                    {formatLastLogin(farmer.lastLogin)}
                  </p>
                </div>
              </div>

              {/* FPO Contact Quick card */}
              <div className="quick-help-card glass-panel">
                <h3>Need Assistance?</h3>
                <p>If you need help with bookings, crop registrations, or updating profile details, contact FPO Support immediately.</p>
                <div className="contact-info">
                  <Phone size={16} /> <span>+91 90144 88562 (Hanumanthu Goud)</span>
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
                          <td>{b.bookingDate}</td>
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

          {/* Profile Tab Removed (redirected to /farmer-profile page) */}

        </div>
      </main>
    </div>
  );
}

export default FarmerDashboard;
