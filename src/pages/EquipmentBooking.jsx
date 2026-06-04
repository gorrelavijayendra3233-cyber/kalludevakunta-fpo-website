import { useState } from "react";
import "./EquipmentBooking.css";

// ── Constants ──────────────────────────────────────────────────
const EQUIPMENT_LIST = [
  { id: "tractor",    icon: "🚜", name: "Tractor",    rateHour: 350,  rateDay: 2500 },
  { id: "rotavator",  icon: "⚙️",  name: "Rotavator", rateHour: 250,  rateDay: 1800 },
  { id: "sprayer",    icon: "💧", name: "Sprayer",    rateHour: 150,  rateDay: 900  },
  { id: "cultivator", icon: "🌱", name: "Cultivator", rateHour: 200,  rateDay: 1400 },
  { id: "harvester",  icon: "🌾", name: "Harvester",  rateHour: 600,  rateDay: 4000 },
  { id: "seeddrill",  icon: "🫘", name: "Seed Drill", rateHour: 300,  rateDay: 2000 },
];

const VILLAGE_OPTIONS = [
  "Kalludevakunta", "Uppal Kalan", "Ghatkesar", "Medchal",
  "Keesara", "Bibi Nagar", "Aler", "Bhongir", "Other",
];

const INITIAL_FORM = {
  farmerName: "", mobileNumber: "", village: "",
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
    valid = false; // handled separately with banner
  }
  if (!form.farmerName.trim()) {
    errors.farmerName = "Name is required / పేరు అవసరం"; valid = false;
  }
  if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
    errors.mobileNumber = "Enter a valid 10-digit mobile number"; valid = false;
  }
  if (!form.village) {
    errors.village = "Please select your village"; valid = false;
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
    if (!selectedEquipment) { setEquipError(true); return; }

    const { errors: newErrors, valid } = validate(form, selectedEquipment);
    if (!valid) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        equipmentName: selectedEquipment.name,
        durationUnit,
      };
      // TODO: replace with real API call
      // const res = await fetch(`${import.meta.env.VITE_API_URL}/api/equipment`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      // if (!res.ok) throw new Error("Submission failed");
      console.log("Booking payload:", payload);

      await new Promise((r) => setTimeout(r, 1200));
      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch {
      alert("Something went wrong. Please try again or call us directly.");
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
      <div className="equip__hero fade-up">
        <span className="equip__hero-tag">Farmer Services</span>
        <h1 className="equip__hero-title">Equipment Booking</h1>
        <p className="equip__hero-sub">
          వ్యవసాయ యంత్రాల బుకింగ్ — Book tractors, harvesters & more by hour or day.
        </p>
      </div>

      {/* Equipment selector */}
      <div className="equip__selector">
        <div className="equip__selector-title">
          Step 1 — Select Equipment / యంత్రం ఎంచుకోండి
        </div>
        <div className="equip__grid">
          {EQUIPMENT_LIST.map((eq) => (
            <div
              key={eq.id}
              className={`equip-tile${selectedId === eq.id ? " selected" : ""}`}
              onClick={() => handleEquipSelect(eq.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleEquipSelect(eq.id)}
              aria-pressed={selectedId === eq.id}
            >
              <div className="equip-tile__icon">{eq.icon}</div>
              <div className="equip-tile__name">{eq.name}</div>
              <div className="equip-tile__rate">₹{eq.rateHour}/hr</div>
            </div>
          ))}
        </div>
        {equipError && (
          <p style={{ color: "#C0392B", fontSize: "12px", marginTop: "10px" }}>
            ⚠ Please select an equipment first / ముందు యంత్రం ఎంచుకోండి
          </p>
        )}
      </div>

      {/* Body */}
      <div className="equip__body">

        {/* ── Form ── */}
        <div className="equip__form-card fade-up">
          <div className="equip__form-header">
            <div className="equip__form-header-icon">📅</div>
            <div>
              <div className="equip__form-header-title">Booking Request</div>
              <div className="equip__form-header-sub">Step 2 — Fill your details</div>
            </div>
          </div>

          <div className="equip__form-body">
            {submitted ? (
              <div className="form-success-msg fade-up">
                <div className="success-icon">✅</div>
                <h3>Booking Confirmed!</h3>
                <p>
                  Your request for <strong>{selectedEquipment?.name || "equipment"}</strong> has
                  been submitted. Our team will call you at your registered number within
                  <strong> 24 hours</strong> to confirm the booking.
                </p>
                <p style={{ marginTop: "12px", color: "var(--soil-light)", fontSize: "12px" }}>
                  మీ బుకింగ్ అభ్యర్థన విజయవంతంగా సమర్పించబడింది.
                </p>
                <button
                  className="form-submit"
                  style={{ marginTop: "1rem" }}
                  onClick={handleNewBooking}
                >
                  Book Another Equipment
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>

                {selectedEquipment ? (
                  <div className="equip__selected-banner">
                    <span style={{ fontSize: "22px" }}>{selectedEquipment.icon}</span>
                    <span>
                      <strong>{selectedEquipment.name}</strong> selected —
                      ₹{selectedEquipment.rateHour}/hour · ₹{selectedEquipment.rateDay}/day
                    </span>
                  </div>
                ) : (
                  <div className="equip__no-selection">
                    👆 Select equipment above to continue
                  </div>
                )}

                {/* Section: Personal Details */}
                <div className="form-section-label">👤 Your Details</div>

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

                <div className="form-divider" />

                {/* Section: Booking Details */}
                <div className="form-section-label">📅 Booking Details</div>

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
                      <div>
                        <input
                          id="eq-duration"
                          className={`form-input${errors.duration ? " error" : ""}`}
                          type="number"
                          name="duration"
                          value={form.duration}
                          onChange={handleChange}
                          placeholder={durationUnit === "Hours" ? "No. of hours" : "No. of days"}
                          min="1"
                          inputMode="decimal"
                        />
                        {errors.duration && <span className="form-error">{errors.duration}</span>}
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
                  </div>
                </div>

                {/* Estimated cost */}
                {estimatedCost !== null && (
                  <div style={{
                    background: "#EAF3DE", border: "1px solid var(--leaf-pale)",
                    borderRadius: "var(--radius-sm)", padding: "10px 14px",
                    fontSize: "13px", color: "var(--leaf)", marginBottom: "1rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span>Estimated cost for {form.duration} {durationUnit.toLowerCase()}</span>
                    <strong style={{ fontSize: "16px", fontFamily: "var(--font-heading)" }}>
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
                  {loading ? "⏳ Submitting…" : "📅 Submit Booking Request"}
                </button>

              </form>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="equip__sidebar fade-up-2">

          {/* Rate card */}
          <div className="equip__info-card">
            <div className="equip__info-head">💰 Rate Card</div>
            <div className="equip__info-body">
              {EQUIPMENT_LIST.map((eq) => (
                <div className="equip-rate-row" key={eq.id}>
                  <div className="equip-rate-name">
                    <span>{eq.icon}</span>
                    <span>{eq.name}</span>
                  </div>
                  <div>
                    <span className="equip-rate-price">₹{eq.rateHour}</span>
                    <span className="equip-rate-unit">/hr</span>
                    <span style={{ margin: "0 4px", color: "var(--cream-dark)" }}>·</span>
                    <span className="equip-rate-price">₹{eq.rateDay}</span>
                    <span className="equip-rate-unit">/day</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="equip__note">
            ⚠️ Rates are indicative. Final pricing confirmed on call. Fuel charges may apply separately. Booking subject to availability.
          </div>

          {/* WhatsApp */}
          <div style={{ marginTop: "1rem" }}>
            <a
              href="https://wa.me/91XXXXXXXXXX?text=Hello%20Kalludevakunta%20FPO%2C%20I%20want%20to%20book%20equipment."
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-btn"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", background: "#25D366", color: "white",
                borderRadius: "var(--radius-sm)", padding: "11px",
                fontSize: "14px", fontWeight: "600", textDecoration: "none",
                fontFamily: "var(--font-body)", transition: "background var(--transition)"
              }}
            >
              💬 Book via WhatsApp
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}

export default EquipmentBooking;