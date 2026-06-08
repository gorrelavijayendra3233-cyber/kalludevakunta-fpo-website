/**
 * HOME PAGE ADDITIONS
 * ───────────────────
 * Paste these two sections into your existing Home.jsx.
 *
 * 1. Import the CSS at the top:
 *    import "./HomeAdditions.css";
 *
 * 2. Import Link from react-router-dom (already there)
 *    import { Link } from "react-router-dom";
 *
 * 3. Add <FarmerStats /> and <EquipmentShowcase />
 *    inside the <main> tag, after your existing sections.
 *
 * Suggested order in Home.jsx <main>:
 *   <AnnounceBanner />
 *   <HeroSection />
 *   <StatsBar />           ← existing quick stats
 *   <Highlights />
 *   <FarmerStats />        ← NEW — paste below
 *   <ProductPreview />
 *   <EquipmentShowcase />  ← NEW — paste below
 */

import { Link } from "react-router-dom";
import "./HomeAdditions.css";

// ─── Data ─────────────────────────────────────────────────────

const FARMER_STATS = [
  {
    icon: "👨‍🌾",
    num: "500",
    suffix: "+",
    label: "Farmers",
    sub: "Active FPO members",
  },
  {
    icon: "🌾",
    num: "1,200",
    suffix: "+",
    label: "Acres Covered",
    sub: "Across all member farms",
  },
  {
    icon: "🛒",
    num: "20",
    suffix: "+",
    label: "Products",
    sub: "In our marketplace",
  },
  {
    icon: "🏘️",
    num: "15",
    suffix: "+",
    label: "Villages",
    sub: "Served in Telangana",
  },
];

const EQUIPMENT_SHOWCASE = [
  {
    icon: "🚜",
    name: "Tractor",
    desc: "Heavy-duty tractor for ploughing, tilling, and transport. Available with operator.",
    rateHour: 350,
    rateDay: 2500,
    available: true,
  },
  {
    icon: "🌾",
    name: "Harvester",
    desc: "Combined harvester for paddy and wheat. Reduces harvest time significantly.",
    rateHour: 600,
    rateDay: 4000,
    available: true,
  },
  {
    icon: "💨",
    name: "Sprayer",
    desc: "Motorised boom sprayer for large-area pesticide and fertiliser application.",
    rateHour: 150,
    rateDay: 900,
    available: true,
  },
  {
    icon: "🫘",
    name: "Seed Drill",
    desc: "Precision seed drill for uniform row sowing. Saves seeds and improves yield.",
    rateHour: 300,
    rateDay: 2000,
    available: true,
  },
  {
    icon: "⚙️",
    name: "Rotavator",
    desc: "Rotary tiller attachment for deep soil mixing and seedbed preparation.",
    rateHour: 250,
    rateDay: 1800,
    available: true,
  },
  {
    icon: "🌱",
    name: "Cultivator",
    desc: "Inter-row cultivator for weed control and aeration. Lightweight and effective.",
    rateHour: 200,
    rateDay: 1400,
    available: false,
  },
];

// ─── FarmerStats Section ───────────────────────────────────────
export function FarmerStats() {
  return (
    <section className="home-stats">
      <div className="home-stats__pattern" aria-hidden="true" />
      <div className="home-stats__header">
        <span className="section-tag">Our Impact</span>
        <h2 className="section-title">Growing stronger,<br />season after season</h2>
        <div className="section-divider" />
      </div>
      <div className="home-stats__grid">
        {FARMER_STATS.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-card__icon">{s.icon}</div>
            <div className="stat-card__num">
              {s.num}
              <span className="stat-card__num-suffix">{s.suffix}</span>
            </div>
            <div className="stat-card__label">{s.label}</div>
            <div className="stat-card__sub">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Equipment Showcase Section ────────────────────────────────
export function EquipmentShowcase() {
  return (
    <section className="home-equipment">
      <div className="home-equipment__header">
        <div>
          <span className="section-tag">Equipment Booking</span>
          <h2 className="section-title">Farm machinery,<br />when you need it</h2>
          <div className="section-divider" />
        </div>
        <Link to="/equipment-booking" className="home-equipment__view-all">
          Book equipment →
        </Link>
      </div>

      <div className="home-equipment__grid">
        {EQUIPMENT_SHOWCASE.map((eq) => (
          <div className="equip-showcase-card" key={eq.name}>
            <div className="equip-showcase-card__img">
              <div className="equip-showcase-card__img-overlay" aria-hidden="true" />
              {eq.icon}
              {eq.available ? (
                <span className="equip-showcase-card__avail">Available</span>
              ) : (
                <span className="equip-showcase-card__avail" style={{ background: "var(--soil)" }}>
                  Booked
                </span>
              )}
            </div>
            <div className="equip-showcase-card__body">
              <div className="equip-showcase-card__name">{eq.name}</div>
              <p className="equip-showcase-card__desc">{eq.desc}</p>
              <div className="equip-showcase-card__rates">
                <span className="rate-pill">
                  <strong>₹{eq.rateHour}</strong> / hr
                </span>
                <span className="rate-pill">
                  <strong>₹{eq.rateDay.toLocaleString("en-IN")}</strong> / day
                </span>
              </div>
              <Link to="/equipment-booking">
                <button
                  className="equip-showcase-card__btn"
                  disabled={!eq.available}
                  style={!eq.available ? {
                    background: "var(--cream-dark)",
                    color: "var(--soil-light)",
                    cursor: "not-allowed",
                  } : {}}
                >
                  {eq.available ? `📅 Book ${eq.name}` : "Currently Unavailable"}
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}