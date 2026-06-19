import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sprout, Menu, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/",                 label: "Home",              end: true  },
  { to: "/about",            label: "About",             end: false },
  { to: "/products",         label: "Products",          end: false },
  { to: "/sell-crops",       label: "Sell Crops",        end: false },
  { to: "/equipment-booking",label: "Equipment Booking", end: false },
  { to: "/gallery",          label: "Gallery",           end: false },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [isFarmerLoggedIn, setIsFarmerLoggedIn] = useState(!!(localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token")));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const close = () => {
    setOpen(false);
    setDropdownOpen(false);
  };
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = () => {
      setIsFarmerLoggedIn(!!(localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token")));
    };
    window.addEventListener("storage", checkLoginStatus);
    return () => window.removeEventListener("storage", checkLoginStatus);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("farmer_token");
    localStorage.removeItem("farmerToken");
    localStorage.removeItem("farmer_data");
    setIsFarmerLoggedIn(false);
    window.dispatchEvent(new Event("storage"));
    toast.success("Logged out successfully");
    navigate("/farmer-login");
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__logo" onClick={close}>
        <div className="navbar__logo-icon">
          <Sprout size={22} className="logo-svg" />
        </div>
        <div className="navbar__logo-text">
          <span className="navbar__logo-name">Kalludevakunta FPC</span>
          <span className="navbar__logo-sub">Farmers Producer Company Limited</span>
        </div>
      </NavLink>

      <button
        className="navbar__hamburger"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation menu"
        aria-expanded={open}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      <ul className={`navbar__links${open ? " open" : ""}`}>
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={close}
            >
              {link.label}
            </NavLink>
          </li>
        ))}

        {isFarmerLoggedIn ? (
          <li className="navbar__dropdown-container">
            <button
              className="navbar__dropdown-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Dashboard <ChevronDown size={14} style={{ marginLeft: "4px" }} />
            </button>
            <ul className={`navbar__dropdown-menu${dropdownOpen ? " show" : ""}`}>
              <li>
                <NavLink to="/farmer-dashboard" onClick={close}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/farmer-profile" onClick={close}>
                  My Profile
                </NavLink>
              </li>
              <li>
                <button className="navbar__logout-btn" onClick={() => { handleLogout(); close(); }}>
                  Logout
                </button>
              </li>
            </ul>
          </li>
        ) : (
          <li>
            <NavLink to="/farmer-login" onClick={close}>
              Farmer Login
            </NavLink>
          </li>
        )}

        {/* CTA — Contact */}
        <li>
          <NavLink
            to="/contact"
            className={({ isActive }) => `navbar__cta${isActive ? " active" : ""}`}
            onClick={close}
          >
            Contact Us
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;