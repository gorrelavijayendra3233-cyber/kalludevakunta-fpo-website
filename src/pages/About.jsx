import "./About.css";

const pillars = [
  {
    label: "🎯 Mission",
    text: "Empower small farmers through collective action and fair market access.",
    accent: false,
  },
  {
    label: "👁 Vision",
    text: "A prosperous farming community with dignified, sustainable livelihoods.",
    accent: true,
  },
  {
    label: "📋 Objectives",
    text: "Collective bargaining, quality inputs, and better market linkages for all.",
    accent: false,
  },
  {
    label: "🤝 Values",
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
  return (
    <main>
      {/* Hero Section */}
      <div className="about__hero">
        <span className="about__hero-tag">Our Story</span>
        <h1 className="about__hero-title">About Kalludevakunta FPO</h1>
      </div>

      {/* About Section */}
      <section className="about__body">
        <div className="about__grid">

          {/* Left Side */}
          <div className="about__visual">
            <div className="about__visual-bg">🌾</div>
            <div className="about__visual-title">
              United in purpose,
              <br />
              rooted in land
            </div>
            <div className="about__visual-sub">
              Kalludevakunta, Telangana · Est. 2019
            </div>
          </div>

          {/* Right Side */}
          <div className="about__text">
            <span className="section-tag">Background</span>

            <h2
              className="section-title"
              style={{
                fontSize: "22px",
                marginBottom: "1rem",
              }}
            >
              Who We Are
            </h2>

            <p>
              Kalludevakunta Farmers Producer Organisation (FPO) was established
              to give small and marginal farmers a collective voice in the
              marketplace. We believe that when farmers unite, they have the
              power to negotiate better prices, access quality inputs, and build
              a sustainable future.
            </p>

            <p>
              Operating in the Telangana region, our FPO brings together
              farmers from Kalludevakunta and neighbouring villages. Our
              members cultivate a diverse range of crops — from staple grains
              to seasonal vegetables — using both traditional knowledge and
              modern techniques.
            </p>

            <div className="about__pillars">
              {pillars.map((pillar) => (
                <div
                  key={pillar.label}
                  className={`pillar ${
                    pillar.accent ? "pillar--harvest" : ""
                  }`}
                >
                  <div className="pillar__title">{pillar.label}</div>
                  <div className="pillar__text">{pillar.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="about__services">
        <span className="section-tag">What We Do</span>

        <h2 className="section-title">Our Services</h2>

        <div className="section-divider"></div>

        <div className="services__grid">
          {services.map((service) => (
            <div className="service-card" key={service.num}>
              <div className="service-card__num">{service.num}</div>

              <div>
                <div className="service-card__title">
                  {service.title}
                </div>

                <div className="service-card__desc">
                  {service.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default About;