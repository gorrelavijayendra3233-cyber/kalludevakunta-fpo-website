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
  RefreshCw
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

const API_BASE = "http://localhost:5000/api";

// ── Mock Data Seeding ──
const INITIAL_CONTACTS = [
  { _id: "c1", fullName: "Venkata Raman", phone: "9014488562", email: "raman.v@gmail.com", village: "Kalludevakunta", inquiryType: "Fertilizers", message: "Inquiry about Urea availability for the upcoming Kharif season.", date: "2026-06-05", createdAt: "2026-06-05T10:00:00.000Z" },
  { _id: "c2", fullName: "Yella Reddy", phone: "9848022338", email: "reddy.yella@yahoo.com", village: "Mantralayam", inquiryType: "Seeds", message: "Do you have CP 818 hybrid maize seeds in stock?", date: "2026-06-07", createdAt: "2026-06-07T11:00:00.000Z" },
  { _id: "c3", fullName: "Shankaraiah Swamy", phone: "9154782290", email: "swamy.shankar@gmail.com", village: "Madhavaram", inquiryType: "Machinery", message: "Looking to rent the combined harvester for 3 days starting next week.", date: "2026-06-09", createdAt: "2026-06-09T12:00:00.000Z" },
  { _id: "c4", fullName: "Hanumanthu Goud", phone: "8985642231", email: "hanuma.goud@outlook.com", village: "Kosigi", inquiryType: "Pesticides", message: "Need bio-pesticides for stem borer control in paddy.", date: "2026-06-10", createdAt: "2026-06-10T13:00:00.000Z" },
  { _id: "c5", fullName: "Thimmappa", phone: "7093288114", email: "thimma.fpo@gmail.com", village: "Nandavaram", inquiryType: "Other", message: "Interested in joining the FPO as a new farmer shareholder.", date: "2026-06-11", createdAt: "2026-06-11T14:00:00.000Z" }
];

const INITIAL_CROPS = [
  { _id: "cr1", farmerName: "Kurnool Chenna Reddy", cropName: "Paddy (Sona Masuri)", quantity: 50, price: 2300, phone: "9440523812", date: "2026-06-06", createdAt: "2026-06-06T10:00:00.000Z" },
  { _id: "cr2", farmerName: "B. Venkateswarlu", cropName: "Maize (Hybrid)", quantity: 80, price: 1850, phone: "9603211547", date: "2026-06-08", createdAt: "2026-06-08T11:00:00.000Z" },
  { _id: "cr3", farmerName: "M. Hanumanthu", cropName: "Red Gram", quantity: 30, price: 7200, phone: "8125433291", date: "2026-06-09", createdAt: "2026-06-09T12:00:00.000Z" },
  { _id: "cr4", farmerName: "G. Raghavendra", cropName: "Cotton", quantity: 45, price: 6800, phone: "9000845321", date: "2026-06-10", createdAt: "2026-06-10T13:00:00.000Z" },
  { _id: "cr5", farmerName: "K. Bheemaiah", cropName: "Groundnut", quantity: 60, price: 5400, phone: "7659982314", date: "2026-06-11", createdAt: "2026-06-11T14:00:00.000Z" }
];

const INITIAL_BOOKINGS = [
  { _id: "b1", farmerName: "G. Anjaneyulu", equipmentName: "Tractor (John Deere)", bookingDate: "2026-06-06", duration: "2 Days", phone: "9866543210", status: "Confirmed", createdAt: "2026-06-06T10:00:00.000Z" },
  { _id: "b2", farmerName: "V. Lingamurthy", equipmentName: "Combined Harvester", bookingDate: "2026-06-08", duration: "1 Day", phone: "9701234567", status: "Pending", createdAt: "2026-06-08T11:00:00.000Z" },
  { _id: "b3", farmerName: "P. Veerendra", equipmentName: "Motorised Sprayer", bookingDate: "2026-06-09", duration: "4 Hours", phone: "9010892211", status: "Confirmed", createdAt: "2026-06-09T12:00:00.000Z" },
  { _id: "b4", farmerName: "T. Narasimhulu", equipmentName: "Seed Drill", bookingDate: "2026-06-10", duration: "1 Day", phone: "8985123456", status: "Cancelled", createdAt: "2026-06-10T13:00:00.000Z" },
  { _id: "b5", farmerName: "M. Rangaswamy", equipmentName: "Rotavator", bookingDate: "2026-06-11", duration: "3 Days", phone: "7382194857", status: "Pending", createdAt: "2026-06-11T14:00:00.000Z" }
];

