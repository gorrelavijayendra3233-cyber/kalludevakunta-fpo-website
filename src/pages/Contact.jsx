import { useState } from "react";
import "./Contact.css";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  subject: "Product enquiry",
  message: "",
};

function Contact() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // TODO: replace with real API call
    // const res = await fetch('/api/contact', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(form),
    // });

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1000));

    setLoading(false);
    setSubmitted(true);
    setForm(initialForm);
  };

  return (
    <main>
      <div className="contact__hero fade-up">
        <span className="contact__hero-tag">Get in Touch</span>
        <h1 className="contact__hero-title">Contact Us</h1>
      </div>

      <section className="contact__body">
        <span className="section-tag">Reach Out</span>
        <h2 className="section-title">We'd love to hear from you</h2>
        <div className="section-divider" />

        <div className="contact__grid">
          {/* Info */}
          <div>
            <div className="contact__item">
              <div className="contact__icon">📍</div>
              <div>
                <div className="contact__label">Address</div>
                <div className="contact__value">
                  Kalludevakunta Village,<br />
                  Telangana – 502 XXX, India
                </div>
              </div>
            </div>
            <div className="contact__item">
              <div className="contact__icon">📞</div>
              <div>
                <div className="contact__label">Phone</div>
                <div className="contact__value">
                  +91 XXXXX XXXXX<br />
                  Mon–Sat, 9 AM – 5 PM
                </div>
              </div>
            </div>
            <div className="contact__item">
              <div className="contact__icon">📧</div>
              <div>
                <div className="contact__label">Email</div>
                <div className="contact__value">
                  fpo@kalludevakunta.in<br />
                  inquiry@kalludevakunta.in
                </div>
              </div>
            </div>

            <div className="contact__map">
              <span>🗺</span>
              <span>Google Maps — coming soon</span>
              <small>Kalludevakunta, Telangana</small>
            </div>
          </div>

          {/* Form */}
          <div className="contact__form">
            <div className="contact__form-heading">Send us a message</div>
            <div className="contact__form-sub">
              We usually respond within 1–2 business days.
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form__row form__row--two">
                <div>
                  <label className="form__label">Full Name *</label>
                  <input
                    className="form__input"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="form__label">Phone</label>
                  <input
                    className="form__input"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <div className="form__row">
                <label className="form__label">Email Address *</label>
                <input
                  className="form__input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@email.com"
                  required
                />
              </div>

              <div className="form__row">
                <label className="form__label">Subject</label>
                <select
                  className="form__select"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                >
                  <option>Product enquiry</option>
                  <option>Bulk purchase</option>
                  <option>Partnership</option>
                  <option>Farmer membership</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="form__row">
                <label className="form__label">Message *</label>
                <textarea
                  className="form__textarea"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what you need..."
                  required
                />
              </div>

              <button className="form__submit" type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send Message →"}
              </button>

              {submitted && (
                <div className="form__success">
                  ✅ Thank you! We'll get back to you within 1–2 business days.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Contact;