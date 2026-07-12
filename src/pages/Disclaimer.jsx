import useDocumentMetadata from "../hooks/useDocumentMetadata";

export default function Disclaimer() {
  useDocumentMetadata("Disclaimer", "Read the legal disclaimer of Kalludevakunta Farmers Producer Company Limited (KDKFPCL). Learn about the scope of information, market prices, and liability limitations.");

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
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", marginBottom: "8px" }}>Legal Disclaimer</h1>
        <p style={{ fontSize: "12px", color: "var(--harvest-lt, #22c55e)", marginBottom: "30px" }}>Last Updated: July 2026</p>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>1. Nature of Information</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            The content, resources, and listings provided on https://kalludevakuntafpcl.in are for general informational purposes to assist member farmers of Kalludevakunta FPC. While we strive to maintain high accuracy, we make no representations or warranties of any kind regarding content accuracy or completeness.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>2. Indicative Market Prices</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            Market prices shown on this website are updated periodically and represent current local market indexes. These prices are strictly indicative. The final crop purchase rate is determined after verification of physical crop quality parameters (e.g. moisture content, foreign matter percentage, and grading) at the local FPO collection hubs.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>3. External Links & Services</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            We are not responsible for the contents or availability of any third-party links, services (such as hCaptcha checks, Google Maps embeds, or MSG91 SMS delivery gateways), or government scheme websites referenced on our portal.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>4. Direct Limitation of Liability</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            Under no circumstances shall Kalludevakunta Farmers Producer Company Limited or its board directors be liable for any direct or indirect loss, equipment rental delay, crop transaction cancellation, or database access issue resulting from the use of this portal.
          </p>
        </section>
      </div>
    </div>
  );
}
