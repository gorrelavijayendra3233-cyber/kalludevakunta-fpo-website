import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Handshake, 
  CheckCircle2, 
  Sprout, 
  Users, 
  Store, 
  MapPin, 
  Tractor, 
  Droplet, 
  Settings, 
  Wheat, 
  Leaf, 
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";
import "./Home.css";

/* ── Static Data with Lucide Icons ─────────────────────────── */

const HIGHLIGHTS = [
  {
    icon: <Handshake size={24} className="highlight-card__icon-svg" />,
    color: "green",
    title: "Direct Farmer Link",
    text: "No middlemen. Buyers connect directly with our member farmers, ensuring fair returns and transparent pricing for all parties.",
  },
  {
    icon: <CheckCircle2 size={24} className="highlight-card__icon-svg" />,
    color: "harvest",
    title: "Quality Assured",
    text: "All produce is graded and quality-checked before reaching buyers. Consistent quality you can count on every season.",
  },
  {
    icon: <Sprout size={24} className="highlight-card__icon-svg" />,
    color: "gold",
    title: "Sustainable Farming",
    text: "We promote responsible agricultural practices — minimal chemical use, water conservation, and soil health across all farms.",
  },
];

const QUICK_PRODUCTS = [
  { icon: <Wheat size={36} />, color: "grain",  name: "Paddy",      variety: "BPT 5204 & Sona Masuri", badge: "Kharif" },
  { icon: <Sprout size={36} />, color: "grain",  name: "Maize",      variety: "Hybrid variety",          badge: "Kharif" },
  { icon: <Sprout size={36} />, color: "pulse",  name: "Red Gram",   variety: "Tur Dal",                 badge: "Rabi"   },
  { icon: <Leaf size={36} />, color: "veggie", name: "Vegetables", variety: "Seasonal varieties",      badge: "Year-round" },
];

const FARMER_STATS = [
  { icon: <Users size={28} />, num: "500",   suffix: "+", label: "Farmers",       sub: "Active KDFPC members"        },
  { icon: <Sprout size={28} />,  num: "1,200", suffix: "+", label: "Acres Covered", sub: "Across all member farms"   },
  { icon: <Store size={28} />,  num: "20",    suffix: "+", label: "Products",       sub: "In our marketplace"        },
  { icon: <MapPin size={28} />,  num: "15",    suffix: "+", label: "Villages",       sub: "Served in Andhra Pradesh"  },
];

const EQUIPMENT_SHOWCASE = [
  { icon: <Tractor size={32} />, name: "Tractor",    desc: "Heavy-duty tractor for ploughing, tilling, and transport. Available with operator.", rateHour: 350,  rateDay: 2500,  available: true  },
  { icon: <Wheat size={32} />, name: "Harvester",  desc: "Combined harvester for paddy and wheat. Reduces harvest time significantly.",        rateHour: 600,  rateDay: 4000,  available: true  },
  { icon: <Droplet size={32} />, name: "Sprayer",    desc: "Motorised boom sprayer for large-area pesticide and fertiliser application.",       rateHour: 150,  rateDay: 900,   available: true  },
  { icon: <Settings size={32} />, name: "Seed Drill", desc: "Precision seed drill for uniform row sowing. Saves seeds and improves yield.",      rateHour: 300,  rateDay: 2000,  available: true  },
  { icon: <Settings size={32} />,  name: "Rotavator", desc: "Rotary tiller attachment for deep soil mixing and seedbed preparation.",            rateHour: 250,  rateDay: 1800,  available: true  },
  { icon: <Sprout size={32} />, name: "Cultivator", desc: "Inter-row cultivator for weed control and aeration. Lightweight and effective.",    rateHour: 200,  rateDay: 1400,  available: false },
];

/* ── Component ─────────────────────────────────────────────── */

