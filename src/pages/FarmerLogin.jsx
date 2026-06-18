import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Lock, ArrowRight, Sprout, ShieldAlert, KeyRound } from "lucide-react";
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
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("farmer_token");
    if (token) {
      navigate("/farmer-dashboard");
    }
  }, [navigate]);

  // Handle OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Dynamically load MSG91 Widget script
  useEffect(() => {
    const widgetId = import.meta.env.VITE_MSG91_WIDGET_ID || "366671657276343530333234";
    const tokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH || "533115TEujAKR2ELl6a323176P1";

    window.configuration = {
      widgetId: widgetId,
      tokenAuth: tokenAuth,
      exposeMethods: true,
      success: (data) => {
        console.log("MSG91 Widget initialized & success callback:", data);
      },
      failure: (error) => {
        console.error("MSG91 Widget failure:", error);
      }
    };

    const scriptId = "msg91-otp-script";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://verify.msg91.com/otp-provider.js";
      script.async = true;
      script.onload = () => {
        if (typeof window.initSendOTP === "function") {
          window.initSendOTP(window.configuration);
        }
      };
      document.body.appendChild(script);
    } else {
      if (typeof window.initSendOTP === "function") {
        window.initSendOTP(window.configuration);
      }
    }
  }, []);

  const cleanPhone = (rawPhone) => {
    let clean = String(rawPhone).replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("91")) {
      clean = clean.substring(2);
    }
    if (clean.length === 11 && clean.startsWith("0")) {
      clean = clean.substring(1);
    }
    return clean;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const normalizedPhone = cleanPhone(phone);
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      toast.error("Please enter a valid 10-digit mobile number starting with 6-9.");
      return;
    }

    setLoading(true);
    let resolved = false;

    // Set a safety timeout of 4 seconds so it never gets stuck
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("sendOtp call timed out after 4 seconds.");
        if (import.meta.env.DEV) {
          toast.success("[DEV MODE] OTP request timed out. Proceeding with mock OTP: 123456");
          setStep(2);
          setOtp("123456");
          setCountdown(60);
        } else {
          toast.error("OTP request timed out. Please check your network and try again.");
        }
        setLoading(false);
      }
    }, 4000);

    const triggerSend = () => {
      if (typeof window.sendOtp === "function") {
        window.sendOtp(
          "91" + normalizedPhone,
          (data) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              toast.success("OTP code sent successfully!");
              setStep(2);
              setCountdown(60);
              setLoading(false);
            }
          },
          (error) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              console.error("MSG91 sendOtp error:", error);
              if (import.meta.env.DEV) {
                toast.success("[DEV MODE] Failed to send real OTP. Proceeding with mock OTP: 123456");
                setStep(2);
                setOtp("123456");
                setCountdown(60);
              } else {
                toast.error(error.message || "Failed to send OTP code.");
              }
              setLoading(false);
            }
          }
        );
      } else {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          console.error("window.sendOtp is not available.");
          if (import.meta.env.DEV) {
            toast.success("[DEV MODE] MSG91 Widget script not loaded. Proceeding with mock OTP: 123456");
            setStep(2);
            setOtp("123456");
            setCountdown(60);
          } else {
            toast.error("OTP verification service is currently unavailable. Please try again.");
          }
          setLoading(false);
        }
      }
    };

    triggerSend();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.error("OTP must be a 6-digit verification code.");
      return;
    }

    setLoading(true);
    let resolved = false;
    const normalizedPhone = cleanPhone(phone);

    const callBackendLogin = async () => {
      try {
        const response = await fetch(`${API_BASE}/farmer-auth/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone: normalizedPhone }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success("Logged in successfully!");
          localStorage.setItem("farmer_token", data.token);
          localStorage.setItem("farmer_info", JSON.stringify(data.farmer));
          
          // Dispatch storage event to update navbar instantly
          window.dispatchEvent(new Event("storage"));
          
          navigate("/farmer-dashboard");
        } else {
          toast.error(data.message || "Farmer verification failed. Please contact the administrator.");
        }
      } catch (error) {
        console.error("Backend verify endpoint error:", error);
        toast.error("Unable to verify registration. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Strict dev-only mock OTP
    if (import.meta.env.DEV && otp === "123456") {
      await callBackendLogin();
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("verifyOtp call timed out after 4 seconds.");
        if (import.meta.env.DEV) {
          toast.success("[DEV MODE] OTP verification timed out. Proceeding with database login.");
          callBackendLogin();
        } else {
          toast.error("OTP verification timed out. Please try again.");
          setLoading(false);
        }
      }
    }, 4000);

    // Production MSG91 verify flow
    if (typeof window.verifyOtp === "function") {
      window.verifyOtp(
        otp,
        async (data) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            await callBackendLogin();
          }
        },
        (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            toast.error(error.message || "Invalid OTP code / తప్పుడు ఓటిపి");
            setLoading(false);
          }
        }
      );
    } else {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        toast.error("Verification service is unavailable. Please try again.");
        setLoading(false);
      }
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
              <span className="input-hint">Must be registered with the FPO by the administrator.</span>
            </div>

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
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="otp-actions">
              <button 
                type="button" 
                className="back-btn" 
                onClick={() => setStep(1)} 
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

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Log In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default FarmerLogin;
