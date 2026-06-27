import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { 
  Store, 
  FlaskConical, 
  Droplet, 
  Sprout, 
  Settings, 
  Search, 
  X, 
  CheckCircle,
  Phone,
  Wheat,
  Lock
} from "lucide-react";
import "./Products.css";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

// ── Icon Mapping ────────────────────────────────────────────────
export const ICON_MAP = {
  FlaskConical: <FlaskConical size={20} />,
  Droplet: <Droplet size={20} />,
  Sprout: <Sprout size={20} />,
  Settings: <Settings size={20} />,
  Wheat: <Wheat size={20} />,
  Store: <Store size={20} />
};

// ── Default Data (Serializable for LocalStorage) ────────────────
const DEFAULT_PRODUCTS = [
  // Fertilizers
  { id: 1,  name: "Urea Fertilizer",     category: "Fertilizer", price: 1200, unit: "/ Bag (50 kg)", iconName: "FlaskConical", inStock: true,  desc: "High-nitrogen fertilizer. Ideal for paddy, maize, and wheat crops." },
  { id: 2,  name: "DAP Fertilizer",      category: "Fertilizer", price: 1450, unit: "/ Bag (50 kg)", iconName: "Sprout",       inStock: true,  desc: "Di-ammonium phosphate. Promotes strong root development." },
  { id: 3,  name: "MOP (Potash)",        category: "Fertilizer", price: 1100, unit: "/ Bag (50 kg)", iconName: "Settings",     inStock: true,  desc: "Muriate of potash. Improves crop quality and disease resistance." },
  { id: 4,  name: "Organic Compost",     category: "Fertilizer", price: 350,  unit: "/ Bag (40 kg)", iconName: "Sprout",       inStock: true,  desc: "Farm-made organic compost. Improves soil health naturally." },
  // Pesticides
  { id: 5,  name: "Pesticide Spray",     category: "Pesticide",  price: 650,  unit: "/ Litre",       iconName: "Droplet",      inStock: true,  desc: "Broad-spectrum insecticide. Effective against stem borers and aphids." },
  { id: 6,  name: "Fungicide Powder",    category: "Pesticide",  price: 480,  unit: "/ 500 g",       iconName: "FlaskConical", inStock: true,  desc: "Systemic fungicide for blast, blight, and powdery mildew control." },
  { id: 7,  name: "Weedicide (Liquid)",  category: "Pesticide",  price: 720,  unit: "/ Litre",       iconName: "Wheat",        inStock: false, desc: "Post-emergent weedicide for paddy fields. Currently out of stock." },
  { id: 8,  name: "Bio-Pesticide",       category: "Pesticide",  price: 390,  unit: "/ 250 ml",      iconName: "Sprout",       inStock: true,  desc: "Neem-based bio-pesticide. Safe for beneficial insects and soil." },
  // Seeds
  { id: 9,  name: "Paddy Seeds (BPT)",   category: "Seeds",      price: 850,  unit: "/ 10 kg bag",   iconName: "Wheat",        inStock: true,  desc: "BPT 5204 high-yield paddy seeds. Best for Kharif season." },
  { id: 10, name: "Maize Seeds (Hybrid)",category: "Seeds",      price: 680,  unit: "/ 5 kg bag",    iconName: "Sprout",       inStock: true,  desc: "CP 818 hybrid maize seeds. High yield, drought-tolerant variety." },
  { id: 11, name: "Red Gram Seeds",      category: "Seeds",      price: 560,  unit: "/ 5 kg bag",    iconName: "Sprout",       inStock: true,  desc: "ICPL 87119 red gram seeds. Short duration, high-protein variety." },
  { id: 12, name: "Sunflower Seeds",     category: "Seeds",      price: 490,  unit: "/ 4 kg bag",    iconName: "Sprout",       inStock: false, desc: "Hybrid sunflower seeds. Contact us for next batch availability." },
  // Farm Tools
  { id: 13, name: "Hand Sprayer (16 L)", category: "Farm Tools", price: 1800, unit: "/ Piece",       iconName: "Droplet",      inStock: true,  desc: "Heavy-duty knapsack sprayer with adjustable nozzle. 16 L capacity." },
  { id: 14, name: "Sickle (Steel)",      category: "Farm Tools", price: 180,  unit: "/ Piece",       iconName: "Settings",     inStock: true,  desc: "Carbon steel sickle. Ergonomic grip, suitable for paddy harvest." },
  { id: 15, name: "Soil Testing Kit",    category: "Farm Tools", price: 950,  unit: "/ Kit",         iconName: "FlaskConical", inStock: true,  desc: "Tests soil pH, nitrogen, phosphorus, potassium. 50 test capacity." },
  { id: 16, name: "Irrigation Pipes",    category: "Farm Tools", price: 1200, unit: "/ Set (20 m)",  iconName: "Settings",     inStock: true,  desc: "Flexible HDPE irrigation pipe set with connectors and fittings." },
];

