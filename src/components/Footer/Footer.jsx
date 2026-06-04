import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__grid">
        {/* Brand */}
        <div>
          <div className="footer__brand-name">🌾 Kalludevakunta FPO</div>
          <p className="footer__brand-desc">
            A registered Farmers Producer Organisation serving the agricultural
            community of Kalludevakunta and surrounding villages in Telangana,
            India.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <div className="footer__col-title">Quick Links</div>
          <ul className="footer__links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/products">Products &amp; Services</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="footer__col-title">Contact</div>
          <ul className="footer__links">
            <li><a href="#">Kalludevakunta Village</a></li>
            <li><a href="#">Telangana – 502 XXX, India</a></li>
            <li><a href="mailto:fpo@kalludevakunta.in">fpo@kalludevakunta.in</a></li>
            <li><a href="tel:+91XXXXXXXXXX">+91 XXXXX XXXXX</a></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <span className="footer__copy">
          © {new Date().getFullYear()} Kalludevakunta FPO. All rights reserved.
        </span>
        <span className="footer__badge">🌾 Farmers First</span>
      </div>
    </footer>
  );
}

export default Footer;