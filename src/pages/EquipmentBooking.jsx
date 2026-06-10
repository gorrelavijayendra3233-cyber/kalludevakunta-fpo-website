import { useState } from "react";
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
  DollarSign
} from "lucide-react";
import "./EquipmentBooking.css";

// ── Constants ──────────────────────────────────────────────────
const EQUIPMENT_LIST = [
  { id: "tractor",    icon: <Tractor size={24} />, name: "Tractor",    rateHour: 350,  rateDay: 2500 },
  { id: "rotavator",  icon: <Settings size={24} />,  name: "Rotavator", rateHour: 250,  rateDay: 1800 },
  { id: "sprayer",    icon: <Droplet size={24} />, name: "Sprayer",    rateHour: 150,  rateDay: 900  },
  { id: "cultivator", icon: <Sprout size={24} />, name: "Cultivator", rateHour: 200,  rateDay: 1400 },
  { id: "harvester",  icon: <Wheat size={24} />, name: "Harvester",  rateHour: 600,  rateDay: 4000 },
  { id: "seeddrill",  icon: <Settings size={24} />, name: "Seed Drill", rateHour: 300,  rateDay: 2000 },
];

const VILLAGE_OPTIONS = [
  "Kalludevakunta", "Mantralayam", "Madhavaram", "Kosigi",
  "Nandavaram", "Emmiganur", "Adoni", "Yemmiganur",
  "Pedakadubur", "Gonegandla", "Kowthalam", "Holagunda", "Other"
];

const INITIAL_FORM = {
  farmerName: "", mobileNumber: "", village: "", otherVillage: "",
  bookingDate: "", duration: "", remarks: "",
};

const INITIAL_ERRORS = Object.fromEntries(
  Object.keys(INITIAL_FORM).map((k) => [k, ""])
);

// ── Validation ─────────────────────────────────────────────────
function validate(form, selectedEquipment) {
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
  if (!form.village) {
    errors.village = "Please select your village"; valid = false;
  } else if (form.village === "Other" && !form.otherVillage.trim()) {
    errors.otherVillage = "Please specify village name / గ్రామం రాయండి"; valid = false;
  }
  if (!form.bookingDate) {
    errors.bookingDate = "Booking date is required"; valid = false;
  }
  if (!form.duration || isNaN(form.duration) || Number(form.duration) <= 0) {
    errors.duration = "Enter a valid duration"; valid = false;
  }

  return { errors, valid };
}

