import "./Product.css";

const crops = [
  { emoji: "🌾", type: "grain",   name: "Paddy (Rice)",  variety: "BPT 5204, Sona Masuri, NLR 34449",  badge: "Kharif" },
  { emoji: "🌽", type: "grain",   name: "Maize",         variety: "DHM 117, CP 818 hybrid",             badge: "Kharif" },
  { emoji: "🫘", type: "pulse",   name: "Red Gram",      variety: "Tur Dal, ICPL 87119",                badge: "Rabi" },
  { emoji: "🌰", type: "oilseed", name: "Groundnut",     variety: "K-6, TCGS 1157",                     badge: "Kharif" },
  { emoji: "🍅", type: "veggie",  name: "Tomato",        variety: "NS 501, CO-3",                       badge: "Year-round" },
  { emoji: "🫑", type: "spice",   name: "Chilli",        variety: "LCA 305, Teja variety",              badge: "Rabi" },
  { emoji: "🧅", type: "veggie",  name: "Onion",         variety: "Bellary Red, N-2-4-1",               badge: "Rabi" },
  { emoji: "🍌", type: "fruit",   name: "Banana",        variety: "Grand Naine, Robusta",               badge: "Year-round" },
];

const services = [
  { num: "01", title: "Bulk Input Supply",          desc: "Seeds, fertilisers, and crop protection chemicals at subsidised collective rates for all members." },
  { num: "02", title: "Storage & Warehousing",      desc: "Secure post-harvest storage to prevent distress selling and preserve produce value." },
  { num: "03", title: "Agri-Equipment Hire",        desc: "Tractors, harvesters, and sprayers available for member farmers at nominal rates." },
  { num: "04", title: "Government Scheme Support",  desc: "Assistance with PM-KISAN, PMFBY crop insurance, and state scheme applications." },
];

function Products() {
  return (
    <main>
      <div className="products__hero fade-up">
        <span className="products__hero-tag">Our Produce &amp; Services</span>
        <h1 className="products__hero-title">Products &amp; Services</h1>
      </div>

      {/* Crops */}
      <section className="products__crops">
        <span className="section-tag">Agricultural Products</span>
        <h2 className="section-title">What our farmers grow</h2>
        <div className="section-divider" />
        <div className="products__grid">
          {crops.map((c) => (
            <div className="crop-card" key={c.name}>
              <div className={`crop-card__img crop-card__img--${c.type}`}>{c.emoji}</div>
              <div className="crop-card__info">
                <div className="crop-card__name">{c.name}</div>
                <div className="crop-card__variety">{c.variety}</div>
                <span className="crop-card__badge">{c.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Business Services */}
      <section className="products__services">
        <span className="section-tag">Business Services</span>
        <h2 className="section-title">More than a marketplace</h2>
        <div className="section-divider" />
        <div className="products__services-grid">
          {services.map((s) => (
            <div className="biz-card" key={s.num}>
              <div className="biz-card__num">{s.num}</div>
              <div>
                <div className="biz-card__title">{s.title}</div>
                <div className="biz-card__desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Products;