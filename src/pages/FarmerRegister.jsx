import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, Sprout, ShieldCheck, KeyRound, Sprout as SproutIcon } from "lucide-react";
import toast from "react-hot-toast";
import LocationSelector from "../components/LocationSelector/LocationSelector";
import "./FarmerLogin.css"; // Reuse login page styling for consistency
import useDocumentMetadata from "../hooks/useDocumentMetadata";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

const CROP_OPTIONS = [
  "Paddy (Rice)", "Maize", "Red Gram (Tur Dal)", "Groundnut",
  "Sunflower", "Soybean", "Cotton", "Tomato", "Chilli", "Onion",
  "Banana", "Turmeric", "Jowar", "Bajra", "Wheat", "Other"
];

function FarmerRegister() {
  useDocumentMetadata("Farmer Registration", "Register as a member of Kalludevakunta Farmers Producer Company Limited (KDKFPCL) to start selling crops and renting farm equipment online.");
  const [form, setForm] = useState({
    farmerName: "",
    phone: "",
    landArea: "",
    surveyNumber: "",
    aadharNumber: "",
    state: "",
    district: "",
    mandal: "",
    village: ""
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const verifyingRef = useRef(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token");
    if (token) {
      navigate("/farmer-dashboard");
    }
  }, [navigate]);

  // Load MSG91 script & init widget
  useEffect(() => {
    const scriptId = "msg91-otp-script";
    let script = document.getElementById(scriptId);

    const initWidget = () => {
      if (window.initSendOTP) {
        window.initSendOTP({
          widgetId: "3666726a614e373435363130",
          tokenAuth: "533115TwHVe50C6a33c31eP1",
          exposeMethods: true,
          captchaRenderId: "msg91-captcha-container",
          success: (data) => {
            console.log("MSG91 Widget Init Success", data);
          },
          failure: (error) => {
            console.error("MSG91 Widget Init Failure", error);
          }
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://verify.msg91.com/otp-provider.js";
      script.async = true;
      script.onload = () => {
        initWidget();
      };
      document.body.appendChild(script);
    } else {
      initWidget();
    }
  }, []);

  // Handle OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const cleanPhone = (rawPhone) => {
    return String(rawPhone).replace(/\D/g, "");
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    const normalizedPhone = cleanPhone(form.phone);
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      toast.error("Please enter a valid 10-digit mobile number starting with 6-9.");
      return;
    }

    if (!window.sendOtp) {
      toast.error("OTP Widget is loading, please wait...");
      return;
    }

    setLoading(true);
    window.sendOtp(
      "91" + normalizedPhone,
      (res) => {
        setLoading(false);
        toast.success("OTP code sent successfully!");
        setOtpSent(true);
        setCountdown(60);
      },
      (err) => {
        setLoading(false);
        toast.error(err.message || "Failed to send OTP code.");
      }
    );
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (loading || verifyingRef.current || otpVerified) return;

    if (!/^\d{6}$/.test(otp)) {
      toast.error("OTP must be a 6-digit verification code.");
      return;
    }

    if (!window.verifyOtp) {
      toast.error("OTP Widget is loading, please wait...");
      return;
    }

    verifyingRef.current = true;
    setLoading(true);
    window.verifyOtp(
      otp,
      (res) => {
        verifyingRef.current = false;
        setLoading(false);
        const tokenVal = typeof res === "string" ? res : (res?.message || res?.access_token || res?.token || res?.data);
        if (!tokenVal) {
          toast.error("Failed to retrieve OTP access token.");
          return;
        }
        toast.success("OTP Verified Successfully!");
        setOtpVerified(true);
        setOtpToken(tokenVal);
      },
      (err) => {
        verifyingRef.current = false;
        setLoading(false);
        toast.error(err.message || "Invalid OTP code / తప్పుడు ఓటిపి");
      }
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otpVerified || !otpToken) {
      toast.error("Please verify your mobile number with OTP first.");
      return;
    }

    if (!form.farmerName || !form.phone || !form.state || !form.district || !form.mandal || !form.village) {
      toast.error("Name, Phone, State, District, Mandal, and Village are required.");
      return;
    }

    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber.trim())) {
      toast.error("Aadhar number must be exactly 12 digits.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        farmerName: form.farmerName,
        state: form.state,
        district: form.district,
        mandal: form.mandal,
        village: form.village,
        phone: cleanPhone(form.phone),
        landArea: form.landArea,
        surveyNumber: form.surveyNumber,
        aadharNumber: form.aadharNumber,
        otpToken,
        action: "register"
      };

      const response = await fetch(`${API_BASE}/farmer/verify-msg91`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Registration Successful!");
        localStorage.setItem("farmerToken", data.token);
        localStorage.setItem("farmer_token", data.token);
        localStorage.setItem("farmer_data", JSON.stringify(data.farmer));
        window.dispatchEvent(new Event("storage"));
        navigate("/farmer-dashboard");
      } else {
        toast.error(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="farmer-login-container" style={{ padding: "60px 20px" }}>
      <div className="farmer-login-card glass-panel fade-up" style={{ maxWidth: "550px" }}>
        <div className="login-header">
          <div className="logo-badge">
            <SproutIcon size={28} className="logo-icon-svg" />
          </div>
          <h2>Farmer Self-Registration</h2>
          <p className="subtitle">రైతు నమోదు — Join Kalludevakunta Farmers Producer Company (KDFPC)</p>
        </div>

        <form onSubmit={handleRegister} className="login-form">
          {/* Farmer Details */}
          <div className="input-group">
            <label htmlFor="farmerName">Farmer Name / రైతు పేరు *</label>
            <div className="input-field-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="farmerName"
                name="farmerName"
                type="text"
                placeholder="Enter your full name"
                value={form.farmerName}
                onChange={handleChange}
                required
                disabled={otpVerified || loading}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="phone">Mobile Number / ఫోన్ నంబర్ *</label>
            <div className="input-field-wrapper">
              <Phone size={18} className="input-icon" />
              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={10}
                placeholder="Enter 10-digit number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                required
                disabled={otpVerified || otpSent || loading}
              />
            </div>
            {!otpSent && <span className="input-hint">OTP will be sent to this number for verification.</span>}
          </div>

          {/* OTP Send/Verify Panel */}
          {otpSent && !otpVerified && (
            <div className="otp-verification-section glass-panel" style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="info-banner glass-panel" style={{ margin: 0 }}>
                <ShieldCheck size={16} className="banner-icon" />
                <span>Verification code sent to <strong>+91 {form.phone}</strong></span>
              </div>

              <div className="input-group">
                <label htmlFor="otp">Enter 6-Digit OTP *</label>
                <div className="input-field-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="otp-actions" style={{ margin: 0 }}>
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => setOtpSent(false)}
                  disabled={loading}
                >
                  Change Number
                </button>
                {countdown > 0 ? (
                  <span className="resend-countdown">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    className="resend-btn"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                type="button"
                className="login-submit-btn"
                onClick={handleVerifyOtp}
                disabled={loading}
                style={{ height: "44px" }}
              >
                {loading ? "Verifying..." : "Verify Mobile Number"}
              </button>
            </div>
          )}

          {otpVerified && (
            <div className="info-banner glass-panel" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)", color: "#22c55e" }}>
              <ShieldCheck size={16} className="banner-icon" />
              <strong>OTP Verified Successfully / మొబైల్ ధృవీకరించబడింది</strong>
            </div>
          )}

          {/* Additional details */}
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
          </div>

          <div className="input-group">
            <label htmlFor="landArea">Land Area / సాగు భూమి (e.g., 5 Acres)</label>
            <div className="input-field-wrapper">
              <Sprout size={18} className="input-icon" />
              <input
                id="landArea"
                name="landArea"
                type="text"
                placeholder="e.g. 5 Acres"
                value={form.landArea}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="surveyNumber">Survey Number / సర్వే నంబర్</label>
            <div className="input-field-wrapper">
              <KeyRound size={18} className="input-icon" />
              <input
                id="surveyNumber"
                name="surveyNumber"
                type="text"
                placeholder="e.g. 123/A"
                value={form.surveyNumber}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="aadharNumber">Aadhar Number / ఆధార్ నంబర్</label>
            <div className="input-field-wrapper">
              <ShieldCheck size={18} className="input-icon" />
              <input
                id="aadharNumber"
                name="aadharNumber"
                type="text"
                maxLength={12}
                placeholder="12-digit number"
                value={form.aadharNumber}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div id="msg91-captcha-container" className="captcha-container"></div>

          {!otpSent && !otpVerified && (
            <button
              type="button"
              className="login-submit-btn"
              onClick={handleSendOtp}
              disabled={loading}
            >
              Verify Mobile via OTP
            </button>
          )}

          {otpVerified && (
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? "Registering..." : "Register Farmer"}
            </button>
          )}
        </form>

        <p className="auth-footer-text">
          Already registered? <span className="auth-link" onClick={() => navigate("/farmer-login")}>Login here</span>
        </p>
      </div>
    </div>
  );
}

export default FarmerRegister;