// ── Component ──────────────────────────────────────────────────
function EquipmentBooking() {
  const [selectedId, setSelectedId]   = useState(null);
  const [durationUnit, setDurationUnit] = useState("Hours");
  const [form, setForm]               = useState(INITIAL_FORM);
  const [errors, setErrors]           = useState(INITIAL_ERRORS);
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [equipError, setEquipError]   = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const selectedEquipment = EQUIPMENT_LIST.find((e) => e.id === selectedId) || null;

  // Estimated cost
  const rate = selectedEquipment
    ? (durationUnit === "Hours" ? selectedEquipment.rateHour : selectedEquipment.rateDay)
    : 0;
  const estimatedCost =
    form.duration && !isNaN(form.duration) && rate
      ? Math.round(Number(form.duration) * rate)
      : null;

  const handleEquipSelect = (id) => {
    setSelectedId(id);
    setEquipError(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!selectedEquipment) {
    setEquipError(true);
    return;
  }

  const { errors: newErrors, valid } = validate(form, selectedEquipment);

  if (!valid) {
    setErrors(newErrors);
    return;
  }

  setLoading(true);

  try {
    const payload = {
      farmerName: form.farmerName,
      equipmentName: selectedEquipment.name,
      bookingDate: form.bookingDate,
      phone: form.mobileNumber,
    };

    const response = await fetch(
      "http://localhost:5000/api/bookings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    console.log("Server Response:", data);

    if (response.ok) {
      setSubmitted(true);
      setForm(INITIAL_FORM);
    } else {
      alert(data.message || "Failed to submit booking request");
    }
  } catch (error) {
    console.error(error);
    alert("Server connection failed");
  } finally {
    setLoading(false);
  }
};

  const handleNewBooking = () => {
    setSubmitted(false);
    setSelectedId(null);
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
          {EQUIPMENT_LIST.map((eq) => (
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
              <div className="equip-tile__rate">₹{eq.rateHour}/hr</div>
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
            {submitted ? (
              <div className="form-success-msg fade-up">
                <div className="success-icon"><CheckCircle size={44} className="text-leaf-light" /></div>
                <h3>Booking Confirmed!</h3>
                <p>
                  Your request for <strong>{selectedEquipment?.name || "equipment"}</strong> has
                  been submitted. Our team will call you at your registered number within
                  <strong> 24 hours</strong> to confirm the booking.
                </p>
                <p style={{ marginTop: "12px", color: "var(--text-muted)", fontSize: "12px" }}>
                  మీ బుకింగ్ అభ్యర్థన విజయవంతంగా సమర్పించబడింది.
                </p>
                <button
                  className="form-submit"
                  style={{ marginTop: "1.5rem" }}
                  onClick={handleNewBooking}
                >
                  Book Another Equipment
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>

                {selectedEquipment ? (
                  <div className="equip__selected-banner glass-panel">
                    <span className="selected-banner-icon">{selectedEquipment.icon}</span>
                    <span>
                      <strong>{selectedEquipment.name}</strong> selected — 
                      ₹{selectedEquipment.rateHour}/hr · ₹{selectedEquipment.rateDay}/day
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
                    />
                    {errors.mobileNumber && <span className="form-error">{errors.mobileNumber}</span>}
                  </div>
                </div>

                 <div className="form-group">
                  <label className="form-label" htmlFor="eq-village">
                    Village / Farm Location <span className="form-label-telugu">/ గ్రామం</span>
                    <span className="req">*</span>
                  </label>
                  <select
                    id="eq-village"
                    className={`form-select${errors.village ? " error" : ""}`}
                    name="village"
                    value={form.village}
                    onChange={handleChange}
                  >
                    <option value="">Select your village</option>
                    {VILLAGE_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.village && <span className="form-error">{errors.village}</span>}
                </div>

                {form.village === "Other" && (
                  <div className="form-group fade-in">
                    <label className="form-label" htmlFor="eq-otherVillage">
                      Specify Village Name <span className="form-label-telugu">/ గ్రామం పేరు రాయండి</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      id="eq-otherVillage"
                      type="text"
                      className={`form-input${errors.otherVillage ? " error" : ""}`}
                      name="otherVillage"
                      value={form.otherVillage}
                      onChange={handleChange}
                      placeholder="Enter your village name"
                    />
                    {errors.otherVillage && <span className="form-error">{errors.otherVillage}</span>}
                  </div>
                )}

                <div className="form-divider" />

                {/* Section: Booking Details */}
                <div className="form-section-label"><Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Booking Details</div>

                <div className="form-group--row">
                  <div className="form-group">
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

                  <div className="form-group">
                    <label className="form-label" htmlFor="eq-duration">
                      Duration <span className="form-label-telugu">/ సమయం</span>
                      <span className="req">*</span>
                    </label>
                    <div className="duration-row">
                      <div style={{ flex: 1 }}>
                        <input
                          id="eq-duration"
                          className={`form-input${errors.duration ? " error" : ""}`}
                          type="number"
                          name="duration"
                          value={form.duration}
                          onChange={handleChange}
                          placeholder={durationUnit === "Hours" ? "Hours" : "Days"}
                          min="1"
                          inputMode="decimal"
                        />
                      </div>
                      
                      <div className="duration-toggle" role="group" aria-label="Duration unit">
                        <button
                          type="button"
                          className={durationUnit === "Hours" ? "active" : ""}
                          onClick={() => setDurationUnit("Hours")}
                        >
                          Hours
                        </button>
                        <button
                          type="button"
                          className={durationUnit === "Days" ? "active" : ""}
                          onClick={() => setDurationUnit("Days")}
                        >
                          Days
                        </button>
                      </div>
                    </div>
                    {errors.duration && <span className="form-error" style={{ marginTop: "6px" }}>{errors.duration}</span>}
                  </div>
                </div>

                {/* Estimated cost details */}
                {estimatedCost !== null && (
                  <div className="estimated-cost-card glass-panel fade-up">
                    <span>Estimated rental cost ({form.duration} {durationUnit.toLowerCase()}):</span>
                    <strong className="estimated-cost-price">
                      ₹{estimatedCost.toLocaleString("en-IN")}
                    </strong>
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

                <button className="form-submit" type="submit" disabled={loading}>
                  {loading ? "Submitting…" : <><Calendar size={16} /> Submit Booking Request</>}
                </button>

              </form>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="equip__sidebar fade-up-2">

          {/* Rate card */}
          <div className="equip__info-card glass-panel">
            <div className="equip__info-head"><DollarSign size={16} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--harvest-lt)' }} /> Rate Card</div>
            <div className="equip__info-body">
              {EQUIPMENT_LIST.map((eq) => (
                <div className="equip-rate-row" key={eq.id}>
                  <div className="equip-rate-name">
                    <span className="equip-rate-icon">{eq.icon}</span>
                    <span>{eq.name}</span>
                  </div>
                  <div className="equip-rate-pricing">
                    <span className="equip-rate-price">₹{eq.rateHour}</span>
                    <span className="equip-rate-unit">/hr</span>
                    <span className="rate-divider">·</span>
                    <span className="equip-rate-price">₹{eq.rateDay}</span>
                    <span className="equip-rate-unit">/day</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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