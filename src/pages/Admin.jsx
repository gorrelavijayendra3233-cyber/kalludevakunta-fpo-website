import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Trash2, 
  Eye, 
  Download, 
  LayoutDashboard,
  Sprout,
  Tractor,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  RefreshCw,
  Lock,
  LogOut
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import "./Admin.css";

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";




function Admin() {
  // ── Authentication States ──
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("fpo_admin_token")
  );
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // ── Core States ──
  const [contacts, setContacts] = useState([]);
  const [crops, setCrops] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Theme State ──
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("fpo_admin_theme") || "dark";
  });

  // ── Search States ──
  const [searchContact, setSearchContact] = useState("");
  const [searchCrop, setSearchCrop] = useState("");
  const [searchBooking, setSearchBooking] = useState("");

  // Apply Theme Mode class on HTML node
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light-mode");
    } else {
      root.classList.remove("light-mode");
    }
    localStorage.setItem("fpo_admin_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();

      const interval = setInterval(() => {
        fetchData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

const fetchData = async () => {
  setLoading(true);

  try {
    const token = localStorage.getItem("fpo_admin_token");
    const headers = {
      Authorization: `Bearer ${token}`
    };

    const [contactsRes, cropsRes, bookingsRes] =
      await Promise.all([
        fetch(`${API_BASE}/contact`, { headers }),
        fetch(`${API_BASE}/crops`, { headers }),
        fetch(`${API_BASE}/bookings`, { headers })
      ]);

    if (
      contactsRes.status === 401 ||
      cropsRes.status === 401 ||
      bookingsRes.status === 401
    ) {
      handleUnauthorized();
      return;
    }

    if (!contactsRes.ok || !cropsRes.ok || !bookingsRes.ok) {
      throw new Error("Failed to fetch data");
    }

    const contactsData = await contactsRes.json();
    const cropsData = await cropsRes.json();
    const bookingsData = await bookingsRes.json();

    setContacts(contactsData);
    setCrops(cropsData);
    setBookings(bookingsData);

  } catch (error) {
    console.error("Database fetch error:", error);
    alert("Unable to load dashboard data.");
  } finally {
    setLoading(false);
  }
};

// ── DELETE Request Handlers ──
const handleDelete = async (type, id) => {
  if (
    !window.confirm(
      `Are you sure you want to delete this ${type.slice(
        0,
        -1
      )}? This action cannot be undone.`
    )
  ) {
    return;
  }

  const endpoint = type === "contacts" ? "contact" : type;

  try {
    const token = localStorage.getItem("fpo_admin_token");
    const response = await fetch(
      `${API_BASE}/${endpoint}/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Delete failed");
    }

    alert("Record deleted successfully.");

    // Reload fresh data from MongoDB
    fetchData();

    // Close modal if deleted item was open
    if (selectedItem && selectedItem.data._id === id) {
      setSelectedItem(null);
    }
  } catch (error) {
    console.error("Delete Error:", error);
    alert("Failed to delete record.");
  }
};

  // ── Authentication Handlers ──
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("fpo_admin_token", data.token);
        setIsAuthenticated(true);
        setAuthError("");
      } else {
        setAuthError(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      setAuthError("Unable to connect to server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fpo_admin_token");
    setIsAuthenticated(false);
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("fpo_admin_token");
    setIsAuthenticated(false);
    setAuthError("Session expired. Please login again.");
  };


  // ── CSV Export Functionality ──
  const exportCSV = (type, dataList) => {
    let headers = [];
    let rows = [];

    if (type === "contacts") {
      headers = ["Name", "Phone", "Email", "Village", "Inquiry Type", "Message", "Date"];
      rows = dataList.map(item => [
        item.fullName || "",
        item.phone || "",
        item.email || "",
        item.village || "",
        item.inquiryType || "",
        item.message || "",
        item.date || (item.createdAt ? item.createdAt.substring(0, 10) : "")
      ]);
    } else if (type === "crops") {
      headers = ["Farmer Name", "Crop Name", "Quantity (Qtls)", "Expected Price (per Qtl)", "Phone Number", "Date"];
      rows = dataList.map(item => [
        item.farmerName || "",
        item.cropName || "",
        item.quantity || 0,
        item.price || 0,
        item.phone || "",
        item.date || (item.createdAt ? item.createdAt.substring(0, 10) : "")
      ]);
    } else if (type === "bookings") {
      headers = ["Farmer Name", "Equipment Name", "Booking Date", "Duration", "Phone Number", "Status"];
      rows = dataList.map(item => [
        item.farmerName || "",
        item.equipmentName || "",
        item.bookingDate || (item.createdAt ? item.createdAt.substring(0, 10) : ""),
        item.duration || "1 Day",
        item.phone || "",
        item.status || "Pending"
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fpo_${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Chartjs Calculations ──
  const getTrendData = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().substring(0, 10));
    }

    const contactCounts = dates.map(dateStr => 
      contacts.filter(c => (c.date || (c.createdAt && c.createdAt.substring(0, 10))) === dateStr).length
    );
    const cropCounts = dates.map(dateStr => 
      crops.filter(c => (c.date || (c.createdAt && c.createdAt.substring(0, 10))) === dateStr).length
    );
    const bookingCounts = dates.map(dateStr => 
      bookings.filter(b => (b.bookingDate || (b.createdAt && b.createdAt.substring(0, 10))) === dateStr).length
    );

    const labels = dates.map(dateStr => {
      const [y, m, d] = dateStr.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(m) - 1]} ${d}`;
    });

    const isLight = theme === "light";
    const gridColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
    const textColor = isLight ? "#2e3b2e" : "#e0e7e1";

    return {
      data: {
        labels,
        datasets: [
          {
            label: "Contacts",
            data: contactCounts,
            borderColor: "#2e7d32",
            backgroundColor: "rgba(46, 125, 50, 0.08)",
            tension: 0.3,
            fill: true
          },
          {
            label: "Crops",
            data: cropCounts,
            borderColor: "#e65100",
            backgroundColor: "rgba(230, 81, 0, 0.08)",
            tension: 0.3,
            fill: true
          },
          {
            label: "Bookings",
            data: bookingCounts,
            borderColor: "#0288d1",
            backgroundColor: "rgba(2, 136, 209, 0.08)",
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: "Inter", size: 12 } }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: "Inter" } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, precision: 0, font: { family: "Inter" } }
          }
        }
      }
    };
  };

  const getDoughnutData = () => {
    const isLight = theme === "light";
    const textColor = isLight ? "#2e3b2e" : "#e0e7e1";

    return {
      data: {
        labels: ["Contacts", "Crops", "Bookings"],
        datasets: [
          {
            data: [contacts.length, crops.length, bookings.length],
            backgroundColor: ["#2e7d32", "#e65100", "#0288d1"],
            borderWidth: 1,
            borderColor: isLight ? "#ffffff" : "#0d2315"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: textColor, font: { family: "Inter", size: 12 } }
          }
        }
      }
    };
  };

  // ── Filter Computations ──
  const filteredContacts = contacts.filter(c => {
    const term = searchContact.toLowerCase();
    return (
      (c.fullName || "").toLowerCase().includes(term) ||
      (c.phone || "").includes(term) ||
      (c.email || "").toLowerCase().includes(term) ||
      (c.inquiryType || "").toLowerCase().includes(term)
    );
  });

  const filteredCrops = crops.filter(cr => {
    const term = searchCrop.toLowerCase();
    return (
      (cr.farmerName || "").toLowerCase().includes(term) ||
      (cr.cropName || "").toLowerCase().includes(term) ||
      (cr.phone || "").includes(term)
    );
  });

  const filteredBookings = bookings.filter(b => {
    const term = searchBooking.toLowerCase();
    return (
      (b.farmerName || "").toLowerCase().includes(term) ||
      (b.equipmentName || "").toLowerCase().includes(term) ||
      (b.phone || "").includes(term) ||
      (b.status || "").toLowerCase().includes(term)
    );
  });

  // ── 1. Protected Route check (Return Login Screen if not authenticated) ──
  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <div className="admin-login-card glass-panel">
          <div className="admin-login-header">
            <div className="admin-login-logo">
              <Sprout size={32} />
            </div>
            <h2 className="admin-login-title">KDK FPC</h2>
            <span className="admin-login-subtitle">FPO Admin Portal Login</span>
          </div>

          <form onSubmit={handleLoginSubmit} className="admin-login-form">
            {authError && (
              <div className="admin-login-error">
                {authError}
              </div>
            )}

            <div className="admin-login-input-group">
              <label className="admin-login-label">Username</label>
              <input 
                type="text"
                placeholder="Enter username"
                className="admin-login-input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />
            </div>

            <div className="admin-login-input-group">
              <label className="admin-login-label">Password</label>
              <input 
                type="password"
                placeholder="Enter password"
                className="admin-login-input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="admin-login-btn">
              <Lock size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              <span>Login to Dashboard</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 2. Render Dashboard UI if authenticated ──
  return (
    <div className="admin-container">
      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <Sprout size={28} className="sidebar-brand-icon" />
          <div className="brand-text">
            <h2>KDK FPC</h2>
            <span>FPO Admin Portal</span>
          </div>
          <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "contacts" ? "active" : ""}`}
            onClick={() => { setActiveTab("contacts"); setMobileMenuOpen(false); }}
          >
            <MessageSquare size={18} />
            <span>Contact Requests</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "crops" ? "active" : ""}`}
            onClick={() => { setActiveTab("crops"); setMobileMenuOpen(false); }}
          >
            <Sprout size={18} />
            <span>Crop Requests</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => { setActiveTab("bookings"); setMobileMenuOpen(false); }}
          >
            <Tractor size={18} />
            <span>Equipment Bookings</span>
          </button>

          <button className="nav-item logout-sidebar" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-badge">
            <span className="badge-dot"></span>
            <span>Live Data Sync</span>
          </div>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="header-title">
              {activeTab === "dashboard" && "Dashboard Overview"}
              {activeTab === "contacts" && "Contact Inquiries"}
              {activeTab === "crops" && "Crop Selling Requests"}
              {activeTab === "bookings" && "Machinery Bookings"}
            </h1>
          </div>

          <div className="header-right">
            <button className="sync-btn" title="Reload Database" onClick={fetchData} disabled={loading}>
              <RefreshCw size={16} className={loading ? "spin" : ""} />
            </button>
            <button 
              className="theme-toggle" 
              title="Toggle theme mode"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button 
              className="logout-btn" 
              title="Log out from session"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>

            <div className="admin-profile">
              <div className="profile-avatar">A</div>
              <span className="profile-name">FPO Admin</span>
            </div>
          </div>
        </header>

        {/* ── Content Grid ── */}
        <div className="admin-content-viewport">
          {loading ? (
            <div className="loader-container">
              <div className="loader"></div>
              <p>Fetching data from FPO database...</p>
            </div>
          ) : (
            <>
              {/* 1. Dashboard Tab */}
              {activeTab === "dashboard" && (
                <div className="tab-pane">
                  {/* Overview Grid */}
                  <div className="metrics-grid">
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("contacts")}>
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <MessageSquare size={22} />
                        </div>
                        <span className="trend-badge positive">Active</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{contacts.length}</h3>
                        <p>Total Contacts</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper orange">
                          <Sprout size={22} />
                        </div>
                        <span className="trend-badge positive">Active</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{crops.length}</h3>
                        <p>Crop Sale Offers</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("bookings")}>
                      <div className="card-top">
                        <div className="icon-wrapper blue">
                          <Tractor size={22} />
                        </div>
                        <span className="trend-badge positive">Active</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{bookings.length}</h3>
                        <p>Equipment Rentals</p>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="charts-row">
                    <div className="chart-wrapper glass-panel main-chart">
                      <div className="chart-header">
                        <h4>FPO Submission Activity Trends</h4>
                        <span>Last 7 Days</span>
                      </div>
                      <div className="chart-container">
                        <Line {...getTrendData()} />
                      </div>
                    </div>

                    <div className="chart-wrapper glass-panel side-chart">
                      <div className="chart-header">
                        <h4>Request Distribution</h4>
                        <span>Current Split</span>
                      </div>
                      <div className="chart-container">
                        <Doughnut {...getDoughnutData()} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Contacts Tab */}
              {activeTab === "contacts" && (
                <div className="tab-pane">
                  <div className="pane-header-actions">
                    <div className="search-bar-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search by name, phone, type..." 
                        value={searchContact}
                        onChange={(e) => setSearchContact(e.target.value)}
                      />
                    </div>
                    <button className="btn-action primary" onClick={() => exportCSV("contacts", filteredContacts)}>
                      <Download size={15} />
                      <span>Export to CSV</span>
                    </button>
                  </div>

                  <div className="table-responsive-container glass-panel">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Village</th>
                          <th>Inquiry Type</th>
                          <th>Date</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="empty-message">No contact inquiries match your search.</td>
                          </tr>
                        ) : (
                          filteredContacts.map(c => {
                            const dateStr = c.date || (c.createdAt ? c.createdAt.substring(0, 10) : "");
                            return (
                              <tr key={c._id}>
                                <td className="font-semibold" data-label="Name">{c.fullName}</td>
                                <td data-label="Phone">{c.phone}</td>
                                <td className="text-dim" data-label="Email">{c.email || "N/A"}</td>
                                <td data-label="Village">{c.village}</td>
                                <td data-label="Inquiry Type">
                                  <span className="badge-tag info">{c.inquiryType}</span>
                                </td>
                                <td data-label="Date">{dateStr}</td>
                                <td className="text-right" data-label="Actions">
                                  <div className="action-button-group">
                                    <button 
                                      className="action-btn view" 
                                      title="Inspect Details"
                                      onClick={() => setSelectedItem({ type: "contact", data: c })}
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button 
                                      className="action-btn delete" 
                                      title="Delete record"
                                      onClick={() => handleDelete("contacts", c._id)}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Crops Tab */}
              {activeTab === "crops" && (
                <div className="tab-pane">
                  <div className="pane-header-actions">
                    <div className="search-bar-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search by farmer, crop, phone..." 
                        value={searchCrop}
                        onChange={(e) => setSearchCrop(e.target.value)}
                      />
                    </div>
                    <button className="btn-action primary" onClick={() => exportCSV("crops", filteredCrops)}>
                      <Download size={15} />
                      <span>Export to CSV</span>
                    </button>
                  </div>

                  <div className="table-responsive-container glass-panel">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Farmer Name</th>
                          <th>Crop Name</th>
                          <th>Quantity (Qtls)</th>
                          <th>Expected Price</th>
                          <th>Phone Number</th>
                          <th>Date</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCrops.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="empty-message">No crop requests match your search.</td>
                          </tr>
                        ) : (
                          filteredCrops.map(cr => {
                            const dateStr = cr.date || (cr.createdAt ? cr.createdAt.substring(0, 10) : "");
                            return (
                              <tr key={cr._id}>
                                <td className="font-semibold" data-label="Farmer Name">{cr.farmerName}</td>
                                <td className="text-accent" data-label="Crop Name">{cr.cropName}</td>
                                <td data-label="Quantity">{cr.quantity}</td>
                                <td data-label="Price">₹{cr.price} / Qtl</td>
                                <td data-label="Phone">{cr.phone}</td>
                                <td data-label="Date">{dateStr}</td>
                                <td className="text-right" data-label="Actions">
                                  <div className="action-button-group">
                                    <button 
                                      className="action-btn view" 
                                      title="Inspect Details"
                                      onClick={() => setSelectedItem({ type: "crop", data: cr })}
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button 
                                      className="action-btn delete" 
                                      title="Delete record"
                                      onClick={() => handleDelete("crops", cr._id)}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. Bookings Tab */}
              {activeTab === "bookings" && (
                <div className="tab-pane">
                  <div className="pane-header-actions">
                    <div className="search-bar-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search by booking details..." 
                        value={searchBooking}
                        onChange={(e) => setSearchBooking(e.target.value)}
                      />
                    </div>
                    <button className="btn-action primary" onClick={() => exportCSV("bookings", filteredBookings)}>
                      <Download size={15} />
                      <span>Export to CSV</span>
                    </button>
                  </div>

                  <div className="table-responsive-container glass-panel">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Farmer Name</th>
                          <th>Equipment Name</th>
                          <th>Booking Date</th>
                          <th>Duration</th>
                          <th>Phone Number</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="empty-message">No equipment bookings match your search.</td>
                          </tr>
                        ) : (
                          filteredBookings.map(b => {
                            const dateStr = b.bookingDate || (b.createdAt ? b.createdAt.substring(0, 10) : "");
                            const statusLower = (b.status || "pending").toLowerCase();
                            return (
                              <tr key={b._id}>
                                <td className="font-semibold" data-label="Farmer Name">{b.farmerName}</td>
                                <td className="text-accent" data-label="Equipment Name">{b.equipmentName}</td>
                                <td data-label="Booking Date">{dateStr}</td>
                                <td data-label="Duration">{b.duration || "1 Day"}</td>
                                <td data-label="Phone">{b.phone}</td>
                                <td data-label="Status">
                                  <span className={`status-pill ${statusLower}`}>
                                    {b.status || "Pending"}
                                  </span>
                                </td>
                                <td className="text-right" data-label="Actions">
                                  <div className="action-button-group">
                                    <button 
                                      className="action-btn view" 
                                      title="Inspect Details"
                                      onClick={() => setSelectedItem({ type: "booking", data: b })}
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button 
                                      className="action-btn delete" 
                                      title="Delete record"
                                      onClick={() => handleDelete("bookings", b._id)}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </main>

      {/* ── Detail Modal Overlay ── */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedItem.type === "contact" && "Contact Request Details"}
                {selectedItem.type === "crop" && "Crop Offer Details"}
                {selectedItem.type === "booking" && "Equipment Booking Details"}
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {selectedItem.type === "contact" && (
                <div className="details-list">
                  <div className="detail-item">
                    <span className="label">Full Name:</span>
                    <span className="value font-semibold">{selectedItem.data.fullName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Phone Number:</span>
                    <span className="value">{selectedItem.data.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email Address:</span>
                    <span className="value">{selectedItem.data.email || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Village / Location:</span>
                    <span className="value">{selectedItem.data.village}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Inquiry Topic:</span>
                    <span className="value badge-tag info">{selectedItem.data.inquiryType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Submission Date:</span>
                    <span className="value">{selectedItem.data.date || selectedItem.data.createdAt?.substring(0, 10)}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="label">Inquiry Message:</span>
                    <span className="value text-block">{selectedItem.data.message}</span>
                  </div>
                </div>
              )}

              {selectedItem.type === "crop" && (
                <div className="details-list">
                  <div className="detail-item">
                    <span className="label">Farmer Name:</span>
                    <span className="value font-semibold">{selectedItem.data.farmerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Crop Name:</span>
                    <span className="value text-accent">{selectedItem.data.cropName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Quantity Offered:</span>
                    <span className="value">{selectedItem.data.quantity} Quintals</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Expected Price:</span>
                    <span className="value">₹{selectedItem.data.price} per Qtl</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Phone Number:</span>
                    <span className="value">{selectedItem.data.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Submitted Date:</span>
                    <span className="value">{selectedItem.data.date || selectedItem.data.createdAt?.substring(0, 10)}</span>
                  </div>
                </div>
              )}

              {selectedItem.type === "booking" && (
                <div className="details-list">
                  <div className="detail-item">
                    <span className="label">Farmer Name:</span>
                    <span className="value font-semibold">{selectedItem.data.farmerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Equipment Name:</span>
                    <span className="value text-accent">{selectedItem.data.equipmentName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Desired Booking Date:</span>
                    <span className="value">{selectedItem.data.bookingDate || selectedItem.data.createdAt?.substring(0, 10)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Rental Duration:</span>
                    <span className="value">{selectedItem.data.duration || "1 Day"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Phone Number:</span>
                    <span className="value">{selectedItem.data.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Approval Status:</span>
                    <span className={`value status-pill ${(selectedItem.data.status || "pending").toLowerCase()}`}>
                      {selectedItem.data.status || "Pending"}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-modal-close" onClick={() => setSelectedItem(null)}>Close Inspector</button>
              <button 
                className="btn-modal-delete"
                onClick={() => handleDelete(selectedItem.type === "contact" ? "contacts" : selectedItem.type === "crop" ? "crops" : "bookings", selectedItem.data._id)}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
