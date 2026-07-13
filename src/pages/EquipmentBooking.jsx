import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import { 
  Tractor, 
  Settings, 
  Droplet, 
  Sprout, 
  Wheat, 
  Calendar, 
  Phone, 
  CheckCircle,
  AlertTriangle,
  User,
  DollarSign,
  Lock
} from "lucide-react";
import LocationSelector from "../components/LocationSelector/LocationSelector";
import "./EquipmentBooking.css";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

// ── Constants ──────────────────────────────────────────────────
const EQUIPMENT_LIST = [
  { id: "tractor",    icon: <Tractor size={24} />, name: "Tractor",    rateHour: 350,  rateDay: 2500 },
  { id: "rotavator",  icon: <Settings size={24} />,  name: "Rotavator", rateHour: 250,  rateDay: 1800 },
  { id: "sprayer",    icon: <Droplet size={24} />, name: "Sprayer",    rateHour: 150,  rateDay: 900  },
  { id: "cultivator", icon: <Sprout size={24} />, name: "Cultivator", rateHour: 200,  rateDay: 1400 },
  { id: "harvester",  icon: <Wheat size={24} />, name: "Harvester",  rateHour: 600,  rateDay: 4000 },
  { id: "seeddrill",  icon: <Settings size={24} />, name: "Seed Drill", rateHour: 300,  rateDay: 2000 },
];

const getEquipmentIcon = (nameOrId, size = 24) => {
  const norm = String(nameOrId || "").toLowerCase();
  if (norm.includes("tractor")) return <Tractor size={size} />;
  if (norm.includes("rotavator")) return <Settings size={size} />;
  if (norm.includes("sprayer")) return <Droplet size={size} />;
  if (norm.includes("cultivator")) return <Sprout size={size} />;
  if (norm.includes("harvester")) return <Wheat size={size} />;
  if (norm.includes("seeddrill") || norm.includes("seed drill")) return <Settings size={size} />;
  return <Tractor size={size} />;
};

const INITIAL_FORM = {
  farmerName: "", mobileNumber: "", state: "", district: "", mandal: "", village: "",
  bookingDate: "", duration: "", remarks: "",
};

const INITIAL_ERRORS = Object.fromEntries(
  Object.keys(INITIAL_FORM).map((k) => [k, ""])
);

// ── Validation ─────────────────────────────────────────────────
function validate(form, selectedEquipment, openSlots) {
  const errors = { ...INITIAL_ERRORS };
  let valid = true;

  if (!selectedEquipment) {
    valid = false;
  }
  if (!form.farmerName.trim()) {
    errors.farmerName = "Name is required / పేరు అవసరం"; valid = false;
  }
  if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
    errors.mobileNumber = "Enter a valid 10-digit mobile number"; valid = false;
  }
  if (!form.state) {
    errors.state = "State is required"; valid = false;
  }
  if (!form.district) {
    errors.district = "District is required"; valid = false;
  }
  if (!form.mandal) {
    errors.mandal = "Mandal is required"; valid = false;
  }
  if (!form.village) {
    errors.village = "Village is required"; valid = false;
  }
  if (!form.bookingDate) {
    errors.bookingDate = "Booking date is required"; valid = false;
  } else if (selectedEquipment) {
    const datePart = new Date(form.bookingDate).toISOString().split("T")[0];
    const match = openSlots.find(s => 
      s.equipmentName.toLowerCase() === selectedEquipment.name.toLowerCase() &&
      s.date === datePart
    );
    if (!match) {
      errors.bookingDate = "Booking slots are not open for this equipment on this date.";
      valid = false;
    } else if (match.bookedCount >= match.slots) {
      errors.bookingDate = "All slots for this equipment on this date are already booked.";
      valid = false;
    }
  }
  if (!form.duration || isNaN(form.duration) || Number(form.duration) <= 0) {
    errors.duration = "Enter a valid duration"; valid = false;
  }

  return { errors, valid };
}

