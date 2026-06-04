import "./Gallery.css";

const items = [
  { emoji: "🌾", bg: "g1", tall: true,  caption: "Paddy harvest — Kharif 2024" },
  { emoji: "👨‍🌾", bg: "g2", tall: false, caption: "Farmer training workshop" },
  { emoji: "🚜", bg: "g3", tall: false, caption: "Mechanised farming demo" },
  { emoji: "🤝", bg: "g4", tall: false, caption: "Annual member meeting 2024" },
  { emoji: "🌽", bg: "g5", tall: false, caption: "Maize field — healthy crop" },
  { emoji: "📦", bg: "g6", tall: false, caption: "Produce grading & packaging" },
];

function Gallery() {
  return (
    <main>
      <div className="gallery__hero fade-up">
        <span className="gallery__hero-tag">Photo Gallery</span>
        <h1 className="gallery__hero-title">Life at Kalludevakunta FPO</h1>
      </div>

      <section className="gallery__body">
        <span className="section-tag">Field &amp; Events</span>
        <h2 className="section-title">Moments from our farms</h2>
        <div className="section-divider" />

        <div className="gallery__grid">
          {items.map((item, i) => (
            <div
              key={i}
              className={`gallery__item ${item.bg}${item.tall ? " gallery__item--tall" : ""}`}
            >
              {item.emoji}
              <div className="gallery__caption">{item.caption}</div>
            </div>
          ))}
        </div>

        <div className="gallery__notice">
          <p>
            📸 These are placeholder tiles.{" "}
            <span>Replace them with real photos</span> supplied by the FPO. Images
            will be managed via the admin dashboard in a future update.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Gallery;