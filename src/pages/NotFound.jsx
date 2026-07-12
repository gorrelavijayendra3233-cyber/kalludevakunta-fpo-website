import { Link } from "react-router-dom";
import { AlertCircle, Home } from "lucide-react";
import useDocumentMetadata from "../hooks/useDocumentMetadata";
import "./NotFound.css";

export default function NotFound() {
  useDocumentMetadata("Page Not Found", "Oops! The page you are looking for does not exist on Kalludevakunta Farmers Producer Company Limited (KDKFPCL).");

  return (
    <div className="not-found-container">
      <div className="not-found-card glass-panel fade-up">
        <div className="not-found-icon-wrapper">
          <AlertCircle size={48} className="not-found-icon" />
        </div>
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found / పేజీ కనుగొనబడలేదు</h2>
        <p className="not-found-text">
          The link you followed may be broken, or the page has been removed. Let's get you back on track.
        </p>
        <Link to="/" className="not-found-btn">
          <Home size={18} />
          <span>Back to Home / హోమ్ పేజీకి వెళ్ళండి</span>
        </Link>
      </div>
    </div>
  );
}
