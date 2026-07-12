import useDocumentMetadata from "../hooks/useDocumentMetadata";

export default function CookiePolicy() {
  useDocumentMetadata("Cookie Policy", "Read the cookie policy of Kalludevakunta Farmers Producer Company Limited (KDKFPCL). Learn how we use local storage and cookies to improve your dashboard experience.");

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
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", marginBottom: "8px" }}>Cookie Policy</h1>
        <p style={{ fontSize: "12px", color: "var(--harvest-lt, #22c55e)", marginBottom: "30px" }}>Last Updated: July 2026</p>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>1. What are Cookies and Local Storage?</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            Cookies are small text files stored on your browser. This application also utilizes browser Local Storage to store persistent session state, authentication tokens, and user preferences to bypass repetitive logins.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>2. How We Use Them</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            We use these tracking methods strictly to preserve security:
            <ul style={{ marginTop: "10px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>Authentication Tokens</strong>: Retaining your verified JWT session so you don't need to request an OTP code on every visit.</li>
              <li><strong>System Cache</strong>: Preserving static configurations and layout setups to minimize loading delay.</li>
              <li><strong>Google Analytics</strong>: Running anonymous telemetry tags (if activated) to map portal engagement rates.</li>
            </ul>
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>3. Controlling Your Settings</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            You can clear your browser cookies and local storage cache at any time using your browser settings. Clearing storage will log you out of the Farmer Dashboard and clear any unsaved bookings or crop selling data.
          </p>
        </section>
      </div>
    </div>
  );
}