function Home() {
  const [announcement] = useState(() => {
    return localStorage.getItem("fpo_announcement") || "Kharif 2026 begins — Fresh seeds and fertilizers now available for the upcoming season.";
  });

  return (
    <main>

      {/* ── Announcement Banner (Glass style) ── */}
      <div className="announce">
        <div className="announce__glow-bar" />
        <div className="announce__content">
          <div className="announce__dot" />
          <p className="announce__text">
            {announcement}
          </p>
          <div className="announce__dot announce__dot--secondary" />
          <p className="announce__text">Direct from farmers. No middlemen.</p>
        </div>
      </div>

      {/* ── Hero Section (Glass Overlay on Farm Scene) ── */}
      <section className="hero">
        <div className="hero__background" />
        <div className="hero__overlay" />
        <div className="hero__content-wrapper">
          <div className="hero__card glass-panel fade-up">
            <span className="hero__tag">
              <Award size={12} style={{ color: "var(--harvest-lt)" }} />
              Est. Kalludevakunta, Andhra Pradesh
            </span>
            <h1 className="hero__title">
              Empowering <span>Farmers</span>,<br />Growing Together
            </h1>
            <p className="hero__desc">
              A collective of 500+ farmers in Kalludevakunta, working together to bring quality
              agricultural produce directly to buyers — ensuring fair prices, transparency, and
              rural prosperity.
            </p>
            <div className="hero__btns">
              <Link to="/products" className="btn-primary">
                View Products <ArrowRight size={16} />
              </Link>
              <Link to="/about" className="btn-outline">
                Learn About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Stats Bar (Glass Capsule) ── */}
      <section className="stats-section">
        <div className="stats glass-panel fade-up-2">
          <div className="stats__item">
            <div className="stats__num">350+</div>
            <div className="stats__label">Member Farmers</div>
          </div>
          <div className="stats__item">
            <div className="stats__num">12+</div>
            <div className="stats__label">Crops Cultivated</div>
          </div>
          <div className="stats__item">
            <div className="stats__num">5 yrs</div>
            <div className="stats__label">Years Active</div>
          </div>
          <div className="stats__item">
            <div className="stats__num">₹2Cr+</div>
            <div className="stats__label">Trade Volume</div>
          </div>
        </div>
      </section>

      {/* ── Highlights (Glass Cards Grid) ── */}
      <section className="highlights">
        <div className="highlights__header fade-up">
          <span className="section-tag"><Sprout size={14} /> Why Choose Us</span>
          <h2 className="section-title">Built by farmers,<br />for farmers</h2>
          <div className="section-divider" />
        </div>
        
        <div className="highlights__grid">
          {HIGHLIGHTS.map((h, index) => (
            <div className={`highlight-card glass-panel fade-up-${index + 1}`} key={h.title}>
              <div className={`highlight-card__icon highlight-card__icon--${h.color}`}>
                {h.icon}
              </div>
              <h3 className="highlight-card__title">{h.title}</h3>
              <p className="highlight-card__text">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Farmer Statistics / Impact ── */}
      <section className="farmer-stats">
        <div className="farmer-stats__glow" />
        <div className="farmer-stats__header fade-up">
          <span className="section-tag"><TrendingUp size={14} /> Our Impact</span>
          <h2 className="section-title">Growing stronger,<br />season after season</h2>
          <div className="section-divider" />
        </div>
        
        <div className="farmer-stats__grid">
          {FARMER_STATS.map((s, index) => (
            <div className={`fstat-card glass-panel fade-up-${index + 1}`} key={s.label}>
              <div className="fstat-card__icon">{s.icon}</div>
              <div className="fstat-card__num">
                {s.num}<span className="fstat-card__suffix">{s.suffix}</span>
              </div>
              <div className="fstat-card__label">{s.label}</div>
              <div className="fstat-card__sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Product Preview ── */}
      <section className="product-preview">
        <div className="product-preview__header fade-up">
          <div>
            <span className="section-tag"><Store size={14} /> Our Produce</span>
            <h2 className="section-title">Fresh from the field</h2>
            <div className="section-divider" />
          </div>
          <Link to="/products" className="product-preview__link">
            View all products <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
          </Link>
        </div>
        
        <div className="product-preview__grid">
          {QUICK_PRODUCTS.map((p, index) => (
            <div className={`product-card glass-panel fade-up-${index + 1}`} key={p.name}>
              <div className={`product-card__img product-card__img--${p.color}`}>
                {p.icon}
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

      {/* ── Equipment Showcase ── */}
      <section className="equip-showcase">
        <div className="equip-showcase__header fade-up">
          <div>
            <span className="section-tag"><Tractor size={14} /> Equipment Booking</span>
            <h2 className="section-title">Farm machinery,<br />when you need it</h2>
            <div className="section-divider" />
          </div>
          <Link to="/equipment-booking" className="equip-showcase__view-all">
            Book equipment <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
          </Link>
        </div>
        
        <div className="equip-showcase__grid">
          {EQUIPMENT_SHOWCASE.map((eq, index) => (
            <div className={`equip-showcase-card glass-panel fade-up-${index % 3 + 1}`} key={eq.name}>
              <div className="equip-showcase-card__img">
                <div className="equip-showcase-card__overlay" />
                <span className="equip-showcase-card__icon-wrap">{eq.icon}</span>
                <span
                  className="equip-showcase-card__avail"
                  style={!eq.available ? { background: "rgba(230, 81, 0, 0.2)", color: "var(--harvest-lt)", borderColor: "rgba(230, 81, 0, 0.4)" } : {}}
                >
                  {eq.available ? "Available" : "Booked"}
                </span>
              </div>
              
              <div className="equip-showcase-card__body">
                <div className="equip-showcase-card__name">{eq.name}</div>
                <p className="equip-showcase-card__desc">{eq.desc}</p>
                <div className="equip-showcase-card__rates">
                  <span className="rate-pill"><strong>₹{eq.rateHour}</strong>/hr</span>
                  <span className="rate-pill"><strong>₹{eq.rateDay.toLocaleString("en-IN")}</strong>/day</span>
                </div>
                <Link to="/equipment-booking" style={{ display: "block" }}>
                  <button
                    className="equip-showcase-card__btn"
                    disabled={!eq.available}
                    style={!eq.available ? { background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", cursor: "not-allowed" } : {}}
                  >
                    {eq.available ? "Book Now" : "Currently Unavailable"}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

export default Home;