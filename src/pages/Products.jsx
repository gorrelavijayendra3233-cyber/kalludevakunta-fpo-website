import { useState, useMemo } from "react";
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
  Wheat
} from "lucide-react";
import "./Products.css";

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
  const map = { Fertilizer: "fertilizer", Pesticide: "pesticide", Seeds: "seeds", "Farm Tools": "farmtools" };
  return map[cat] || "fertilizer";
}

function catCount(products, key) {
  if (key === "All") return products.length;
  return products.filter((p) => p.category === key).length;
}

// ── Enquiry Modal ──────────────────────────────────────────────
const ENQUIRY_INIT = { name: "", phone: "", message: "" };

function EnquiryModal({ product, onClose }) {
  const [form, setForm]         = useState(ENQUIRY_INIT);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card glass-panel">
        <div className="modal-header">
          <div>
            <div className="modal-header-title">Product Enquiry</div>
            <div className="modal-header-product">
              <span className="modal-product-icon">{product.icon}</span> 
              <span>{product.name}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {submitted ? (
            <div className="modal-success">
              <div className="modal-success-icon"><CheckCircle size={40} className="text-leaf-light" /></div>
              <h3>Enquiry Sent!</h3>
              <p>
                We've received your enquiry for <strong>{product.name}</strong>. Our team
                will call you within <strong>24 hours</strong> to confirm availability and
                pricing.
              </p>
              <button className="form-submit" style={{ marginTop: "1rem" }} onClick={onClose}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="enq-name">
                  Your Name <span className="req">*</span>
                </label>
                <input
                  id="enq-name"
                  className="form-input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="enq-phone">
                  Mobile Number <span className="req">*</span>
                </label>
                <input
                  id="enq-phone"
                  className="form-input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="enq-message">
                  Message / Quantity needed
                </label>
                <textarea
                  id="enq-message"
                  className="form-textarea"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder={`Enquiring about: ${product.name}. I need…`}
                  rows={3}
                />
              </div>
              <button className="form-submit" type="submit" disabled={loading}>
                {loading ? "Sending…" : <><Phone size={16} /> Send Enquiry</>}
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
  const [products] = useState(() => {
    const saved = localStorage.getItem("fpo_products");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing products:", e);
      }
    }
    localStorage.setItem("fpo_products", JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  });
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery]       = useState("");
  const [enquiryProduct, setEnquiryProduct] = useState(null);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  return (
    <main>
      {/* Enquiry modal */}
      {enquiryProduct && (
        <EnquiryModal
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
          {filtered.length === 0 ? (
            <div className="products-page__empty glass-panel fade-up">
              <Search size={32} className="products-page__empty-icon" />
              <p>No products found. Try a different search or category.</p>
            </div>
          ) : (
            filtered.map((product, idx) => {
              const slug = categorySlug(product.category);
              return (
                <div className="product-card-item glass-panel fade-up" key={product.id} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className={`product-card-item__stripe stripe--${slug}`} />
                  <div className={`product-card-item__img img-bg--${slug}`}>
                    <span className="prod-icon-wrap">{ICON_MAP[product.iconName] || <Store size={20} />}</span>
                    <div className="product-card-item__badge-wrap">
                      <span className={`product-card-item__cat-badge cat-badge--${slug}`}>
                        {product.category}
                      </span>
                    </div>
                  </div>
                  <div className="product-card-item__info">
                    <h3 className="product-card-item__name">{product.name}</h3>
                    <p className="product-card-item__desc">{product.desc}</p>
                    <div className="product-card-item__meta">
                      <div>
                        <span className="product-card-item__price">₹{product.price.toLocaleString("en-IN")}</span>
                        <span className="product-card-item__unit">{product.unit}</span>
                      </div>
                      <div className={`product-card-item__stock ${product.inStock ? "in" : "out"}`}>
                        <span className="stock-dot" />
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </div>
                    </div>
                    <button
                      className="product-card-item__enquire"
                      disabled={!product.inStock}
                      onClick={() => setEnquiryProduct(product)}
                      style={!product.inStock ? { background: "rgba(255, 255, 255, 0.03)", color: "var(--text-muted)", border: "1px solid rgba(255, 255, 255, 0.03)", cursor: "not-allowed" } : {}}
                    >
                      {product.inStock ? <><Phone size={14} /> Enquire Now</> : "Out of Stock"}
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