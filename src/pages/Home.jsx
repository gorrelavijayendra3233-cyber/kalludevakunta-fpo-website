import { Link } from "react-router-dom";
import "./Home.css";

const stats = [
  { num: "350+", label: "Member Farmers" },
  { num: "12+",  label: "Crops Cultivated" },
  { num: "5 yrs", label: "Years Active" },
  { num: "₹2Cr+", label: "Trade Volume" },
];

const highlights = [
  {
    icon: "🤝",
    bar: "",
    title: "Direct Farmer Link",
    text: "No middlemen. Buyers connect directly with our member farmers, ensuring fair returns and transparent pricing for all parties.",
  },
  {
    icon: "✅",
    bar: "harvest",
    title: "Quality Assured",
    text: "All produce is graded and quality-checked before reaching buyers. Consistent quality you can count on every season.",
  },
  {
    icon: "🌱",
    bar: "soil",
    title: "Sustainable Farming",
    text: "We promote responsible agricultural practices — minimal chemical use, water conservation, and soil health across all farms.",
  },
];

const products = [
  { emoji: "🌾", type: "grain",  name: "Paddy",      variety: "BPT 5204 & Sona Masuri", badge: "Kharif" },
  { emoji: "🌽", type: "grain",  name: "Maize",      variety: "Hybrid variety",          badge: "Kharif" },
  { emoji: "🫘", type: "pulse",  name: "Red Gram",   variety: "Tur Dal",                 badge: "Rabi" },
  { emoji: "🥬", type: "veggie", name: "Vegetables", variety: "Seasonal varieties",      badge: "Year-round" },
];

function Home() {
  return (
    <main>
      {/* Announcement */}
      <div className="announce">
        <div className="announce__dot" />
        <p className="announce__text">
          <strong>Kharif 2024 season open</strong> — Fresh paddy and maize now available for bulk purchase.
        </p>
        <div className="announce__dot" />
        <p className="announce__text">Direct from farmers. No middlemen.</p>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero__pattern" />
        <div className="hero__visual">🌿</div>
        <div className="hero__content">
          <span className="hero__tag">Est. Kalludevakunta, Telangana</span>
          <h1 className="hero__title fade-up">
            Empowering <span>Farmers</span>,<br />Growing Together
          </h1>
          <p className="hero__desc fade-up-2">
            A collective of 350+ farmers in Kalludevakunta, working together to bring
            quality agricultural produce directly to buyers — ensuring fair prices,
            transparency, and rural prosperity.
          </p>
          <div className="hero__btns fade-up-3">
            <Link to="/products" className="btn-primary">View Products</Link>
            <Link to="/about" className="btn-outline">Learn About Us</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats">
        {stats.map((s) => (
          <div className="stats__item" key={s.label}>
            <div className="stats__num">{s.num}</div>
            <div className="stats__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Highlights */}
      <section className="highlights">
        <div className="highlights__header">
          <span className="section-tag">Why Choose Us</span>
          <h2 className="section-title">Built by farmers,<br />for farmers</h2>
          <div className="section-divider" />
        </div>
        <div className="highlights__grid">
          {highlights.map((h) => (
            <div className="highlight-card" key={h.title}>
              <div className={`highlight-card__bar${h.bar ? ` highlight-card__bar--${h.bar}` : ""}`} />
              <div className="highlight-card__body">
                <div className="highlight-card__icon">{h.icon}</div>
                <h3 className="highlight-card__title">{h.title}</h3>
                <p className="highlight-card__text">{h.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Product Preview */}
      <section className="product-preview">
        <div className="product-preview__header">
          <div>
            <span className="section-tag">Our Produce</span>
            <h2 className="section-title">Fresh from the field</h2>
            <div className="section-divider" />
          </div>
          <Link to="/products" className="product-preview__link">
            View all products →
          </Link>
        </div>
        <div className="product-preview__grid">
          {products.map((p) => (
            <div className="product-card" key={p.name}>
              <div className={`product-card__img product-card__img--${p.type}`}>
                {p.emoji}
              </div>
              <div className="product-card__info">
                <div className="product-card__name">{p.name}</div>
                <div className="product-card__variety">{p.variety}</div>
                <span className="product-card__badge">{p.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;