const CATEGORIES = [
  { key: "All",        icon: <Store size={16} />, label: "All" },
  { key: "Fertilizer", icon: <FlaskConical size={16} />, label: "Fertilizers" },
  { key: "Pesticide",  icon: <Droplet size={16} />, label: "Pesticides" },
  { key: "Seeds",      icon: <Sprout size={16} />, label: "Seeds" },
  { key: "Farm Tools", icon: <Settings size={16} />, label: "Farm Tools" },
];

// ── Helpers ─────────────────────────────────────────────────────
function categorySlug(cat) {
  const norm = (cat || "").toLowerCase();
  if (norm.startsWith("fertilizer")) return "fertilizer";
  if (norm.startsWith("pesticide")) return "pesticide";
  if (norm.includes("seed")) return "seeds";
  if (norm.includes("tool")) return "farmtools";
  return "fertilizer";
}

function getProductIcon(category) {
  const norm = (category || "").toLowerCase();
  if (norm.startsWith("fertilizer")) return <FlaskConical size={20} />;
  if (norm.startsWith("pesticide")) return <Droplet size={20} />;
  if (norm.includes("seed")) return <Sprout size={20} />;
  if (norm.includes("tool")) return <Settings size={20} />;
  return <Store size={20} />;
}

function matchesCategoryKey(catName, filterKey) {
  if (filterKey === "All") return true;
  const c = (catName || "").toLowerCase();
  const f = filterKey.toLowerCase();
  if (f === "fertilizer") return c.startsWith("fertilizer");
  if (f === "pesticide") return c.startsWith("pesticide");
  if (f === "seeds") return c.includes("seed");
  if (f === "farm tools") return c.includes("tool");
  return c === f;
}

function catCount(products, key) {
  if (key === "All") return products.length;
  return products.filter((p) => matchesCategoryKey(p.category, key)).length;
}

