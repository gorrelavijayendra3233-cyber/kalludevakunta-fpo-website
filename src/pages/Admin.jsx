import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Trash2, 
  Eye, 
  EyeOff,
  Download, 
  LayoutDashboard,
  Sprout,
  Tractor,
  Menu,
  X,
  Sun,
  Search,
  RefreshCw,
  Lock,
  LogOut,
  Users,
  Package,
  BarChart3,
  FileText,
  FolderOpen,
  Bell,
  Settings,
  Send,
  Pencil,
  AlertTriangle,
  Coins,
  ShoppingCart,
  Clock,
  CheckCircle,
  Check,
  Ban,
  Megaphone
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import LocationSelector from "../components/LocationSelector/LocationSelector";
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

const EmptyState = ({ icon: Icon, title, message, ctaText, onCtaClick }) => {
  return (
    <div className="empty-state-container glass-panel">
      <div className="empty-state-icon">
        <Icon size={36} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-message">{message}</p>
      {ctaText && (
        <button className="btn-action primary" onClick={onCtaClick} style={{ minWidth: "140px", height: "40px", padding: "0 20px" }}>
          <span>{ctaText}</span>
        </button>
      )}
    </div>
  );
};

function Admin() {
  // ── Authentication States ──
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("fpo_admin_token")
  );
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  // ── Core States ──
  const [contacts, setContacts] = useState([]);
  const [crops, setCrops] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [farmers, setFarmers] = useState([]);
  
  // Crop Sales module custom filters & reject state
  const [cropStatusFilter, setCropStatusFilter] = useState("All");
  const [cropTimeframeFilter, setCropTimeframeFilter] = useState("all");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectCropId, setRejectCropId] = useState("");
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejectType, setRejectType] = useState("crop");

  // ── Farmers Module States ──
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [viewingFarmer, setViewingFarmer] = useState(null);
  const [searchFarmer, setSearchFarmer] = useState("");
  const [farmerForm, setFarmerForm] = useState({
    name: "",
    phone: "",
    state: "Andhra Pradesh",
    district: "",
    mandal: "",
    village: "",
    surveyNumber: "",
    aadharNumber: "",
    landHolding: "",
    gender: "Male",
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
  const [filterProductCategory, setFilterProductCategory] = useState("All");
  const [filterProductStatus, setFilterProductStatus] = useState("All");
  const [deletingProductItem, setDeletingProductItem] = useState(null);
  const [productBookings, setProductBookings] = useState([]);
  const [viewingProductBooking, setViewingProductBooking] = useState(null);
  const [editingProductBooking, setEditingProductBooking] = useState(null);
  const [searchProductBooking, setSearchProductBooking] = useState("");
  const [deletingProductBookingItem, setDeletingProductBookingItem] = useState(null);

  // ── Equipments Rates States ──
  const [equipments, setEquipments] = useState([]);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [searchEquipment, setSearchEquipment] = useState("");
  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    description: "",
    rateHour: "",
    rateDay: "",
    available: true,
    equipmentId: ""
  });

  // ── Equipment Slots States ──
  const [equipmentSlots, setEquipmentSlots] = useState([]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    equipmentName: "",
    date: "",
    slots: 1
  });

  const getProductStatusText = (stock) => {
    if (stock === 0) return "Out Of Stock";
    if (stock <= 10) return "Low Stock";
    return "In Stock";
  };

  const getProductStatusClass = (stock) => {
    if (stock === 0) return "out-of-stock";
    if (stock <= 10) return "low-stock";
    return "in-stock";
  };

  // ── Reports & Analytics States ──
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState("all");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

  // ── Announcements States ──
  const [announcements, setAnnouncements] = useState([]);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    description: "",
    category: "General",
    priority: "low",
    imageUrl: "",
    published: true
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Theme State ──
  const [theme, setTheme] = useState("dark");


  // ── Document Center States ──
  const [documents, setDocuments] = useState([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    title: "",
    description: "",
    category: "Government Schemes"
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [searchDoc, setSearchDoc] = useState("");
  const [filterDocCategory, setFilterDocCategory] = useState("All");

  // ── Audit Logs States ──
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchAuditLogsInput, setSearchAuditLogsInput] = useState("");
  const [searchAuditLogs, setSearchAuditLogs] = useState("");
  const [filterAuditModule, setFilterAuditModule] = useState("All");
  const [filterAuditAction, setFilterAuditAction] = useState("All");



  // ── Forgot Password States ──
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetForm, setResetForm] = useState({
    username: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showResetOldPassword, setShowResetOldPassword] = useState(false);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [credentialsVerified, setCredentialsVerified] = useState(false);
  const [verifyingCredentials, setVerifyingCredentials] = useState(false);

  // ── Search States ──
  const [searchContact, setSearchContact] = useState("");
  const [searchCrop, setSearchCrop] = useState("");
  const [searchBooking, setSearchBooking] = useState("");

  const [searchFarmerInput, setSearchFarmerInput] = useState("");
  const [searchProductInput, setSearchProductInput] = useState("");
  const [searchProductBookingInput, setSearchProductBookingInput] = useState("");
  const [searchContactInput, setSearchContactInput] = useState("");
  const [searchCropInput, setSearchCropInput] = useState("");
  const [searchBookingInput, setSearchBookingInput] = useState("");
  const [notificationSearchInput, setNotificationSearchInput] = useState("");
  const [searchEquipmentInput, setSearchEquipmentInput] = useState("");

  // ── Pagination States ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Helper: getStatusBadgeClass ──
  const getStatusBadgeClass = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (["active", "confirmed", "in stock", "sent", "success", "completed", "approved"].includes(s)) {
      return "badge-status success";
    }
    if (["pending", "low stock", "warning"].includes(s)) {
      return "badge-status warning";
    }
    if (["cancelled", "out of stock", "failed", "danger", "rejected", "inactive"].includes(s)) {
      return "badge-status danger";
    }
    return "badge-status info";
  };

  // ── Helper: renderPagination ──
  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div className="pagination-container">
        <div className="pagination-left">
          <span>Rows per page:</span>
          <select 
            className="pagination-page-select" 
            value={pageSize} 
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span style={{ marginLeft: "12px" }}>
            Showing {startItem}-{endItem} of {totalItems}
          </span>
        </div>
        <div className="pagination-right">
          <button 
            className="btn-pagination" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            aria-label="Previous Page"
          >
            &lt;
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="btn-pagination" 
            disabled={currentPage >= totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            aria-label="Next Page"
          >
            &gt;
          </button>
        </div>
      </div>
    );
  };

  // ── Escape Key Modal Dismissal ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedItem(null);
        setShowFarmerModal(false);
        setEditingFarmer(null);
        setViewingFarmer(null);
        setShowProductModal(false);
        setEditingProduct(null);
        setViewingProduct(null);
        setViewingProductBooking(null);
        setEditingProductBooking(null);
        setDeletingProductItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  useEffect(() => {
    document.title = "Kalludevakunta FPO Admin Portal";
    return () => {
      document.title = "Kalludevakunta Farmers Producer Company Limited";
    };
  }, []);

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

  async function fetchData() {
    setLoading(true);

    try {
      const signal = AbortSignal.timeout(30000);

      const [contactsRes, cropsRes, bookingsRes, farmersRes, productsRes, analyticsRes, monthlyRes, categoryRes, notificationsRes, settingsRes, telegramRes, productBookingsRes, equipmentsRes, announcementsRes, documentsRes, auditLogsRes] =
        await Promise.all([
          fetch(`${API_BASE}/contact`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/crop-sales`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/bookings`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/farmers`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/products`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/analytics?timeframe=${analyticsTimeframe}`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/analytics/monthly`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/analytics/categories`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/notifications/settings`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/notifications/telegram-status`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/product-bookings`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/equipments`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/announcements/admin`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/documents`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_BASE}/audit-logs`, { headers: getAuthHeaders(), signal })
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
        telegramRes.status === 401 ||
        productBookingsRes.status === 401 ||
        equipmentsRes.status === 401 ||
        announcementsRes.status === 401 ||
        documentsRes.status === 401 ||
        auditLogsRes.status === 401
      ) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      if (!contactsRes.ok || !cropsRes.ok || !bookingsRes.ok || !farmersRes.ok || !productsRes.ok || !analyticsRes.ok || !monthlyRes.ok || !categoryRes.ok || !notificationsRes.ok || !settingsRes.ok || !telegramRes.ok || !productBookingsRes.ok || !equipmentsRes.ok || !announcementsRes.ok || !documentsRes.ok || !auditLogsRes.ok) {
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
      const productBookingsData = await productBookingsRes.json();
      const equipmentsData = await equipmentsRes.json();
      const announcementsData = await announcementsRes.json();
      const documentsData = await documentsRes.json();
      const auditLogsData = await auditLogsRes.json();

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
      setProductBookings(Array.isArray(productBookingsData) ? productBookingsData : (productBookingsData?.data || []));
      setEquipments(equipmentsData);
      setAnnouncements(announcementsData);
      setDocuments(documentsData);
      setAuditLogs(auditLogsData);
      setIsOffline(false);

      // Fetch equipment slots calendar
      try {
        const slotsRes = await fetch(`${API_BASE}/equipment-slots`, { signal });
        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();
          setEquipmentSlots(slotsData);
        }
      } catch (slotErr) {
        console.error("Failed to load equipment slots:", slotErr);
      }
    } catch (error) {
      console.error("Database fetch error:", error);
      setIsOffline(true);
      toast.error("Unable to load dashboard data. Connection failed.");
    } finally {
      setLoading(false);
    }
  }


  const getPasswordStrength = (pwd) => {
    if (!pwd) return "";
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return "Weak";
    if (score === 3) return "Medium";
    return "Strong";
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength === "Weak") return "#f44336"; // Red
    if (strength === "Medium") return "#ff9800"; // Orange
    if (strength === "Strong") return "#4caf50"; // Green
    return "transparent";
  };

  const formatSecurityDate = (dateVal) => {
    if (!dateVal) return "Never";
    try {
      const d = new Date(dateVal);
      const day = String(d.getDate()).padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (err) {
      return "Never";
    }
  };



  const handleVerifyCredentials = async (e) => {
    e.preventDefault();

    if (!resetForm.username || !resetForm.username.trim()) {
      toast.error("Please enter your username");
      return;
    }

    if (!resetForm.oldPassword) {
      toast.error("Please enter your old/last password");
      return;
    }

    try {
      setVerifyingCredentials(true);
      const response = await fetch(`${API_BASE}/admin/verify-old-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: resetForm.username,
          oldPassword: resetForm.oldPassword
        }),
        signal: AbortSignal.timeout(10000)
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error("Failed to parse JSON response:", parseErr);
        toast.error(`Server connection issue (status ${response.status}). Please try again shortly.`);
        return;
      }

      if (!response.ok || !data.success) {
        toast.error(data.message || "Invalid credentials");
        return;
      }

      toast.success("Credentials verified. Please set your new password.");
      setCredentialsVerified(true);

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to verify credentials");
    } finally {
      setVerifyingCredentials(false);
    }
  };

  const handleForgotPasswordReset = async (e) => {
    e.preventDefault();

    if (!resetForm.oldPassword || !resetForm.newPassword || !resetForm.confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Minimum password rules check
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(resetForm.newPassword)) {
      toast.error("Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character.");
      return;
    }

    try {
      setResettingPassword(true);
      const response = await fetch(`${API_BASE}/admin/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: resetForm.username,
          oldPassword: resetForm.oldPassword,
          newPassword: resetForm.newPassword
        }),
        signal: AbortSignal.timeout(10000)
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error("Failed to parse JSON response:", parseErr);
        toast.error(`Server connection issue (status ${response.status}). Please try again shortly.`);
        return;
      }

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to reset password");
        return;
      }

      setShowForgotPassword(false);
      setCredentialsVerified(false);
      setResetForm({
        username: "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
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


  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!documentForm.title || !documentFile) {
      toast.error("Document Title and File are required.");
      return;
    }
    
    setUploadingDoc(true);
    const formData = new FormData();
    formData.append("title", documentForm.title);
    formData.append("description", documentForm.description || "");
    formData.append("category", documentForm.category || "Other");
    formData.append("file", documentFile);

    try {
      const response = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const resData = await response.json();
      if (resData.success) {
        toast.success("Document uploaded successfully!");
        setShowDocumentModal(false);
        setDocumentForm({ title: "", description: "", category: "Government Schemes" });
        setDocumentFile(null);
        fetchData();
        triggerSystemNotification(
          "Document Uploaded",
          `New document "${documentForm.title}" has been uploaded to the center.`,
          "medium"
        );
      } else {
        toast.error(resData.message || "Failed to upload document");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error uploading file.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/documents/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const resData = await response.json();
      if (resData.success) {
        toast.success("Document deleted successfully!");
        fetchData();
      } else {
        toast.error(resData.message || "Failed to delete document");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting document.");
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
        toast.success("Notification settings updated successfully!");
        fetchData();
      } else {
        toast.error("Failed to save notification settings.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server to save settings.");
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
        toast.success("Test telegram message sent successfully!");
        fetchData();
      } else {
        toast.error(data.message || "Failed to send test telegram message.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server to send test message.");
    } finally {
      setSendingTest(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();

      const interval = setInterval(() => {
        fetchData();
      }, 120000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, analyticsTimeframe]);

  // ── Debounce Search Inputs & Reset Page ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchFarmer(searchFarmerInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFarmerInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchProduct(searchProductInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchProductInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchProductBooking(searchProductBookingInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchProductBookingInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchContact(searchContactInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchContactInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchCrop(searchCropInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchCropInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchBooking(searchBookingInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchBookingInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotificationSearch(notificationSearchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [notificationSearchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchEquipment(searchEquipmentInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchEquipmentInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchAuditLogs(searchAuditLogsInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchAuditLogsInput]);

  // Reset pagination & clear search inputs on tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchFarmerInput("");
    setSearchProductInput("");
    setSearchProductBookingInput("");
    setSearchContactInput("");
    setSearchCropInput("");
    setSearchBookingInput("");
    setNotificationSearchInput("");
    setSearchEquipmentInput("");
    setSearchAuditLogsInput("");
  }, [activeTab]);

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

  const endpoint = type === "contacts" ? "contact" : type === "crops" ? "crop-sales" : type;

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

    toast.success("Record deleted successfully.");

    // Reload fresh data from MongoDB
    fetchData();

    // Close modal if deleted item was open
    if (selectedItem && selectedItem.data._id === id) {
      setSelectedItem(null);
    }
  } catch (error) {
    console.error("Delete Error:", error);
    toast.error("Failed to delete record.");
  }
};

  // ── Crop Request Actions ──
  const handleApproveCrop = async (id) => {
    if (!window.confirm("Are you sure you want to approve this crop sale request?")) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/crop-sales/${id}/approve`, {
        method: "PUT",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }
      const data = response.ok ? await response.json() : null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Approval failed.");
      }
      toast.success("Crop sale request approved.");
      fetchData();
      if (selectedItem && selectedItem.data._id === id) {
        setSelectedItem(prev => ({ ...prev, data: { ...prev.data, status: "Approved" } }));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to approve request.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCrop = async (id, remarks) => {
    if (!remarks || !remarks.trim()) {
      toast.error("Please provide rejection remarks.");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/crop-sales/${id}/reject`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ remarks }),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }
      const data = response.ok ? await response.json() : null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Rejection failed.");
      }
      toast.success("Crop sale request rejected.");
      fetchData();
      if (selectedItem && selectedItem.data._id === id) {
        setSelectedItem(prev => ({ ...prev, data: { ...prev.data, status: "Rejected", adminRemarks: remarks } }));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to reject request.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCrop = async (id) => {
    if (!window.confirm("Are you sure you want to mark this crop sale request as completed?")) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/crop-sales/${id}/complete`, {
        method: "PUT",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }
      const data = response.ok ? await response.json() : null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Completion failed.");
      }
      toast.success("Crop sale request marked as completed.");
      fetchData();
      if (selectedItem && selectedItem.data._id === id) {
        setSelectedItem(prev => ({ ...prev, data: { ...prev.data, status: "Completed" } }));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to complete request.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (id) => {
    if (!window.confirm("Are you sure you want to approve this equipment booking?")) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/bookings/${id}/approve`, {
        method: "PUT",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }
      const data = response.ok ? await response.json() : null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Approval failed.");
      }
      toast.success("Equipment booking approved.");
      fetchData();
      if (selectedItem && selectedItem.data._id === id) {
        setSelectedItem(prev => ({ ...prev, data: { ...prev.data, status: "Approved" } }));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to approve booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBooking = async (id, remarks) => {
    if (!remarks || !remarks.trim()) {
      toast.error("Please provide rejection remarks.");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/bookings/${id}/reject`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ remarks }),
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }
      const data = response.ok ? await response.json() : null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Rejection failed.");
      }
      toast.success("Equipment booking rejected.");
      fetchData();
      if (selectedItem && selectedItem.data._id === id) {
        setSelectedItem(prev => ({ ...prev, data: { ...prev.data, status: "Rejected", adminRemarks: remarks } }));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to reject booking.");
    } finally {
      setLoading(false);
    }
  };

  // ── Farmer CRUD Handlers ──
  const handleFarmerSubmit = async (e) => {
    e.preventDefault();
    if (!farmerForm.name || !farmerForm.phone || !farmerForm.state || !farmerForm.district || !farmerForm.mandal || !farmerForm.village) {
      toast.error("Name, Phone, State, District, Mandal, and Village are required.");
      return;
    }
    if (!/^\d{10}$/.test(farmerForm.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    if (farmerForm.landHolding && Number(farmerForm.landHolding) < 0) {
      toast.error("Land holding must be a positive number.");
      return;
    }
    if (farmerForm.aadharNumber && !/^\d{12}$/.test(farmerForm.aadharNumber.trim())) {
      toast.error("Aadhar number must be exactly 12 digits.");
      return;
    }

    try {
      const payload = { ...farmerForm };
      if (payload.landHolding === "") {
        payload.landHolding = null;
      }
      const response = await fetch(`${API_BASE}/farmers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        toast.success("Farmer added successfully!");
        setShowFarmerModal(false);
        setFarmerForm({
          name: "",
          phone: "",
          state: "Andhra Pradesh",
          district: "",
          mandal: "",
          village: "",
          surveyNumber: "",
          aadharNumber: "",
          landHolding: "",
          gender: "Male",
          status: "Active"
        });
        fetchData();
      } else {
        toast.error(data.message || "Failed to add farmer.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  const handleFarmerUpdate = async (e) => {
    e.preventDefault();
    if (!editingFarmer.name || !editingFarmer.phone || !editingFarmer.state || !editingFarmer.district || !editingFarmer.mandal || !editingFarmer.village) {
      toast.error("Name, Phone, State, District, Mandal, and Village are required.");
      return;
    }
    if (!/^\d{10}$/.test(editingFarmer.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    if (editingFarmer.landHolding && Number(editingFarmer.landHolding) < 0) {
      toast.error("Land holding must be a positive number.");
      return;
    }
    if (editingFarmer.aadharNumber && !/^\d{12}$/.test(editingFarmer.aadharNumber.trim())) {
      toast.error("Aadhar number must be exactly 12 digits.");
      return;
    }

    try {
      const payload = { ...editingFarmer };
      if (payload.landHolding === "") {
        payload.landHolding = null;
      }
      const response = await fetch(`${API_BASE}/farmers/${editingFarmer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        toast.success("Farmer updated successfully!");
        setEditingFarmer(null);
        fetchData();
      } else {
        toast.error(data.message || "Failed to update farmer.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
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
        toast.success("Farmer deleted successfully.");
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete farmer.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  // ── Product CRUD Handlers ──
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category || productForm.price === "" || productForm.stock === "") {
      toast.error("Product Name, Category, Price, and Stock Quantity are required.");
      return;
    }
    if (Number(productForm.price) < 0 || Number(productForm.stock) < 0) {
      toast.error("Price and Stock must be non-negative numbers.");
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
        toast.success("Product added successfully!");
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
        toast.error(data.message || "Failed to add product.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  const handleProductUpdate = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.category || editingProduct.price === "" || editingProduct.stock === "") {
      toast.error("Product Name, Category, Price, and Stock Quantity are required.");
      return;
    }
    if (Number(editingProduct.price) < 0 || Number(editingProduct.stock) < 0) {
      toast.error("Price and Stock must be non-negative numbers.");
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
        toast.success("Product updated successfully!");
        setEditingProduct(null);
        fetchData();
      } else {
        toast.error(data.message || "Failed to update product.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
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
        toast.success("Product deleted successfully.");
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete product.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  // ── Announcements CRUD Handlers ──
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.description) {
      toast.error("Title and Description are required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(announcementForm),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        toast.success("Announcement created successfully!");
        setShowAddAnnouncementModal(false);
        setAnnouncementForm({
          title: "",
          description: "",
          category: "General",
          priority: "low",
          imageUrl: "",
          published: true
        });
        fetchData();
      } else {
        toast.error(data.message || "Failed to create announcement.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  const handleAnnouncementUpdate = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.description) {
      toast.error("Title and Description are required.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/announcements/${selectedAnnouncement._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(announcementForm),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        toast.success("Announcement updated successfully!");
        setShowEditAnnouncementModal(false);
        setSelectedAnnouncement(null);
        setAnnouncementForm({
          title: "",
          description: "",
          category: "General",
          priority: "low",
          imageUrl: "",
          published: true
        });
        fetchData();
      } else {
        toast.error(data.message || "Failed to update announcement.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  const handleAnnouncementDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/announcements/${id}`, {
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
        toast.success("Announcement deleted successfully.");
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete announcement.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  // ── Equipment Rates CRUD Handlers ──
  const handleEquipmentSubmit = async (e) => {
    e.preventDefault();
    if (!equipmentForm.name || equipmentForm.rateHour === "" || equipmentForm.rateDay === "") {
      toast.error("Equipment Name, Hourly Rate, and Daily Rate are required.");
      return;
    }

    if (Number(equipmentForm.rateHour) < 0 || Number(equipmentForm.rateDay) < 0) {
      toast.error("Rates must be non-negative numbers.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/equipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(equipmentForm),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        toast.success("Equipment rate added successfully!");
        setShowEquipmentModal(false);
        setEquipmentForm({
          name: "",
          description: "",
          rateHour: "",
          rateDay: "",
          available: true,
          equipmentId: ""
        });
        fetchData();
      } else {
        toast.error(data.message || "Failed to add equipment rate.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  const handleEquipmentEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEquipment.name || editingEquipment.rateHour === "" || editingEquipment.rateDay === "") {
      toast.error("Equipment Name, Hourly Rate, and Daily Rate are required.");
      return;
    }

    if (Number(editingEquipment.rateHour) < 0 || Number(editingEquipment.rateDay) < 0) {
      toast.error("Rates must be non-negative numbers.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/equipments/${editingEquipment._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(editingEquipment),
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        setLoading(false);
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        toast.success("Equipment rate updated successfully!");
        setEditingEquipment(null);
        fetchData();
      } else {
        toast.error(data.message || "Failed to update equipment rate.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  const handleEquipmentDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this equipment rate?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/equipments/${id}`, {
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
        toast.success("Equipment rate deleted successfully.");
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete equipment rate.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  // ── Equipment Slots Handlers ──
  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    if (!slotForm.equipmentName || !slotForm.date || slotForm.slots === "") {
      toast.error("Equipment, Date, and Slots capacity are required.");
      return;
    }
    if (Number(slotForm.slots) <= 0 || !Number.isInteger(Number(slotForm.slots))) {
      toast.error("Slots count must be a positive integer.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/equipment-slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(slotForm)
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Daily slot configuration saved!");
        setShowSlotModal(false);
        setSlotForm({ equipmentName: "", date: "", slots: 1 });
        fetchData();
      } else {
        toast.error(data.message || "Failed to save slot.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to connect to server.");
    }
  };

  const handleSlotDelete = async (id) => {
    if (!window.confirm("Are you sure you want to close/remove this booking slot?")) return;
    try {
      const response = await fetch(`${API_BASE}/equipment-slots/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Slot closed successfully.");
        fetchData();
      } else {
        toast.error(data.message || "Failed to close slot.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to connect to server.");
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
          username: usernameInput.trim().toLowerCase(),
          password: passwordInput,
        }),
        signal: AbortSignal.timeout(60000)
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

  function handleUnauthorized() {
    localStorage.removeItem("fpo_admin_token");
    setIsAuthenticated(false);
    setLoading(false);
    setAuthError("Session expired. Please login again.");
  }

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

  const handleExportReport = async (reportType, format) => {
    let startDate = "";
    let endDate = "";

    if (analyticsTimeframe === "custom") {
      startDate = reportStartDate;
      endDate = reportEndDate;
    } else if (analyticsTimeframe !== "all") {
      const now = new Date();
      let start = new Date();
      if (analyticsTimeframe === "today") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (analyticsTimeframe === "week") {
        const day = now.getDay();
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      } else if (analyticsTimeframe === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (analyticsTimeframe === "year") {
        start = new Date(now.getFullYear(), 0, 1);
      }
      startDate = start.toISOString();
    }

    const timeframeText = analyticsTimeframe === "custom" 
      ? `Custom (${reportStartDate || "Start"} to ${reportEndDate || "End"})` 
      : {
          all: "All Time",
          today: "Today",
          week: "This Week",
          month: "This Month",
          year: "This Year"
        }[analyticsTimeframe] || "All Time";

    const toastId = toast.loading("Fetching report dataset...");

    try {
      let url = `${API_BASE}/reports?reportType=${reportType}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.status === 401) {
        toast.dismiss(toastId);
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch report data");
      }
      const json = await res.json();
      const dataset = json.data || [];

      let headers = [];
      let rows = [];
      let title = "";

      if (reportType === "farmers") {
        title = "Farmer Summary Report";
        headers = ["Farmer ID", "Name", "Phone", "Village", "Survey Number", "Aadhar Number", "Land Holding", "Status"];
        rows = dataset.map(f => [
          f.farmerId || "",
          f.name || "",
          f.phone || "",
          f.village || "",
          f.surveyNumber || "",
          f.aadharNumber || "",
          f.landHolding !== undefined ? `${f.landHolding} Acres` : "",
          f.status || "Active"
        ]);
      } else if (reportType === "products") {
        title = "Product Inventory Report";
        headers = ["Product ID", "Product Name", "Category", "Price", "Stock", "Status"];
        rows = dataset.map(p => [
          p.productId || "",
          p.name || "",
          p.category || "",
          p.price !== undefined ? `Rs. ${p.price}` : "",
          p.stock !== undefined ? `${p.stock}` : "",
          p.status || "In Stock"
        ]);
      } else if (reportType === "crops") {
        title = "Crop Requests Report";
        headers = ["Sale ID", "Farmer Name", "Phone", "Crop Name", "Quantity", "Expected Price", "Estimated Value", "Status", "Date"];
        rows = dataset.map(c => [
          c.cropSaleId || "",
          c.farmerName || "",
          c.phone || "",
          c.cropName || "",
          c.quantity !== undefined ? `${c.quantity} ${c.unit || "Qtls"}` : "",
          c.expectedPrice !== undefined ? `Rs. ${c.expectedPrice}` : "",
          c.estimatedValue !== undefined ? `Rs. ${c.estimatedValue}` : "",
          c.status || "Pending",
          c.createdAt ? c.createdAt.substring(0, 10) : ""
        ]);
      } else if (reportType === "bookings") {
        title = "Equipment Booking Report";
        headers = ["Booking ID", "Farmer Name", "Equipment ID", "Equipment Name", "Duration", "Booking Date", "Status"];
        rows = dataset.map(b => [
          b.bookingId || "",
          b.farmerName || "",
          b.equipmentId || "",
          b.equipmentName || "",
          b.duration || "",
          b.bookingDate ? b.bookingDate.substring(0, 10) : "",
          b.status || "Pending"
        ]);
      } else if (reportType === "orders") {
        title = "Product Orders Report";
        headers = ["Order ID", "Farmer Name", "Product Name", "Quantity", "Total Price", "Phone Number", "Order Date", "Status"];
        rows = dataset.map(o => [
          o.bookingId || o._id || "",
          o.farmerName || "",
          o.productName || "",
          o.quantity || 0,
          `Rs. ${o.totalPrice || 0}`,
          o.phone || "",
          o.createdAt ? o.createdAt.substring(0, 10) : "",
          o.status || "Pending"
        ]);
      } else if (reportType === "revenue") {
        title = "Platform Revenue Report";
        headers = ["Revenue Stream", "Revenue Amount"];
        rows = dataset.map(r => [
          r.stream || "",
          `Rs. ${(r.revenue || 0).toLocaleString("en-IN")}`
        ]);
      } else if (reportType === "contacts") {
        title = "Contact Requests Report";
        headers = ["Name", "Phone", "Subject", "Date"];
        rows = dataset.map(c => [
          c.fullName || c.name || "",
          c.phone || "",
          c.inquiryType || "General Inquiry",
          c.createdAt ? c.createdAt.substring(0, 10) : ""
        ]);
      }

      toast.dismiss(toastId);

      if (rows.length === 0) {
        toast.error("No records found for the selected filter.");
        return;
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
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error("Error exporting report: " + error.message);
    }
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

    const farmerHeaders = ["Farmer ID", "Name", "Phone", "Village", "Survey Number", "Aadhar Number", "Land Holding", "Status"];
    const farmerRows = filteredFarmers.map(f => [
      f.farmerId || "",
      f.name || "",
      f.phone || "",
      f.village || "",
      f.surveyNumber || "",
      f.aadharNumber || "",
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
      headers = ["Request ID", "Farmer Name", "Phone Number", "Village", "Crop Name", "Quantity", "Unit", "Expected Price", "Estimated Value", "Status", "Date"];
      rows = dataList.map(item => [
        item.cropSaleId || "CS---",
        item.farmerName || "",
        item.phone || "",
        item.village || "",
        item.cropName || "",
        item.quantity || 0,
        item.unit || "Qtls",
        item.expectedPrice || item.price || 0,
        item.estimatedValue || (item.quantity * (item.expectedPrice || item.price || 0)),
        item.status || "Pending",
        item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("en-IN") : (item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "")
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
      headers = ["Farmer ID", "Name", "Phone", "Village", "Mandal", "District", "Survey Number", "Aadhar Number", "Land Holding", "Status", "Joined Date"];
      rows = dataList.map(item => [
        item.farmerId || "",
        item.name || "",
        item.phone || "",
        item.village || "",
        item.mandal || "",
        item.district || "",
        item.surveyNumber || "",
        item.aadharNumber || "",
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
    } else if (type === "product-bookings") {
      headers = ["Booking ID", "Farmer Name", "Product Name", "Quantity", "Total Price", "Phone Number", "Booking Date", "Status"];
      rows = dataList.map(item => [
        item.bookingId || "",
        item.farmerName || "",
        item.productName || "",
        item.quantity || 0,
        item.totalPrice || 0,
        item.phone || "",
        item.bookingDate || (item.createdAt ? item.createdAt.substring(0, 10) : ""),
        item.status || "Pending"
      ]);
    } else if (type === "equipments") {
      headers = ["Equipment ID", "Equipment Name", "Hourly Rate (₹)", "Daily Rate (₹)", "Availability", "Description"];
      rows = dataList.map(item => [
        item.equipmentId || "",
        item.name || "",
        item.rateHour || 0,
        item.rateDay || 0,
        item.available ? "Available" : "Unavailable",
        item.description || ""
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

  const exportPDF = (type, dataList) => {
    try {
      if (!dataList || dataList.length === 0) {
        toast.error("No data to export");
        return;
      }

      let headers = [];
      let rows = [];
      let title = "";

      if (type === "contacts") {
        title = "Contact Inquiries Report";
        headers = ["Name", "Phone", "Email", "Village", "Inquiry Type", "Date"];
        rows = dataList.map(item => [
          item.fullName || "",
          item.phone || "",
          item.email || "",
          item.village || "",
          item.inquiryType || "",
          item.date || (item.createdAt ? item.createdAt.substring(0, 10) : "")
        ]);
      } else if (type === "crops") {
        title = "Crop Selling Requests Report";
        headers = ["Request ID", "Farmer Name", "Phone", "Village", "Crop Name", "Qty", "Expected Price", "Est Value", "Status"];
        rows = dataList.map(item => [
          item.cropSaleId || "CS---",
          item.farmerName || "",
          item.phone || "",
          item.village || "",
          item.cropName || "",
          `${item.quantity || 0} ${item.unit || "Qtls"}`,
          `Rs. ${item.expectedPrice || item.price || 0}`,
          `Rs. ${item.estimatedValue || (item.quantity * (item.expectedPrice || item.price || 0))}`,
          item.status || "Pending"
        ]);
      } else if (type === "bookings") {
        title = "Equipment Bookings Report";
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
        title = "Farmer Registry Report";
        headers = ["Farmer ID", "Name", "Phone", "Village", "Mandal", "Survey Number", "Aadhar Number", "Land Holding", "Status"];
        rows = dataList.map(item => [
          item.farmerId || "",
          item.name || "",
          item.phone || "",
          item.village || "",
          item.mandal || "",
          item.surveyNumber || "",
          item.aadharNumber || "",
          `${item.landHolding || 0} Acres`,
          item.status || "Active"
        ]);
      } else if (type === "products") {
        title = "Product Inventory Report";
        headers = ["Product ID", "Product Name", "Category", "Price", "Stock", "Status"];
        rows = dataList.map(item => [
          item.productId || "",
          item.name || "",
          item.category || "",
          `Rs. ${item.price || 0}`,
          item.stock || 0,
          item.status || "In Stock"
        ]);
      } else if (type === "product-bookings") {
        title = "Product Bookings & Orders Report";
        headers = ["Booking ID", "Farmer Name", "Product Name", "Quantity", "Total Price", "Phone Number", "Booking Date", "Status"];
        rows = dataList.map(item => [
          item.bookingId || "",
          item.farmerName || "",
          item.productName || "",
          item.quantity || 0,
          `Rs. ${item.totalPrice || 0}`,
          item.phone || "",
          item.bookingDate || (item.createdAt ? item.createdAt.substring(0, 10) : ""),
          item.status || "Pending"
        ]);
      } else if (type === "equipments") {
        title = "Machinery & Equipment Rates Report";
        headers = ["Equipment ID", "Equipment Name", "Hourly Rate", "Daily Rate", "Availability"];
        rows = dataList.map(item => [
          item.equipmentId || "",
          item.name || "",
          `Rs. ${item.rateHour || 0}/hr`,
          `Rs. ${item.rateDay || 0}/day`,
          item.available ? "Available" : "Unavailable"
        ]);
      }

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
      
      const tableConfig = {
        startY: 49,
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
        margin: { top: 49, left: 14, right: 14 }
      };

      if (typeof doc.autoTable === "function") {
        doc.autoTable(tableConfig);
      } else if (typeof autoTable === "function") {
        autoTable(doc, tableConfig);
      } else {
        throw new Error("PDF table generation library is not initialized correctly.");
      }
      
      doc.save(`fpo_${type}_export.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("Failed to generate PDF: " + err.message);
    }
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

  const getCropSalesStatusChartData = () => {
    const pending = crops.filter(c => c.status === "Pending" || !c.status).length;
    const approved = crops.filter(c => c.status === "Approved").length;
    const rejected = crops.filter(c => c.status === "Rejected").length;
    const completed = crops.filter(c => c.status === "Completed").length;

    return {
      labels: ["Pending", "Approved", "Rejected", "Completed"],
      datasets: [
        {
          data: [pending, approved, rejected, completed],
          backgroundColor: ["#f9a825", "#2e7d32", "#c62828", "#1565c0"],
          borderWidth: 1
        }
      ]
    };
  };

  const getCropWiseChartData = () => {
    const stats = analyticsStats?.cropStats || [];
    const labels = stats.map(c => c._id || "Others");
    const data = stats.map(c => c.count);
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

  const getVillageWiseChartData = () => {
    const stats = analyticsStats?.villageStats || [];
    const labels = stats.map(v => v._id || "Other");
    const data = stats.map(v => v.count);
    return {
      labels,
      datasets: [
        {
          label: "Farmers count",
          data,
          backgroundColor: "#2e7d32",
          borderWidth: 1
        }
      ]
    };
  };

  const getBookingTrendsChartData = () => {
    const stats = analyticsStats?.equipmentStats || [];
    const labels = stats.map(e => e._id || "Other");
    const data = stats.map(e => e.count);
    return {
      labels,
      datasets: [
        {
          label: "Rentals",
          data,
          backgroundColor: "#0288d1",
          borderRadius: 6
        }
      ]
    };
  };

  const getTopProductsChartData = () => {
    const stats = analyticsStats?.productSalesStats || [];
    const labels = stats.map(p => p._id || "Other");
    const data = stats.map(p => p.count);
    return {
      labels,
      datasets: [
        {
          label: "Quantity Sold",
          data,
          backgroundColor: "#e65100",
          borderRadius: 6
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
    const matchesSearch = (
      (cr.farmerName || "").toLowerCase().includes(term) ||
      (cr.cropName || "").toLowerCase().includes(term) ||
      (cr.phone || "").includes(term) ||
      (cr.cropSaleId || "").toLowerCase().includes(term) ||
      (cr.village || "").toLowerCase().includes(term)
    );

    const matchesStatus = cropStatusFilter === "All" || cr.status === cropStatusFilter;

    let matchesTimeframe = true;
    if (cropTimeframeFilter !== "all") {
      const date = new Date(cr.submittedAt || cr.createdAt);
      const now = new Date();
      if (cropTimeframeFilter === "today") {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        matchesTimeframe = date >= todayStart;
      } else if (cropTimeframeFilter === "week") {
        const weekStart = new Date();
        weekStart.setDate(now.getDate() - 7);
        weekStart.setHours(0,0,0,0);
        matchesTimeframe = date >= weekStart;
      } else if (cropTimeframeFilter === "month") {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0,0,0,0);
        matchesTimeframe = date >= monthStart;
      }
    }

    return matchesSearch && matchesStatus && matchesTimeframe;
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

  const filteredProductBookings = (Array.isArray(productBookings) ? productBookings : []).filter(b => {
    const term = searchProductBooking.toLowerCase();
    return (
      (b.bookingId || "").toLowerCase().includes(term) ||
      (b.farmerName || "").toLowerCase().includes(term) ||
      (b.productName || "").toLowerCase().includes(term) ||
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
    const matchesSearch = (
      (p.productId || "").toLowerCase().includes(term) ||
      (p.name || "").toLowerCase().includes(term) ||
      (p.category || "").toLowerCase().includes(term)
    );
    const matchesCategory = filterProductCategory === "All" ||
      (p.category || "").toLowerCase() === filterProductCategory.toLowerCase();
    
    const calculatedStatus = getProductStatusText(p.stock);
    const matchesStatus = filterProductStatus === "All" ||
      calculatedStatus.toLowerCase() === filterProductStatus.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredEquipments = equipments.filter(eq => {
    const term = searchEquipment.toLowerCase();
    return (
      (eq.equipmentId || "").toLowerCase().includes(term) ||
      (eq.name || "").toLowerCase().includes(term) ||
      (eq.description || "").toLowerCase().includes(term)
    );
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const term = searchAuditLogs.toLowerCase();
    const matchesSearch = (
      (log.user || "").toLowerCase().includes(term) ||
      (log.userType || "").toLowerCase().includes(term) ||
      (log.module || "").toLowerCase().includes(term) ||
      (log.action || "").toLowerCase().includes(term) ||
      (log.details || "").toLowerCase().includes(term)
    );
    const matchesModule = filterAuditModule === "All" ||
      (log.module || "").toLowerCase() === filterAuditModule.toLowerCase();
    const matchesAction = filterAuditAction === "All" ||
      (log.action || "").toLowerCase() === filterAuditAction.toLowerCase();
    return matchesSearch && matchesModule && matchesAction;
  });

  // ── Paginated Computations ──
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedCrops = filteredCrops.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedProductBookings = filteredProductBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedFarmers = filteredFarmers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedEquipments = filteredEquipments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedAuditLogs = filteredAuditLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getModuleBadgeClass = (module) => {
    const m = String(module || "").toLowerCase().trim();
    if (["farmers", "products", "documents"].includes(m)) return "info";
    if (["bookings", "announcements"].includes(m)) return "success";
    if (["crops", "market prices", "settings"].includes(m)) return "warning";
    return "info";
  };

  const getActionBadgeClass = (action) => {
    const a = String(action || "").toLowerCase().trim();
    if (["create", "login", "approve"].includes(a)) return "success";
    if (a === "update") return "warning";
    if (a === "delete" || a === "reject") return "danger";
    return "info";
  };

  // ── Farmers Stats Calculations ──
  const totalFarmersCount = farmers.length;
  const uniqueVillagesCount = [...new Set(farmers.map(f => f.village?.trim()).filter(Boolean))].length;
  const totalLandHoldingSum = farmers.reduce((sum, f) => sum + (Number(f.landHolding) || 0), 0);
  const activeFarmersCount = farmers.filter(f => f.status === "Active").length;

  // ── 1. Protected Route check (Return Login Screen if not authenticated) ──
  if (!isAuthenticated) {
    if (showForgotPassword) {
      return (
        <div className="admin-login-overlay">
          <div className="admin-login-card glass-panel" style={{ maxWidth: "400px", width: "100%" }}>
            <div className="admin-login-header">
              <div className="admin-login-logo">
                <Sprout size={32} />
              </div>
              <h2 className="admin-login-title">Reset Password</h2>
              <span className="admin-login-subtitle">FPO Admin Password Recovery</span>
            </div>

            <form onSubmit={credentialsVerified ? handleForgotPasswordReset : handleVerifyCredentials} className="admin-login-form">
              <div className="admin-login-input-group">
                <label className="admin-login-label">Username</label>
                <input 
                  type="text"
                  placeholder="Enter username"
                  className="admin-login-input"
                  value={resetForm.username}
                  onChange={(e) => setResetForm(prev => ({ ...prev, username: e.target.value }))}
                  disabled={credentialsVerified}
                  required
                />
              </div>

              {/* Old Password Field */}
              <div className="admin-login-input-group" style={{ position: "relative" }}>
                <label className="admin-login-label">Old Password</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showResetOldPassword ? "text" : "password"} 
                    value={resetForm.oldPassword}
                    onChange={(e) => setResetForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                    className="admin-login-input" 
                    style={{ width: "100%", paddingRight: "40px" }}
                    placeholder="Enter old password"
                    disabled={credentialsVerified}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowResetOldPassword(!showResetOldPassword)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--admin-text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                    disabled={credentialsVerified}
                  >
                    {showResetOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password Fields - only visible if credentialsVerified is true */}
              {credentialsVerified && (
                <>
                  {/* New Password Field */}
                  <div className="admin-login-input-group" style={{ position: "relative" }}>
                    <label className="admin-login-label">New Password</label>
                    <div style={{ position: "relative" }}>
                      <input 
                        type={showResetNewPassword ? "text" : "password"} 
                        value={resetForm.newPassword}
                        onChange={(e) => setResetForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="admin-login-input" 
                        style={{ width: "100%", paddingRight: "40px" }}
                        placeholder="Enter new password"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--admin-text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        {showResetNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {resetForm.newPassword && (
                      <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--admin-text-muted)", fontWeight: "600" }}>Strength:</span>
                        <span style={{ 
                          fontSize: "11px", 
                          fontWeight: "700", 
                          color: getPasswordStrengthColor(getPasswordStrength(resetForm.newPassword))
                        }}>
                          {getPasswordStrength(resetForm.newPassword)}
                        </span>
                        <div style={{ flex: 1, height: "4px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden", display: "flex" }}>
                          <div style={{ 
                            width: getPasswordStrength(resetForm.newPassword) === "Weak" ? "33%" : getPasswordStrength(resetForm.newPassword) === "Medium" ? "66%" : "100%", 
                            height: "100%", 
                            backgroundColor: getPasswordStrengthColor(getPasswordStrength(resetForm.newPassword)),
                            transition: "width 0.3s ease" 
                          }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="admin-login-input-group" style={{ position: "relative" }}>
                    <label className="admin-login-label">Confirm Password</label>
                    <div style={{ position: "relative" }}>
                      <input 
                        type={showResetConfirmPassword ? "text" : "password"} 
                        value={resetForm.confirmPassword}
                        onChange={(e) => setResetForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="admin-login-input" 
                        style={{ width: "100%", paddingRight: "40px" }}
                        placeholder="Confirm new password"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--admin-text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        {showResetConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                {credentialsVerified ? (
                  <button type="submit" className="admin-login-btn" style={{ flex: 1, margin: 0 }} disabled={resettingPassword}>
                    {resettingPassword ? "Updating..." : "Update Password"}
                  </button>
                ) : (
                  <button type="submit" className="admin-login-btn" style={{ flex: 1, margin: 0 }} disabled={verifyingCredentials}>
                    {verifyingCredentials ? "Checking..." : "Verify Credentials"}
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setCredentialsVerified(false);
                    setResetForm({
                      username: "",
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                  }} 
                  className="admin-login-btn" 
                  style={{ flex: 1, margin: 0, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

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

            <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "15px" }}>
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)}
                style={{ background: "none", border: "none", color: "var(--admin-accent-orange)", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
              >
                Forgot Password?
              </button>
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
      {/* Sidebar Backdrop for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-backdrop open" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
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
            className={`nav-item ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => { setActiveTab("analytics"); setMobileMenuOpen(false); }}
          >
            <BarChart3 size={18} />
            <span>Analytics Center</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "announcements" ? "active" : ""}`}
            onClick={() => { setActiveTab("announcements"); setMobileMenuOpen(false); }}
          >
            <Megaphone size={18} />
            <span>Announcements</span>
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
            className={`nav-item ${activeTab === "equipments" ? "active" : ""}`}
            onClick={() => { setActiveTab("equipments"); setMobileMenuOpen(false); }}
          >
            <Coins size={18} />
            <span>Equipment Rates</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "product-bookings" ? "active" : ""}`}
            onClick={() => { setActiveTab("product-bookings"); setMobileMenuOpen(false); }}
          >
            <ShoppingCart size={18} />
            <span>Product Bookings</span>
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
            className={`nav-item ${activeTab === "documents" ? "active" : ""}`}
            onClick={() => { setActiveTab("documents"); setMobileMenuOpen(false); }}
          >
            <FolderOpen size={18} />
            <span>Document Center</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => { setActiveTab("reports"); setMobileMenuOpen(false); }}
          >
            <FileText size={18} />
            <span>Reports</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "audit-logs" ? "active" : ""}`}
            onClick={() => { setActiveTab("audit-logs"); setMobileMenuOpen(false); }}
          >
            <Clock size={18} />
            <span>Audit Logs</span>
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
              {activeTab === "analytics" && "Analytics Center"}
              {activeTab === "announcements" && "Announcements Management"}
              {activeTab === "contacts" && "Contact Inquiries"}
              {activeTab === "crops" && "Crop Selling Requests"}
              {activeTab === "bookings" && "Machinery Bookings"}
              {activeTab === "equipments" && "Equipment Rates Management"}
              {activeTab === "product-bookings" && "Product Bookings & Orders"}
              {activeTab === "farmers" && "Farmer Management"}
              {activeTab === "products" && "Product Inventory"}
              {activeTab === "documents" && "Document Center Management"}
              {activeTab === "reports" && "Report Generator Dashboard"}
              {activeTab === "audit-logs" && "Audit Trails & Logs"}
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
          {isOffline ? (
            <div className="api-offline-container glass-panel">
              <div className="offline-icon-wrapper">
                <AlertTriangle size={40} className="pulse-slow" />
              </div>
              <h2>Unable to connect to server</h2>
              <p>Please check your internet connection or verify if the backend server is running.</p>
              <button className="btn-action primary" onClick={fetchData}>
                <RefreshCw size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : loading ? (
            <div className="skeleton-wrapper">
              <div className="skeleton-table-header skeleton-pulse" style={{ height: "40px", width: "30%", marginBottom: "10px" }}></div>
              <div className="skeleton-table-header skeleton-pulse" style={{ height: "20px", width: "50%", marginBottom: "30px" }}></div>
              {["dashboard", "analytics"].includes(activeTab) && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", width: "100%", marginBottom: "2rem" }}>
                    <div className="skeleton-card skeleton-pulse"></div>
                    <div className="skeleton-card skeleton-pulse"></div>
                    <div className="skeleton-card skeleton-pulse"></div>
                    <div className="skeleton-card skeleton-pulse"></div>
                    <div className="skeleton-card skeleton-pulse"></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                    <div className="skeleton-chart skeleton-pulse"></div>
                    <div className="skeleton-chart skeleton-pulse"></div>
                  </div>
                </>
              )}
              {activeTab === "reports" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", width: "100%", marginBottom: "2rem" }}>
                    <div className="skeleton-card skeleton-pulse"></div>
                    <div className="skeleton-card skeleton-pulse"></div>
                    <div className="skeleton-card skeleton-pulse"></div>
                  </div>
                  <div className="skeleton-chart skeleton-pulse"></div>
                </>
              )}
              {["farmers", "products", "product-bookings", "contacts", "crops", "bookings", "notifications", "equipments", "announcements", "documents", "audit-logs"].includes(activeTab) && (
                <>
                  <div className="skeleton-table-header skeleton-pulse" style={{ marginBottom: "20px" }}></div>
                  <div className="skeleton-table-row skeleton-pulse" style={{ marginBottom: "12px" }}></div>
                  <div className="skeleton-table-row skeleton-pulse" style={{ marginBottom: "12px" }}></div>
                  <div className="skeleton-table-row skeleton-pulse" style={{ marginBottom: "12px" }}></div>
                  <div className="skeleton-table-row skeleton-pulse" style={{ marginBottom: "12px" }}></div>
                  <div className="skeleton-table-row skeleton-pulse" style={{ marginBottom: "12px" }}></div>
                </>
              )}
              {activeTab === "settings" && (
                <div className="skeleton-chart skeleton-pulse" style={{ height: "300px" }}></div>
              )}
            </div>
          ) : (
            <>
              {/* 1. Dashboard Tab */}
              {activeTab === "dashboard" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Dashboard Overview</h2>
                    <p className="module-description">Real-time analytics, critical metrics, and system activity status.</p>
                  </div>
                  {/* Overview Grid - 8 Cards */}
                  <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("farmers")}>
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

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <Sprout size={22} />
                        </div>
                        <span className="trend-badge positive">Crops</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalCropRequests || 0}</h3>
                        <p>Total Crop Requests</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("bookings")}>
                      <div className="card-top">
                        <div className="icon-wrapper blue">
                          <Tractor size={22} />
                        </div>
                        <span className="trend-badge positive">Rentals</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalBookings || 0}</h3>
                        <p>Total Equipment Bookings</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("product-bookings")}>
                      <div className="card-top">
                        <div className="icon-wrapper orange" style={{ background: "rgba(230, 81, 0, 0.15)", color: "var(--admin-accent-orange)" }}>
                          <ShoppingCart size={22} />
                        </div>
                        <span className="trend-badge positive">Orders</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalOrders || 0}</h3>
                        <p>Total Product Orders</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper green" style={{ background: "rgba(46, 125, 50, 0.15)", color: "var(--admin-accent-green)" }}>
                          <CheckCircle size={22} />
                        </div>
                        <span className="trend-badge positive">Approved</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.approvedCropRequests || 0}</h3>
                        <p>Approved Requests</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper blue" style={{ background: "rgba(211, 47, 47, 0.15)", color: "#d32f2f" }}>
                          <Ban size={22} />
                        </div>
                        <span className="trend-badge negative">Rejected</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.rejectedCropRequests || 0}</h3>
                        <p>Rejected Requests</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <CheckCircle size={22} />
                        </div>
                        <span className="trend-badge positive">Completed</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.completedCropRequests || 0}</h3>
                        <p>Completed Requests</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper orange" style={{ background: "rgba(230, 81, 0, 0.15)", color: "var(--admin-accent-orange)" }}>
                          <Coins size={22} />
                        </div>
                        <span className="trend-badge positive">Estimated</span>
                      </div>
                      <div className="card-bottom">
                        <h3>₹{(analyticsStats?.estimatedCropValue || 0).toLocaleString("en-IN")}</h3>
                        <p>Estimated Crop Value</p>
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

              {/* Analytics Center Tab */}
              {activeTab === "analytics" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Analytics Center</h2>
                    <p className="module-description">Comprehensive business intelligence, revenue metrics, and data charts.</p>
                  </div>

                  {/* 1. Overview Cards Grid */}
                  <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", marginBottom: "24px" }}>
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("farmers")}>
                      <div className="card-top">
                        <div className="icon-wrapper orange"><Users size={22} /></div>
                        <span className="trend-badge positive">Farmers</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalFarmers || 0}</h3>
                        <p>Total Farmers</p>
                      </div>
                    </div>
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper green"><Sprout size={22} /></div>
                        <span className="trend-badge positive">Crops</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalCropRequests || 0}</h3>
                        <p>Total Crop Requests</p>
                      </div>
                    </div>
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("bookings")}>
                      <div className="card-top">
                        <div className="icon-wrapper blue"><Tractor size={22} /></div>
                        <span className="trend-badge positive">Rentals</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalBookings || 0}</h3>
                        <p>Total Equipment Bookings</p>
                      </div>
                    </div>
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("product-bookings")}>
                      <div className="card-top">
                        <div className="icon-wrapper orange"><ShoppingCart size={22} /></div>
                        <span className="trend-badge positive">Orders</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.totalOrders || 0}</h3>
                        <p>Total Product Orders</p>
                      </div>
                    </div>
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper green"><CheckCircle size={22} /></div>
                        <span className="trend-badge positive">Approved</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.approvedCropRequests || 0}</h3>
                        <p>Approved Requests</p>
                      </div>
                    </div>
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper blue" style={{ color: "#d32f2f" }}><Ban size={22} /></div>
                        <span className="trend-badge negative">Rejected</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.rejectedCropRequests || 0}</h3>
                        <p>Rejected Requests</p>
                      </div>
                    </div>
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper green"><CheckCircle size={22} /></div>
                        <span className="trend-badge positive">Completed</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{analyticsStats?.completedCropRequests || 0}</h3>
                        <p>Completed Requests</p>
                      </div>
                    </div>
                    <div className="metric-card glass-panel" onClick={() => setActiveTab("crops")}>
                      <div className="card-top">
                        <div className="icon-wrapper orange"><Coins size={22} /></div>
                        <span className="trend-badge positive">Estimated</span>
                      </div>
                      <div className="card-bottom">
                        <h3>₹{(analyticsStats?.estimatedCropValue || 0).toLocaleString("en-IN")}</h3>
                        <p>Estimated Crop Value</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Revenue Analytics Section */}
                  <div className="glass-panel" style={{ padding: "24px", marginBottom: "24px" }}>
                    <h3 className="section-title" style={{ fontSize: "16px", color: "var(--admin-accent-green)", marginBottom: "16px", fontWeight: "600", borderBottom: "1px solid var(--admin-border-color)", paddingBottom: "8px" }}>
                      Revenue Analytics
                    </h3>
                    <div className="table-responsive-container" style={{ border: "none", boxShadow: "none", background: "transparent" }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Revenue Stream</th>
                            <th>Today</th>
                            <th>This Week</th>
                            <th>This Month</th>
                            <th>This Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-semibold">Expected Crop Revenue</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.today?.expectedCropRevenue || 0).toLocaleString("en-IN")}</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.week?.expectedCropRevenue || 0).toLocaleString("en-IN")}</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.month?.expectedCropRevenue || 0).toLocaleString("en-IN")}</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.year?.expectedCropRevenue || 0).toLocaleString("en-IN")}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold">Product Sales Revenue</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.today?.productSalesRevenue || 0).toLocaleString("en-IN")}</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.week?.productSalesRevenue || 0).toLocaleString("en-IN")}</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.month?.productSalesRevenue || 0).toLocaleString("en-IN")}</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.year?.productSalesRevenue || 0).toLocaleString("en-IN")}</td>
                          </tr>
                          <tr>
                            <td className="font-semibold">Equipment Booking Revenue</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.today?.equipmentBookingRevenue || 0).toLocaleString("en-IN")}</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.week?.equipmentBookingRevenue || 0).toLocaleString("en-IN")}</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.month?.equipmentBookingRevenue || 0).toLocaleString("en-IN")}</td>
                            <td>₹{(analyticsStats?.revenueBreakdown?.year?.equipmentBookingRevenue || 0).toLocaleString("en-IN")}</td>
                          </tr>
                          <tr style={{ background: "rgba(46, 125, 50, 0.1)", borderTop: "2px solid var(--admin-accent-green)" }}>
                            <td className="font-semibold" style={{ color: "var(--admin-accent-green)" }}>Total Platform Revenue</td>
                            <td className="font-bold" style={{ color: "var(--admin-accent-green)" }}>₹{(analyticsStats?.revenueBreakdown?.today?.totalPlatformRevenue || 0).toLocaleString("en-IN")}</td>
                            <td className="font-bold" style={{ color: "var(--admin-accent-green)" }}>₹{(analyticsStats?.revenueBreakdown?.week?.totalPlatformRevenue || 0).toLocaleString("en-IN")}</td>
                            <td className="font-bold" style={{ color: "var(--admin-accent-green)" }}>₹{(analyticsStats?.revenueBreakdown?.month?.totalPlatformRevenue || 0).toLocaleString("en-IN")}</td>
                            <td className="font-bold" style={{ color: "var(--admin-accent-green)" }}>₹{(analyticsStats?.revenueBreakdown?.year?.totalPlatformRevenue || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>


                  {/* 3. Charts Row */}
                  <div className="charts-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                    <div className="chart-wrapper glass-panel" style={{ height: "340px" }}>
                      <div className="chart-header">
                        <h4>Crop-wise Requests</h4>
                        <span>Total distribution</span>
                      </div>
                      <div className="chart-container" style={{ position: "relative", height: "260px" }}>
                        <Pie data={getCropWiseChartData()} options={getPieOptions("Crops Distribution")} />
                      </div>
                    </div>

                    <div className="chart-wrapper glass-panel" style={{ height: "340px" }}>
                      <div className="chart-header">
                        <h4>Village-wise Farmers</h4>
                        <span>Top villages</span>
                      </div>
                      <div className="chart-container" style={{ position: "relative", height: "260px" }}>
                        <Bar data={getVillageWiseChartData()} options={getChartOptions("Farmers by Village")} />
                      </div>
                    </div>

                    <div className="chart-wrapper glass-panel" style={{ height: "340px" }}>
                      <div className="chart-header">
                        <h4>Machinery Booking Trends</h4>
                        <span>Popular machinery</span>
                      </div>
                      <div className="chart-container" style={{ position: "relative", height: "260px" }}>
                        <Bar data={getBookingTrendsChartData()} options={getChartOptions("Bookings by Equipment")} />
                      </div>
                    </div>

                    <div className="chart-wrapper glass-panel" style={{ height: "340px" }}>
                      <div className="chart-header">
                        <h4>Top Selling Products</h4>
                        <span>Quantity sold</span>
                      </div>
                      <div className="chart-container" style={{ position: "relative", height: "260px" }}>
                        <Bar data={getTopProductsChartData()} options={getChartOptions("Top Products")} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Announcements Tab */}
              {activeTab === "announcements" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Announcements & Notice Board</h2>
                    <p className="module-description">Publish, edit, and categorize official notices, events, and training announcements for farmers.</p>
                  </div>

                  <div className="pane-header-actions">
                    <div className="search-bar-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search announcements..." 
                        value={searchCrop}
                        onChange={(e) => setSearchCrop(e.target.value)}
                      />
                    </div>
                    <button 
                      className="btn-action primary" 
                      onClick={() => {
                        setAnnouncementForm({ title: "", description: "", category: "General", priority: "low", imageUrl: "", published: true });
                        setShowAddAnnouncementModal(true);
                      }}
                    >
                      <span>+ Publish Notice</span>
                    </button>
                  </div>

                  {announcements.length === 0 ? (
                    <EmptyState 
                      icon={Megaphone} 
                      title="No Announcements Published" 
                      message="Get started by publishing your first notice to the farmer notice board." 
                      ctaText="+ Publish Notice"
                      onCtaClick={() => setShowAddAnnouncementModal(true)}
                    />
                  ) : (
                    <div className="table-responsive-container glass-panel">
                      <div className="table-responsive-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Category</th>
                              <th>Priority</th>
                              <th>Published</th>
                              <th>Created Date</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {announcements
                              .filter(a => !searchCrop || a.title.toLowerCase().includes(searchCrop.toLowerCase()) || a.category.toLowerCase().includes(searchCrop.toLowerCase()))
                              .map(a => {
                                return (
                                  <tr key={a._id}>
                                    <td className="font-semibold" data-label="Title">{a.title}</td>
                                    <td data-label="Category">
                                      <span className="badge-status success">{a.category}</span>
                                    </td>
                                    <td data-label="Priority">
                                      <span className={`badge-status ${a.priority === "high" ? "danger" : a.priority === "medium" ? "warning" : "success"}`}>
                                        {a.priority.toUpperCase()}
                                      </span>
                                    </td>
                                    <td data-label="Published">
                                      <span className={`badge-status ${a.published ? "success" : "danger"}`}>
                                        {a.published ? "YES" : "NO"}
                                      </span>
                                    </td>
                                    <td data-label="Created Date">{new Date(a.createdAt).toLocaleDateString("en-IN")}</td>
                                    <td className="text-right" data-label="Actions">
                                      <div className="action-button-group">
                                        <button 
                                          className="action-btn view" 
                                          title="Inspect notice"
                                          onClick={() => setSelectedItem({ type: "announcement", data: a })}
                                        >
                                          <Eye size={15} />
                                        </button>
                                        <button 
                                          className="action-btn edit" 
                                          title="Edit notice"
                                          onClick={() => {
                                            setSelectedAnnouncement(a);
                                            setAnnouncementForm({
                                              title: a.title,
                                              description: a.description,
                                              category: a.category,
                                              priority: a.priority,
                                              imageUrl: a.imageUrl,
                                              published: a.published
                                            });
                                            setShowEditAnnouncementModal(true);
                                          }}
                                        >
                                          <Pencil size={15} />
                                        </button>
                                        <button 
                                          className="action-btn delete" 
                                          title="Delete notice"
                                          onClick={() => handleAnnouncementDelete(a._id)}
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Contacts Tab */}
              {activeTab === "contacts" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Contact Inquiries</h2>
                    <p className="module-description">Manage and respond to feedback and queries from farmers and customers.</p>
                  </div>
                  <div className="pane-header-actions">
                    <div className="search-bar-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search by name, phone, type..." 
                        value={searchContactInput}
                        onChange={(e) => setSearchContactInput(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button 
                        className="btn-action primary" 
                        onClick={() => exportCSV("contacts", filteredContacts)}
                        disabled={filteredContacts.length === 0}
                      >
                        <Download size={15} />
                        <span>Export CSV</span>
                      </button>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportPDF("contacts", filteredContacts)}
                        disabled={filteredContacts.length === 0}
                      >
                        <FileText size={15} />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  {filteredContacts.length === 0 ? (
                    <EmptyState 
                      icon={MessageSquare} 
                      title="No Contact Inquiries" 
                      message={searchContactInput ? "No inquiries match your search criteria. Try a different query." : "There are no customer inquiries submitted yet."} 
                      ctaText={searchContactInput ? "Clear Search" : null}
                      onCtaClick={searchContactInput ? () => setSearchContactInput("") : null}
                    />
                  ) : (
                    <div className="table-responsive-container glass-panel">
                      <div className="table-responsive-wrapper">
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
                            {paginatedContacts.map(c => {
                              const dateStr = c.date || (c.createdAt ? c.createdAt.substring(0, 10) : "");
                              return (
                                <tr key={c._id}>
                                  <td className="font-semibold" data-label="Name">{c.fullName}</td>
                                  <td data-label="Phone">{c.phone}</td>
                                  <td className="text-dim" data-label="Email">{c.email || "N/A"}</td>
                                  <td data-label="Village">{c.village}</td>
                                  <td data-label="Inquiry Type">
                                    <span className={getStatusBadgeClass(c.inquiryType)}>{c.inquiryType}</span>
                                  </td>
                                  <td data-label="Date">{dateStr}</td>
                                  <td className="text-right" data-label="Actions">
                                    <div className="action-button-group">
                                      <button 
                                        className="action-btn view" 
                                        title="Inspect Details"
                                        onClick={() => setSelectedItem({ type: "contact", data: c })}
                                        tabIndex={0}
                                        aria-label="Inspect Details"
                                      >
                                        <Eye size={15} />
                                      </button>
                                      <button 
                                        className="action-btn delete" 
                                        title="Delete record"
                                        onClick={() => handleDelete("contacts", c._id)}
                                        tabIndex={0}
                                        aria-label="Delete record"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(filteredContacts.length)}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Crops Tab */}
              {activeTab === "crops" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Crop Sales Requests</h2>
                    <p className="module-description">Review crop selling proposals submitted by farmers for purchase approval.</p>
                  </div>
                  <div className="pane-header-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", flex: 1 }}>
                      <div className="search-bar-wrapper">
                        <Search size={16} />
                        <input 
                          type="text" 
                          placeholder="Search by farmer, crop, ID, village..." 
                          value={searchCropInput}
                          onChange={(e) => setSearchCropInput(e.target.value)}
                        />
                      </div>

                      {/* Filters Group */}
                      <div className="filter-group-wrapper" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        <div className="filter-select-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--admin-panel-bg)", border: "1px solid var(--admin-panel-border)", borderRadius: "12px", padding: "0 12px", height: "44px" }}>
                          <span style={{ fontSize: "12px", color: "var(--admin-text-secondary)", fontWeight: "600" }}>Status:</span>
                          <select 
                            value={cropStatusFilter}
                            onChange={(e) => {
                              setCropStatusFilter(e.target.value);
                              setCurrentPage(1);
                            }}
                            style={{ background: "transparent", border: "none", color: "var(--admin-text-primary)", fontWeight: "600", outline: "none", cursor: "pointer", fontSize: "13px" }}
                          >
                            <option value="All" style={{ background: "#07140a", color: "#fff" }}>All</option>
                            <option value="Pending" style={{ background: "#07140a", color: "#fff" }}>Pending</option>
                            <option value="Approved" style={{ background: "#07140a", color: "#fff" }}>Approved</option>
                            <option value="Rejected" style={{ background: "#07140a", color: "#fff" }}>Rejected</option>
                            <option value="Completed" style={{ background: "#07140a", color: "#fff" }}>Completed</option>
                          </select>
                        </div>

                        <div className="filter-select-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--admin-panel-bg)", border: "1px solid var(--admin-panel-border)", borderRadius: "12px", padding: "0 12px", height: "44px" }}>
                          <span style={{ fontSize: "12px", color: "var(--admin-text-secondary)", fontWeight: "600" }}>Timeframe:</span>
                          <select 
                            value={cropTimeframeFilter}
                            onChange={(e) => {
                              setCropTimeframeFilter(e.target.value);
                              setCurrentPage(1);
                            }}
                            style={{ background: "transparent", border: "none", color: "var(--admin-text-primary)", fontWeight: "600", outline: "none", cursor: "pointer", fontSize: "13px" }}
                          >
                            <option value="all" style={{ background: "#07140a", color: "#fff" }}>All Time</option>
                            <option value="today" style={{ background: "#07140a", color: "#fff" }}>Today</option>
                            <option value="week" style={{ background: "#07140a", color: "#fff" }}>This Week</option>
                            <option value="month" style={{ background: "#07140a", color: "#fff" }}>This Month</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button 
                        className="btn-action primary" 
                        onClick={() => exportCSV("crops", filteredCrops)}
                        disabled={filteredCrops.length === 0}
                      >
                        <Download size={15} />
                        <span>Export CSV</span>
                      </button>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportPDF("crops", filteredCrops)}
                        disabled={filteredCrops.length === 0}
                      >
                        <FileText size={15} />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  {filteredCrops.length === 0 ? (
                    <EmptyState 
                      icon={Sprout} 
                      title="No Crop Requests" 
                      message={searchCropInput ? "No crop requests match your search criteria. Try a different query." : "No crop sales requests have been submitted yet."} 
                      ctaText={searchCropInput ? "Clear Search" : null}
                      onCtaClick={searchCropInput ? () => setSearchCropInput("") : null}
                    />
                  ) : (
                    <div className="table-responsive-container glass-panel">
                      <div className="table-responsive-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Request ID</th>
                              <th>Farmer Name</th>
                              <th>Village</th>
                              <th>Crop Name</th>
                              <th>Quantity</th>
                              <th>Expected Price</th>
                              <th>Estimated Value</th>
                              <th>Phone</th>
                              <th>Status</th>
                              <th>Date</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedCrops.map(cr => {
                              const dateStr = cr.submittedAt ? new Date(cr.submittedAt).toLocaleDateString() : (cr.createdAt ? new Date(cr.createdAt).toLocaleDateString() : "");
                              return (
                                <tr key={cr._id}>
                                  <td className="font-semibold" data-label="Request ID">{cr.cropSaleId || "N/A"}</td>
                                  <td className="font-semibold" data-label="Farmer Name">{cr.farmerName}</td>
                                  <td data-label="Village">{cr.village || "N/A"}</td>
                                  <td className="text-accent font-semibold" data-label="Crop Name">{cr.cropName}</td>
                                  <td data-label="Quantity">{cr.quantity} {cr.unit || "Quintals"}</td>
                                  <td data-label="Expected Price">₹{cr.expectedPrice}</td>
                                  <td className="text-accent font-semibold" data-label="Estimated Value">₹{cr.estimatedValue || (cr.quantity * cr.expectedPrice)}</td>
                                  <td data-label="Phone">{cr.phone}</td>
                                  <td data-label="Status">
                                    <span className={getStatusBadgeClass(cr.status)}>
                                      {cr.status}
                                    </span>
                                  </td>
                                  <td data-label="Date">{dateStr}</td>
                                  <td className="text-right" data-label="Actions">
                                    <div className="action-button-group">
                                      <button 
                                        className="action-btn view" 
                                        title="Inspect Details"
                                        onClick={() => setSelectedItem({ type: "crop", data: cr })}
                                        tabIndex={0}
                                        aria-label="Inspect Details"
                                      >
                                        <Eye size={15} />
                                      </button>
                                      {cr.status === "Pending" && (
                                        <>
                                          <button 
                                            className="action-btn approve" 
                                            title="Approve Request"
                                            onClick={() => handleApproveCrop(cr._id)}
                                            tabIndex={0}
                                            aria-label="Approve Request"
                                          >
                                            <Check size={15} />
                                          </button>
                                          <button 
                                            className="action-btn reject" 
                                            title="Reject Request"
                                            onClick={() => {
                                              setRejectCropId(cr._id);
                                              setRejectRemarks("");
                                              setShowRejectModal(true);
                                            }}
                                            tabIndex={0}
                                            aria-label="Reject Request"
                                          >
                                            <Ban size={15} />
                                          </button>
                                        </>
                                      )}
                                      {cr.status === "Approved" && (
                                        <button 
                                          className="action-btn complete" 
                                          title="Mark Completed"
                                          onClick={() => handleCompleteCrop(cr._id)}
                                          tabIndex={0}
                                          aria-label="Mark Completed"
                                        >
                                          <CheckCircle size={15} />
                                        </button>
                                      )}
                                      <button 
                                        className="action-btn delete" 
                                        title="Delete record"
                                        onClick={() => handleDelete("crops", cr._id)}
                                        tabIndex={0}
                                        aria-label="Delete record"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(filteredCrops.length)}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Bookings Tab */}
              {activeTab === "bookings" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Machinery Hire Bookings</h2>
                    <p className="module-description">Approve, schedule, and manage agricultural equipment bookings.</p>
                  </div>
                  <div className="pane-header-actions">
                    <div className="search-bar-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search by booking details..." 
                        value={searchBookingInput}
                        onChange={(e) => setSearchBookingInput(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button 
                        className="btn-action primary" 
                        onClick={() => exportCSV("bookings", filteredBookings)}
                        disabled={filteredBookings.length === 0}
                      >
                        <Download size={15} />
                        <span>Export CSV</span>
                      </button>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportPDF("bookings", filteredBookings)}
                        disabled={filteredBookings.length === 0}
                      >
                        <FileText size={15} />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <EmptyState 
                      icon={Tractor} 
                      title="No Equipment Bookings" 
                      message={searchBookingInput ? "No equipment bookings match your search criteria. Try a different query." : "No equipment hire requests have been booked yet."} 
                      ctaText={searchBookingInput ? "Clear Search" : null}
                      onCtaClick={searchBookingInput ? () => setSearchBookingInput("") : null}
                    />
                  ) : (
                    <div className="table-responsive-container glass-panel">
                      <div className="table-responsive-wrapper">
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
                            {paginatedBookings.map(b => {
                              const dateStr = b.bookingDate || (b.createdAt ? b.createdAt.substring(0, 10) : "");
                              return (
                                <tr key={b._id}>
                                  <td className="font-semibold" data-label="Farmer Name">{b.farmerName}</td>
                                  <td className="text-accent" data-label="Equipment Name">{b.equipmentName}</td>
                                  <td data-label="Booking Date">{dateStr}</td>
                                  <td data-label="Duration">{b.duration || "1 Day"}</td>
                                  <td data-label="Phone">{b.phone}</td>
                                  <td data-label="Status">
                                    <span className={getStatusBadgeClass(b.status || "Pending")}>
                                      {b.status || "Pending"}
                                    </span>
                                  </td>
                                  <td className="text-right" data-label="Actions">
                                    <div className="action-button-group">
                                      <button 
                                        className="action-btn view" 
                                        title="Inspect Details"
                                        onClick={() => setSelectedItem({ type: "booking", data: b })}
                                        tabIndex={0}
                                        aria-label="Inspect Details"
                                      >
                                        <Eye size={15} />
                                      </button>
                                      {(b.status === "Pending" || !b.status) && (
                                        <>
                                          <button 
                                            className="action-btn approve" 
                                            title="Approve Booking"
                                            onClick={() => handleApproveBooking(b._id)}
                                            tabIndex={0}
                                            aria-label="Approve Booking"
                                          >
                                            <Check size={15} />
                                          </button>
                                          <button 
                                            className="action-btn reject" 
                                            title="Reject Booking"
                                            onClick={() => {
                                              setRejectCropId(b._id);
                                              setRejectType("booking");
                                              setRejectRemarks("");
                                              setShowRejectModal(true);
                                            }}
                                            tabIndex={0}
                                            aria-label="Reject Booking"
                                          >
                                            <Ban size={15} />
                                          </button>
                                        </>
                                      )}
                                      <button 
                                        className="action-btn delete" 
                                        title="Delete record"
                                        onClick={() => handleDelete("bookings", b._id)}
                                        tabIndex={0}
                                        aria-label="Delete record"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(filteredBookings.length)}
                    </div>
                  )}
                </div>
              )}

              {/* Product Bookings Tab */}
              {activeTab === "product-bookings" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Product Bookings & Orders</h2>
                    <p className="module-description">Track client booking requests for seeds, fertilizers, and tools. Adjust quantities to update stock.</p>
                  </div>
                  {/* Stats Cards */}
                  <div className="metrics-grid">
                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <ShoppingCart size={22} />
                        </div>
                        <span className="trend-badge positive">Bookings</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{productBookings.length}</h3>
                        <p>Total Bookings</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper orange">
                          <Clock size={22} />
                        </div>
                        <span className="trend-badge warning">Pending</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{productBookings.filter(b => b.status === "Pending").length}</h3>
                        <p>Pending Bookings</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <CheckCircle size={22} />
                        </div>
                        <span className="trend-badge positive">Confirmed</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{productBookings.filter(b => b.status === "Confirmed").length}</h3>
                        <p>Confirmed Bookings</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper green">
                          <Coins size={22} />
                        </div>
                        <span className="trend-badge positive">INR</span>
                      </div>
                      <div className="card-bottom">
                        <h3>₹{productBookings.filter(b => b.status === "Confirmed").reduce((sum, b) => sum + (b.totalPrice || 0), 0).toLocaleString("en-IN")}</h3>
                        <p>Total Confirmed Value</p>
                      </div>
                    </div>
                  </div>

                  <div className="pane-header-actions">
                    <div className="search-bar-wrapper">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search by booking details..." 
                        value={searchProductBookingInput}
                        onChange={(e) => setSearchProductBookingInput(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button 
                        className="btn-action primary" 
                        onClick={() => exportCSV("product-bookings", filteredProductBookings)}
                        disabled={filteredProductBookings.length === 0}
                      >
                        <Download size={15} />
                        <span>Export CSV</span>
                      </button>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportPDF("product-bookings", filteredProductBookings)}
                        disabled={filteredProductBookings.length === 0}
                      >
                        <FileText size={15} />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  {filteredProductBookings.length === 0 ? (
                    <EmptyState 
                      icon={ShoppingCart} 
                      title="No Product Bookings" 
                      message={searchProductBookingInput ? "No product orders match your search criteria. Try a different query." : "No agricultural product orders have been booked yet."} 
                      ctaText={searchProductBookingInput ? "Clear Search" : null}
                      onCtaClick={searchProductBookingInput ? () => setSearchProductBookingInput("") : null}
                    />
                  ) : (
                    <div className="table-responsive-container glass-panel">
                      <div className="table-responsive-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Booking ID</th>
                              <th>Farmer Name</th>
                              <th>Product Name</th>
                              <th>Qty</th>
                              <th>Total Price</th>
                              <th>Phone Number</th>
                              <th>Booking Date</th>
                              <th>Status</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedProductBookings.map(b => {
                              const dateStr = b.bookingDate || (b.createdAt ? b.createdAt.substring(0, 10) : "");
                              return (
                                <tr key={b._id}>
                                  <td className="font-semibold" data-label="Booking ID">{b.bookingId || "N/A"}</td>
                                  <td data-label="Farmer Name">{b.farmerName}</td>
                                  <td className="text-accent" data-label="Product Name">{b.productName}</td>
                                  <td data-label="Qty">{b.quantity}</td>
                                  <td data-label="Total Price">₹{(b.totalPrice || 0).toLocaleString("en-IN")}</td>
                                  <td data-label="Phone">{b.phone}</td>
                                  <td data-label="Booking Date">{dateStr}</td>
                                  <td data-label="Status">
                                    <span className={getStatusBadgeClass(b.status || "Pending")}>
                                      {b.status || "Pending"}
                                    </span>
                                  </td>
                                  <td className="text-right" data-label="Actions">
                                    <div className="action-button-group">
                                      <button 
                                        className="action-btn view" 
                                        title="Inspect Details"
                                        onClick={() => setViewingProductBooking(b)}
                                        tabIndex={0}
                                        aria-label="Inspect Details"
                                      >
                                        <Eye size={15} />
                                      </button>
                                      <button 
                                        className="action-btn edit" 
                                        title="Edit Status"
                                        onClick={() => setEditingProductBooking(b)}
                                        tabIndex={0}
                                        aria-label="Edit Status"
                                      >
                                        <Pencil size={15} />
                                      </button>
                                      <button 
                                        className="action-btn delete" 
                                        title="Delete record"
                                        onClick={() => handleDelete("product-bookings", b._id)}
                                        tabIndex={0}
                                        aria-label="Delete record"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(filteredProductBookings.length)}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Farmers Tab */}
              {activeTab === "farmers" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Farmer Directory</h2>
                    <p className="module-description">Register and manage records, land holdings, and active status for cooperative farmers.</p>
                  </div>
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
                        value={searchFarmerInput}
                        onChange={(e) => setSearchFarmerInput(e.target.value)}
                      />
                    </div>
                    <div className="button-actions-group" style={{ display: "flex", gap: "12px" }}>
                      <button className="btn-action primary" onClick={() => setShowFarmerModal(true)}>
                        <span>+ Add Farmer</span>
                      </button>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportCSV("farmers", filteredFarmers)}
                        disabled={filteredFarmers.length === 0}
                      >
                        <Download size={15} />
                        <span>Export CSV</span>
                      </button>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportPDF("farmers", filteredFarmers)}
                        disabled={filteredFarmers.length === 0}
                      >
                        <FileText size={15} />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  {filteredFarmers.length === 0 ? (
                    <EmptyState 
                      icon={Users} 
                      title="No Farmers Found" 
                      message={searchFarmerInput ? "No farmers match your search criteria. Try a different query." : "No farmers have been registered in the system yet."} 
                      ctaText={searchFarmerInput ? "Clear Search" : "Add Farmer"}
                      onCtaClick={searchFarmerInput ? () => setSearchFarmerInput("") : () => setShowFarmerModal(true)}
                    />
                  ) : (
                    <div className="table-responsive-container glass-panel">
                      <div className="table-responsive-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Farmer ID</th>
                              <th>Name</th>
                              <th>Phone</th>
                              <th>Village</th>
                              <th>Survey No</th>
                              <th>Aadhar No</th>
                              <th>Land Holding</th>
                              <th>Status</th>
                              <th>Joined Date</th>
                              <th>Last Login</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedFarmers.map(f => {
                              const dateStr = f.joinedDate ? f.joinedDate.substring(0, 10) : (f.createdAt ? f.createdAt.substring(0, 10) : "");
                              const lastLoginStr = f.lastLogin ? new Date(f.lastLogin).toLocaleString("en-IN") : "Never";
                              return (
                                <tr key={f._id}>
                                  <td className="font-semibold" data-label="Farmer ID">{f.farmerId}</td>
                                  <td data-label="Name">{f.name}</td>
                                  <td data-label="Phone">{f.phone}</td>
                                  <td data-label="Village">{f.village}</td>
                                  <td data-label="Survey No">{f.surveyNumber || "N/A"}</td>
                                  <td data-label="Aadhar No">{f.aadharNumber || "N/A"}</td>
                                  <td data-label="Land Holding">{f.landHolding ? `${f.landHolding} Acres` : "N/A"}</td>
                                  <td data-label="Status">
                                    <span className={getStatusBadgeClass(f.status || "Active")}>
                                      {f.status || "Active"}
                                    </span>
                                  </td>
                                  <td data-label="Joined Date">{dateStr}</td>
                                  <td data-label="Last Login">{lastLoginStr}</td>
                                  <td className="text-right" data-label="Actions">
                                    <div className="action-button-group">
                                      <button 
                                        className="action-btn view" 
                                        title="View Details"
                                        onClick={() => setViewingFarmer(f)}
                                        tabIndex={0}
                                        aria-label="View Details"
                                      >
                                        <Eye size={15} />
                                      </button>
                                      <button 
                                        className="action-btn edit" 
                                        title="Edit Record"
                                        onClick={() => setEditingFarmer(f)}
                                        tabIndex={0}
                                        aria-label="Edit Record"
                                      >
                                        <Pencil size={15} />
                                      </button>
                                      <button 
                                        className="action-btn delete" 
                                        title="Delete Farmer"
                                        onClick={() => handleFarmerDelete(f._id)}
                                        tabIndex={0}
                                        aria-label="Delete Farmer"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(filteredFarmers.length)}
                    </div>
                  )}
                </div>
              )}

              {/* 6. Products Tab */}
              {activeTab === "products" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Product Inventory</h2>
                    <p className="module-description">Monitor agricultural stock items, category classifications, and retail prices.</p>
                  </div>
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
                        <div className="icon-wrapper green" style={{ background: "rgba(46, 125, 50, 0.15)", color: "var(--admin-accent-green)" }}>
                          <Sprout size={22} />
                        </div>
                        <span className="trend-badge positive">In Stock</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{products.filter(p => p.stock > 10).length}</h3>
                        <p>In Stock</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper orange" style={{ background: "rgba(249, 115, 22, 0.15)", color: "#f97316" }}>
                          <AlertTriangle size={22} />
                        </div>
                        <span className="trend-badge warning" style={{ background: "rgba(249, 115, 22, 0.1)", color: "#f97316", border: "1px solid rgba(249, 115, 22, 0.2)" }}>Low</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{products.filter(p => p.stock <= 10 && p.stock > 0).length}</h3>
                        <p>Low Stock</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper red" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                          <X size={22} />
                        </div>
                        <span className="trend-badge negative">Out</span>
                      </div>
                      <div className="card-bottom">
                        <h3>{products.filter(p => p.stock === 0).length}</h3>
                        <p>Out of Stock</p>
                      </div>
                    </div>

                    <div className="metric-card glass-panel">
                      <div className="card-top">
                        <div className="icon-wrapper blue" style={{ background: "rgba(2, 136, 209, 0.15)", color: "var(--admin-accent-blue)" }}>
                          <Coins size={22} />
                        </div>
                        <span className="trend-badge positive">Value</span>
                      </div>
                      <div className="card-bottom">
                        <h3>₹{products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString('en-IN')}</h3>
                        <p>Inventory Value</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pane-header-actions" style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="search-bar-wrapper" style={{ flex: "1 1 300px", maxWidth: "360px" }}>
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search products by name, category or ID..." 
                        value={searchProductInput}
                        onChange={(e) => setSearchProductInput(e.target.value)}
                      />
                    </div>

                    {/* Filters Group */}
                    <div className="filter-group-wrapper" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                      <div className="filter-select-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--admin-panel-bg)", border: "1px solid var(--admin-panel-border)", borderRadius: "12px", padding: "0 12px", height: "44px" }}>
                        <span style={{ fontSize: "12px", color: "var(--admin-text-secondary)", fontWeight: "600" }}>Category:</span>
                        <select 
                          value={filterProductCategory}
                          onChange={(e) => setFilterProductCategory(e.target.value)}
                          style={{ background: "transparent", border: "none", color: "var(--admin-text-primary)", fontWeight: "600", outline: "none", cursor: "pointer", fontSize: "13px" }}
                        >
                          <option value="All" style={{ background: "#07140a", color: "#fff" }}>All</option>
                          <option value="Seeds" style={{ background: "#07140a", color: "#fff" }}>Seeds</option>
                          <option value="Fertilizers" style={{ background: "#07140a", color: "#fff" }}>Fertilizers</option>
                          <option value="Pesticides" style={{ background: "#07140a", color: "#fff" }}>Pesticides</option>
                          <option value="Farm Tools" style={{ background: "#07140a", color: "#fff" }}>Farm Tools</option>
                        </select>
                      </div>

                      <div className="filter-select-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--admin-panel-bg)", border: "1px solid var(--admin-panel-border)", borderRadius: "12px", padding: "0 12px", height: "44px" }}>
                        <span style={{ fontSize: "12px", color: "var(--admin-text-secondary)", fontWeight: "600" }}>Status:</span>
                        <select 
                          value={filterProductStatus}
                          onChange={(e) => setFilterProductStatus(e.target.value)}
                          style={{ background: "transparent", border: "none", color: "var(--admin-text-primary)", fontWeight: "600", outline: "none", cursor: "pointer", fontSize: "13px" }}
                        >
                          <option value="All" style={{ background: "#07140a", color: "#fff" }}>All</option>
                          <option value="In Stock" style={{ background: "#07140a", color: "#fff" }}>In Stock</option>
                          <option value="Low Stock" style={{ background: "#07140a", color: "#fff" }}>Low Stock</option>
                          <option value="Out Of Stock" style={{ background: "#07140a", color: "#fff" }}>Out Of Stock</option>
                        </select>
                      </div>
                    </div>

                    <div className="button-actions-group" style={{ display: "flex", gap: "12px" }}>
                      <button className="btn-action primary" onClick={() => setShowProductModal(true)}>
                        <span>+ Add Product</span>
                      </button>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportCSV("products", filteredProducts)}
                        disabled={filteredProducts.length === 0}
                      >
                        <Download size={15} />
                        <span>Export CSV</span>
                      </button>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportPDF("products", filteredProducts)}
                        disabled={filteredProducts.length === 0}
                      >
                        <FileText size={15} />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <EmptyState 
                      icon={Package} 
                      title="No Products Found" 
                      message={searchProductInput ? "No products match your search criteria. Try checking your filters." : "No products have been added to the inventory yet."} 
                      ctaText={searchProductInput ? "Clear Search" : "Add Product"}
                      onCtaClick={searchProductInput ? () => { setSearchProductInput(""); setFilterProductCategory("All"); setFilterProductStatus("All"); } : () => setShowProductModal(true)}
                    />
                  ) : (
                    <div className="table-responsive-container glass-panel">
                      <div className="table-responsive-wrapper">
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
                              <th>Last Updated</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedProducts.map(p => {
                              const dateStr = p.createdAt ? p.createdAt.substring(0, 10) : "";
                              const updatedStr = p.updatedAt ? `${p.updatedAt.substring(0, 10)} ${p.updatedAt.substring(11, 16)}` : "N/A";
                              const statusText = getProductStatusText(p.stock);
                              return (
                                <tr key={p._id}>
                                  <td className="font-semibold" data-label="Product ID">{p.productId}</td>
                                  <td data-label="Product Name">{p.name}</td>
                                  <td data-label="Category">{p.category}</td>
                                  <td data-label="Price">₹{p.price}</td>
                                  <td data-label="Stock">{p.stock} {p.unit || ""}</td>
                                  <td data-label="Status">
                                    <span className={getStatusBadgeClass(statusText)}>
                                      {statusText}
                                    </span>
                                  </td>
                                  <td data-label="Created Date">{dateStr}</td>
                                  <td data-label="Last Updated">{updatedStr}</td>
                                  <td className="text-right" data-label="Actions">
                                    <div className="action-button-group">
                                      <button 
                                        className="action-btn view" 
                                        title="View Product Details"
                                        onClick={() => setViewingProduct(p)}
                                        tabIndex={0}
                                        aria-label="View Product Details"
                                      >
                                        <Eye size={15} />
                                      </button>
                                      <button 
                                        className="action-btn edit" 
                                        title="Edit Product"
                                        onClick={() => setEditingProduct(p)}
                                        tabIndex={0}
                                        aria-label="Edit Product"
                                      >
                                        <Pencil size={15} />
                                      </button>
                                      <button 
                                        className="action-btn delete" 
                                        title="Delete Product"
                                        onClick={() => setDeletingProductItem(p)}
                                        tabIndex={0}
                                        aria-label="Delete Product"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(filteredProducts.length)}
                    </div>
                  )}
                </div>
              )}

              {/* Equipment Rates Tab */}
              {activeTab === "equipments" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Equipment Rates Management</h2>
                    <p className="module-description">Manage machinery hire charges, description details, and availability parameters.</p>
                  </div>
                  {/* Toolbar */}
                  <div className="pane-header-actions" style={{ marginBottom: "20px" }}>
                    <div className="search-bar-wrapper">
                      <Search className="search-icon" size={18} />
                      <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search by name, ID, or description..."
                        value={searchEquipmentInput}
                        onChange={(e) => setSearchEquipmentInput(e.target.value)}
                      />
                      {searchEquipmentInput && (
                        <button className="clear-search-btn" onClick={() => setSearchEquipmentInput("")}><X size={14} /></button>
                      )}
                    </div>
                    <div className="button-actions-group" style={{ display: "flex", gap: "12px" }}>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportCSV("equipments", filteredEquipments)}
                        disabled={filteredEquipments.length === 0}
                      >
                        <Download size={15} /> Export CSV
                      </button>
                      <button 
                        className="btn-action outline" 
                        onClick={() => exportPDF("equipments", filteredEquipments)}
                        disabled={filteredEquipments.length === 0}
                      >
                        <FileText size={15} /> Export PDF
                      </button>
                      <button className="btn-action primary" onClick={() => setShowEquipmentModal(true)}>
                        + Add Equipment
                      </button>
                    </div>
                  </div>

                  {filteredEquipments.length === 0 ? (
                    <div className="empty-state glass-panel">
                      <div className="empty-state-icon">
                        <Tractor size={48} style={{ opacity: 0.5 }} />
                      </div>
                      <h3>No equipment found</h3>
                      <p>Try searching for a different name, ID, or add a new equipment rate.</p>
                      {searchEquipment && (
                        <button className="admin-btn primary" onClick={() => setSearchEquipmentInput("")} style={{ marginTop: "15px" }}>
                          Clear Search
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive-wrapper">
                      <div className="table-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Equipment ID</th>
                              <th>Name</th>
                              <th>Description</th>
                              <th>Rate / Hour</th>
                              <th>Rate / Day</th>
                              <th>Status</th>
                              <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedEquipments.map((eq) => {
                              return (
                                <tr key={eq._id}>
                                  <td className="font-semibold text-primary">{eq.equipmentId}</td>
                                  <td className="font-semibold">{eq.name}</td>
                                  <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={eq.description}>
                                    {eq.description || "-"}
                                  </td>
                                  <td>₹{eq.rateHour}</td>
                                  <td>₹{eq.rateDay}</td>
                                  <td>
                                    <span className={getStatusBadgeClass(eq.available ? "active" : "inactive")}>
                                      {eq.available ? "Available" : "Unavailable"}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "right" }}>
                                    <div className="action-group" style={{ justifyContent: "flex-end" }}>
                                      <button 
                                        className="action-btn edit" 
                                        title="Edit Equipment"
                                        onClick={() => setEditingEquipment(eq)}
                                        tabIndex={0}
                                        aria-label="Edit Equipment"
                                      >
                                        <Pencil size={15} />
                                      </button>
                                      <button 
                                        className="action-btn delete" 
                                        title="Delete Equipment"
                                        onClick={() => handleEquipmentDelete(eq._id)}
                                        tabIndex={0}
                                        aria-label="Delete Equipment"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(filteredEquipments.length)}
                    </div>
                  )}

                  {/* Daily Slots Calendar Manager */}
                  <div className="slots-manager-section" style={{ marginTop: "40px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "30px" }}>
                    <div className="module-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <div>
                        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#fff" }}>Daily Booking Slots Calendar</h3>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                          Open specific booking dates for each equipment. Customers can only book on dates with open slots.
                        </p>
                      </div>
                      <button className="admin-btn primary" onClick={() => setShowSlotModal(true)}>
                        Open New Slot
                      </button>
                    </div>

                    {equipmentSlots.length === 0 ? (
                      <div className="empty-state" style={{ padding: "40px 20px" }}>
                        <p style={{ color: "rgba(255,255,255,0.5)" }}>No booking slots are currently open. Click \"Open New Slot\" to schedule availability.</p>
                      </div>
                    ) : (
                      <div className="table-responsive-wrapper">
                        <div className="table-wrapper">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Equipment Name</th>
                                <th>Booking Date</th>
                                <th>Opened Slots</th>
                                <th>Booked Count</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {equipmentSlots.map((slot) => {
                                const isFilled = slot.bookedCount >= slot.slots;
                                return (
                                  <tr key={slot._id}>
                                    <td className="font-semibold text-primary">{slot.equipmentName}</td>
                                    <td>{new Date(slot.date).toLocaleDateString("en-IN")}</td>
                                    <td>{slot.slots}</td>
                                    <td>{slot.bookedCount}</td>
                                    <td>
                                      <span className={getStatusBadgeClass(isFilled ? "inactive" : "active")}>
                                        {isFilled ? "All Filled" : "Slots Available"}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      <button 
                                        className="action-btn delete" 
                                        title="Delete/Close Slot"
                                        onClick={() => handleSlotDelete(slot._id)}
                                        disabled={slot.bookedCount > 0}
                                        style={{ opacity: slot.bookedCount > 0 ? 0.4 : 1 }}
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 7. Reports & Analytics Tab */}
              {activeTab === "reports" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Report Generator Dashboard</h2>
                    <p className="module-description">Export data files and download official PDF/Excel reports of FPC activities.</p>
                  </div>
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
                        <option value="custom" style={{ background: "#0d2315", color: "#fff" }}>Custom Range</option>
                      </select>
                    </div>

                    {analyticsTimeframe === "custom" && (
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "var(--admin-text-secondary)", fontWeight: "600" }}>Start:</span>
                        <input 
                          type="date" 
                          value={reportStartDate} 
                          onChange={(e) => setReportStartDate(e.target.value)} 
                          className="admin-login-input" 
                          style={{ padding: "4px 8px", margin: 0, width: "130px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--admin-border-color)", color: "#fff", borderRadius: "4px" }} 
                        />
                        <span style={{ fontSize: "12px", color: "var(--admin-text-secondary)", fontWeight: "600" }}>End:</span>
                        <input 
                          type="date" 
                          value={reportEndDate} 
                          onChange={(e) => setReportEndDate(e.target.value)} 
                          className="admin-login-input" 
                          style={{ padding: "4px 8px", margin: 0, width: "130px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--admin-border-color)", color: "#fff", borderRadius: "4px" }} 
                        />
                      </div>
                    )}
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

                      {/* 6. Product Orders */}
                      <div className="report-card glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h4 style={{ fontSize: "15px", color: "var(--admin-text-primary)", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <ShoppingCart size={16} style={{ color: "var(--admin-accent-green)" }} />
                            <span>Product Orders Report</span>
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginBottom: "15px" }}>Log of seeds, fertilizers, and pesticide orders submitted by farmers, with quantities and booking statuses.</p>
                        </div>
                        <div className="action-buttons-stack" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button className="btn-action small pdf" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("orders", "pdf")}>PDF</button>
                          <button className="btn-action small excel" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("orders", "excel")}>Excel</button>
                          <button className="btn-action small csv" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("orders", "csv")}>CSV</button>
                        </div>
                      </div>

                      {/* 7. Platform Revenue */}
                      <div className="report-card glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h4 style={{ fontSize: "15px", color: "var(--admin-text-primary)", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Coins size={16} style={{ color: "var(--admin-accent-green)" }} />
                            <span>Platform Revenue Report</span>
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginBottom: "15px" }}>Financial report summarizing revenue streams from crop transactions, machinery rentals, and retail sales.</p>
                        </div>
                        <div className="action-buttons-stack" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button className="btn-action small pdf" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("revenue", "pdf")}>PDF</button>
                          <button className="btn-action small excel" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("revenue", "excel")}>Excel</button>
                          <button className="btn-action small csv" style={{ flex: "1 1 0" }} onClick={() => handleExportReport("revenue", "csv")}>CSV</button>
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
                    <div className="chart-wrapper glass-panel" style={{ height: "300px", padding: "16px" }}>
                      <Doughnut data={getCropSalesStatusChartData()} options={getPieOptions("Crop Sales Request Status")} />
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

              {/* Document Center Tab */}
              {activeTab === "documents" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Document Center Management</h2>
                    <p className="module-description">Upload official guides, government schemes, training manuals, and FPO forms for farmer download access.</p>
                  </div>

                  <div className="pane-header-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                    <div className="search-bar-wrapper" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={{ position: "relative" }}>
                        <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--admin-text-secondary)" }} />
                        <input 
                          type="text" 
                          placeholder="Search documents..." 
                          value={searchDoc}
                          onChange={(e) => setSearchDoc(e.target.value)}
                          style={{ paddingLeft: "32px", height: "36px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--admin-border-color)", color: "#fff", outline: "none" }}
                        />
                      </div>
                      <select
                        value={filterDocCategory}
                        onChange={(e) => setFilterDocCategory(e.target.value)}
                        style={{ height: "36px", padding: "0 10px", borderRadius: "8px", background: "rgba(13, 35, 21, 0.9)", border: "1px solid var(--admin-border-color)", color: "#fff", outline: "none", cursor: "pointer" }}
                      >
                        <option value="All">All Categories</option>
                        <option value="Government Schemes">Government Schemes</option>
                        <option value="Training Manuals">Training Manuals</option>
                        <option value="Crop Guides">Crop Guides</option>
                        <option value="FPO Forms">FPO Forms</option>
                        <option value="KDKFPCL Forms">KDKFPCL Forms</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <button 
                      className="btn-action primary" 
                      onClick={() => {
                        setDocumentForm({ title: "", description: "", category: "Government Schemes" });
                        setDocumentFile(null);
                        setShowDocumentModal(true);
                      }}
                      style={{ background: "var(--admin-accent-green)", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                    >
                      <span>+ Upload Document</span>
                    </button>
                  </div>

                  {documents.filter(d => {
                    const matchesSearch = d.title.toLowerCase().includes(searchDoc.toLowerCase()) || (d.description && d.description.toLowerCase().includes(searchDoc.toLowerCase()));
                    const matchesCat = filterDocCategory === "All" || d.category === filterDocCategory;
                    return matchesSearch && matchesCat;
                  }).length === 0 ? (
                    <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-secondary)" }}>
                      <FolderOpen size={48} style={{ color: "var(--admin-accent-green)", marginBottom: "12px", opacity: 0.5 }} />
                      <h3>No Documents Found</h3>
                      <p>Upload files to share important resources with registered farmers.</p>
                    </div>
                  ) : (
                    <div className="table-responsive-container glass-panel">
                      <div className="table-responsive-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Document Title</th>
                              <th>Category</th>
                              <th>File Details</th>
                              <th>Uploaded Date</th>
                              <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.filter(d => {
                              const matchesSearch = d.title.toLowerCase().includes(searchDoc.toLowerCase()) || (d.description && d.description.toLowerCase().includes(searchDoc.toLowerCase()));
                              const matchesCat = filterDocCategory === "All" || d.category === filterDocCategory;
                              return matchesSearch && matchesCat;
                            }).map((doc) => {
                              return (
                                <tr key={doc._id}>
                                  <td>
                                    <div className="font-semibold text-primary" style={{ fontSize: "14px", color: "var(--admin-accent-green)" }}>{doc.title}</div>
                                    <div style={{ fontSize: "11px", color: "var(--admin-text-secondary)", marginTop: "4px" }}>{doc.description || "No description provided."}</div>
                                  </td>
                                  <td>
                                    <span className="trend-badge positive" style={{ textTransform: "capitalize", background: "rgba(46, 125, 50, 0.15)", color: "var(--admin-accent-green)", border: "1px solid rgba(46, 125, 50, 0.2)" }}>
                                      {doc.category}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{doc.fileName}</div>
                                    <div style={{ fontSize: "11px", color: "var(--admin-text-secondary)" }}>{doc.fileSize}</div>
                                  </td>
                                  <td>
                                    {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                                  </td>
                                  <td style={{ textAlign: "right" }}>
                                    <div className="action-group" style={{ justifyContent: "flex-end", display: "flex", gap: "8px" }}>
                                      <a 
                                        href={`${API_BASE.replace("/api", "")}${doc.fileUrl}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="action-btn edit" 
                                        title="Download Document"
                                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", background: "rgba(197, 168, 128, 0.2)", border: "1px solid var(--admin-accent-gold)", color: "var(--admin-accent-gold)", borderRadius: "4px" }}
                                      >
                                        <Download size={14} />
                                      </a>
                                      <button 
                                        className="action-btn delete" 
                                        title="Delete Document"
                                        onClick={() => handleDocumentDelete(doc._id)}
                                        style={{ width: "30px", height: "30px", background: "rgba(211, 47, 47, 0.2)", border: "1px solid #ff5252", color: "#ff5252", borderRadius: "4px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Upload Document Modal */}
                  {showDocumentModal && (
                    <div className="admin-modal-overlay">
                      <div className="admin-modal-content glass-panel" style={{ maxWidth: "500px", width: "100%", padding: "24px" }}>
                        <div className="admin-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <h3 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>Upload New Document</h3>
                          <button onClick={() => setShowDocumentModal(false)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
                            <X size={20} />
                          </button>
                        </div>
                        <form onSubmit={handleDocumentUpload}>
                          <div style={{ marginBottom: "16px" }}>
                            <label className="admin-login-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Document Title *</label>
                            <input 
                              type="text" 
                              required 
                              value={documentForm.title}
                              onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                              placeholder="e.g. Organic Farming Guide"
                              className="admin-login-input"
                              style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--admin-border-color)", padding: "10px", borderRadius: "6px", color: "#fff" }}
                            />
                          </div>

                          <div style={{ marginBottom: "16px" }}>
                            <label className="admin-login-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Description</label>
                            <textarea 
                              value={documentForm.description}
                              onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                              placeholder="Brief overview of what this file contains..."
                              className="admin-login-input"
                              rows={3}
                              style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--admin-border-color)", padding: "10px", borderRadius: "6px", color: "#fff", resize: "none" }}
                            />
                          </div>

                          <div style={{ marginBottom: "16px" }}>
                            <label className="admin-login-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Category *</label>
                            <select 
                              value={documentForm.category}
                              onChange={(e) => setDocumentForm({ ...documentForm, category: e.target.value })}
                              className="admin-login-input"
                              style={{ width: "100%", background: "rgba(13, 35, 21, 0.9)", border: "1px solid var(--admin-border-color)", padding: "10px", borderRadius: "6px", color: "#fff" }}
                            >
                              <option value="Government Schemes">Government Schemes</option>
                              <option value="Training Manuals">Training Manuals</option>
                              <option value="Crop Guides">Crop Guides</option>
                              <option value="FPO Forms">FPO Forms</option>
                              <option value="KDKFPCL Forms">KDKFPCL Forms</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div style={{ marginBottom: "20px" }}>
                            <label className="admin-login-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Select File (PDF, DOCX, Images) *</label>
                            <input 
                              type="file" 
                              required 
                              accept=".pdf,.docx,.doc,image/*"
                              onChange={(e) => setDocumentFile(e.target.files[0])}
                              style={{ color: "#fff", fontSize: "13px" }}
                            />
                          </div>

                          <div className="admin-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button 
                              type="button" 
                              onClick={() => setShowDocumentModal(false)}
                              className="btn-action outline"
                              style={{ padding: "8px 16px", borderRadius: "6px", background: "transparent", border: "1px solid var(--admin-border-color)", color: "#fff", cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              disabled={uploadingDoc}
                              className="btn-action primary"
                              style={{ padding: "8px 16px", borderRadius: "6px", background: "var(--admin-accent-green)", border: "none", color: "#fff", cursor: "pointer", opacity: uploadingDoc ? 0.6 : 1 }}
                            >
                              {uploadingDoc ? "Uploading..." : "Upload"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 8. Notification Center Tab */}
              {activeTab === "notifications" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Notification Center</h2>
                    <p className="module-description">Browse recent activity alerts, system warning logs, and dispatch alerts.</p>
                  </div>
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
                          value={notificationSearchInput}
                          onChange={(e) => setNotificationSearchInput(e.target.value)}
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
                  <div className="module-header">
                    <h2 className="module-title">System Settings</h2>
                    <p className="module-description">Configure dashboard behaviors, SMS notifications, and Telegram channel bots.</p>
                  </div>
                  <div className="settings-container glass-panel" style={{ padding: "30px", borderRadius: "16px" }}>
                    
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

              {/* 10. Audit Logs Tab */}
              {activeTab === "audit-logs" && (
                <div className="tab-pane">
                  <div className="module-header">
                    <h2 className="module-title">Audit Trails & Logs</h2>
                    <p className="module-description">Monitor and audit administrative actions, farmer authentication, and business transaction updates.</p>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pane-header-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                    <div className="search-bar-wrapper" style={{ flex: "1 1 300px" }}>
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search logs by username, action, or details..." 
                        value={searchAuditLogsInput}
                        onChange={(e) => setSearchAuditLogsInput(e.target.value)}
                      />
                    </div>

                    <div className="search-bar-wrapper" style={{ minWidth: "180px" }}>
                      <span style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginRight: "8px", fontWeight: "600" }}>Module:</span>
                      <select 
                        value={filterAuditModule}
                        onChange={(e) => {
                          setFilterAuditModule(e.target.value);
                          setCurrentPage(1);
                        }}
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
                        <option value="All" style={{ background: "#0d2315", color: "#fff" }}>All Modules</option>
                        <option value="Farmers" style={{ background: "#0d2315", color: "#fff" }}>Farmers</option>
                        <option value="Crops" style={{ background: "#0d2315", color: "#fff" }}>Crops</option>
                        <option value="Bookings" style={{ background: "#0d2315", color: "#fff" }}>Bookings</option>
                        <option value="Products" style={{ background: "#0d2315", color: "#fff" }}>Products</option>
                        <option value="Announcements" style={{ background: "#0d2315", color: "#fff" }}>Announcements</option>
                        <option value="Market Prices" style={{ background: "#0d2315", color: "#fff" }}>Market Prices</option>
                        <option value="Documents" style={{ background: "#0d2315", color: "#fff" }}>Documents</option>
                        <option value="Settings" style={{ background: "#0d2315", color: "#fff" }}>Settings</option>
                      </select>
                    </div>

                    <div className="search-bar-wrapper" style={{ minWidth: "180px" }}>
                      <span style={{ fontSize: "12px", color: "var(--admin-text-secondary)", marginRight: "8px", fontWeight: "600" }}>Action:</span>
                      <select 
                        value={filterAuditAction}
                        onChange={(e) => {
                          setFilterAuditAction(e.target.value);
                          setCurrentPage(1);
                        }}
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
                        <option value="All" style={{ background: "#0d2315", color: "#fff" }}>All Actions</option>
                        <option value="CREATE" style={{ background: "#0d2315", color: "#fff" }}>CREATE</option>
                        <option value="UPDATE" style={{ background: "#0d2315", color: "#fff" }}>UPDATE</option>
                        <option value="DELETE" style={{ background: "#0d2315", color: "#fff" }}>DELETE</option>
                        <option value="APPROVE" style={{ background: "#0d2315", color: "#fff" }}>APPROVE</option>
                        <option value="REJECT" style={{ background: "#0d2315", color: "#fff" }}>REJECT</option>
                        <option value="LOGIN" style={{ background: "#0d2315", color: "#fff" }}>LOGIN</option>
                      </select>
                    </div>
                  </div>

                  {/* Audit Logs Table */}
                  {filteredAuditLogs.length === 0 ? (
                    <EmptyState 
                      icon={Clock} 
                      title="No Audit Logs Found" 
                      message="No audit records match your current search and filters."
                    />
                  ) : (
                    <div className="pane-content-card glass-panel" style={{ padding: "20px" }}>
                      <div className="table-responsive">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Timestamp</th>
                              <th>User</th>
                              <th>Role</th>
                              <th>Module / Action</th>
                              <th>Description</th>
                              <th>IP Address</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedAuditLogs.map((log) => {
                              const moduleColorClass = getModuleBadgeClass(log.module);
                              const actionColorClass = getActionBadgeClass(log.action);
                              return (
                                <tr key={log._id}>
                                  <td className="text-secondary font-semibold" style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                                    {new Date(log.createdAt).toLocaleString("en-IN")}
                                  </td>
                                  <td className="font-semibold text-primary">{log.user || "System"}</td>
                                  <td>
                                    <span className={getStatusBadgeClass(log.userType)}>
                                      {log.userType || "System"}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge-status ${moduleColorClass}`} style={{ marginRight: "6px" }}>
                                      {log.module}
                                    </span>
                                    <span className={`badge-status ${actionColorClass}`}>
                                      {log.action}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: "13px", lineHeight: "1.4", color: "var(--admin-text-primary)" }}>
                                    {log.details}
                                  </td>
                                  <td className="text-secondary" style={{ fontFamily: "monospace", fontSize: "12px" }}>
                                    {log.ipAddress || "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(filteredAuditLogs.length)}
                    </div>
                  )}
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
                {selectedItem.type === "announcement" && "Announcement Details"}
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
                    <span className={`value ${getStatusBadgeClass(selectedItem.data.inquiryType)}`}>{selectedItem.data.inquiryType}</span>
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
                <>
                  <div className="details-list">
                    <div className="detail-item">
                      <span className="label">Request ID:</span>
                      <span className="value font-semibold">{selectedItem.data.cropSaleId || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Farmer Name:</span>
                      <span className="value font-semibold">{selectedItem.data.farmerName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Village:</span>
                      <span className="value">{selectedItem.data.village || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Crop Name:</span>
                      <span className="value text-accent font-semibold">{selectedItem.data.cropName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Quantity Offered:</span>
                      <span className="value">{selectedItem.data.quantity} {selectedItem.data.unit || "Quintals"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Expected Price:</span>
                      <span className="value">₹{selectedItem.data.expectedPrice} per {selectedItem.data.unit || "Quintals"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Estimated Value:</span>
                      <span className="value text-accent font-semibold">₹{selectedItem.data.estimatedValue || (selectedItem.data.quantity * selectedItem.data.expectedPrice)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Phone Number:</span>
                      <span className="value">{selectedItem.data.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Approval Status:</span>
                      <span className={`value ${getStatusBadgeClass(selectedItem.data.status || "Pending")}`}>
                        {selectedItem.data.status || "Pending"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Submitted Date:</span>
                      <span className="value">{selectedItem.data.submittedAt ? new Date(selectedItem.data.submittedAt).toLocaleString() : (selectedItem.data.createdAt ? new Date(selectedItem.data.createdAt).toLocaleString() : "N/A")}</span>
                    </div>
                    {selectedItem.data.approvedAt && (
                      <div className="detail-item">
                        <span className="label">Approved Date:</span>
                        <span className="value">{new Date(selectedItem.data.approvedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedItem.data.description && (
                      <div className="detail-item full-width">
                        <span className="label">Description / Harvest Details:</span>
                        <span className="value text-block">{selectedItem.data.description}</span>
                      </div>
                    )}
                    {selectedItem.data.adminRemarks && (
                      <div className="detail-item full-width" style={{ borderLeft: "4px solid var(--admin-danger, #ef4444)", paddingLeft: "12px", background: "rgba(239, 68, 68, 0.05)" }}>
                        <span className="label" style={{ color: "var(--admin-danger, #ef4444)" }}>Admin Remarks / Rejection Reason:</span>
                        <span className="value text-block font-semibold">{selectedItem.data.adminRemarks}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Timeline */}
                  <div className="timeline-wrapper" style={{ marginTop: "24px", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.08)" }}>
                    <span className="label" style={{ display: "block", marginBottom: "16px", fontWeight: "600", fontSize: "13px", color: "var(--admin-text-secondary)" }}>Request Timeline:</span>
                    <div style={{ display: "flex", justifyContent: "space-between", position: "relative", padding: "0 15px" }}>
                      {/* Line behind steps */}
                      <div style={{
                        position: "absolute",
                        top: "14px",
                        left: "12%",
                        right: "12%",
                        height: "3px",
                        background: "rgba(255, 255, 255, 0.1)",
                        zIndex: 0
                      }}>
                        <div style={{
                          height: "100%",
                          width: selectedItem.data.status === "Completed" ? "100%" : selectedItem.data.status === "Approved" ? "50%" : "0%",
                          background: selectedItem.data.status === "Rejected" ? "#ef4444" : "var(--admin-accent-blue, #3b82f6)",
                          transition: "width 0.3s ease"
                        }} />
                      </div>

                      {/* Step 1: Submitted */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, position: "relative" }}>
                        <div style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "#2e7d32",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: "12px"
                        }}>✓</div>
                        <span style={{ fontSize: "11px", marginTop: "6px", color: "var(--admin-text-primary)", fontWeight: "500" }}>Submitted</span>
                      </div>

                      {/* Step 2: Approved / Rejected */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, position: "relative" }}>
                        <div style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: selectedItem.data.status === "Rejected" ? "#ef4444" : (["Approved", "Completed"].includes(selectedItem.data.status) ? "#2e7d32" : "#424242"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: "12px"
                        }}>
                          {selectedItem.data.status === "Rejected" ? "✗" : (["Approved", "Completed"].includes(selectedItem.data.status) ? "✓" : "2")}
                        </div>
                        <span style={{ fontSize: "11px", marginTop: "6px", color: selectedItem.data.status === "Rejected" ? "#ef4444" : (["Approved", "Completed"].includes(selectedItem.data.status) ? "var(--admin-text-primary)" : "var(--admin-text-secondary)"), fontWeight: "500" }}>
                          {selectedItem.data.status === "Rejected" ? "Rejected" : "Approved"}
                        </span>
                      </div>

                      {/* Step 3: Completed */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, position: "relative" }}>
                        <div style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: selectedItem.data.status === "Completed" ? "#2e7d32" : "#424242",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: "12px"
                        }}>
                          {selectedItem.data.status === "Completed" ? "✓" : "3"}
                        </div>
                        <span style={{ fontSize: "11px", marginTop: "6px", color: selectedItem.data.status === "Completed" ? "var(--admin-text-primary)" : "var(--admin-text-secondary)", fontWeight: "500" }}>Completed</span>
                      </div>
                    </div>
                  </div>
                </>
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
                    <span className={`value ${getStatusBadgeClass(selectedItem.data.status || "Pending")}`}>
                      {selectedItem.data.status || "Pending"}
                    </span>
                  </div>
                  {selectedItem.data.adminRemarks && (
                    <div className="detail-item full-width" style={{ borderLeft: "4px solid var(--admin-danger, #ef4444)", paddingLeft: "12px", background: "rgba(239, 68, 68, 0.05)" }}>
                      <span className="label" style={{ color: "var(--admin-danger, #ef4444)" }}>Admin Remarks / Rejection Reason:</span>
                      <span className="value text-block font-semibold">{selectedItem.data.adminRemarks}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedItem.type === "announcement" && (
                <div className="details-list">
                  <div className="detail-item">
                    <span className="label">Title:</span>
                    <span className="value font-semibold">{selectedItem.data.title}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Category:</span>
                    <span className="value text-accent font-semibold">{selectedItem.data.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Priority Level:</span>
                    <span className={`value font-semibold ${selectedItem.data.priority === "high" ? "badge-status danger" : selectedItem.data.priority === "medium" ? "badge-status warning" : "badge-status success"}`}>
                      {selectedItem.data.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`value font-semibold ${selectedItem.data.published ? "badge-status success" : "badge-status danger"}`}>
                      {selectedItem.data.published ? "Published" : "Draft (Hidden)"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Publish Date:</span>
                    <span className="value">{new Date(selectedItem.data.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                  {selectedItem.data.imageUrl && (
                    <div className="detail-item full-width">
                      <span className="label">Image URL:</span>
                      <span className="value"><a href={selectedItem.data.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--admin-accent-green)", textDecoration: "underline" }}>{selectedItem.data.imageUrl}</a></span>
                    </div>
                  )}
                  <div className="detail-item full-width">
                    <span className="label">Notice Content:</span>
                    <span className="value text-block" style={{ whiteSpace: "pre-wrap" }}>{selectedItem.data.description}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn-modal-close" onClick={() => setSelectedItem(null)}>Close Inspector</button>
                {selectedItem.type === "booking" && selectedItem.data.status === "Pending" && (
                  <>
                    <button 
                      className="btn-modal-action approve"
                      style={{ background: "#10b981", color: "#fff", border: "1px solid #10b981", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                      onClick={() => handleApproveBooking(selectedItem.data._id)}
                    >
                      Approve Booking
                    </button>
                    <button 
                      className="btn-modal-action reject"
                      style={{ background: "#ef4444", color: "#fff", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                      onClick={() => {
                        setRejectCropId(selectedItem.data._id);
                        setRejectType("booking");
                        setRejectRemarks("");
                        setShowRejectModal(true);
                      }}
                    >
                      Reject Booking
                    </button>
                  </>
                )}
              </div>
              <button 
                className="btn-modal-delete"
                onClick={() => {
                  if (selectedItem.type === "announcement") {
                    handleAnnouncementDelete(selectedItem.data._id);
                    setSelectedItem(null);
                  } else {
                    handleDelete(selectedItem.type === "contact" ? "contacts" : selectedItem.type === "crop" ? "crops" : "bookings", selectedItem.data._id);
                  }
                }}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Remarks Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Provide Rejection Remarks</h3>
              <button className="modal-close-btn" onClick={() => setShowRejectModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <p style={{ fontSize: "14px", color: "var(--admin-text-secondary)", marginBottom: "12px" }}>
                Please enter the reason for rejecting this {rejectType === "booking" ? "equipment booking" : "crop sales"} request. The farmer will be notified.
              </p>
              <textarea
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="Enter rejection reason (e.g., Price too high, Quality concerns, Quantity limit exceeded)..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "var(--admin-panel-bg)",
                  border: "1px solid var(--admin-panel-border)",
                  borderRadius: "8px",
                  color: "var(--admin-text-primary)",
                  outline: "none",
                  resize: "vertical",
                  fontSize: "14px"
                }}
              />
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn-modal-close" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button
                className="btn-modal-delete"
                style={{ background: "#ef4444", color: "#fff", borderColor: "#ef4444" }}
                onClick={() => {
                  if (rejectType === "booking") {
                    handleRejectBooking(rejectCropId, rejectRemarks);
                  } else {
                    handleRejectCrop(rejectCropId, rejectRemarks);
                  }
                  setShowRejectModal(false);
                }}
              >
                Submit Rejection
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

                <div style={{ gridColumn: "span 2", marginBottom: "15px" }}>
                  <LocationSelector
                    value={{
                      state: farmerForm.state,
                      district: farmerForm.district,
                      mandal: farmerForm.mandal,
                      village: farmerForm.village
                    }}
                    onChange={(loc) => setFarmerForm({ ...farmerForm, ...loc })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Survey Number</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="e.g. 123/A"
                    value={farmerForm.surveyNumber}
                    onChange={(e) => setFarmerForm({ ...farmerForm, surveyNumber: e.target.value })}
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
                  <label className="admin-login-label">Aadhar Number</label>
                  <input 
                    type="text" 
                    maxLength="12"
                    className="admin-login-input" 
                    placeholder="12-digit number"
                    value={farmerForm.aadharNumber}
                    onChange={(e) => setFarmerForm({ ...farmerForm, aadharNumber: e.target.value })}
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
                  <span className="label">Survey Number:</span>
                  <span className="value text-accent">{viewingFarmer.surveyNumber || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Land Holding:</span>
                  <span className="value">{viewingFarmer.landHolding ? `${viewingFarmer.landHolding} Acres` : "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Aadhar Number:</span>
                  <span className="value">
                    {viewingFarmer.aadharNumber 
                      ? `${viewingFarmer.aadharNumber.substring(0, 4)}-${viewingFarmer.aadharNumber.substring(4, 8)}-${viewingFarmer.aadharNumber.substring(8, 12)}` 
                      : (viewingFarmer.aadhaarLast4 ? `XXXX-XXXX-${viewingFarmer.aadhaarLast4}` : "N/A")}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Member Status:</span>
                  <span className={`value ${getStatusBadgeClass(viewingFarmer.status || "Active")}`}>
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
                  <label className="admin-login-label">Farmer Name *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingFarmer.name || ""}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, name: e.target.value })}
                    required
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
                  <label className="admin-login-label">Gender</label>
                  <select 
                    className="admin-login-input" 
                    value={editingFarmer.gender || "Male"}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, gender: e.target.value })}
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ gridColumn: "span 2", marginBottom: "15px" }}>
                  <LocationSelector
                    value={{
                      state: editingFarmer.state || "Andhra Pradesh",
                      district: editingFarmer.district || "",
                      mandal: editingFarmer.mandal || "",
                      village: editingFarmer.village || ""
                    }}
                    onChange={(loc) => setEditingFarmer({ ...editingFarmer, ...loc })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Survey Number</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingFarmer.surveyNumber || ""}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, surveyNumber: e.target.value })}
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

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Aadhar Number</label>
                  <input 
                    type="text" 
                    maxLength="12"
                    className="admin-login-input" 
                    placeholder="12-digit number"
                    value={editingFarmer.aadharNumber || ""}
                    onChange={(e) => setEditingFarmer({ ...editingFarmer, aadharNumber: e.target.value })}
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
              </div>
              
              <div className="modal-footer" style={{ padding: "16px 20px" }}>
                <button type="button" className="btn-modal-close" onClick={() => setEditingFarmer(null)}>Cancel</button>
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}>Update Farmer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Equipment Slot Modal */}
      {showSlotModal && (
        <div className="modal-overlay" onClick={() => setShowSlotModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Open Booking Slots Calendar</h3>
              <button className="modal-close-icon" onClick={() => setShowSlotModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSlotSubmit}>
              <div className="modal-body form-grid" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
                
                <div className="admin-login-input-group">
                  <label className="admin-login-label" style={{ color: "#e2e8f0" }}>Select Equipment *</label>
                  <select 
                    className="admin-login-input"
                    value={slotForm.equipmentName}
                    onChange={(e) => setSlotForm({ ...slotForm, equipmentName: e.target.value })}
                    style={{ background: "#051207", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "10px", borderRadius: "8px", width: "100%", outline: "none" }}
                    required
                  >
                    <option value="">-- Choose Equipment --</option>
                    {equipments.map((eq) => (
                      <option key={eq._id} value={eq.name}>{eq.name} ({eq.equipmentId})</option>
                    ))}
                  </select>
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label" style={{ color: "#e2e8f0" }}>Select Date *</label>
                  <input 
                    type="date" 
                    className="admin-login-input" 
                    min={new Date().toISOString().split("T")[0]}
                    value={slotForm.date}
                    onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                    style={{ width: "100%" }}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label" style={{ color: "#e2e8f0" }}>Total Slots Available *</label>
                  <input 
                    type="number" 
                    min="1"
                    className="admin-login-input" 
                    placeholder="e.g. 1, 2, 5"
                    value={slotForm.slots}
                    onChange={(e) => setSlotForm({ ...slotForm, slots: e.target.value })}
                    style={{ width: "100%" }}
                    required
                  />
                </div>

              </div>
              <div className="modal-footer" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", padding: "15px 20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="admin-btn secondary" onClick={() => setShowSlotModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn primary">
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showEquipmentModal && (
        <div className="modal-overlay" onClick={() => setShowEquipmentModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>+ Add New Equipment Rate</h3>
              <button className="modal-close-icon" onClick={() => setShowEquipmentModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEquipmentSubmit}>
              <div className="modal-body form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px" }}>
                
                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Equipment Code / ID (Optional)</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="e.g. tractor, rotavator, or leave blank to auto-generate"
                    value={equipmentForm.equipmentId}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, equipmentId: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Equipment Name *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Enter equipment name"
                    value={equipmentForm.name}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Hourly Rate (₹) *</label>
                  <input 
                    type="number" 
                    min="0"
                    className="admin-login-input" 
                    placeholder="Rate per hour"
                    value={equipmentForm.rateHour}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, rateHour: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Daily Rate (₹) *</label>
                  <input 
                    type="number" 
                    min="0"
                    className="admin-login-input" 
                    placeholder="Rate per day"
                    value={equipmentForm.rateDay}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, rateDay: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Availability Status</label>
                  <select 
                    className="admin-login-input"
                    value={equipmentForm.available ? "true" : "false"}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, available: e.target.value === "true" })}
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Description</label>
                  <textarea 
                    className="admin-login-input" 
                    placeholder="Enter equipment details/specification..."
                    value={equipmentForm.description}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                    style={{ minHeight: "80px", resize: "vertical" }}
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ padding: "16px 20px" }}>
                <button type="button" className="btn-modal-close" onClick={() => setShowEquipmentModal(false)}>Cancel</button>
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}>Save Equipment</button>
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
                  <select 
                    className="admin-login-input" 
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    required
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="" disabled>Select Category</option>
                    <option value="Seeds">Seeds</option>
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Pesticides">Pesticides</option>
                    <option value="Farm Tools">Farm Tools</option>
                  </select>
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
                    min="0"
                    step="any"
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
                    min="0"
                    className="admin-login-input" 
                    placeholder="Initial stock"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Product Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="admin-login-input" 
                    style={{ color: "#fff", fontSize: "13px" }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploadingProductImage(true);
                      const formData = new FormData();
                      formData.append("image", file);
                      try {
                        const res = await fetch(`${API_BASE}/products/upload-image`, {
                          method: "POST",
                          headers: { ...getAuthHeaders() },
                          body: formData
                        });
                        const data = await res.json();
                        if (data.success) {
                          setProductForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
                          toast.success("Product image uploaded successfully!");
                        } else {
                          toast.error(data.message || "Failed to upload image");
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to upload image");
                      } finally {
                        setUploadingProductImage(false);
                      }
                    }}
                  />
                  {productForm.imageUrl && (
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--admin-accent-green)", fontWeight: "600" }}>✓ Image Selected:</span>
                      <img src={`${API_BASE.replace("/api", "")}${productForm.imageUrl}`} alt="Preview" style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px" }} />
                    </div>
                  )}
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
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px", opacity: uploadingProductImage ? 0.6 : 1 }} disabled={uploadingProductImage}>
                  {uploadingProductImage ? "Uploading Image..." : "Save Product"}
                </button>
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
                    src={viewingProduct.imageUrl.startsWith("http") ? viewingProduct.imageUrl : `${API_BASE.replace("/api", "")}${viewingProduct.imageUrl}`} 
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
                  <span className={`value ${getStatusBadgeClass("info")}`}>{viewingProduct.category}</span>
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
                  <span className={`value ${getStatusBadgeClass(getProductStatusText(viewingProduct.stock))}`}>
                    {getProductStatusText(viewingProduct.stock)}
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

      {/* Edit Equipment Modal */}
      {editingEquipment && (
        <div className="modal-overlay" onClick={() => setEditingEquipment(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>Edit Equipment: {editingEquipment.equipmentId}</h3>
              <button className="modal-close-icon" onClick={() => setEditingEquipment(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEquipmentEditSubmit}>
              <div className="modal-body form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px" }}>
                
                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Equipment Name *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Enter equipment name"
                    value={editingEquipment.name}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Hourly Rate (₹) *</label>
                  <input 
                    type="number" 
                    min="0"
                    className="admin-login-input" 
                    placeholder="Rate per hour"
                    value={editingEquipment.rateHour}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, rateHour: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Daily Rate (₹) *</label>
                  <input 
                    type="number" 
                    min="0"
                    className="admin-login-input" 
                    placeholder="Rate per day"
                    value={editingEquipment.rateDay}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, rateDay: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Availability Status</label>
                  <select 
                    className="admin-login-input"
                    value={editingEquipment.available ? "true" : "false"}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, available: e.target.value === "true" })}
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Description</label>
                  <textarea 
                    className="admin-login-input" 
                    placeholder="Enter equipment details/specification..."
                    value={editingEquipment.description || ""}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, description: e.target.value })}
                    style={{ minHeight: "80px", resize: "vertical" }}
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ padding: "16px 20px" }}>
                <button type="button" className="btn-modal-close" onClick={() => setEditingEquipment(null)}>Cancel</button>
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}>Update Equipment</button>
              </div>
            </form>
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
                  <label className="admin-login-label">Product Name *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="admin-login-input-group">
                  <label className="admin-login-label">Category *</label>
                  <select 
                    className="admin-login-input" 
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    required
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="Seeds">Seeds</option>
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Pesticides">Pesticides</option>
                    <option value="Farm Tools">Farm Tools</option>
                  </select>
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Unit</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    value={editingProduct.unit || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Price (₹) *</label>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
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
                    min="0"
                    className="admin-login-input" 
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Product Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="admin-login-input" 
                    style={{ color: "#fff", fontSize: "13px" }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploadingProductImage(true);
                      const formData = new FormData();
                      formData.append("image", file);
                      try {
                        const res = await fetch(`${API_BASE}/products/upload-image`, {
                          method: "POST",
                          headers: { ...getAuthHeaders() },
                          body: formData
                        });
                        const data = await res.json();
                        if (data.success) {
                          setEditingProduct(prev => ({ ...prev, imageUrl: data.imageUrl }));
                          toast.success("Product image uploaded successfully!");
                        } else {
                          toast.error(data.message || "Failed to upload image");
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to upload image");
                      } finally {
                        setUploadingProductImage(false);
                      }
                    }}
                  />
                  {editingProduct.imageUrl && (
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--admin-accent-green)", fontWeight: "600" }}>✓ Image Selected:</span>
                      <img src={`${API_BASE.replace("/api", "")}${editingProduct.imageUrl}`} alt="Preview" style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px" }} />
                    </div>
                  )}
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
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px", opacity: uploadingProductImage ? 0.6 : 1 }} disabled={uploadingProductImage}>
                  {uploadingProductImage ? "Uploading Image..." : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductItem && (
        <div className="modal-overlay" onClick={() => setDeletingProductItem(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close-icon" onClick={() => setDeletingProductItem(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: "20px", textAlign: "center" }}>
              <p style={{ color: "var(--admin-text-primary)", marginBottom: "16px" }}>
                Are you sure you want to delete this product?
              </p>
              <div style={{ fontWeight: "600", color: "#ef4444", marginBottom: "8px" }}>
                {deletingProductItem.name} ({deletingProductItem.productId})
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "16px 20px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn-modal-close" onClick={() => setDeletingProductItem(null)}>Cancel</button>
              <button 
                className="btn-action primary" 
                style={{ height: "40px", padding: "0 20px", borderRadius: "8px", background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                onClick={() => {
                  handleProductDelete(deletingProductItem._id);
                  setDeletingProductItem(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Product Booking Modal */}
      {viewingProductBooking && (
        <div className="modal-overlay" onClick={() => setViewingProductBooking(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>Product Booking Details</h3>
              <button className="modal-close-icon" onClick={() => setViewingProductBooking(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <div className="details-container">
                <div className="detail-item">
                  <span className="label">Booking ID:</span>
                  <span className="value font-semibold">{viewingProductBooking.bookingId || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Farmer Name:</span>
                  <span className="value">{viewingProductBooking.farmerName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Phone:</span>
                  <span className="value">{viewingProductBooking.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Product Name:</span>
                  <span className="value text-accent">{viewingProductBooking.productName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Quantity:</span>
                  <span className="value">{viewingProductBooking.quantity}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Total Price:</span>
                  <span className="value">₹{(viewingProductBooking.totalPrice || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Booking Date:</span>
                  <span className="value">{viewingProductBooking.bookingDate}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`value ${getStatusBadgeClass(viewingProductBooking.status || "Pending")}`}>
                    {viewingProductBooking.status || "Pending"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Submitted Date:</span>
                  <span className="value">{viewingProductBooking.createdAt ? new Date(viewingProductBooking.createdAt).toLocaleString("en-IN") : "N/A"}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "16px 20px" }}>
              <button className="btn-modal-close" onClick={() => setViewingProductBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Booking Status Modal */}
      {editingProductBooking && (
        <div className="modal-overlay" onClick={() => setEditingProductBooking(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Update Booking Status</h3>
              <button className="modal-close-icon" onClick={() => setEditingProductBooking(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <span className="label" style={{ display: "block", marginBottom: "6px", color: "var(--admin-text-secondary)" }}>Booking ID:</span>
                <span className="value font-semibold">{editingProductBooking.bookingId || "N/A"}</span>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <span className="label" style={{ display: "block", marginBottom: "6px", color: "var(--admin-text-secondary)" }}>Farmer:</span>
                <span className="value">{editingProductBooking.farmerName} ({editingProductBooking.phone})</span>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <span className="label" style={{ display: "block", marginBottom: "6px", color: "var(--admin-text-secondary)" }}>Product:</span>
                <span className="value">{editingProductBooking.productName} (Qty: {editingProductBooking.quantity})</span>
              </div>
              
              <div className="admin-login-input-group">
                <label className="admin-login-label">Booking Status *</label>
                <select 
                  className="admin-login-input" 
                  value={editingProductBooking.status || "Pending"}
                  onChange={(e) => setEditingProductBooking({ ...editingProductBooking, status: e.target.value })}
                  style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff", width: "100%", height: "42px", borderRadius: "8px", padding: "0 10px" }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "16px 20px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn-modal-close" onClick={() => setEditingProductBooking(null)}>Cancel</button>
              <button 
                className="btn-action primary" 
                style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_BASE}/product-bookings/${editingProductBooking._id}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders()
                      },
                      body: JSON.stringify({ status: editingProductBooking.status }),
                      signal: AbortSignal.timeout(10000)
                    });
                    if (response.status === 401) {
                      handleUnauthorized();
                      return;
                    }
                    if (response.ok) {
                      toast.success("Booking status updated successfully!");
                      fetchData();
                      setEditingProductBooking(null);
                    } else {
                      const data = await response.json();
                      toast.error(data.message || "Failed to update status.");
                    }
                  } catch (err) {
                    console.error("Failed to update booking status:", err);
                    toast.error("Error updating status.");
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAddAnnouncementModal && (
        <div className="modal-overlay" onClick={() => setShowAddAnnouncementModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>Publish FPO Notice / Announcement</h3>
              <button className="modal-close-icon" onClick={() => setShowAddAnnouncementModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAnnouncementSubmit}>
              <div className="modal-body form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px" }}>
                
                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Notice Title *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Enter notice title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Category *</label>
                  <select 
                    className="admin-login-input" 
                    value={announcementForm.category}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                    required
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="Training">Training</option>
                    <option value="Government Schemes">Government Schemes</option>
                    <option value="Market Prices">Market Prices</option>
                    <option value="Events">Events</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Priority Level *</label>
                  <select 
                    className="admin-login-input" 
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                    required
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Image URL (Optional)</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Paste unsplash or web image link"
                    value={announcementForm.imageUrl}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, imageUrl: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Published Status</label>
                  <select 
                    className="admin-login-input" 
                    value={announcementForm.published ? "true" : "false"}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, published: e.target.value === "true" })}
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="true">Published (Visible to Farmers)</option>
                    <option value="false">Draft (Hidden)</option>
                  </select>
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Description / Notice Details *</label>
                  <textarea 
                    className="admin-login-input" 
                    placeholder="Provide full notice details..."
                    value={announcementForm.description}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })}
                    required
                    style={{ minHeight: "120px", resize: "vertical", background: "#0d2315", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "10px", borderRadius: "8px" }}
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ padding: "16px 20px" }}>
                <button type="button" className="btn-modal-close" onClick={() => setShowAddAnnouncementModal(false)}>Cancel</button>
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}>Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {showEditAnnouncementModal && (
        <div className="modal-overlay" onClick={() => setShowEditAnnouncementModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>Edit Notice / Announcement</h3>
              <button className="modal-close-icon" onClick={() => setShowEditAnnouncementModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAnnouncementUpdate}>
              <div className="modal-body form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px" }}>
                
                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Notice Title *</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Enter notice title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Category *</label>
                  <select 
                    className="admin-login-input" 
                    value={announcementForm.category}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                    required
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="Training">Training</option>
                    <option value="Government Schemes">Government Schemes</option>
                    <option value="Market Prices">Market Prices</option>
                    <option value="Events">Events</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="admin-login-input-group">
                  <label className="admin-login-label">Priority Level *</label>
                  <select 
                    className="admin-login-input" 
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                    required
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Image URL (Optional)</label>
                  <input 
                    type="text" 
                    className="admin-login-input" 
                    placeholder="Paste unsplash or web image link"
                    value={announcementForm.imageUrl}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, imageUrl: e.target.value })}
                  />
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Published Status</label>
                  <select 
                    className="admin-login-input" 
                    value={announcementForm.published ? "true" : "false"}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, published: e.target.value === "true" })}
                    style={{ background: "#0d2315", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}
                  >
                    <option value="true">Published (Visible to Farmers)</option>
                    <option value="false">Draft (Hidden)</option>
                  </select>
                </div>

                <div className="admin-login-input-group" style={{ gridColumn: "span 2" }}>
                  <label className="admin-login-label">Description / Notice Details *</label>
                  <textarea 
                    className="admin-login-input" 
                    placeholder="Provide full notice details..."
                    value={announcementForm.description}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })}
                    required
                    style={{ minHeight: "120px", resize: "vertical", background: "#0d2315", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "10px", borderRadius: "8px" }}
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ padding: "16px 20px" }}>
                <button type="button" className="btn-modal-close" onClick={() => setShowEditAnnouncementModal(false)}>Cancel</button>
                <button type="submit" className="btn-action primary" style={{ height: "40px", padding: "0 20px", borderRadius: "8px" }}>Update Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
