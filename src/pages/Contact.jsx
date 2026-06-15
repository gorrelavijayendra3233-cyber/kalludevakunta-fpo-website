import { useState } from "react";
import { MapPin, Phone, Mail, CheckCircle, MessageCircle, AlertTriangle } from "lucide-react";
import "./Contact.css";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

const VILLAGE_OPTIONS = [
  "Kalludevakunta", "Mantralayam", "Madhavaram", "Kosigi",
  "Nandavaram", "Emmiganur", "Adoni", "Yemmiganur",
  "Pedakadubur", "Gonegandla", "Kowthalam", "Holagunda", "Other"
];

const INQUIRY_OPTIONS = [
  "Product enquiry", "Bulk purchase", "Partnership", "Farmer membership", "Other"
];

const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  village: "",
  otherVillage: "",
  inquiryType: "Product enquiry",
  message: "",
};

const INITIAL_ERRORS = {
  name: "",
  phone: "",
  email: "",
  village: "",
  otherVillage: "",
  message: "",
};

function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const tempErrors = { ...INITIAL_ERRORS };
    let isValid = true;

    if (!form.name.trim()) {
      tempErrors.name = "Full Name is required / పేరు అవసరం";
      isValid = false;
    }

    if (!form.phone.trim()) {
      tempErrors.phone = "Phone number is required / ఫోన్ నెంబర్ అవసరం";
      isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
      tempErrors.phone = "Enter a valid 10-digit mobile number";
      isValid = false;
    }

    if (!form.email.trim()) {
      tempErrors.email = "Email address is required / ఈమెయిల్ అవసరం";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      tempErrors.email = "Enter a valid email address";
      isValid = false;
    }

    if (!form.village) {
      tempErrors.village = "Please select your village / గ్రామం ఎంచుకోండి";
      isValid = false;
    } else if (form.village === "Other" && !form.otherVillage.trim()) {
      tempErrors.otherVillage = "Please specify village name / గ్రామం రాయండి";
      isValid = false;
    }

    if (!form.message.trim()) {
      tempErrors.message = "Message is required / సందేశం అవసరం";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);

  const payload = {
    ...form,
    village:
      form.village === "Other"
        ? form.otherVillage.trim()
        : form.village,
  };

  delete payload.otherVillage;

  try {
    const response = await fetch(
      `${API_BASE}/contact`,
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
      setErrors(INITIAL_ERRORS);
    } else {
      alert(data.message || "Failed to send message");
    }
  } catch (error) {
    console.error(error);
    alert("Server connection failed");
  }

  setLoading(false);
};

  return (
    <main>
      {/* Hero */}
      <div className="contact__hero glass-panel fade-up">
        <span className="contact__hero-tag">
          <Mail size={12} style={{ color: "var(--harvest-lt)" }} /> Get in Touch
        </span>
        <h1 className="contact__hero-title">Contact Us</h1>
      </div>

      {/* Body */}
      <section className="contact__body">
        <span className="section-tag"><MapPin size={14} /> Reach Out</span>
        <h2 className="section-title">We'd love to hear from you</h2>
        <div className="section-divider" />

        <div className="contact__grid">
          
          {/* Info cards (Left Side) */}
          <div className="contact__info-list">
            <div className="contact__item glass-panel fade-up-1">
              <div className="contact__icon"><MapPin size={20} /></div>
              <div>
                <div className="contact__label">Address</div>
                <div className="contact__value">
                  Kalludevakunta (V), Mantralayam (M),<br />
                  Kurnool District, Andhra Pradesh – 518345
                </div>
              </div>
            </div>
            
            <div className="contact__item glass-panel fade-up-2 contact__item--phone">
              <div className="contact-phone-content">
                <div className="contact__icon"><Phone size={20} /></div>
                <div>
                  <div className="contact__label">Phone &amp; WhatsApp</div>
                  <div className="contact__value">
                    +91 9014488562<br />
                    Mon–Sat, 9 AM – 5 PM
                  </div>
                </div>
              </div>
              <a
                href="https://wa.me/919014488562?text=Hello%20Kalludevakunta%20FPC%20Team%2C%20I%20have%20an%20inquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn contact-whatsapp-btn"
              >
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>
            </div>
            
            <div className="contact__item glass-panel fade-up-3">
              <div className="contact__icon"><Mail size={20} /></div>
              <div>
                <div className="contact__label">Email</div>
                <div className="contact__value">
                  kdkfpc9@gmail.com
                </div>
              </div>
            </div>

            {/* Google Maps placeholder section */}
            <div className="contact__map glass-panel fade-up-3">
              <div className="map-glow" />
              <div className="map-content">
                <MapPin size={24} className="map-pin-pulse" />
                <span className="map-text">Google Maps View</span>
                <small className="map-sub">Kalludevakunta Farmers Producer Company Limited, Andhra Pradesh</small>
              </div>
            </div>
          </div>

          {/* Form Card (Right Side) */}
          <div className="contact__form glass-panel fade-up">
            <div className="contact__form-heading">Send us a message</div>
            <div className="contact__form-sub">
              We usually respond within 1–2 business days.
            </div>

            {submitted ? (
              <div className="form-success-msg fade-up">
                <div className="success-icon"><CheckCircle size={44} className="text-leaf-light" /></div>
                <h3>Message Sent!</h3>
                <p>
                  Thank you. We've received your message. Our representative will contact you
                  via email or phone within <strong>1–2 business days</strong>.
                </p>
                <button
                  className="form-submit"
                  style={{ marginTop: "1.5rem" }}
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="form__row form__row--two">
                  <div className="form-group">
                    <label className="form-label" htmlFor="con-name">Full Name *</label>
                    <input
                      id="con-name"
                      className={`form-input${errors.name ? " error" : ""}`}
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                    />
                    {errors.name && (
                      <span className="form-error">
                        <AlertTriangle size={12} /> {errors.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="con-phone">Phone Number *</label>
                    <input
                      id="con-phone"
                      className={`form-input${errors.phone ? " error" : ""}`}
                      type="tel"
                      name="phone"
                      maxLength={10}
                      inputMode="numeric"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="10-digit number"
                    />
                    {errors.phone && (
                      <span className="form-error">
                        <AlertTriangle size={12} /> {errors.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form__row form__row--two">
                  <div className="form-group">
                    <label className="form-label" htmlFor="con-email">Email Address *</label>
                    <input
                      id="con-email"
                      className={`form-input${errors.email ? " error" : ""}`}
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@email.com"
                    />
                    {errors.email && (
                      <span className="form-error">
                        <AlertTriangle size={12} /> {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="con-village">Village *</label>
                    <select
                      id="con-village"
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
                    {errors.village && (
                      <span className="form-error">
                        <AlertTriangle size={12} /> {errors.village}
                      </span>
                    )}
                  </div>
                </div>

                {form.village === "Other" && (
                  <div className="form-group fade-in">
                    <label className="form-label" htmlFor="con-otherVillage">
                      Specify Village Name <span className="form-label-telugu">/ గ్రామం పేరు రాయండి</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      id="con-otherVillage"
                      type="text"
                      className={`form-input${errors.otherVillage ? " error" : ""}`}
                      name="otherVillage"
                      value={form.otherVillage}
                      onChange={handleChange}
                      placeholder="Enter your village name"
                    />
                    {errors.otherVillage && (
                      <span className="form-error">
                        <AlertTriangle size={12} /> {errors.otherVillage}
                      </span>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="con-inquiry">Inquiry Type</label>
                  <select
                    id="con-inquiry"
                    className="form-select"
                    name="inquiryType"
                    value={form.inquiryType}
                    onChange={handleChange}
                  >
                    {INQUIRY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="con-message">Message *</label>
                  <textarea
                    id="con-message"
                    className={`form-textarea${errors.message ? " error" : ""}`}
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what you need..."
                    rows={4}
                  />
                  {errors.message && (
                    <span className="form-error">
                      <AlertTriangle size={12} /> {errors.message}
                    </span>
                  )}
                </div>

                <button className="form-submit" type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send Message →"}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>
    </main>
  );
}

export default Contact;