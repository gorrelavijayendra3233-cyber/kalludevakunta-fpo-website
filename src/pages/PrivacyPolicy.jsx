import useDocumentMetadata from "../hooks/useDocumentMetadata";

export default function PrivacyPolicy() {
  useDocumentMetadata("Privacy Policy", "Review the privacy policy of Kalludevakunta Farmers Producer Company Limited (KDKFPCL). Learn how we protect and manage your personal data.");

  return (
    <div className="legal-container" style={{
      padding: "80px 20px 60px 20px",
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #0b1a0e 0%, #030804 100%)",
      color: "#e2e8f0"
    }}>
      <div className="legal-card glass-panel fade-up" style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "rgba(10, 25, 15, 0.6)",
        border: "1px solid rgba(34, 197, 94, 0.15)",
        borderRadius: "16px",
        padding: "40px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(12px)"
      }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", marginBottom: "8px" }}>Privacy Policy</h1>
        <p style={{ fontSize: "12px", color: "var(--harvest-lt, #22c55e)", marginBottom: "30px" }}>Last Updated: July 2026</p>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>1. Information We Collect</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            We collect personal details you provide during registration and booking, including your Name, Mobile Number, Aadhaar Number, Survey Number, Land Area, and Village details. This data is required to verify FPO membership and process transactional crop requests or equipment rentals.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>2. How We Use Your Information</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            Your information is used to facilitate crop selling requests, coordinate machinery delivery, issue OTP login verifications via MSG91, send SMS updates, and compile FPO analytics. We do not sell or lease your personal information to third parties.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>3. Data Security & Storage</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            We host data securely on MongoDB Atlas servers. Transacted user information (like password hashes and session tokens) is encrypted. Rest assured, only authorized FPO administrators have access to farmer databases.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>4. Cookies</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            We utilize persistent web storage (Local Storage) and cookies to store session preferences and authentication tokens, enabling continuous logins without re-requesting OTP verifications.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>5. Contact Us</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            If you have questions regarding our privacy rules, please email us at <a href="mailto:info@kalludevakuntafpcl.in" style={{ color: "#22c55e", textDecoration: "none" }}>info@kalludevakuntafpcl.in</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