function Admin() {
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

  // Load Data on Mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const savedContacts = localStorage.getItem("fpo_admin_contacts");
    const savedCrops = localStorage.getItem("fpo_admin_crops");
    const savedBookings = localStorage.getItem("fpo_admin_bookings");

    // Contact Requests
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    } else {
      try {
        const res = await fetch(`${API_BASE}/contact`);
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
          localStorage.setItem("fpo_admin_contacts", JSON.stringify(data));
        } else {
          setContacts(INITIAL_CONTACTS);
          localStorage.setItem("fpo_admin_contacts", JSON.stringify(INITIAL_CONTACTS));
        }
      } catch (err) {
        console.warn("Could not fetch contacts, using seed data:", err);
        setContacts(INITIAL_CONTACTS);
        localStorage.setItem("fpo_admin_contacts", JSON.stringify(INITIAL_CONTACTS));
      }
    }

    // Crop Requests
    if (savedCrops) {
      setCrops(JSON.parse(savedCrops));
    } else {
      try {
        const res = await fetch(`${API_BASE}/crops`);
        if (res.ok) {
          const data = await res.json();
          setCrops(data);
          localStorage.setItem("fpo_admin_crops", JSON.stringify(data));
        } else {
          setCrops(INITIAL_CROPS);
          localStorage.setItem("fpo_admin_crops", JSON.stringify(INITIAL_CROPS));
        }
      } catch (err) {
        console.warn("Could not fetch crops, using seed data:", err);
        setCrops(INITIAL_CROPS);
        localStorage.setItem("fpo_admin_crops", JSON.stringify(INITIAL_CROPS));
      }
    }

    // Bookings
    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    } else {
      try {
        const res = await fetch(`${API_BASE}/bookings`);
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
          localStorage.setItem("fpo_admin_bookings", JSON.stringify(data));
        } else {
          setBookings(INITIAL_BOOKINGS);
          localStorage.setItem("fpo_admin_bookings", JSON.stringify(INITIAL_BOOKINGS));
        }
      } catch (err) {
        console.warn("Could not fetch bookings, using seed data:", err);
        setBookings(INITIAL_BOOKINGS);
        localStorage.setItem("fpo_admin_bookings", JSON.stringify(INITIAL_BOOKINGS));
      }
    }

    setLoading(false);
  };

  // ── DELETE Request Handlers ──
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}? This action will remove it permanently.`)) return;

    const endpoint = type === "contacts" ? "contact" : type;
    
    try {
      const response = await fetch(`${API_BASE}/${endpoint}/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("Record deleted successfully from database.");
      } else {
        console.warn("Server DELETE call returned non-200, deleting from client state only.");
      }
    } catch (error) {
      console.warn("API offline or server unreachable, deleting from local session state only:", error);
    }

    // Always update local React state and localStorage cache for visual consistency
    if (type === "contacts") {
      const updated = contacts.filter(item => item._id !== id);
      setContacts(updated);
      localStorage.setItem("fpo_admin_contacts", JSON.stringify(updated));
    } else if (type === "crops") {
      const updated = crops.filter(item => item._id !== id);
      setCrops(updated);
      localStorage.setItem("fpo_admin_crops", JSON.stringify(updated));
    } else if (type === "bookings") {
      const updated = bookings.filter(item => item._id !== id);
      setBookings(updated);
      localStorage.setItem("fpo_admin_bookings", JSON.stringify(updated));
    }

    if (selectedItem && selectedItem.data._id === id) {
      setSelectedItem(null);
    }
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
