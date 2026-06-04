import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/",                 label: "Home",              end: true  },
  { to: "/about",            label: "About",             end: false },
  { to: "/products",         label: "Products",          end: false },
  { to: "/sell-crops",       label: "Sell Crops 🌾",    end: false },
  { to: "/equipment-booking",label: "Equipment Booking", end: false },
  { to: "/gallery",          label: "Gallery",           end: false },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__logo" onClick={close}>
        <div className="navbar__logo-icon">🌾</div>
        <div className="navbar__logo-text">
          <span className="navbar__logo-name">Kalludevakunta FPO</span>
          <span className="navbar__logo-sub">Farmers Producer Organisation</span>
        </div>
      </NavLink>

      <button
        className="navbar__hamburger"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation menu"
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
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