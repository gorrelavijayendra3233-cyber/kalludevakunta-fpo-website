import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { 
  Sprout, 
  CheckCircle, 
  Clock, 
  Phone, 
  CreditCard, 
  Calendar, 
  FileText,
  User,
  MapPin,
  TrendingUp,
  Lock
} from "lucide-react";
import LocationSelector from "../components/LocationSelector/LocationSelector";
import "./SellCrop.css";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

// ── Constants ──────────────────────────────────────────────────
const CROP_OPTIONS = [
  "Paddy (Rice)", "Maize", "Red Gram (Tur Dal)", "Groundnut",
  "Sunflower", "Soybean", "Cotton", "Tomato", "Chilli", "Onion",
  "Banana", "Turmeric", "Jowar", "Bajra", "Wheat", "Other",
];

const UNIT_OPTIONS = ["Quintal", "Kg", "Ton", "Bags"];

const HOW_IT_WORKS = [
  { num: "1", label: "Fill the form below" },
  { num: "2", label: "We verify your details" },
  { num: "3", label: "KDFPC team calls you" },
  { num: "4", label: "Crop collected & paid" },
];

const ACCEPTED_CROPS = [
  { name: "Paddy" }, { name: "Maize" },
  { name: "Red Gram" }, { name: "Groundnut" },
  { name: "Tomato" }, { name: "Chilli" },
  { name: "Onion" }, { name: "Sunflower" },
];

const INITIAL_FORM = {
  farmerName: "", mobileNumber: "", state: "", district: "", mandal: "", village: "",
  cropName: "", quantity: "", quantityUnit: "Quintal",
  expectedPrice: "", harvestDate: "", notes: "",
};

const INITIAL_ERRORS = Object.fromEntries(
  Object.keys(INITIAL_FORM).map((k) => [k, ""])
);

// ── Validation ─────────────────────────────────────────────────
function validate(form) {
  const errors = { ...INITIAL_ERRORS };
  let valid = true;

  if (!form.farmerName.trim()) {
    errors.farmerName = "Farmer name is required / రైతు పేరు అవసరం"; valid = false;
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
  if (!form.cropName) {
    errors.cropName = "Please select the crop"; valid = false;
  }
  if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) {
    errors.quantity = "Enter a valid quantity"; valid = false;
  }
  if (form.expectedPrice && (isNaN(form.expectedPrice) || Number(form.expectedPrice) < 0)) {
    errors.expectedPrice = "Enter a valid price"; valid = false;
  }
  if (!form.harvestDate) {
    errors.harvestDate = "Harvest date is required"; valid = false;
  }

  return { errors, valid };
}

