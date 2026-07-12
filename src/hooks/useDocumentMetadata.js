import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function useDocumentMetadata(title, description) {
  const location = useLocation();

  useEffect(() => {
    // Update Document Title
    document.title = title ? `${title} | Kalludevakunta FPC` : "Kalludevakunta Farmers Producer Company Limited";

    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      "content",
      description ||
        "Kalludevakunta Farmers Producer Company Limited (KDKFPCL) empowers farmers with direct marketplace crop selling, custom hiring center machinery bookings, and fertilizer supply."
    );

    // Update Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", `https://kalludevakuntafpcl.in${location.pathname}`);
  }, [title, description, location.pathname]);
}
