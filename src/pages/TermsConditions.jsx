import useDocumentMetadata from "../hooks/useDocumentMetadata";

export default function TermsConditions() {
  useDocumentMetadata("Terms & Conditions", "Review the terms and conditions of Kalludevakunta Farmers Producer Company Limited (KDKFPCL). Understand farmer membership and booking rules.");

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
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", marginBottom: "8px" }}>Terms & Conditions</h1>
        <p style={{ fontSize: "12px", color: "var(--harvest-lt, #22c55e)", marginBottom: "30px" }}>Last Updated: July 2026</p>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>1. Acceptance of Terms</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            By registering as a farmer or submitting crop requests on https://kalludevakuntafpcl.in, you agree to comply with all policies, rules, and guidelines set forth by the Kalludevakunta Farmers Producer Company Limited (KDKFPCL) board of directors.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>2. Farmer Registration & Verification</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            Registration requires submission of an active 10-digit mobile number, valid 12-digit Aadhaar Number, and land Survey Numbers. All profiles are reviewed by FPO admins. Providing fraudulent data may result in account termination and blocking of bookings.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>3. Crop Market Transactions</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            Submitted crop sales represent offers to sell to the FPO. Market prices shown on the dashboard are indicative and subject to quality testing, moisture evaluation, and spot grading at the local collection centers.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>4. Machinery & Equipment Bookings</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            Custom Hiring Center bookings (tractors, sprayers, harvesters) are subject to availability. Farmers are responsible for the machine during the booking tenure. Rental charges are billed hourly or daily as specified in the booking confirmation receipt.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>5. Liability & Modifications</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
            KDKFPCL reserves the right to suspend accounts or adjust booking schedules due to seasonal crop conditions, force majeure, or maintenance needs. We reserve the right to amend these terms at any time.
          </p>
        </section>
      </div>
    </div>
  );
}