// ── Component ──────────────────────────────────────────────────
function SellCrops() {
  const [form, setForm]         = useState(INITIAL_FORM);
  const [errors, setErrors]     = useState(INITIAL_ERRORS);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token");

  const today = new Date().toISOString().split("T")[0];

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const { errors: newErrors, valid } = validate(form);

  if (!valid) {
    setErrors(newErrors);
    return;
  }

  setLoading(true);

  try {
    const payload = {
      cropName: form.cropName,
      quantity: Number(form.quantity),
      unit: form.quantityUnit,
      expectedPrice: Number(form.expectedPrice || 0),
      description: form.notes || "",
    };

    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE}/crop-sales`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    );

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

    console.log("Server Response:", data);

    if (response.ok) {
      setSubmitted(true);
      setForm(INITIAL_FORM);
      setErrors(INITIAL_ERRORS);
      toast.success("Crop sale offer submitted successfully!");
    } else {
      toast.error(data.message || "Failed to submit crop request");
    }
  } catch (error) {
    console.error(error);
    toast.error("Server connection failed");
  } finally {
    setLoading(false);
  }
};
  const handleNewRequest = () => setSubmitted(false);

  return (
    <main>
      {/* Hero */}
      <div className="sellcrops__hero glass-panel fade-up">
        <span className="sellcrops__hero-tag">
          <TrendingUp size={12} style={{ color: "var(--harvest-lt)" }} /> Farmer Services
        </span>
        <h1 className="sellcrops__hero-title">Sell Your Crops to KDFPC</h1>
        <p className="sellcrops__hero-sub">
          పంట అమ్మకానికి దరఖాస్తు చేయండి — Get a fair price directly. No middlemen.
        </p>
      </div>

      {/* How it works */}
      <div className="sellcrops__steps fade-up-2">
        {HOW_IT_WORKS.map((s) => (
          <div className="sellcrops__step glass-panel" key={s.num}>
            <div className="sellcrops__step-num">{s.num}</div>
            <div className="sellcrops__step-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="sellcrops__body">

        {/* ── Form ── */}
        <div className="sellcrops__form-card glass-panel fade-up">
          <div className="form-card__header">
            <div className="form-card__header-icon"><Sprout size={22} className="text-leaf-light" /></div>
            <div>
              <div className="form-card__header-title">Crop Sale Request</div>
              <div className="form-card__header-sub">పంట అమ్మకం దరఖాస్తు — All fields marked * are required</div>
            </div>
          </div>

          <div className="form-card__body">
            {!token ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ width: "50px", height: "50px", background: "rgba(230, 81, 0, 0.1)", border: "1px solid rgba(230, 81, 0, 0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                  <Lock size={24} style={{ color: "var(--harvest-lt || #f97316)" }} />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "0.75rem" }}>Farmer Login Required</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                  Please login using your registered mobile number to submit crop requests.
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
              <div className="form-success-msg fade-up">
                <div className="success-icon"><CheckCircle size={44} className="text-leaf-light" /></div>
                <h3>Request Submitted!</h3>
                <p>
                  Thank you <strong>{form.farmerName || "Farmer"}</strong>. Our team will
                  call you on your registered mobile within <strong>24 hours</strong> to
                  confirm your crop sale details.
                </p>
                <p style={{ marginTop: "12px", color: "var(--text-muted)", fontSize: "12px" }}>
                  మీ అభ్యర్థన విజయవంతంగా సమర్పించబడింది. మేము 24 గంటల్లో సంప్రదిస్తాం.
                </p>
                <button
                  className="form-submit"
                  style={{ marginTop: "1.5rem" }}
                  onClick={handleNewRequest}
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>

                {/* Section: Personal Details */}
                <div className="form-section-label"><User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Personal Details</div>

                <div className="form-group--row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="farmerName">
                      Farmer Name <span className="form-label-telugu">/ ఋతు పేరు</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      id="farmerName"
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
                    <label className="form-label" htmlFor="mobileNumber">
                      Mobile Number <span className="form-label-telugu">/ మొబైల్</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      id="mobileNumber"
                      className={`form-input${errors.mobileNumber ? " error" : ""}`}
                      type="tel"
                      name="mobileNumber"
                      value={form.mobileNumber}
                      onChange={handleChange}
                      placeholder="10-digit number"
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel"
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

                {/* Section: Crop Details */}
                <div className="form-section-label"><Sprout size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Crop Details</div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cropName">
                    Crop Name <span className="form-label-telugu">/ పంట పేరు</span>
                    <span className="req">*</span>
                  </label>
                  <select
                    id="cropName"
                    className={`form-select${errors.cropName ? " error" : ""}`}
                    name="cropName"
                    value={form.cropName}
                    onChange={handleChange}
                  >
                    <option value="">Select crop</option>
                    {CROP_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.cropName && <span className="form-error">{errors.cropName}</span>}
                </div>

                <div className="form-group--row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="quantity">
                      Quantity <span className="form-label-telugu">/ పరిమాణం</span>
                      <span className="req">*</span>
                    </label>
                    <div className="input-unit-wrap">
                      <input
                        id="quantity"
                        className="form-input"
                        type="number"
                        name="quantity"
                        value={form.quantity}
                        onChange={handleChange}
                        placeholder="Quantity"
                        min="1"
                        inputMode="decimal"
                        style={{ borderRight: "none", borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                      />
                      <select
                        className="unit-selector"
                        name="quantityUnit"
                        value={form.quantityUnit}
                        onChange={handleChange}
                        aria-label="Unit"
                        style={{ width: "110px", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, background: "rgba(255,255,255,0.06)", borderLeft: "1px solid var(--panel-border)" }}
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    {errors.quantity && <span className="form-error" style={{ marginTop: "6px" }}>{errors.quantity}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="expectedPrice">
                      Expected Price <span className="form-label-telugu">/ ధర</span>
                    </label>
                    <div className="price-wrap" style={{ position: "relative" }}>
                      <span className="price-prefix" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "var(--text-secondary)" }}>₹</span>
                      <input
                        id="expectedPrice"
                        className={`form-input${errors.expectedPrice ? " error" : ""}`}
                        type="number"
                        name="expectedPrice"
                        value={form.expectedPrice}
                        onChange={handleChange}
                        placeholder="Price per unit"
                        min="0"
                        inputMode="decimal"
                        style={{ paddingLeft: "30px" }}
                      />
                    </div>
                    {errors.expectedPrice && <span className="form-error">{errors.expectedPrice}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="harvestDate">
                    Harvest Date <span className="form-label-telugu">/ కోత తేదీ</span>
                    <span className="req">*</span>
                  </label>
                  <input
                    id="harvestDate"
                    className={`form-input${errors.harvestDate ? " error" : ""}`}
                    type="date"
                    name="harvestDate"
                    value={form.harvestDate}
                    onChange={handleChange}
                    min={today}
                  />
                  {errors.harvestDate && <span className="form-error">{errors.harvestDate}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="notes">
                    Additional Notes <span className="form-label-telugu">/ అదనపు వివరాలు</span>
                  </label>
                  <textarea
                    id="notes"
                    className="form-textarea"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Crop condition, grade, storage location… (optional)"
                  />
                </div>

                <button className="form-submit" type="submit" disabled={loading}>
                  {loading ? "Submitting…" : <><Sprout size={16} /> Submit Crop Sale Request</>}
                </button>

              </form>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="sellcrops__sidebar fade-up-2">

          {/* Accepted crops */}
          <div className="sidebar-card glass-panel">
            <div className="sidebar-card__head">
              <Sprout size={16} className="text-leaf-light" /> Crops We Accept
            </div>
            <div className="sidebar-card__body">
              <div className="crop-chip-grid">
                {ACCEPTED_CROPS.map((c) => (
                  <div className="crop-chip glass-panel" key={c.name}>
                    <Sprout size={12} className="text-leaf-pale" />
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="sidebar-card glass-panel">
            <div className="sidebar-card__head">
              <Phone size={16} className="text-harvest-lt" /> Need Help?
            </div>
            <div className="sidebar-card__body">
              <div className="info-row">
                <div className="info-row-icon"><Phone size={16} /></div>
                <div className="info-row-text">
                  <div className="info-row-label">Call Us</div>
                  <div className="info-value">+91 9014488562</div>
                  <div style={{ fontSize: "11px", opacity: 0.6 }}>Mon–Sat, 9 AM – 5 PM</div>
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-row-icon"><Clock size={16} /></div>
                <div className="info-row-text">
                  <div className="info-row-label">Response Time</div>
                  <div className="info-value">Within 24 hours of submission</div>
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-row-icon"><CreditCard size={16} /></div>
                <div className="info-row-text">
                  <div className="info-row-label">Payment</div>
                  <div className="info-value">Direct bank transfer within 3 days</div>
                </div>
              </div>
              
              <a
                href="https://wa.me/919014488562?text=Hello%20Kalludevakunta%20FPC%2C%20I%20want%20to%20sell%20my%20crops."
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn"
              >
                💬 Chat on WhatsApp
              </a>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

export default SellCrops;