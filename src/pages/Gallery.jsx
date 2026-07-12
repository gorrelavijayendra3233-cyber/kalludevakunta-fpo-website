import { useState } from "react";
import { Image, X, ZoomIn, Calendar } from "lucide-react";
import "./Gallery.css";
import useDocumentMetadata from "../hooks/useDocumentMetadata";

const items = [
  { 
    img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80", 
    tall: true,  
    caption: "Paddy harvest — Kharif 2024",
    desc: "Our member farmers successfully completing the harvest of high-yield Paddy crops during the Kharif season in Kalludevakunta."
  },
  { 
    img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80", 
    tall: false, 
    caption: "Farmer training workshop",
    desc: "Agricultural extension officers teaching farmers modern biological pest control and crop rotation methods at the company training center."
  },
  { 
    img: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80", 
    tall: false, 
    caption: "Mechanised farming demo",
    desc: "Demonstrating combine harvester and motorized precision sprayers to local member farmers, explaining rent-by-day procedures."
  },
  { 
    img: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80", 
    tall: false, 
    caption: "Annual member meeting 2024",
    desc: "Board members and local farmers gathering at the annual committee assembly to discuss pricing, input procurement, and direct buyer tie-ups."
  },
  { 
    img: "https://images.unsplash.com/photo-1526346699644-214439c01b2a?auto=format&fit=crop&w=800&q=80", 
    tall: false, 
    caption: "Maize field — healthy crop",
    desc: "A view of the thriving hybrid maize fields of one of our member farmers, demonstrating healthy seed grain results."
  },
  { 
    img: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80", 
    tall: false, 
    caption: "Produce grading & packaging",
    desc: "Our warehouse staff carefully cleaning, grading, and packaging bulk fresh vegetables to prepare them for direct shipment to urban buyers."
  },
];

function Gallery() {
  useDocumentMetadata("Gallery", "Take a look at the activities, member farmer training sessions, crop harvests, and machinery demos of Kalludevakunta Farmers Producer Company Limited.");
  const [activeItem, setActiveItem] = useState(null);

  return (
    <main>
      {/* Lightbox Modal (Glassmorphic) */}
      {activeItem && (
        <div className="lightbox-overlay" onClick={(e) => e.target === e.currentTarget && setActiveItem(null)}>
          <div className="lightbox-card glass-panel">
            <button className="lightbox-close" onClick={() => setActiveItem(null)} aria-label="Close Lightbox">
              <X size={20} />
            </button>
            <div className="lightbox-img-wrap">
              <img src={activeItem.img} alt={activeItem.caption} className="lightbox-img" />
            </div>
            <div className="lightbox-info">
              <h3 className="lightbox-title">{activeItem.caption}</h3>
              <p className="lightbox-desc">{activeItem.desc}</p>
              <div className="lightbox-meta">
                <Calendar size={14} className="text-leaf-light" />
                <span>Kalludevakunta Cooperative Hub</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="gallery__hero glass-panel fade-up">
        <span className="gallery__hero-tag">
          <Image size={12} style={{ color: "var(--harvest-lt)" }} /> Photo Gallery
        </span>
        <h1 className="gallery__hero-title">Life at Kalludevakunta Farmers Producer Company Limited</h1>
      </div>

      {/* Body */}
      <section className="gallery__body">
        <span className="section-tag"><Image size={14} /> Field &amp; Events</span>
        <h2 className="section-title">Moments from our farms</h2>
        <div className="section-divider" />

        <div className="gallery__grid">
          {items.map((item, i) => (
            <div
              key={i}
              className={`gallery__item fade-up${item.tall ? " gallery__item--tall" : ""}`}
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => setActiveItem(item)}
            >
              <img src={item.img} alt={item.caption} className="gallery__img-asset" />
              <div className="gallery__zoom-overlay">
                <ZoomIn size={24} className="zoom-icon" />
              </div>
              <div className="gallery__caption">
                <span className="gallery__caption-text">{item.caption}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Gallery;