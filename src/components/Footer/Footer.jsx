import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__grid">
        {/* Brand */}
        <div>
          <div className="footer__brand-name">
            <Sprout size={18} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block', color: 'var(--harvest-lt)' }} />
            Kalludevakunta Farmers Producer Company Limited
          </div>
          <p className="footer__brand-desc">
            A registered Farmers Producer Company serving the agricultural
            community of Kalludevakunta and surrounding villages in Andhra Pradesh,
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
            <li><Link to="/admin">Admin Portal</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="footer__col-title">Contact</div>
          <ul className="footer__links">
            <li><a href="#">Kalludevakunta (V), Mantralayam (M)</a></li>
            <li><a href="#">Kurnool Dist, Andhra Pradesh – 518345</a></li>
            <li><a href="mailto:kdkfpc9@gmail.com">kdkfpc9@gmail.com</a></li>
            <li><a href="tel:+919014488562">+91 9014488562</a></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <span className="footer__copy">
          © {new Date().getFullYear()} Kalludevakunta Farmers Producer Company Limited. All rights reserved.
        </span>
        <span className="footer__badge">
          <Sprout size={12} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
          Farmers First
        </span>
      </div>
    </footer>
  );
}

export default Footer;