// ── Product Booking Modal ───────────────────────────────────────
function BookingModal({ product, onClose }) {
  const [form, setForm] = useState({
    farmerName: "",
    phone: "",
    quantity: 1,
    bookingDate: new Date().toISOString().substring(0, 10)
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("farmerToken") || localStorage.getItem("farmer_token");

  useEffect(() => {
    if (token) {
      const infoStr = localStorage.getItem("farmer_data");
      if (infoStr) {
        try {
          const info = JSON.parse(infoStr);
          setForm((prev) => ({
            ...prev,
            farmerName: info.name || "",
            phone: info.phone || "",
          }));
        } catch (e) {
          console.error("Failed to parse farmer info:", e);
        }
      }
    }
  }, [token]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.farmerName || !form.phone || !form.bookingDate || !form.quantity) {
      toast.error("All fields are required.");
      return;
    }
    if (Number(form.quantity) <= 0) {
      toast.error("Quantity must be at least 1.");
      return;
    }
    setLoading(true);
    try {
      const headers = { 
        "Content-Type": "application/json" 
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/product-bookings`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          farmerName: form.farmerName,
          phone: form.phone,
          productId: product._id,
          quantity: Number(form.quantity),
          bookingDate: form.bookingDate
        })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("farmer_token");
        localStorage.removeItem("farmerToken");
        localStorage.removeItem("farmer_data");
        window.dispatchEvent(new Event("storage"));
        toast.error("Session expired. Please log in again.");
        navigate("/farmer-login");
        onClose();
        return;
      }

      const resData = await response.json();
      if (response.ok) {
        setBookingDetails(resData.data);
        setSubmitted(true);
        toast.success("Booking submitted successfully!");
      } else {
        toast.error(resData.message || "Failed to submit booking.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = (product.price || 0) * Number(form.quantity || 0);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card glass-panel" style={{ maxWidth: "450px" }}>
        <div className="modal-header">
          <div>
            <div className="modal-header-title">Product Booking</div>
            <div className="modal-header-product">
              <span className="modal-product-icon">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl.startsWith("http") ? product.imageUrl : `${API_BASE.replace("/api", "")}${product.imageUrl}`} 
                    alt={product.name} 
                    style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", verticalAlign: "middle" }} 
                  />
                ) : (
                  getProductIcon(product.category)
                )}
              </span> 
              <span>{product.name}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {!token ? (
            <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
              <div style={{ width: "50px", height: "50px", background: "rgba(230, 81, 0, 0.1)", border: "1px solid rgba(230, 81, 0, 0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                <Lock size={24} style={{ color: "var(--harvest-lt || #f97316)" }} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "0.75rem" }}>Farmer Login Required</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                Please login using your registered mobile number to purchase/book this product.
              </p>
              <button 
                className="form-submit" 
                onClick={() => {
                  onClose();
                  navigate("/farmer-login");
                }}
                style={{ width: "100%" }}
                type="button"
              >
                Login Now
              </button>
            </div>
          ) : submitted ? (
            <div className="modal-success" style={{ textAlign: "center", padding: "10px" }}>
              <div className="modal-success-icon" style={{ marginBottom: "16px" }}><CheckCircle size={40} className="text-leaf-light" /></div>
              <h3>Booking Confirmed!</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px", lineHeight: "1.6" }}>
                We've received your booking for <strong>{product.name}</strong>.<br/>
                Booking ID: <strong>{bookingDetails?.bookingId}</strong><br/>
                Total Price: <strong>₹{totalPrice.toLocaleString("en-IN")}</strong><br/><br/>
                Our team will call you at <strong>{form.phone}</strong> within 24 hours to coordinate.
              </p>
              <button className="form-submit" onClick={onClose}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">
                  Your Name <span className="req">*</span>
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="farmerName"
                  value={form.farmerName}
                  onChange={handleChange}
                  placeholder="Full name"
                  disabled={!!token}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Mobile Number <span className="req">*</span>
                </label>
                <input
                  className="form-input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                  disabled={!!token}
                  required
                />
              </div>
              <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">
                    Quantity <span className="req">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">
                    Booking Date <span className="req">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    name="bookingDate"
                    value={form.bookingDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div style={{ margin: "16px 0", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "600" }}>Total Price:</span>
                <span style={{ fontSize: "18px", color: "var(--harvest-lt || #16a34a)", fontWeight: "700" }}>₹{totalPrice.toLocaleString("en-IN")}</span>
              </div>
              <button className="form-submit" type="submit" disabled={loading}>
                {loading ? "Submitting Booking…" : "Confirm Booking"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
function Products() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery]       = useState("");
  const [enquiryProduct, setEnquiryProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async (isInitial = false) => {
      try {
        if (isInitial) setLoadingProducts(true);
        const response = await fetch(`${API_BASE}/products`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Error loading products:", err);
        if (isInitial) setErrorProducts(err.message);
      } finally {
        if (isInitial) setLoadingProducts(false);
      }
    };

    fetchProducts(true);

    const interval = setInterval(() => fetchProducts(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "All") {
      list = list.filter((p) => matchesCategoryKey(p.category, activeCategory));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.description || p.desc || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, searchQuery]);

  return (
    <main>
      {/* Booking modal */}
      {enquiryProduct && (
        <BookingModal
          product={enquiryProduct}
          onClose={() => setEnquiryProduct(null)}
        />
      )}

      {/* Hero (Frosted dark header card) */}
      <div className="products-page__hero glass-panel fade-up">
        <span className="products-page__hero-tag">
          <Store size={12} style={{ color: "var(--harvest-lt)" }} /> Marketplace
        </span>
        <h1 className="products-page__hero-title">Agricultural Products</h1>
        <p className="products-page__hero-sub">
          Quality fertilizers, seeds, pesticides & farm tools — direct from KDFPC at fair prices.
        </p>
      </div>

      {/* Filter bar */}
      <div className="products-page__filter-bar glass-panel fade-up-2">
        <div className="filter-label-wrap">
          <span className="filter-label">Filter:</span>
        </div>
        
        <div className="filter-btn-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`filter-btn${activeCategory === cat.key ? " active" : ""}`}
              onClick={() => { setActiveCategory(cat.key); setSearchQuery(""); }}
            >
              <span className="filter-btn-icon">{cat.icon}</span> 
              <span>{cat.label}</span>
              <span className="filter-count">{catCount(products, cat.key)}</span>
            </button>
          ))}
        </div>

        <div className="products-page__search">
          <Search size={16} className="products-page__search-icon" />
          <input
            type="search"
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search products"
          />
        </div>
      </div>

      {/* Body */}
      <section className="products-page__body">
        <p className="products-page__count fade-up">
          Showing <strong>{filtered.length}</strong> product{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "All" && <> in <strong>{activeCategory}</strong></>}
          {searchQuery && <> matching "<strong>{searchQuery}</strong>"</>}
        </p>

        <div className="products-page__grid">
          {loadingProducts ? (
            <div className="products-page__empty glass-panel fade-up">
              <p>Loading products from database...</p>
            </div>
          ) : errorProducts ? (
            <div className="products-page__empty glass-panel fade-up">
              <X size={32} className="products-page__empty-icon" style={{ color: "#ff5252" }} />
              <p>Error loading products: {errorProducts}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="products-page__empty glass-panel fade-up">
              <Search size={32} className="products-page__empty-icon" />
              <p>No products found. Try a different search or category.</p>
            </div>
          ) : (
            filtered.map((product, idx) => {
              const slug = categorySlug(product.category);
              const hasStock = product.stock > 0;
              return (
                <div className="product-card-item glass-panel fade-up" key={product._id || product.id} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className={`product-card-item__stripe stripe--${slug}`} />
                  <div className={`product-card-item__img img-bg--${slug}`}>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl.startsWith("http") ? product.imageUrl : `${API_BASE.replace("/api", "")}${product.imageUrl}`} 
                        alt={product.name} 
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px 10px 0 0" }} 
                      />
                    ) : (
                      <span className="prod-icon-wrap">{getProductIcon(product.category)}</span>
                    )}
                    <div className="product-card-item__badge-wrap">
                      <span className={`product-card-item__cat-badge cat-badge--${slug}`}>
                        {product.category}
                      </span>
                    </div>
                  </div>
                  <div className="product-card-item__info">
                    <h3 className="product-card-item__name">{product.name}</h3>
                    <p className="product-card-item__desc">{product.description || product.desc}</p>
                    <div className="product-card-item__meta">
                      <div>
                        <span className="product-card-item__price">₹{(product.price || 0).toLocaleString("en-IN")}</span>
                        <span className="product-card-item__unit">{product.unit ? ` / ${product.unit}` : ""}</span>
                      </div>
                      <div className={`product-card-item__stock ${hasStock ? "in" : "out"}`}>
                        <span className="stock-dot" />
                        {hasStock ? "In Stock" : "Out of Stock"}
                      </div>
                    </div>
                    <button
                      className="product-card-item__enquire"
                      disabled={!hasStock}
                      onClick={() => setEnquiryProduct(product)}
                      style={!hasStock ? { background: "rgba(255, 255, 255, 0.03)", color: "var(--text-muted)", border: "1px solid rgba(255, 255, 255, 0.03)", cursor: "not-allowed" } : {}}
                    >
                      {hasStock ? <><Phone size={14} /> Book Now</> : "Out of Stock"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

export default Products;