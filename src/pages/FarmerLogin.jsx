import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Sprout, ShieldAlert, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import "./FarmerLogin.css";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

function FarmerLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

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

  const cleanPhone = (rawPhone) => {
    return String(rawPhone).replace(/\D/g, "");
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    const normalizedPhone = cleanPhone(phone);
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
        setStep(2);
        setCountdown(60);
      },
      (err) => {
        setLoading(false);
        toast.error(err.message || "Failed to send OTP code.");
      }
    );
  };

  const verifyOTP = () => {
    return new Promise((resolve, reject) => {
      if (!window.verifyOtp) {
        return reject(new Error("OTP Widget is loading, please wait..."));
      }
      window.verifyOtp(
        otp,
        (res) => resolve(res),
        (err) => reject(err)
      );
    });
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isVerifying) return;

    const normalizedPhone = cleanPhone(phone);
    if (!/^\d{6}$/.test(otp)) {
      toast.error("OTP must be a 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    setLoading(true);

    try {
      const verificationResult = await verifyOTP();
      const tokenVal = typeof verificationResult === "string" ? verificationResult : (verificationResult?.access_token || verificationResult?.token || verificationResult?.data);
      if (!tokenVal) {
        throw new Error("Failed to retrieve OTP access token.");
      }

      // Call backend: POST /api/farmer/login
      const response = await fetch(`${API_BASE}/farmer/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          otpToken: tokenVal
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Logged in successfully!");
        localStorage.setItem("farmerToken", data.token);
        localStorage.setItem("farmer_token", data.token);
        localStorage.setItem("farmer_data", JSON.stringify(data.farmer));
        window.dispatchEvent(new Event("storage"));
        navigate("/farmer-dashboard");
      } else {
        toast.error(data.message || "Login failed.");
      }
    } catch (err) {
      toast.error(err.message || "Invalid OTP code / తప్పుడు ఓటిపి");
    } finally {
      setIsVerifying(false);
      setLoading(false);
    }
  };

  return (
    <div className="farmer-login-container">
      <div className="farmer-login-card glass-panel fade-up">
        <div className="login-header">
          <div className="logo-badge">
            <Sprout size={28} className="logo-icon-svg" />
          </div>
          <h2>Farmer Login Portal</h2>
          <p className="subtitle">రైతు లాగిన్ — Access crop selling, machinery booking, and order history</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="input-group">
              <label htmlFor="phone">Registered Mobile Number / ఫోన్ నంబర్ *</label>
              <div className="input-field-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  required
                  disabled={loading}
                />
              </div>
              <span className="input-hint">Must be registered with the FPO.</span>
            </div>

            <div id="msg91-captcha-container" className="captcha-container"></div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? "Sending OTP..." : "Request OTP Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <div className="info-banner glass-panel">
              <ShieldAlert size={16} className="banner-icon" />
              <span>OTP code sent to <strong>+91 {phone}</strong></span>
            </div>

            <div className="input-group">
              <label htmlFor="otp">Enter 6-Digit OTP / ఓటిపి నంబర్ *</label>
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
                  disabled={loading || isVerifying}
                  autoFocus
                />
              </div>
            </div>

            <div className="otp-actions">
              <button
                type="button"
                className="back-btn"
                onClick={() => setStep(1)}
                disabled={loading || isVerifying}
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
                  disabled={loading || isVerifying}
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading || isVerifying}>
              {loading || isVerifying ? "Verifying..." : "Verify & Log In"}
            </button>
          </form>
        )}

        <p className="auth-footer-text">
          New farmer? <span className="auth-link" onClick={() => navigate("/farmer-register")}>Register here</span>
        </p>
      </div>
    </div>
  );
}

export default FarmerLogin;