// ── Component ──────────────────────────────────────────────────
function EquipmentBooking() {
  const [selectedId, setSelectedId]   = useState(null);
  const [form, setForm]               = useState(INITIAL_FORM);
  const [errors, setErrors]           = useState(INITIAL_ERRORS);
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [equipError, setEquipError]   = useState(false);
  const [equipmentList, setEquipmentList] = useState(EQUIPMENT_LIST);
  const [openSlots, setOpenSlots] = useState([]);

  // Advanced Slots States
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token");

  const today = new Date().toISOString().split("T")[0];
  const selectedEquipment = equipmentList.find((e) => e.id === selectedId) || null;

  const equipmentOpenSlots = selectedEquipment
    ? openSlots.filter(s => s.equipmentName.toLowerCase() === selectedEquipment.name.toLowerCase())
    : [];

  // Fetch equipment list and slots dynamically from DB API
  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const response = await fetch(`${API_BASE}/equipments`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const formatted = data.map((eq) => ({
              id: String(eq.equipmentId || eq._id).toLowerCase().replace(/\s+/g, ""),
              name: eq.name,
              rateHour: eq.rateHour,
              rateDay: eq.rateDay,
              icon: getEquipmentIcon(eq.equipmentId || eq.name)
            }));
            setEquipmentList(formatted);
          }
        }
      } catch (err) {
        console.error("Error fetching equipment details:", err);
      }
    };
    const fetchSlots = async () => {
      try {
        const response = await fetch(`${API_BASE}/equipment-slots`);
        if (response.ok) {
          const data = await response.json();
          setOpenSlots(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch slots calendar:", err);
      }
    };
    fetchEquipments();
    fetchSlots();
  }, []);

  // Auto-fill from localStorage if logged in
  useEffect(() => {
    if (token) {
      const infoStr = localStorage.getItem("farmer_data");
      if (infoStr) {
        try {
          const info = JSON.parse(infoStr);
          setForm((prev) => ({
            ...prev,
            farmerName: info.name || "",
            mobileNumber: info.phone || "",
            state: info.state || "",
            district: info.district || "",
            mandal: info.mandal || "",
            village: info.village || "",
          }));
        } catch (e) {
          console.error("Failed to parse farmer info:", e);
        }
      }
    }
  }, [token]);

  // Fetch available slots on date or equipment selection change
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (selectedEquipment && form.bookingDate) {
        try {
          const response = await fetch(`${API_BASE}/equipment-slots/available?equipment=${selectedEquipment.equipmentId || selectedEquipment.name}&date=${form.bookingDate}`);
          if (response.ok) {
            const data = await response.json();
            setSlots(data || []);
          } else {
            setSlots([]);
          }
        } catch (err) {
          console.error("Failed to load available slots:", err);
          setSlots([]);
        }
      } else {
        setSlots([]);
      }
    };
    fetchAvailableSlots();
  }, [selectedId, form.bookingDate]);

  const handleEquipSelect = (id) => {
    setSelectedId(id);
    setEquipError(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedEquipment) {
      setEquipError(true);
      return;
    }

    const errorsCopy = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.farmerName.trim()) {
      errorsCopy.farmerName = "Name is required / పేరు అవసరం"; valid = false;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
      errorsCopy.mobileNumber = "Enter a valid 10-digit mobile number"; valid = false;
    }
    if (!form.state || !form.district || !form.mandal || !form.village) {
      errorsCopy.state = "Complete location address details are required"; valid = false;
    }

    if (!selectedSlot) {
      toast.error("Please select an available time slot first.");
      valid = false;
    }

    if (!valid) {
      setErrors(errorsCopy);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/equipment-slots/book`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          slotId: selectedSlot._id
        })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("farmer_token");
        localStorage.removeItem("farmerToken");
        localStorage.removeItem("farmer_data");
        window.dispatchEvent(new Event("storage"));
        toast.error("Session expired. Please log in again.");
        navigate("/farmer-login");
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        setBookingResult(data.data);
        setSubmitted(true);
        toast.success("Booking confirmed successfully!");
        setShowConfirmModal(false);
      } else {
        toast.error(data.message || "Failed to confirm slot booking.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!bookingResult) return;
    const doc = new jsPDF();
    
    // Receipt styling
    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94); // Green
    doc.text("KALLUDEVAKUNTA FPC LTD", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Agricultural Machinery Hire Booking Receipt", 14, 26);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 30, 196, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Receipt ID: ${bookingResult.bookingId}`, 14, 42);
    doc.text(`Equipment Name: ${bookingResult.equipmentName}`, 14, 52);
    doc.text(`Booking Date: ${new Date(bookingResult.date).toLocaleDateString("en-IN")}`, 14, 62);
    doc.text(`Time Slot Range: ${bookingResult.timeSlot}`, 14, 72);
    doc.text(`Price: Rs. ${bookingResult.price}`, 14, 82);
    doc.text(`Farmer Name: ${form.farmerName}`, 14, 92);
    doc.text(`Phone: ${form.mobileNumber}`, 14, 102);
    doc.text(`Address: ${form.village}, ${form.mandal}, ${form.district}, ${form.state}`, 14, 112);
    
    doc.line(14, 122, 196, 122);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for choosing Kalludevakunta Farmers Producer Company Limited.", 14, 132);
    doc.text("For help and queries, please email info@kalludevakuntafpcl.in", 14, 137);
    
    doc.save(`FPO_Booking_Receipt_${bookingResult.bookingId}.pdf`);
  };

  const handleNewBooking = () => {
    setSubmitted(false);
    setSelectedId(null);
    setSelectedSlot(null);
    setBookingResult(null);
  };

  return (
    <main>
      {/* Hero */}
      <div className="equip__hero glass-panel fade-up">
        <span className="equip__hero-tag">
          <Tractor size={12} style={{ color: "var(--harvest-lt)" }} /> Farmer Services
        </span>
        <h1 className="equip__hero-title">Equipment Booking</h1>
        <p className="equip__hero-sub">
          వ్యవసాయ యంత్రాల బుకింగ్ — Book tractors, harvesters & more by hour or day.
        </p>
      </div>

      {/* Equipment selector */}
      <div className="equip__selector glass-panel fade-up">
        <div className="equip__selector-title">
          Step 1 — Select Equipment / యంత్రం ఎంచుకోండి
        </div>
        
        <div className="equip__grid">
          {equipmentList.map((eq) => (
            <div
              key={eq.id}
              className={`equip-tile glass-panel${selectedId === eq.id ? " selected" : ""}`}
              onClick={() => handleEquipSelect(eq.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleEquipSelect(eq.id)}
              aria-pressed={selectedId === eq.id}
            >
              <div className="equip-tile__icon-wrap">{eq.icon}</div>
              <div className="equip-tile__name">{eq.name}</div>
            </div>
          ))}
        </div>
        
        {equipError && (
          <p className="equip-select-error">
            <AlertTriangle size={14} /> Please select an equipment first / ముందు యంత్రం ఎంచుకోండి
          </p>
        )}
      </div>

      {/* Body */}
      <div className="equip__body">

        {/* ── Form ── */}
        <div className="equip__form-card glass-panel fade-up">
          <div className="equip__form-header">
            <div className="equip__form-header-icon"><Calendar size={20} className="text-leaf-light" /></div>
            <div>
              <div className="equip__form-header-title">Booking Request</div>
              <div className="equip__form-header-sub">Step 2 — Fill your details</div>
            </div>
          </div>

          <div className="equip__form-body">
            {!token ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ width: "50px", height: "50px", background: "rgba(230, 81, 0, 0.1)", border: "1px solid rgba(230, 81, 0, 0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                  <Lock size={24} style={{ color: "var(--harvest-lt || #f97316)" }} />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "0.75rem" }}>Farmer Login Required</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                  Please login using your registered mobile number to book equipment.
                </p>
                <button 
                  className="form-submit" 
                  onClick={() => navigate("/farmer-login")}
                  style={{ width: "100%" }}
                  type="button"
                >
                  Login Now
                </button>
              </div>
            ) : submitted ? (
              <div className="form-success-msg fade-up" style={{ textAlign: "center", padding: "20px" }}>
                <div className="success-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
                  <CheckCircle size={56} style={{ color: "var(--harvest-lt, #22c55e)" }} />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#fff", marginBottom: "10px" }}>Booking Successful!</h3>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginBottom: "20px" }}>
                  Your appointment slot booking has been confirmed successfully.
                </p>

                {bookingResult && (
                  <div className="booking-receipt-card glass-panel" style={{ padding: "16px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", textAlign: "left", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div><span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Booking ID:</span> <strong style={{ color: "var(--harvest-lt, #22c55e)" }}>{bookingResult.bookingId}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Equipment Name:</span> <strong>{bookingResult.equipmentName}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Booking Date:</span> <strong>{new Date(bookingResult.date).toLocaleDateString("en-IN")}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Time Slot Range:</span> <strong>{bookingResult.timeSlot}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Total Price:</span> <strong>₹{bookingResult.price}</strong></div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button className="form-submit" onClick={downloadReceipt} style={{ width: "100%" }}>
                    Download PDF Receipt
                  </button>
                  <button className="form-submit secondary-btn" onClick={() => navigate("/farmer-dashboard")} style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: "8px", cursor: "pointer" }}>
                    View My Bookings
                  </button>
                  <button className="form-submit secondary-btn" onClick={handleNewBooking} style={{ width: "100%", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px" }}>
                    Book Another Slot
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>

                {selectedEquipment ? (
                  <div className="equip__selected-banner glass-panel">
                    <span className="selected-banner-icon">{selectedEquipment.icon}</span>
                    <span>
                      <strong>{selectedEquipment.name}</strong> selected
                    </span>
                  </div>
                ) : (
                  <div className="equip__no-selection glass-panel">
                    <Tractor size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} /> Select equipment above to continue
                  </div>
                )}

                {/* Section: Personal Details */}
                <div className="form-section-label"><User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Your Details</div>

                <div className="form-group--row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="eq-farmerName">
                      Farmer Name <span className="form-label-telugu">/ రైతు పేరు</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      id="eq-farmerName"
                      className={`form-input${errors.farmerName ? " error" : ""}`}
                      type="text"
                      name="farmerName"
                      value={form.farmerName}
                      onChange={handleChange}
                      placeholder="Your full name"
                      autoComplete="name"
                      disabled={!!token}
                    />
                    {errors.farmerName && <span className="form-error">{errors.farmerName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="eq-mobileNumber">
                      Mobile Number <span className="form-label-telugu">/ మొబైల్</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      id="eq-mobileNumber"
                      className={`form-input${errors.mobileNumber ? " error" : ""}`}
                      type="tel"
                      name="mobileNumber"
                      value={form.mobileNumber}
                      onChange={handleChange}
                      placeholder="10-digit number"
                      maxLength={10}
                      inputMode="numeric"
                      disabled={!!token}
                    />
                    {errors.mobileNumber && <span className="form-error">{errors.mobileNumber}</span>}
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
                  {(errors.state || errors.district || errors.mandal || errors.village) && (
                    <span className="form-error" style={{ display: "block", marginTop: "4px" }}>
                      {errors.state || errors.district || errors.mandal || errors.village}
                    </span>
                  )}
                </div>

                <div className="form-divider" />

                {/* Section: Booking Details */}
                <div className="form-section-label"><Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Select Booking Date & Slot</div>

                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label className="form-label" htmlFor="eq-bookingDate">
                    Booking Date <span className="form-label-telugu">/ తేదీ</span>
                    <span className="req">*</span>
                  </label>
                  <input
                    id="eq-bookingDate"
                    className={`form-input${errors.bookingDate ? " error" : ""}`}
                    type="date"
                    name="bookingDate"
                    value={form.bookingDate}
                    onChange={handleChange}
                    min={today}
                  />
                  {errors.bookingDate && <span className="form-error">{errors.bookingDate}</span>}
                </div>

                {/* Available Slots Grid */}
                {selectedEquipment && form.bookingDate && (
                  <div className="slots-grid-section" style={{ marginBottom: "24px" }}>
                    <label className="form-label" style={{ marginBottom: "12px", display: "block" }}>
                      Select Time Slot / సమయం ఎంచుకోండి <span className="req">*</span>
                    </label>
                    {slots.length === 0 ? (
                      <div className="empty-slots-msg glass-panel" style={{ padding: "20px", textStyle: "italic", textAlign: "center", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#f87171", borderRadius: "8px" }}>
                        No booking slots are currently open for this equipment on the selected date. Please choose another date or contact FPO admin.
                      </div>
                    ) : (
                      <div className="slots-buttons-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                        {slots.map((s) => {
                          const isBooked = s.status === "Booked";
                          const isSelected = selectedSlot?._id === s._id;
                          const startTimeStr = new Date(s.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
                          const endTimeStr = new Date(s.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

                          return (
                            <button
                              key={s._id}
                              type="button"
                              disabled={isBooked}
                              onClick={() => setSelectedSlot(s)}
                              style={{
                                background: isSelected ? "var(--harvest-lt, #22c55e)" : isBooked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                                color: isSelected ? "#000" : isBooked ? "rgba(255,255,255,0.2)" : "#fff",
                                border: isSelected ? "1px solid var(--harvest-lt, #22c55e)" : "1px solid rgba(255,255,255,0.1)",
                                padding: "12px 10px",
                                borderRadius: "8px",
                                cursor: isBooked ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px"
                              }}
                            >
                              <span style={{ fontSize: "13px", fontWeight: "600" }}>{startTimeStr} - {endTimeStr}</span>
                              <span style={{ fontSize: "11px", opacity: isSelected ? 0.8 : 0.6 }}>₹{s.price}</span>
                              <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px", color: isSelected ? "#000" : isBooked ? "rgba(255,255,255,0.2)" : "var(--harvest-lt, #22c55e)" }}>
                                {isBooked ? "Booked" : isSelected ? "Selected" : "Available"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="eq-remarks">
                    Remarks <span className="form-label-telugu">/ వ్యాఖ్యలు</span>
                  </label>
                  <textarea
                    id="eq-remarks"
                    className="form-textarea"
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    placeholder="Field size, crop type, any special requirements… (optional)"
                  />
                </div>

                <button 
                  className="form-submit" 
                  type="submit" 
                  disabled={loading || !selectedSlot}
                  style={{ opacity: !selectedSlot ? 0.6 : 1 }}
                >
                  {loading ? "Processing…" : <><Calendar size={16} /> Confirm Details & Continue</>}
                </button>

              </form>
            )}

            {/* Booking Confirmation Dialog Overlay */}
            {showConfirmModal && selectedSlot && (
              <div className="modal-overlay" onClick={() => setShowConfirmModal(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px", width: "90%", background: "#051207", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "12px", padding: "24px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#fff", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Confirm Booking Reservation</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px", fontSize: "14px" }}>
                    <div><span style={{ color: "rgba(255,255,255,0.5)" }}>Machinery:</span> <strong style={{ color: "var(--harvest-lt, #22c55e)" }}>{selectedEquipment?.name}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.5)" }}>Date:</span> <strong>{new Date(form.bookingDate).toLocaleDateString("en-IN")}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.5)" }}>Selected Time:</span> <strong>{new Date(selectedSlot.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" })} - {new Date(selectedSlot.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" })}</strong></div>
                    <div><span style={{ color: "rgba(255,255,255,0.5)" }}>Total Rental Price:</span> <strong>₹{selectedSlot.price}</strong></div>
                    
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", marginTop: "4px" }}>
                      <div><span style={{ color: "rgba(255,255,255,0.5)" }}>Farmer Name:</span> <strong>{form.farmerName}</strong></div>
                      <div><span style={{ color: "rgba(255,255,255,0.5)" }}>Phone:</span> <strong>{form.mobileNumber}</strong></div>
                      <div><span style={{ color: "rgba(255,255,255,0.5)" }}>Address:</span> <strong>{form.village}, {form.mandal}, {form.district}, {form.state}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button type="button" className="admin-btn secondary" onClick={() => setShowConfirmModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                      Cancel
                    </button>
                    <button type="button" className="admin-btn primary" onClick={confirmBooking} disabled={loading} style={{ padding: "10px 20px", borderRadius: "8px", cursor: "pointer", background: "var(--harvest-lt, #22c55e)", border: "none", color: "#000", fontWeight: "600" }}>
                      {loading ? "Securing Reservation…" : "Confirm & Book"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="equip__sidebar fade-up-2">

          {/* Rate card removed */}

          {/* Note */}
          <div className="equip__note glass-panel">
            <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline', color: 'var(--harvest-lt)' }} /> Rates are indicative. Final pricing confirmed on call. Fuel charges may apply separately. Booking subject to availability.
          </div>

          {/* WhatsApp */}
          <div style={{ marginTop: "1rem" }}>
            <a
              href="https://wa.me/919014488562?text=Hello%20Kalludevakunta%20FPC%2C%20I%20want%20to%20book%20equipment."
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-btn"
            >
              <Phone size={16} /> Book via WhatsApp
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}

export default EquipmentBooking;