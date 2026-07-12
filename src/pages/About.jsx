import { Target, Eye, ClipboardList, Heart, Sprout } from "lucide-react";
import "./About.css";
import useDocumentMetadata from "../hooks/useDocumentMetadata";

const pillars = [
  {
    label: "Mission",
    icon: <Target size={20} className="text-leaf-light" />,
    text: "Empower small farmers through collective action and fair market access.",
    accent: false,
  },
  {
    label: "Vision",
    icon: <Eye size={20} className="text-harvest-lt" />,
    text: "A prosperous farming community with dignified, sustainable livelihoods.",
    accent: true,
  },
  {
    label: "Objectives",
    icon: <ClipboardList size={20} className="text-leaf-light" />,
    text: "Collective bargaining, quality inputs, and better market linkages for all.",
    accent: false,
  },
  {
    label: "Values",
    icon: <Heart size={20} className="text-harvest-lt" />,
    text: "Transparency, equity, sustainability, and unwavering farmer welfare.",
    accent: true,
  },
];

const services = [
  {
    num: "01",
    title: "Collective Input Procurement",
    desc: "Seeds, fertilisers, and pesticides sourced in bulk for member farmers at significantly reduced rates.",
  },
  {
    num: "02",
    title: "Market Linkage",
    desc: "Connecting farmers directly to mandis, traders, and institutional buyers for better, fair prices.",
  },
  {
    num: "03",
    title: "Training & Extension Services",
    desc: "Regular workshops on modern farming, soil health, water management, and post-harvest handling.",
  },
  {
    num: "04",
    title: "Credit Facilitation",
    desc: "Helping members access government schemes, Kisan Credit Cards, and institutional credit easily.",
  },
];

function About() {
  useDocumentMetadata("About", "Learn more about the mission, vision, values, and objectives of Kalludevakunta Farmers Producer Company Limited (KDKFPCL).");
  return (
    <main>
      {/* Hero Section */}
      <div className="about__hero glass-panel fade-up">
        <span className="about__hero-tag">
          <Sprout size={12} style={{ color: "var(--harvest-lt)" }} /> Our Story
        </span>
        <h1 className="about__hero-title">About Kalludevakunta Farmers Producer Company Limited</h1>
      </div>

      {/* About Section */}
      <section className="about__body">
        <div className="about__grid">

          {/* Left Side (Visual Card) */}
          <div className="about__visual glass-panel fade-up">
            <div className="about__visual-bg-overlay" />
            <div className="about__visual-icon"><Sprout size={36} /></div>
            <div className="about__visual-title">
              United in purpose,<br />rooted in land
            </div>
            <div className="about__visual-sub">
              Kalludevakunta, Andhra Pradesh · Est. 2019
            </div>
          </div>

          {/* Right Side */}
          <div className="about__text fade-up-2">
            <span className="section-tag"><Sprout size={14} /> Background</span>
            <h2 className="section-title" style={{ fontSize: "24px", marginBottom: "1rem" }}>
              Who We Are
            </h2>

            <p className="about__paragraph">
              Kalludevakunta Farmers Producer Company Limited (KDFPC) was established
              to give small and marginal farmers a collective voice in the
              marketplace. We believe that when farmers unite, they have the
              power to negotiate better prices, access quality inputs, and build
              a sustainable future.
            </p>

            <p className="about__paragraph">
              Operating in the Kurnool district of Andhra Pradesh, our company brings together
              farmers from Kalludevakunta and neighbouring villages. Our
              members cultivate a diverse range of crops — from staple grains
              to seasonal vegetables — using both traditional knowledge and
              modern techniques.
            </p>

            <div className="about__pillars">
              {pillars.map((pillar) => (
                <div
                  key={pillar.label}
                  className={`pillar glass-panel ${pillar.accent ? "pillar--harvest" : ""}`}
                >
                  <div className="pillar__head">
                    <span className="pillar__icon">{pillar.icon}</span>
                    <span className="pillar__title">{pillar.label}</span>
                  </div>
                  <div className="pillar__text">{pillar.text}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Services Section */}
      <section className="about__services">
        <span className="section-tag"><Sprout size={14} /> What We Do</span>
        <h2 className="section-title">Our Services</h2>
        <div className="section-divider"></div>

        <div className="services__grid">
          {services.map((service, index) => (
            <div className={`service-card glass-panel fade-up-${index % 4 + 1}`} key={service.num}>
              <div className="service-card__num">{service.num}</div>
              <div>
                <h3 className="service-card__title">{service.title}</h3>
                <p className="service-card__desc">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default About;