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
  LogOut,
  Users,
  Package,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Send
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
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
import { Line, Doughnut, Bar, Pie } from "react-chartjs-2";
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
  const [farmers, setFarmers] = useState([]);

  // ── Farmers Module States ──
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [viewingFarmer, setViewingFarmer] = useState(null);
  const [searchFarmer, setSearchFarmer] = useState("");
  const [farmerForm, setFarmerForm] = useState({
    name: "",
    phone: "",
    village: "",
    mandal: "",
    district: "Kurnool",
    cropType: "",
    landHolding: "",
    gender: "Male",
    aadhaarLast4: "",
    status: "Active"
  });

  // ── Products Module States ──
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [searchProduct, setSearchProduct] = useState("");
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    description: "",
    unit: "",
    price: "",
    stock: "",
    imageUrl: "",
    status: "In Stock"
  });

  // ── Reports & Analytics States ──
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState("all");

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

  // ── Notification States ──
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notificationSearch, setNotificationSearch] = useState("");

  // ── Settings & Telegram States ──
  const [settingsForm, setSettingsForm] = useState({ dashboardEnabled: true, telegramEnabled: true });
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

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

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("fpo_admin_token")}`
  });

  const getRelativeTime = (dateInput) => {
    if (!dateInput) return "";
    try {
      return formatDistanceToNow(new Date(dateInput), { addSuffix: true });
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  const triggerSystemNotification = async (title, message, priority = "medium") => {
    try {
      await fetch(`${API_BASE}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          title,
          message,
          type: "system",
          priority
        }),
        signal: AbortSignal.timeout(5000)
      });
      // Fetch fresh data to update notifications list/badge
      fetchData();
    } catch (err) {
      console.error("Failed to post system notification:", err);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications? This cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/notifications/clear-all`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }
      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  };

  const handleSettingsChange = (field, value) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }));
  };

  const saveNotificationSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch(`${API_BASE}/notifications/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(settingsForm),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (response.ok) {
        alert("Notification settings updated successfully!");
        fetchData();
      } else {
        alert("Failed to save notification settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const sendTestTelegramMessage = async () => {
    setSendingTest(true);
    try {
      const response = await fetch(`${API_BASE}/notifications/test-telegram`, {
        method: "POST",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await response.json();
      if (response.ok && data.success) {
        alert("Test telegram message sent successfully!");
        fetchData();
      } else {
        alert(data.message || "Failed to send test telegram message.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server to send test message.");
    } finally {
      setSendingTest(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();

      const interval = setInterval(() => {
        fetchData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, analyticsTimeframe]);

const fetchData = async () => {
  setLoading(true);

  try {
    const signal = AbortSignal.timeout(10000);

    const [contactsRes, cropsRes, bookingsRes, farmersRes, productsRes, analyticsRes, monthlyRes, categoryRes, notificationsRes, settingsRes, telegramRes] =
      await Promise.all([
        fetch(`${API_BASE}/contact`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/crops`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/bookings`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/farmers`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/products`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/analytics?timeframe=${analyticsTimeframe}`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/analytics/monthly`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/analytics/categories`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/notifications/settings`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE}/notifications/telegram-status`, { headers: getAuthHeaders(), signal })
      ]);

    if (
      contactsRes.status === 401 ||
      cropsRes.status === 401 ||
      bookingsRes.status === 401 ||
      farmersRes.status === 401 ||
      productsRes.status === 401 ||
      analyticsRes.status === 401 ||
      monthlyRes.status === 401 ||
      categoryRes.status === 401 ||
      notificationsRes.status === 401 ||
      settingsRes.status === 401 ||
      telegramRes.status === 401
    ) {
      setLoading(false);
      handleUnauthorized();
      return;
    }

    if (!contactsRes.ok || !cropsRes.ok || !bookingsRes.ok || !farmersRes.ok || !productsRes.ok || !analyticsRes.ok || !monthlyRes.ok || !categoryRes.ok || !notificationsRes.ok || !settingsRes.ok || !telegramRes.ok) {
      throw new Error("Failed to fetch data");
    }

    const contactsData = await contactsRes.json();
    const cropsData = await cropsRes.json();
    const bookingsData = await bookingsRes.json();
    const farmersData = await farmersRes.json();
    const productsData = await productsRes.json();
    const analyticsData = await analyticsRes.json();
    const monthlyData = await monthlyRes.json();
    const categoryData = await categoryRes.json();
    const notificationsData = await notificationsRes.json();
    const settingsData = await settingsRes.json();
    const telegramData = await telegramRes.json();

    setContacts(contactsData);
    setCrops(cropsData);
    setBookings(bookingsData);
    setFarmers(farmersData.data || farmersData);
    setProducts(productsData.data || productsData);
    setAnalyticsStats(analyticsData);
    setMonthlyAnalytics(monthlyData);
    setCategoryAnalytics(categoryData);
    setNotifications(notificationsData);
    setSettingsForm({
      dashboardEnabled: settingsData.dashboardEnabled,
      telegramEnabled: settingsData.telegramEnabled
    });
    setTelegramStatus(telegramData);

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
    const response = await fetch(
      `${API_BASE}/${endpoint}/${id}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      }
    );

    if (response.status === 401) {
      setLoading(false);
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

  // ── Farmer CRUD Handlers ──
  const handleFarmerSubmit = async (e) => {
    e.preventDefault();
    if (!farmerForm.name || !farmerForm.phone || !farmerForm.village) {
      alert("Name, Phone, and Village are required.");
      return;
    }
    if (!/^\d{10}$/.test(farmerForm.phone)) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }
    if (farmerForm.landHolding && Number(farmerForm.landHolding) < 0) {
      alert("Land holding must be a positive number.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/farmers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(farmerForm),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        alert("Farmer added successfully!");
        setShowFarmerModal(false);
        setFarmerForm({
          name: "",
          phone: "",
          village: "",
          mandal: "",
          district: "Kurnool",
          cropType: "",
          landHolding: "",
          gender: "Male",
          aadhaarLast4: "",
          status: "Active"
        });
        fetchData();
      } else {
        alert(data.message || "Failed to add farmer.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  const handleFarmerUpdate = async (e) => {
    e.preventDefault();
    if (!editingFarmer.name || !editingFarmer.phone || !editingFarmer.village) {
      alert("Name, Phone, and Village are required.");
      return;
    }
    if (!/^\d{10}$/.test(editingFarmer.phone)) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }
    if (editingFarmer.landHolding && Number(editingFarmer.landHolding) < 0) {
      alert("Land holding must be a positive number.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/farmers/${editingFarmer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(editingFarmer),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        alert("Farmer updated successfully!");
        setEditingFarmer(null);
        fetchData();
      } else {
        alert(data.message || "Failed to update farmer.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  const handleFarmerDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this farmer?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/farmers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        alert("Farmer deleted successfully.");
        fetchData();
      } else {
        alert(data.message || "Failed to delete farmer.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  // ── Product CRUD Handlers ──
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category || productForm.price === "" || productForm.stock === "") {
      alert("Product Name, Category, Price, and Stock Quantity are required.");
      return;
    }
    if (Number(productForm.price) < 0 || Number(productForm.stock) < 0) {
      alert("Price and Stock must be non-negative numbers.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(productForm),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        alert("Product added successfully!");
        setShowProductModal(false);
        setProductForm({
          name: "",
          category: "",
          description: "",
          unit: "",
          price: "",
          stock: "",
          imageUrl: "",
          status: "In Stock"
        });
        fetchData();
      } else {
        alert(data.message || "Failed to add product.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  const handleProductUpdate = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.category || editingProduct.price === "" || editingProduct.stock === "") {
      alert("Product Name, Category, Price, and Stock Quantity are required.");
      return;
    }
    if (Number(editingProduct.price) < 0 || Number(editingProduct.stock) < 0) {
      alert("Price and Stock must be non-negative numbers.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/products/${editingProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(editingProduct),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        alert("Product updated successfully!");
        setEditingProduct(null);
        fetchData();
      } else {
        alert(data.message || "Failed to update product.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        alert("Product deleted successfully.");
        fetchData();
      } else {
        alert(data.message || "Failed to delete product.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
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
        signal: AbortSignal.timeout(10000)
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
    setLoading(false);
    setAuthError("Session expired. Please login again.");
  };

  const filterByTimeframe = (data, timeframe) => {
    if (!data || !Array.isArray(data)) return [];
    if (!timeframe || timeframe === "all") return data;

    const now = new Date();
    let startDate = new Date();

    if (timeframe === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === "week") {
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    } else if (timeframe === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      return data;
    }

    return data.filter(item => {
      const dateVal = item.createdAt || item.joinedDate || item.bookingDate;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      return d >= startDate;
    });
  };

  const handleExportReport = (reportType, format) => {
    const timeframeText = {
      all: "All Time",
      today: "Today",
      week: "This Week",
      month: "This Month",
      year: "This Year"
    }[analyticsTimeframe] || "All Time";

    let headers = [];
    let rows = [];
    let title = "";
    
    if (reportType === "farmers") {
      title = "Farmer Summary Report";
      headers = ["Farmer ID", "Name", "Phone", "Village", "Crop Type", "Land Holding", "Status"];
      const filtered = filterByTimeframe(farmers, analyticsTimeframe);
      rows = filtered.map(f => [
        f.farmerId || "",
        f.name || "",
        f.phone || "",
        f.village || "",
        f.cropType || "",
        f.landHolding !== undefined ? `${f.landHolding} Acres` : "",
        f.status || "Active"
      ]);
    } else if (reportType === "products") {
      title = "Product Inventory Report";
      headers = ["Product ID", "Product Name", "Category", "Price", "Stock", "Status"];
      const filtered = filterByTimeframe(products, analyticsTimeframe);
      rows = filtered.map(p => [
        p.productId || "",
        p.name || "",
        p.category || "",
        p.price !== undefined ? `Rs. ${p.price}` : "",
        p.stock !== undefined ? `${p.stock}` : "",
        p.status || "In Stock"
      ]);
    } else if (reportType === "crops") {
      title = "Crop Requests Report";
      headers = ["Farmer Name", "Crop Name", "Quantity", "Expected Price", "Date"];
      const filtered = filterByTimeframe(crops, analyticsTimeframe);
      rows = filtered.map(c => [
        c.farmerName || "",
        c.cropName || "",
        c.quantity !== undefined ? `${c.quantity} Qtls` : "",
        c.price !== undefined ? `Rs. ${c.price}/Qtl` : "",
        c.createdAt ? (typeof c.createdAt === 'string' ? c.createdAt.substring(0, 10) : new Date(c.createdAt).toISOString().substring(0, 10)) : ""
      ]);
    } else if (reportType === "bookings") {
      title = "Equipment Booking Report";
      headers = ["Farmer Name", "Equipment", "Booking Date", "Status"];
      const filtered = filterByTimeframe(bookings, analyticsTimeframe);
      rows = filtered.map(b => [
        b.farmerName || "",
        b.equipmentName || "",
        b.bookingDate || (b.createdAt ? (typeof b.createdAt === 'string' ? b.createdAt.substring(0, 10) : new Date(b.createdAt).toISOString().substring(0, 10)) : ""),
        b.status || "Pending"
      ]);
    } else if (reportType === "contacts") {
      title = "Contact Requests Report";
      headers = ["Name", "Phone", "Subject", "Date"];
      const filtered = filterByTimeframe(contacts, analyticsTimeframe);
      rows = filtered.map(c => [
        c.fullName || c.name || "",
        c.phone || "",
        c.inquiryType || "General Inquiry",
        c.createdAt ? (typeof c.createdAt === 'string' ? c.createdAt.substring(0, 10) : new Date(c.createdAt).toISOString().substring(0, 10)) : ""
      ]);
    }

    if (format === "csv") {
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${reportType}_report_${analyticsTimeframe}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "excel") {
      const wb = XLSX.utils.book_new();
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      const colWidths = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));
      ws["!cols"] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 30));
      XLSX.writeFile(wb, `${reportType}_report_${analyticsTimeframe}.xlsx`);
    } else if (format === "pdf") {
      const doc = new jsPDF();
      const primaryColor = [13, 35, 21];
      const accentColor = [197, 168, 128];
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Kalludevakunta Farmers Producer Company Limited", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Official Administrative Report", 14, 25);
      
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.5);
      doc.line(14, 28, 196, 28);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(50, 50, 50);
      doc.text(title, 14, 38);
      
      const now = new Date();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 14, 44);
      doc.text(`Timeframe: ${timeframeText}`, 14, 48);
      
      doc.autoTable({
        startY: 53,
        head: [headers],
        body: rows,
        theme: "striped",
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold"
        },
        alternateRowStyles: {
          fillColor: [245, 248, 245]
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 2.5
        },
        margin: { top: 53, left: 14, right: 14 }
      });
      
      doc.save(`${reportType}_report_${analyticsTimeframe}.pdf`);
    }

    triggerSystemNotification(
      "Report Exported",
      `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported in ${format.toUpperCase()} format (${timeframeText}).`,
      "low"
    );
  };

  const exportFullFPOReport = (format) => {
    const timeframeText = {
      all: "All Time",
      today: "Today",
      week: "This Week",
      month: "This Month",
      year: "This Year"
    }[analyticsTimeframe] || "All Time";

    const filteredFarmers = filterByTimeframe(farmers, analyticsTimeframe);
    const filteredProducts = filterByTimeframe(products, analyticsTimeframe);
    const filteredCrops = filterByTimeframe(crops, analyticsTimeframe);
    const filteredBookings = filterByTimeframe(bookings, analyticsTimeframe);
    const filteredContacts = filterByTimeframe(contacts, analyticsTimeframe);

    const farmerHeaders = ["Farmer ID", "Name", "Phone", "Village", "Crop Type", "Land Holding", "Status"];
    const farmerRows = filteredFarmers.map(f => [
      f.farmerId || "",
      f.name || "",
      f.phone || "",
      f.village || "",
      f.cropType || "",
      f.landHolding !== undefined ? `${f.landHolding} Acres` : "",
      f.status || "Active"
    ]);

    const productHeaders = ["Product ID", "Product Name", "Category", "Price", "Stock", "Status"];
    const productRows = filteredProducts.map(p => [
      p.productId || "",
      p.name || "",
      p.category || "",
      p.price !== undefined ? `Rs. ${p.price}` : "",
      p.stock !== undefined ? `${p.stock}` : "",
      p.status || "In Stock"
    ]);

    const cropHeaders = ["Farmer Name", "Crop Name", "Quantity", "Expected Price", "Date"];
    const cropRows = filteredCrops.map(c => [
      c.farmerName || "",
      c.cropName || "",
      c.quantity !== undefined ? `${c.quantity} Qtls` : "",
      c.price !== undefined ? `Rs. ${c.price}/Qtl` : "",
      c.createdAt ? (typeof c.createdAt === 'string' ? c.createdAt.substring(0, 10) : new Date(c.createdAt).toISOString().substring(0, 10)) : ""
    ]);

    const bookingHeaders = ["Farmer Name", "Equipment", "Booking Date", "Status"];
    const bookingRows = filteredBookings.map(b => [
      b.farmerName || "",
      b.equipmentName || "",
      b.bookingDate || (b.createdAt ? (typeof b.createdAt === 'string' ? b.createdAt.substring(0, 10) : new Date(b.createdAt).toISOString().substring(0, 10)) : ""),
      b.status || "Pending"
    ]);

    const contactHeaders = ["Name", "Phone", "Subject", "Date"];
    const contactRows = filteredContacts.map(c => [
      c.fullName || c.name || "",
      c.phone || "",
      c.inquiryType || "General Inquiry",
      c.createdAt ? (typeof c.createdAt === 'string' ? c.createdAt.substring(0, 10) : new Date(c.createdAt).toISOString().substring(0, 10)) : ""
    ]);

    const analyticsHeaders = ["Overview Metric", "Value"];
    const analyticsRows = [
      ["Total Farmers", filteredFarmers.length],
      ["Total Products", filteredProducts.length],
      ["Crop Requests", filteredCrops.length],
      ["Equipment Bookings", filteredBookings.length],
      ["Contact Requests", filteredContacts.length],
      ["Products In Stock", filteredProducts.filter(p => p.status === "In Stock").length],
      ["Products Out of Stock", filteredProducts.filter(p => p.status === "Out of Stock").length]
    ];

    if (format === "excel") {
      const wb = XLSX.utils.book_new();

      const wsAnalytics = XLSX.utils.aoa_to_sheet([analyticsHeaders, ...analyticsRows]);
      wsAnalytics["!cols"] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsAnalytics, "Analytics");

      const wsFarmers = XLSX.utils.aoa_to_sheet([farmerHeaders, ...farmerRows]);
      wsFarmers["!cols"] = farmerHeaders.map(() => ({ wch: 15 }));
      XLSX.utils.book_append_sheet(wb, wsFarmers, "Farmers");

      const wsProducts = XLSX.utils.aoa_to_sheet([productHeaders, ...productRows]);
      wsProducts["!cols"] = productHeaders.map(() => ({ wch: 15 }));
      XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

      const wsCrops = XLSX.utils.aoa_to_sheet([cropHeaders, ...cropRows]);
      wsCrops["!cols"] = cropHeaders.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, wsCrops, "Crop Requests");

      const wsBookings = XLSX.utils.aoa_to_sheet([bookingHeaders, ...bookingRows]);
      wsBookings["!cols"] = bookingHeaders.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, wsBookings, "Bookings");

      const wsContacts = XLSX.utils.aoa_to_sheet([contactHeaders, ...contactRows]);
      wsContacts["!cols"] = contactHeaders.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, wsContacts, "Contacts");

      XLSX.writeFile(wb, `kdk_fpo_complete_report_${analyticsTimeframe}.xlsx`);
    } else if (format === "pdf") {
      const doc = new jsPDF();
      const primaryColor = [13, 35, 21];
      const accentColor = [197, 168, 128];
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Kalludevakunta Farmers Producer Company Limited", 14, 30);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Official Administrative Report - Complete Summary", 14, 38);
      
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(1);
      doc.line(14, 43, 196, 43);
      
      const now = new Date();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated Date: ${now.toLocaleDateString()}`, 14, 53);
      doc.text(`Generated Time: ${now.toLocaleTimeString()}`, 14, 59);
      doc.text(`Report Timeframe: ${timeframeText}`, 14, 65);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(50, 50, 50);
      doc.text("Analytics Overview Summary", 14, 80);
      
      const cardWidth = 34;
      const cardHeight = 22;
      const startY = 86;
      
      const cards = [
        { label: "Total Farmers", val: filteredFarmers.length },
        { label: "Total Products", val: filteredProducts.length },
        { label: "Crop Requests", val: filteredCrops.length },
        { label: "Total Bookings", val: filteredBookings.length },
        { label: "Total Contacts", val: filteredContacts.length }
      ];
      
      cards.forEach((card, index) => {
        const x = 14 + (index * (cardWidth + 2));
        doc.setFillColor(245, 248, 245);
        doc.setDrawColor(210, 220, 210);
        doc.rect(x, startY, cardWidth, cardHeight, "FD");
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text(card.label, x + 3, startY + 7);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(String(card.val), x + 3, startY + 16);
      });
      
      doc.addPage();
      let currentY = 25;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 35, 21);
      doc.text("1. Registered Farmers List", 14, currentY);
      
      doc.autoTable({
        startY: currentY + 4,
        head: [farmerHeaders],
        body: farmerRows,
        theme: "striped",
        headStyles: { fillColor: primaryColor, fontSize: 8 },
        styles: { fontSize: 7.5 },
        margin: { left: 14, right: 14 }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 35, 21);
      doc.text("2. Product Inventory List", 14, currentY);
      
      doc.autoTable({
        startY: currentY + 4,
        head: [productHeaders],
        body: productRows,
        theme: "striped",
        headStyles: { fillColor: primaryColor, fontSize: 8 },
        styles: { fontSize: 7.5 },
        margin: { left: 14, right: 14 }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 35, 21);
      doc.text("3. Crop Selling Requests", 14, currentY);
      
      doc.autoTable({
        startY: currentY + 4,
        head: [cropHeaders],
        body: cropRows,
        theme: "striped",
        headStyles: { fillColor: primaryColor, fontSize: 8 },
        styles: { fontSize: 7.5 },
        margin: { left: 14, right: 14 }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 35, 21);
      doc.text("4. Machinery Booking Requests", 14, currentY);
      
      doc.autoTable({
        startY: currentY + 4,
        head: [bookingHeaders],
        body: bookingRows,
        theme: "striped",
        headStyles: { fillColor: primaryColor, fontSize: 8 },
        styles: { fontSize: 7.5 },
        margin: { left: 14, right: 14 }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 35, 21);
      doc.text("5. Contact Inquiries", 14, currentY);
      
      doc.autoTable({
        startY: currentY + 4,
        head: [contactHeaders],
        body: contactRows,
        theme: "striped",
        headStyles: { fillColor: primaryColor, fontSize: 8 },
        styles: { fontSize: 7.5 },
        margin: { left: 14, right: 14 }
      });
      
    }

    triggerSystemNotification(
      "Full Report Exported",
      `Complete FPO Admin Report was exported in ${format.toUpperCase()} format (${timeframeText}).`,
      "medium"
    );
  };

  // ── Notification Action Handlers ──
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PUT",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/notifications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
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
    } else if (type === "farmers") {
      headers = ["Farmer ID", "Name", "Phone", "Village", "Mandal", "District", "Crop Type", "Land Holding", "Status", "Joined Date"];
      rows = dataList.map(item => [
        item.farmerId || "",
        item.name || "",
        item.phone || "",
        item.village || "",
        item.mandal || "",
        item.district || "",
        item.cropType || "",
        item.landHolding || 0,
        item.status || "Active",
        item.joinedDate ? item.joinedDate.substring(0, 10) : (item.createdAt ? item.createdAt.substring(0, 10) : "")
      ]);
    } else if (type === "products") {
      headers = ["Product ID", "Product Name", "Category", "Price", "Stock", "Status", "Created Date"];
      rows = dataList.map(item => [
        item.productId || "",
        item.name || "",
        item.category || "",
        item.price || 0,
        item.stock || 0,
        item.status || "In Stock",
        item.createdAt ? item.createdAt.substring(0, 10) : ""
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

  const getFarmerGrowthChartData = () => {
    const labels = monthlyAnalytics.map(d => d.month);
    const data = monthlyAnalytics.map(d => d.farmers);

    return {
      labels,
      datasets: [
        {
          label: "Farmers Registered",
          data,
          borderColor: "#2e7d32",
          backgroundColor: "rgba(46, 125, 50, 0.08)",
          tension: 0.3,
          fill: true
        }
      ]
    };
  };

  const getProductCategoryChartData = () => {
    const labels = categoryAnalytics.map(c => c.category);
    const data = categoryAnalytics.map(c => c.count);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ["#2e7d32", "#e65100", "#0288d1", "#7b1fa2", "#fbc02d", "#c2185b"],
          borderWidth: 1
        }
      ]
    };
  };

  const getBookingTrendChartData = () => {
    const labels = monthlyAnalytics.map(d => d.month);
    const data = monthlyAnalytics.map(d => d.bookings);

    return {
      labels,
      datasets: [
        {
          label: "Machinery Bookings",
          data,
          backgroundColor: "#0288d1",
          borderRadius: 6
        }
      ]
    };
  };

  const getInventoryStatusChartData = () => {
    const inStock = analyticsStats?.inStockProducts || 0;
    const outOfStock = analyticsStats?.outOfStockProducts || 0;

    return {
      labels: ["In Stock", "Out Of Stock"],
      datasets: [
        {
          data: [inStock, outOfStock],
          backgroundColor: ["#2e7d32", "#d32f2f"],
          borderWidth: 1
        }
      ]
    };
  };

  const getChartOptions = (title) => {
    const isLight = theme === "light";
    const textColor = isLight ? "#2e3b2e" : "#e0e7e1";
    const gridColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: "Inter", size: 11 } }
        },
        title: {
          display: !!title,
          text: title,
          color: textColor,
          font: { family: "Inter", size: 14, weight: "bold" }
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
    };
  };

  const getPieOptions = (title) => {
    const isLight = theme === "light";
    const textColor = isLight ? "#2e3b2e" : "#e0e7e1";

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: textColor, font: { family: "Inter", size: 11 } }
        },
        title: {
          display: !!title,
          text: title,
          color: textColor,
          font: { family: "Inter", size: 14, weight: "bold" }
        }
      }
    };
  };

  const exportAnalytics = (format) => {
    if (format === "pdf") {
      window.print();
      triggerSystemNotification(
        "Analytics Exported",
        `Reports & Analytics summary printed/saved as PDF.`,
        "low"
      );
      return;
    }

    const rows = [
      ["Total Farmers", analyticsStats?.totalFarmers || 0],
      ["Total Products", analyticsStats?.totalProducts || 0],
      ["Crop Requests", analyticsStats?.totalCropRequests || 0],
      ["Equipment Bookings", analyticsStats?.totalBookings || 0],
      ["Contact Requests", analyticsStats?.totalContacts || 0],
      ["Products In Stock", analyticsStats?.inStockProducts || 0],
      ["Products Out of Stock", analyticsStats?.outOfStockProducts || 0]
    ];

    const delimiter = format === "excel" ? "\t" : ",";
    const extension = format === "excel" ? "xls" : "csv";

    let content = `Kalludevakunta FPO Reports & Analytics Export${delimiter}Timeframe: ${analyticsTimeframe.toUpperCase()}\n\n`;
    content += `OVERVIEW METRICS\n`;
    content += `Metric${delimiter}Value\n`;
    rows.forEach(r => {
      content += `"${r[0]}"${delimiter}${r[1]}\n`;
    });

    content += `\nMONTHLY TRENDS\n`;
    content += `Month${delimiter}Farmers Registered${delimiter}Products Added${delimiter}Machinery Bookings\n`;
    monthlyAnalytics.forEach(m => {
      content += `"${m.month}"${delimiter}${m.farmers}${delimiter}${m.products}${delimiter}${m.bookings}\n`;
    });

    content += `\nPRODUCT CATEGORY DISTRIBUTION\n`;
    content += `Category${delimiter}Product Count\n`;
    categoryAnalytics.forEach(c => {
      content += `"${c.category}"${delimiter}${c.count}\n`;
    });

    const blob = new Blob([content], { type: format === "excel" ? "application/vnd.ms-excel;charset=utf-8;" : "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fpo_analytics_report_${analyticsTimeframe}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerSystemNotification(
      "Analytics Exported",
      `Reports & Analytics summary exported in ${format.toUpperCase()} format.`,
      "low"
    );
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

  const filteredFarmers = farmers.filter(f => {
    const term = searchFarmer.toLowerCase();
    return (
      (f.farmerId || "").toLowerCase().includes(term) ||
      (f.name || "").toLowerCase().includes(term) ||
      (f.phone || "").includes(term) ||
      (f.village || "").toLowerCase().includes(term)
    );
  });

  const filteredProducts = products.filter(p => {
    const term = searchProduct.toLowerCase();
    return (
      (p.productId || "").toLowerCase().includes(term) ||
      (p.name || "").toLowerCase().includes(term) ||
      (p.category || "").toLowerCase().includes(term)
    );
  });

  // ── Farmers Stats Calculations ──
  const totalFarmersCount = farmers.length;
  const uniqueVillagesCount = [...new Set(farmers.map(f => f.village?.trim()).filter(Boolean))].length;
  const totalLandHoldingSum = farmers.reduce((sum, f) => sum + (Number(f.landHolding) || 0), 0);
  const activeFarmersCount = farmers.filter(f => f.status === "Active").length;

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

          <button 
            className={`nav-item ${activeTab === "farmers" ? "active" : ""}`}
            onClick={() => { setActiveTab("farmers"); setMobileMenuOpen(false); }}
          >
            <Users size={18} />
            <span>Farmers</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => { setActiveTab("products"); setMobileMenuOpen(false); }}
          >
            <Package size={18} />
            <span>Products</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => { setActiveTab("reports"); setMobileMenuOpen(false); }}
          >
            <FileText size={18} />
            <span>Reports</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => { setActiveTab("notifications"); setMobileMenuOpen(false); }}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
          >
            <Settings size={18} />
            <span>Settings</span>
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
              {activeTab === "farmers" && "Farmer Management"}
              {activeTab === "products" && "Product Inventory"}
              {activeTab === "reports" && "Report Generator Dashboard"}
              {activeTab === "notifications" && "Notification Center"}
              {activeTab === "settings" && "System Settings"}
            </h1>
          </div>

          <div className="header-right">
            {/* Notification Bell & Dropdown */}
            <div className="notifications-bell-wrapper" style={{ position: "relative" }}>
              <button 
                className={`header-bell-btn ${showNotificationDropdown ? "active" : ""}`}
                title="Notifications"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "var(--admin-text-primary)",
                  padding: "8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "all 0.2s ease"
                }}
              >
                <Bell size={16} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="bell-badge" style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "#ff5252",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "bold",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {notifications.filter(n => !n.isRead).length > 99 ? "99+" : notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="bell-dropdown glass-panel" style={{
                  position: "absolute",
                  top: "40px",
                  right: "0",
                  width: "300px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  zIndex: 1000,
                  padding: "12px",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--admin-border-color)",
                  background: "rgba(13, 35, 21, 0.95)"
                }}>
                  <div className="dropdown-header" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--admin-border-color)",
                    paddingBottom: "8px",
                    marginBottom: "8px"
                  }}>
                    <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--admin-text-primary)" }}>Recent Notifications</span>
                    <button 
                      onClick={() => { markAllAsRead(); setShowNotificationDropdown(false); }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--admin-accent-green)",
                        fontSize: "11px",
                        cursor: "pointer",
                        fontWeight: "600"
                      }}
                    >
                      Mark All Read
                    </button>
                  </div>

                  <div className="dropdown-body" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "var(--admin-text-muted)", fontSize: "12px" }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map(n => {
                        const dateStr = getRelativeTime(n.createdAt);
                        return (
                          <div 
                            key={n._id} 
                            onClick={() => { markAsRead(n._id); }}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              background: n.isRead ? "rgba(255, 255, 255, 0.02)" : "rgba(76, 175, 80, 0.08)",
                              borderLeft: n.isRead ? "3px solid transparent" : "3px solid var(--admin-accent-green)",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              position: "relative"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                              <span style={{ fontWeight: "600", fontSize: "12px", color: "var(--admin-text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span className={`priority-dot ${n.priority || "medium"}`} style={{
                                  display: "inline-block",
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  backgroundColor: n.priority === "high" ? "#ff5252" : n.priority === "medium" ? "#ffb300" : "#29b6f6"
                                }}></span>
                                {n.title}
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--admin-text-muted)" }}>{dateStr}</span>
                            </div>
                            <p style={{ fontSize: "11px", color: "var(--admin-text-secondary)", margin: 0, paddingRight: "10px" }}>{n.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="dropdown-footer" style={{
                    borderTop: "1px solid var(--admin-border-color)",
                    paddingTop: "8px",
                    marginTop: "8px",
                    textAlign: "center"
                  }}>
                    <button 
                      onClick={() => { setActiveTab("notifications"); setShowNotificationDropdown(false); }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--admin-text-primary)",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        width: "100%"
                      }}
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

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

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("farmers")}>
                      <div className="card-top">
                        <div className="icon-wrapper orange" style={{ background: "rgba(230, 81, 0, 0.15)", color: "var(--admin-accent-orange)" }}>
                          <Users size={22} />
                        </div>
                        <span className="trend-badge positive">Members</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{farmers.length}</h3>
                        <p>FPO Farmers</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("products")}>
                      <div className="card-top">
                        <div className="icon-wrapper green" style={{ background: "rgba(46, 125, 50, 0.15)", color: "var(--admin-accent-green)" }}>
                          <Package size={22} />
                        </div>
                        <span className="trend-badge positive">Inventory</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{products.length}</h3>
                        <p>Products</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("settings")}>
                      <div className="card-top">
                        <div className="icon-wrapper blue" style={{ background: "rgba(2, 136, 209, 0.15)", color: "var(--admin-accent-blue)" }}>
                          <Send size={22} />
                        </div>
                        <span className={`trend-badge ${telegramStatus?.connected ? "positive" : "negative"}`}>
                          {telegramStatus?.connected ? "Connected" : "Disconnected"}
                        </span>
                      </div>
                      <div className="card-bottom">
                        <h3>Telegram</h3>
                        <p style={{ fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Last Sent: {telegramStatus?.lastNotificationSent ? getRelativeTime(telegramStatus.lastNotificationSent) : "Never"}
                        </p>
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

              {/* 5. Farmers Tab */}
              {activeTab === "farmers" && (
                <div className="tab-pane">
                  {/* Farmer Stats Cards */}
                  <div className="metrics-grid">
                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <Users size={22} />
                        </div>
                        <span className="trend-badge positive">Total</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{totalFarmersCount}</h3>
                        <p>Total Farmers</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper blue">
                          <Sun size={22} />
                        </div>
                        <span className="trend-badge positive">Villages</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{uniqueVillagesCount}</h3>
                        <p>Total Villages</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper orange">
                          <Sprout size={22} />
                        </div>
                        <span className="trend-badge positive">Acres</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{totalLandHoldingSum.toFixed(1)}</h3>
                        <p>Total Land (Acres)</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <Lock size={22} />
                        </div>
                        <span className="trend-badge positive">Active</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{activeFarmersCount}</h3>
                        <p>Active Farmers</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pane-header-actions">
                    <div className="search-bar-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search Farmer by Name, Phone, Village or ID..." 
                        value={searchFarmer}
                        onChange={(e) => setSearchFarmer(e.target.value)}
                      />
                    </div>
                    <div className="button-actions-group" style={{ display: "flex", gap: "12px" }}>
                      <button className="btn-action primary" onClick={() => setShowFarmerModal(true)}>
                        <span>+ Add Farmer</span>
                      </button>
                      <button className="btn-action outline" onClick={() => exportCSV("farmers", filteredFarmers)}>
                        <Download size={15} />
                        <span>Export Farmers CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Farmers Table */}
                  <div className="table-responsive-container glass-panel">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Farmer ID</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Village</th>
                          <th>Crop Type</th>
                          <th>Land Holding</th>
                          <th>Status</th>
                          <th>Joined Date</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFarmers.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="empty-message">No farmers match your search criteria.</td>
                          </tr>
                        ) : (
                          filteredFarmers.map(f => {
                            const dateStr = f.joinedDate ? f.joinedDate.substring(0, 10) : (f.createdAt ? f.createdAt.substring(0, 10) : "");
                            return (
                              <tr key={f._id}>
                                <td className="font-semibold" data-label="Farmer ID">{f.farmerId}</td>
                                <td data-label="Name">{f.name}</td>
                                <td data-label="Phone">{f.phone}</td>
                                <td data-label="Village">{f.village}</td>
                                <td data-label="Crop Type">{f.cropType || "N/A"}</td>
                                <td data-label="Land Holding">{f.landHolding ? `${f.landHolding} Acres` : "N/A"}</td>
                                <td data-label="Status">
                                  <span className={`status-pill ${String(f.status || "Active").toLowerCase()}`}>
                                    {f.status || "Active"}
                                  </span>
                                </td>
                                <td data-label="Joined Date">{dateStr}</td>
                                <td className="text-right" data-label="Actions">
                                  <div className="action-button-group">
                                    <button 
                                      className="action-btn view" 
                                      title="View Details"
                                      onClick={() => setViewingFarmer(f)}
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button 
                                      className="action-btn edit" 
                                      title="Edit Record"
                                      onClick={() => setEditingFarmer(f)}
                                    >
                                      <RefreshCw size={15} />
                                    </button>
                                    <button 
                                      className="action-btn delete" 
                                      title="Delete Farmer"
                                      onClick={() => handleFarmerDelete(f._id)}
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

              {/* 6. Products Tab */}
              {activeTab === "products" && (
                <div className="tab-pane">
                  {/* Product Stats Cards */}
                  <div className="metrics-grid">
                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <Package size={22} />
                        </div>
                        <span className="trend-badge positive">Total</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{products.length}</h3>
                        <p>Total Products</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper blue">
                          <LayoutDashboard size={22} />
                        </div>
                        <span className="trend-badge positive">Categories</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{[...new Set(products.map(p => p.category?.trim()).filter(Boolean))].length}</h3>
                        <p>Total Categories</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <Sprout size={22} />
                        </div>
                        <span className="trend-badge positive">In Stock</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{products.filter(p => p.status === "In Stock").length}</h3>
                        <p>In Stock</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper orange">
                          <X size={22} />
                        </div>
                        <span className="trend-badge negative">Out Of Stock</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{products.filter(p => p.status === "Out of Stock").length}</h3>
                        <p>Out of Stock</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pane-header-actions">
                    <div className="search-bar-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search products by name, category or ID..." 
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                      />
                    </div>
                    <div className="button-actions-group" style={{ display: "flex", gap: "12px" }}>
                      <button className="btn-action primary" onClick={() => setShowProductModal(true)}>
                        <span>+ Add Product</span>
                      </button>
                      <button className="btn-action outline" onClick={() => exportCSV("products", filteredProducts)}>
                        <Download size={15} />
                        <span>Export Products CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="table-responsive-container glass-panel">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Product ID</th>
                          <th>Product Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                          <th>Created Date</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="empty-message">No products match your search.</td>
                          </tr>
                        ) : (
                          filteredProducts.map(p => {
                            const dateStr = p.createdAt ? p.createdAt.substring(0, 10) : "";
                            const statusClass = String(p.status || "In Stock").toLowerCase().replace(/\s+/g, "-");
                            return (
                              <tr key={p._id}>
                                <td className="font-semibold" data-label="Product ID">{p.productId}</td>
                                <td data-label="Product Name">{p.name}</td>
                                <td data-label="Category">{p.category}</td>
                                <td data-label="Price">₹{p.price}</td>
                                <td data-label="Stock">{p.stock} {p.unit || ""}</td>
                                <td data-label="Status">
                                  <span className={`status-pill ${statusClass}`}>
                                    {p.status || "In Stock"}
                                  </span>
                                </td>
                                <td data-label="Created Date">{dateStr}</td>
                                <td className="text-right" data-label="Actions">
                                  <div className="action-button-group">
                                    <button 
                                      className="action-btn view" 
                                      title="View Product Details"
                                      onClick={() => setViewingProduct(p)}
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button 
                                      className="action-btn edit" 
                                      title="Edit Product"
                                      onClick={() => setEditingProduct(p)}
                                    >
                                      <RefreshCw size={15} />
                                    </button>
                                    <button 
                                      className="action-btn delete" 
                                      title="Delete Product"
                                      onClick={() => handleProductDelete(p._id)}
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

              {/* 7. Reports & Analytics Tab */}
              {activeTab === "reports" && (
                <div className="tab-pane">
                  {/* Toolbar with Timeframe Filter */}
                  <div className="pane-header-actions" style={{ marginBottom: "20px" }}>
                    <div className="search-bar-wrapper" style={{ minWidth: "220px" }}>
                      <span style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginRight: "8px", fontWeight: "600" }}>Timeframe Filter:</span>
                      <select 
                        value={analyticsTimeframe}
                        onChange={(e) => setAnalyticsTimeframe(e.target.value)}
                        style={{ 
                          background: "transparent", 
                          border: "none", 
                          color: "var(--admin-text-primary)", 
                          outline: "none", 
                          cursor: "pointer", 
                          fontSize: "14px", 
                          fontWeight: "600",
                          width: "120px"
                        }}
                      >
                        <option value="all" style={{ background: "#0d2315", color: "#fff" }}>All Time</option>
                        <option value="today" style={{ background: "#0d2315", color: "#fff" }}>Today</option>
                        <option value="week" style={{ background: "#0d2315", color: "#fff" }}>This Week</option>
                        <option value="month" style={{ background: "#0d2315", color: "#fff" }}>This Month</option>
                        <option value="year" style={{ background: "#0d2315", color: "#fff" }}>This Year</option>
                      </select>
                    </div>
                  </div>

                  {/* Reports Overview Cards Grid */}
                  <div className="metrics-grid" style={{ marginBottom: "24px" }}>
                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper orange">
                          <Users size={22} />
                        </div>
                        <span className="trend-badge positive">Farmers</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalFarmers || 0}</h3>
                        <p>Total Farmers</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <Package size={22} />
                        </div>
                        <span className="trend-badge positive">Products</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalProducts || 0}</h3>
                        <p>Total Products</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper orange">
                          <Sprout size={22} />
                        </div>
                        <span className="trend-badge positive">Crops</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalCropRequests || 0}</h3>
                        <p>Crop Requests</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper blue">
                          <Tractor size={22} />
                        </div>
                        <span className="trend-badge positive">Rentals</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalBookings || 0}</h3>
                        <p>Equipment Bookings</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <MessageSquare size={22} />
                        </div>
                        <span className="trend-badge positive">Contacts</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalContacts || 0}</h3>
                        <p>Contact Requests</p>
                      </div>
                    </div>
                  </div>

                  {/* Report Generator Panel */}
                  <div className="report-generator-section" style={{ marginBottom: "30px" }}>
                    <h2 className="section-title" style={{ fontSize: "18px", color: "var(--admin-text-primary)", marginBottom: "16px", fontWeight: "600", borderBottom: "1px solid var(--admin-border-color)", paddingBottom: "8px" }}>Report Generator Dashboard</h2>
                    
                    {/* Complete FPO Report Card (Full Width) */}
                    <div className="report-card full-width glass-panel" style={{ padding: "20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                      <div>
                        <h3 style={{ fontSize: "16px", color: "var(--admin-accent-green)", fontWeight: "600", marginBottom: "4px" }}>Kalludevakunta FPO Complete Report</h3>
                        <p style={{ fontSize: "13px", color: "var(--admin-text-secondary)" }}>Generates a comprehensive audit report containing overall analytics, farmer registry, product inventory, crop requests, equipment bookings, and contact inquiries.</p>
                      </div>
                      <div className="action-buttons" style={{ display: "flex", gap: "10px" }}>
                        <button className="btn-action primary" onClick={() => exportFullFPOReport("pdf")}>
                          <Download size={14} />
                          <span>Export PDF</span>
                        </button>
                        <button className="btn-action outline" onClick={() => exportFullFPOReport("excel")}>
                          <Download size={14} />
                          <span>Export Excel</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Individual Report Cards Grid */}
                    <div className="report-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                      {/* 1. Farmers */}
                      <div className="report-card glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h4 style={{ fontSize: "15px", color: "var(--admin-text-primary)", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Users size={16} style={{ color: "var(--admin-accent-green)" }} />
                            <span>Farmer Summary Report</span>
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginBottom: "15px" }}>List of FPO registered member farmers with land holdings, villages, crops, and status.</p>
                        </div>
                        <div className="action-buttons-stack" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button className="btn-action small pdf" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("farmers", "pdf")}>PDF</button>
                          <button className="btn-action small excel" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("farmers", "excel")}>Excel</button>
                          <button className="btn-action small csv" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("farmers", "csv")}>CSV</button>
                        </div>
                      </div>

                      {/* 2. Products */}
                      <div className="report-card glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h4 style={{ fontSize: "15px", color: "var(--admin-text-primary)", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Package size={16} style={{ color: "var(--admin-accent-green)" }} />
                            <span>Product Inventory Report</span>
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginBottom: "15px" }}>Detailed stock report containing inventory item categories, pricing, stock quantities, and availability.</p>
                        </div>
                        <div className="action-buttons-stack" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button className="btn-action small pdf" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("products", "pdf")}>PDF</button>
                          <button className="btn-action small excel" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("products", "excel")}>Excel</button>
                          <button className="btn-action small csv" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("products", "csv")}>CSV</button>
                        </div>
                      </div>

                      {/* 3. Crop Requests */}
                      <div className="report-card glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h4 style={{ fontSize: "15px", color: "var(--admin-text-primary)", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Sprout size={16} style={{ color: "var(--admin-accent-green)" }} />
                            <span>Crop Requests Report</span>
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginBottom: "15px" }}>Listing of selling requests submitted by farmers, including crop varieties, quantities, and expected prices.</p>
                        </div>
                        <div className="action-buttons-stack" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button className="btn-action small pdf" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("crops", "pdf")}>PDF</button>
                          <button className="btn-action small excel" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("crops", "excel")}>Excel</button>
                          <button className="btn-action small csv" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("crops", "csv")}>CSV</button>
                        </div>
                      </div>

                      {/* 4. Equipment Bookings */}
                      <div className="report-card glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h4 style={{ fontSize: "15px", color: "var(--admin-text-primary)", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Tractor size={16} style={{ color: "var(--admin-accent-green)" }} />
                            <span>Equipment Booking Report</span>
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginBottom: "15px" }}>Log of custom hiring machinery bookings showing farmer names, machinery name, booking date, and status.</p>
                        </div>
                        <div className="action-buttons-stack" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button className="btn-action small pdf" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("bookings", "pdf")}>PDF</button>
                          <button className="btn-action small excel" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("bookings", "excel")}>Excel</button>
                          <button className="btn-action small csv" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("bookings", "csv")}>CSV</button>
                        </div>
                      </div>

                      {/* 5. Contact Inquiries */}
                      <div className="report-card glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h4 style={{ fontSize: "15px", color: "var(--admin-text-primary)", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <MessageSquare size={16} style={{ color: "var(--admin-accent-green)" }} />
                            <span>Contact Requests Report</span>
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginBottom: "15px" }}>Visitor feedback and general query logs containing contact names, phone numbers, and inquiry types.</p>
                        </div>
                        <div className="action-buttons-stack" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button className="btn-action small pdf" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("contacts", "pdf")}>PDF</button>
                          <button className="btn-action small excel" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("contacts", "excel")}>Excel</button>
                          <button className="btn-action small csv" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("contacts", "csv")}>CSV</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="charts-grid-analytics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                    <div className="chart-wrapper glass-panel" style={{ height: "300px", padding: "16px" }}>
                      <Line data={getFarmerGrowthChartData()} options={getChartOptions("Farmers Registered Per Month")} />
                    </div>
                    <div className="chart-wrapper glass-panel" style={{ height: "300px", padding: "16px" }}>
                      <Bar data={getBookingTrendChartData()} options={getChartOptions("Equipment Bookings Per Month")} />
                    </div>
                    <div className="chart-wrapper glass-panel" style={{ height: "300px", padding: "16px" }}>
                      <Pie data={getProductCategoryChartData()} options={getPieOptions("Product Category Distribution")} />
                    </div>
                    <div className="chart-wrapper glass-panel" style={{ height: "300px", padding: "16px" }}>
                      <Doughnut data={getInventoryStatusChartData()} options={getPieOptions("Inventory Status")} />
                    </div>
                  </div>

                  {/* Analytics Insights Grid */}
                  <div className="analytics-insights-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                    {/* Active Inventory */}
                    <div className="glass-panel" style={{ padding: "20px" }}>
                      <h4 style={{ color: "var(--admin-accent-green)", borderBottom: "1px solid var(--admin-border-color)", paddingBottom: "10px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Package size={18} />
                        <span>Active Inventory</span>
                      </h4>
                      <p style={{ fontSize: "13px", color: "var(--admin-text-secondary)", marginBottom: "12px" }}>
                        Total active products currently in stock: <strong style={{ color: "var(--admin-text-primary)" }}>{analyticsStats?.inStockProducts || 0}</strong>
                      </p>
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {products.filter(p => p.status === "In Stock").slice(0, 4).map(p => (
                          <li key={p._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed rgba(255,255,255,0.06)", fontSize: "13px" }}>
                            <span>{p.name}</span>
                            <span style={{ fontWeight: "600", color: "var(--admin-accent-orange)" }}>{p.stock} {p.unit || "units"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Inventory Alerts */}
                    <div className="glass-panel" style={{ padding: "20px" }}>
                      <h4 style={{ color: "#ff5252", borderBottom: "1px solid var(--admin-border-color)", paddingBottom: "10px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <X size={18} />
                        <span>Inventory Alerts</span>
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ background: "rgba(211, 47, 47, 0.08)", border: "1px solid rgba(211,47,47,0.15)", padding: "10px", borderRadius: "8px" }}>
                          <span style={{ fontSize: "12px", color: "#ff8a80", display: "block", fontWeight: "600" }}>Out of Stock Products:</span>
                          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#ff5252" }}>{analyticsStats?.outOfStockProducts || 0}</span>
                        </div>
                        <div style={{ background: "rgba(230, 81, 0, 0.08)", border: "1px solid rgba(230,81,0,0.15)", padding: "10px", borderRadius: "8px" }}>
                          <span style={{ fontSize: "12px", color: "var(--admin-accent-orange)", display: "block", fontWeight: "600" }}>Low Stock Products (&le; 5 units):</span>
                          <span style={{ fontSize: "20px", fontWeight: "bold", color: "var(--admin-accent-orange)" }}>
                            {products.filter(p => p.stock > 0 && p.stock <= 5).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Farmer Insights */}
                    <div className="glass-panel" style={{ padding: "20px" }}>
                      <h4 style={{ color: "var(--admin-accent-blue)", borderBottom: "1px solid var(--admin-border-color)", paddingBottom: "10px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Users size={18} />
                        <span>Farmer Insights</span>
                      </h4>
                      <p style={{ fontSize: "13px", color: "var(--admin-text-secondary)", marginBottom: "12px" }}>
                        FPO registered farmers overview.
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "12px" }}>
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Total Members</span>
                          <h3 style={{ fontSize: "24px", color: "var(--admin-text-primary)", margin: "4px 0" }}>{analyticsStats?.totalFarmers || 0}</h3>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Latest Month</span>
                          <h3 style={{ fontSize: "24px", color: "var(--admin-accent-green)", margin: "4px 0" }}>
                            {monthlyAnalytics.length > 0 ? monthlyAnalytics[monthlyAnalytics.length - 1].farmers : 0}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. Notification Center Tab */}
              {activeTab === "notifications" && (
                <div className="tab-pane">
                  {/* Notification Counters */}
                  <div className="metrics-grid" style={{ marginBottom: "24px" }}>
                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper red">
                          <Bell size={22} />
                        </div>
                        <span className="trend-badge negative">Attention</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{notifications.filter(n => !n.isRead).length}</h3>
                        <p>Unread Notifications</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <Bell size={22} />
                        </div>
                        <span className="trend-badge positive">All Alerts</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{notifications.length}</h3>
                        <p>Total Notifications</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper blue">
                          <Bell size={22} />
                        </div>
                        <span className="trend-badge positive">Today</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{notifications.filter(n => n.createdAt && new Date(n.createdAt).toDateString() === new Date().toDateString()).length}</h3>
                        <p>Today's Notifications</p>
                      </div>
                    </div>
                  </div>

                  {/* Toolbar & Filters */}
                  <div className="pane-header-actions" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                    <div className="filters-group" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {["all", "farmer", "crop", "booking", "contact", "inventory", "system"].map(type => (
                        <button
                          key={type}
                          className={`btn-action small ${notificationFilter === type ? "primary" : "outline"}`}
                          onClick={() => setNotificationFilter(type)}
                          style={{ textTransform: "capitalize" }}
                        >
                          {type === "all" ? "All" : type === "crop" ? "Crops" : type === "booking" ? "Bookings" : type === "contact" ? "Contacts" : type}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <div className="search-bar-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search notification text..."
                          className="search-input"
                          value={notificationSearch}
                          onChange={(e) => setNotificationSearch(e.target.value)}
                        />
                      </div>
                      
                      <button className="btn-action primary" onClick={markAllAsRead} disabled={notifications.filter(n => !n.isRead).length === 0}>
                        Mark All Read
                      </button>
                      <button className="btn-action danger" onClick={clearAllNotifications} disabled={notifications.length === 0}>
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Notification List */}
                  <div className="notifications-list-wrapper glass-panel" style={{ padding: "20px", borderRadius: "12px", minHeight: "300px" }}>
                    {(() => {
                      const filtered = notifications.filter(n => {
                        const matchesType = notificationFilter === "all" || n.type === notificationFilter;
                        const matchesSearch = !notificationSearch || 
                          (n.title && n.title.toLowerCase().includes(notificationSearch.toLowerCase())) ||
                          (n.message && n.message.toLowerCase().includes(notificationSearch.toLowerCase()));
                        return matchesType && matchesSearch;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--admin-text-muted)" }}>
                            No notifications match your selection.
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {filtered.map(n => {
                            const dateStr = getRelativeTime(n.createdAt);
                            return (
                              <div
                                key={n._id}
                                className={`notification-item-card ${n.isRead ? "read" : "unread"}`}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "16px",
                                  borderRadius: "8px",
                                  background: n.isRead ? "rgba(255, 255, 255, 0.02)" : "rgba(76, 175, 80, 0.05)",
                                  borderLeft: n.isRead ? "4px solid transparent" : "4px solid var(--admin-accent-green)",
                                  border: "1px solid var(--admin-border-color)",
                                  transition: "all 0.2s ease",
                                  flexWrap: "wrap",
                                  gap: "10px"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: "1 1 300px" }}>
                                  <div className="notification-icon-indicator" style={{ marginTop: "2px" }}>
                                    {n.type === "farmer" && <Users size={18} style={{ color: "var(--admin-accent-green)" }} />}
                                    {n.type === "crop" && <Sprout size={18} style={{ color: "var(--admin-accent-green)" }} />}
                                    {n.type === "booking" && <Tractor size={18} style={{ color: "var(--admin-accent-green)" }} />}
                                    {n.type === "contact" && <MessageSquare size={18} style={{ color: "var(--admin-accent-green)" }} />}
                                    {n.type === "inventory" && <Package size={18} style={{ color: "#ff8a80" }} />}
                                    {n.type === "system" && <Bell size={18} style={{ color: "var(--admin-text-muted)" }} />}
                                  </div>
                                  <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                      <h4 style={{ fontSize: "14px", fontWeight: "600", margin: "0", color: "var(--admin-text-primary)" }}>{n.title}</h4>
                                      <span className={`priority-badge ${n.priority || "medium"}`} style={{
                                        fontSize: "9px",
                                        fontWeight: "700",
                                        textTransform: "uppercase",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        color: n.priority === "medium" ? "#0d2315" : "#ffffff",
                                        backgroundColor: n.priority === "high" ? "#ff5252" : n.priority === "medium" ? "#ffb300" : "#29b6f6"
                                      }}>{n.priority || "medium"}</span>
                                    </div>
                                    <p style={{ fontSize: "13px", color: "var(--admin-text-secondary)", margin: "0 0 6px 0" }}>{n.message}</p>
                                    <span style={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>{dateStr}</span>
                                  </div>
                                </div>
                                
                                <div className="action-button-group" style={{ display: "flex", gap: "8px" }}>
                                  {!n.isRead && (
                                    <button 
                                      className="btn-action small excel" 
                                      onClick={() => markAsRead(n._id)}
                                      style={{ padding: "6px 12px", minHeight: "auto" }}
                                    >
                                      Mark Read
                                    </button>
                                  )}
                                  <button 
                                    className="btn-action small pdf" 
                                    onClick={() => deleteNotification(n._id)}
                                    style={{ padding: "6px 12px", minHeight: "auto" }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 9. Settings Tab */}
              {activeTab === "settings" && (
                <div className="tab-pane">
                  <div className="settings-container glass-panel" style={{ padding: "30px", borderRadius: "16px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px", color: "var(--admin-text-primary)" }}>System Settings</h2>
                    
                    <div className="settings-section" style={{ borderBottom: "1px solid var(--admin-border-color)", paddingBottom: "24px", marginBottom: "24px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "var(--admin-accent-orange)" }}>Notification Preferences</h3>
                      <p style={{ fontSize: "13px", color: "var(--admin-text-secondary)", marginBottom: "20px" }}>Configure how you receive business alerts and stock level warnings.</p>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--admin-text-primary)" }}>
                          <input 
                            type="checkbox" 
                            checked={settingsForm.dashboardEnabled}
                            onChange={(e) => handleSettingsChange("dashboardEnabled", e.target.checked)}
                            style={{ width: "18px", height: "18px", accentColor: "var(--admin-accent-green)" }}
                          />
                          <div>
                            <span style={{ fontSize: "14px", fontWeight: "600", display: "block" }}>Dashboard Notifications</span>
                            <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Show real-time alerts on the admin dashboard feed.</span>
                          </div>
                        </label>

                        <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--admin-text-primary)" }}>
                          <input 
                            type="checkbox" 
                            checked={settingsForm.telegramEnabled}
                            onChange={(e) => handleSettingsChange("telegramEnabled", e.target.checked)}
                            style={{ width: "18px", height: "18px", accentColor: "var(--admin-accent-green)" }}
                          />
                          <div>
                            <span style={{ fontSize: "14px", fontWeight: "600", display: "block" }}>Telegram Notifications</span>
                            <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Send mobile push notifications to the "Kalludevakunta FPO Alerts" group.</span>
                          </div>
                        </label>

                        <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", opacity: 0.5, cursor: "not-allowed", color: "var(--admin-text-primary)" }}>
                          <input 
                            type="checkbox" 
                            disabled 
                            style={{ width: "18px", height: "18px" }}
                          />
                          <div>
                            <span style={{ fontSize: "14px", fontWeight: "600", display: "block", color: "var(--admin-text-muted)" }}>WhatsApp Notifications (Future)</span>
                            <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Send automated notifications to WhatsApp numbers.</span>
                          </div>
                        </label>

                        <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", opacity: 0.5, cursor: "not-allowed", color: "var(--admin-text-primary)" }}>
                          <input 
                            type="checkbox" 
                            disabled 
                            style={{ width: "18px", height: "18px" }}
                          />
                          <div>
                            <span style={{ fontSize: "14px", fontWeight: "600", display: "block", color: "var(--admin-text-muted)" }}>Email Notifications (Future)</span>
                            <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>Send daily digest/alerts to admin email addresses.</span>
                          </div>
                        </label>
                      </div>

                      <button 
                        className="btn-action primary" 
                        onClick={saveNotificationSettings}
                        style={{ marginTop: "24px" }}
                        disabled={savingSettings}
                      >
                        {savingSettings ? "Saving Settings..." : "Save Preferences"}
                      </button>
                    </div>

                    <div className="settings-section">
                      <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "var(--admin-accent-orange)" }}>Telegram Bot Integration Status</h3>
                      
                      <div className="telegram-status-card" style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "16px" }}>
                        <div className="status-item" style={{ flex: "1 1 200px" }}>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--admin-text-muted)", textTransform: "uppercase" }}>Connection Status</span>
                          <span style={{ 
                            fontSize: "16px", 
                            fontWeight: "700", 
                            color: telegramStatus?.connected ? "#4caf50" : "#f44336",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "4px"
                          }}>
                            <span style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              backgroundColor: telegramStatus?.connected ? "#4caf50" : "#f44336",
                              display: "inline-block",
                              boxShadow: telegramStatus?.connected ? "0 0 8px #4caf50" : "0 0 8px #f44336"
                            }}></span>
                            {telegramStatus?.connected ? "Connected" : "Disconnected"}
                          </span>
                        </div>

                        <div className="status-item" style={{ flex: "1 1 200px" }}>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--admin-text-muted)", textTransform: "uppercase" }}>Last Notification Sent</span>
                          <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--admin-text-primary)", display: "block", marginTop: "4px" }}>
                            {telegramStatus?.lastNotificationSent ? getRelativeTime(telegramStatus.lastNotificationSent) : "Never"}
                          </span>
                        </div>
                      </div>

                      <button 
                        className="btn-action small excel" 
                        onClick={sendTestTelegramMessage}
                        style={{ marginTop: "24px", padding: "10px 16px" }}
                        disabled={sendingTest || !telegramStatus?.connected}
                      >
                        {sendingTest ? "Sending..." : "Send Test Telegram Notification"}
                      </button>
                    </div>
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

      {/* Add Farmer Modal */}
      {showFarmerModal && (
        <div className="modal-overlay" onClick={() => setShowFarmerModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>+ Add New Farmer</h3>
              <button className="modal-close-icon" onClick={() => setShowFarmerModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleFarmerSubmit}>
              <div className="modal-body form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px" }}>
                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Farmer Name *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Enter name"
                    value={farmerForm.name}
                    onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="admin-login-input-group">
                  <label className="admin-login-label">Phone Number *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="10-digit mobile"
                    value={farmerForm.phone}
                    onChange={(e) => setFarmerForm({ ...farmerForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Gender</label>
                  <select 
                    className="admin-login-input" 
                    value={farmerForm.gender}
                    onChange={(e) => setFarmerForm({ ...farmerForm, gender: e.target.value })}
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Village *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Village name"
                    value={farmerForm.village}
                    onChange={(e) => setFarmerForm({ ...farmerForm, village: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Mandal</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Mandal name"
                    value={farmerForm.mandal}
                    onChange={(e) => setFarmerForm({ ...farmerForm, mandal: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">District</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="District name"
                    value={farmerForm.district}
                    onChange={(e) => setFarmerForm({ ...farmerForm, district: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Crop Type</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="e.g. Paddy, Cotton"
                    value={farmerForm.cropType}
                    onChange={(e) => setFarmerForm({ ...farmerForm, cropType: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Land Holding (Acres)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="admin-login-input" 
                    placeholder="Land in acres"
                    value={farmerForm.landHolding}
                    onChange={(e) => setFarmerForm({ ...farmerForm, landHolding: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Aadhaar (Last 4 Digits)</label>
                  <input 
                    type="text" 
                    maxLength="4"
                    className="admin-login-input" 
                    placeholder="Last 4 digits only"
                    value={farmerForm.aadhaarLast4}
                    onChange={(e) => setFarmerForm({ ...farmerForm, aadhaarLast4: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ padding: "16px 20px" }}>
                <button type="button" className="btn-modal-close" onClick={() => setShowFarmerModal(false)}>Cancel</button>
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}>Save Farmer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Farmer Modal */}
      {viewingFarmer && (
        <div className="modal-overlay" onClick={() => setViewingFarmer(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>Farmer Details: {viewingFarmer.farmerId}</h3>
              <button className="modal-close-icon" onClick={() => setViewingFarmer(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <div className="details-list">
                <div className="detail-item">
                  <span className="label">Farmer ID:</span>
                  <span className="value font-semibold">{viewingFarmer.farmerId}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Full Name:</span>
                  <span className="value font-semibold">{viewingFarmer.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Gender:</span>
                  <span className="value">{viewingFarmer.gender || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Phone Number:</span>
                  <span className="value">{viewingFarmer.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Village:</span>
                  <span className="value">{viewingFarmer.village}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Mandal:</span>
                  <span className="value">{viewingFarmer.mandal || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">District:</span>
                  <span className="value">{viewingFarmer.district || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Crop Type:</span>
                  <span className="value text-accent">{viewingFarmer.cropType || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Land Holding:</span>
                  <span className="value">{viewingFarmer.landHolding ? `${viewingFarmer.landHolding} Acres` : "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Aadhaar Last 4:</span>
                  <span className="value">{viewingFarmer.aadhaarLast4 ? `XXXX-XXXX-${viewingFarmer.aadhaarLast4}` : "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Member Status:</span>
                  <span className={`value status-pill ${String(viewingFarmer.status || "Active").toLowerCase()}`}>
                    {viewingFarmer.status || "Active"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Joined Date:</span>
                  <span className="value">{viewingFarmer.joinedDate ? viewingFarmer.joinedDate.substring(0, 10) : (viewingFarmer.createdAt ? viewingFarmer.createdAt.substring(0, 10) : "N/A")}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "16px 20px" }}>
              <button className="btn-modal-close" onClick={() => setViewingFarmer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Farmer Modal */}
      {editingFarmer && (
        <div className="modal-overlay" onClick={() => setEditingFarmer(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>Edit Farmer: {editingFarmer.farmerId}</h3>
              <button className="modal-close-icon" onClick={() => setEditingFarmer(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleFarmerUpdate}>
              <div className="modal-body form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px" }}>
                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Farmer Name * (Read-Only)</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingFarmer.name}
                    disabled
                    style={{ opacity: 0.6 }}
                  />
                </div>
                
                <div className="admin-login-input-group">
                  <label className="admin-login-label">Phone Number *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingFarmer.phone}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Status</label>
                  <select 
                    className="admin-login-input" 
                    value={editingFarmer.status || "Active"}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, status: e.target.value })}
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Village *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingFarmer.village}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, village: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Mandal</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingFarmer.mandal || ""}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, mandal: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">District</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingFarmer.district || ""}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, district: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Crop Type</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingFarmer.cropType || ""}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, cropType: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Land Holding (Acres)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="admin-login-input" 
                    value={editingFarmer.landHolding || ""}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, landHolding: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ padding: "16px 20px" }}>
                <button type="button" className="btn-modal-close" onClick={() => setEditingFarmer(null)}>Cancel</button>
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}>Update Farmer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>+ Add New Product</h3>
              <button className="modal-close-icon" onClick={() => setShowProductModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px" }}>
                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Product Name *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Enter product name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="admin-login-input-group">
                  <label className="admin-login-label">Category *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="e.g. Seeds, Fertilizers"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Unit</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="e.g. kg, 50kg Bag, Packet"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Price (₹) *</label>
                  <input 
                    type="number" 
                    className="admin-login-input" 
                    placeholder="Price per unit"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Stock Quantity *</label>
                  <input 
                    type="number" 
                    className="admin-login-input" 
                    placeholder="Initial stock"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Image URL</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="https://example.com/image.jpg"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Status</label>
                  <select 
                    className="admin-login-input" 
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Description</label>
                  <textarea 
                    className="admin-login-input" 
                    placeholder="Product description details"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    style={{ minHeight: "80px", resize: "vertical", background: "#0d2315", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "10px", borderRadius: "8px" }}
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ padding: "16px 20px" }}>
                <button type="button" className="btn-modal-close" onClick={() => setShowProductModal(false)}>Cancel</button>
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewingProduct && (
        <div className="modal-overlay" onClick={() => setViewingProduct(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>Product Details: {viewingProduct.productId}</h3>
              <button className="modal-close-icon" onClick={() => setViewingProduct(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              {viewingProduct.imageUrl && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <img 
                    src={viewingProduct.imageUrl} 
                    alt={viewingProduct.name} 
                    style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "8px", objectFit: "cover" }} 
                  />
                </div>
              )}
              <div className="details-list">
                <div className="detail-item">
                  <span className="label">Product ID:</span>
                  <span className="value font-semibold">{viewingProduct.productId}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value font-semibold">{viewingProduct.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Category:</span>
                  <span className="value badge-tag info">{viewingProduct.category}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Price:</span>
                  <span className="value text-accent font-semibold">₹{viewingProduct.price}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Stock:</span>
                  <span className="value">{viewingProduct.stock} {viewingProduct.unit || ""}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`value status-pill ${viewingProduct.status === "In Stock" ? "active" : "inactive"}`}>
                    {viewingProduct.status}
                  </span>
                </div>
                <div className="detail-item full-width">
                  <span className="label">Description:</span>
                  <span className="value text-block">{viewingProduct.description || "No description provided."}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Created Date:</span>
                  <span className="value">{viewingProduct.createdAt?.substring(0, 10)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "16px 20px" }}>
              <button className="btn-modal-close" onClick={() => setViewingProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>Edit Product: {editingProduct.productId}</h3>
              <button className="modal-close-icon" onClick={() => setEditingProduct(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleProductUpdate}>
              <div className="modal-body form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px" }}>
                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Product Name * (Read-Only)</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingProduct.name}
                    disabled
                    style={{ opacity: 0.6 }}
                  />
                </div>
                
                <div className="admin-login-input-group">
                  <label className="admin-login-label">Category *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Unit (Read-Only)</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingProduct.unit || ""}
                    disabled
                    style={{ opacity: 0.6 }}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Price (₹) *</label>
                  <input 
                    type="number" 
                    className="admin-login-input" 
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Stock Quantity *</label>
                  <input 
                    type="number" 
                    className="admin-login-input" 
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Status</label>
                  <select 
                    className="admin-login-input" 
                    value={editingProduct.status}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Description</label>
                  <textarea 
                    className="admin-login-input" 
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    style={{ minHeight: "80px", resize: "vertical", background: "#0d2315", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "10px", borderRadius: "8px" }}
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ padding: "16px 20px" }}>
                <button type="button" className="btn-modal-close" onClick={() => setEditingProduct(null)}>Cancel</button>
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}>Update Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
