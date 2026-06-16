import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07140a",
          color: "#e0e7e1",
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: "20px",
          textAlign: "center"
        }}>
          <div style={{
            maxWidth: "500px",
            width: "100%",
            padding: "40px",
            borderRadius: "20px",
            background: "rgba(13, 35, 21, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(16px)"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(249, 115, 22, 0.15)",
              color: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px auto",
              border: "1px solid rgba(249, 115, 22, 0.3)"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "12px", color: "#ffffff" }}>Something went wrong</h2>
            <p style={{ fontSize: "14px", color: "#97a79a", marginBottom: "30px", lineHeight: "1.5" }}>
              An unexpected error occurred in the portal interface.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(22, 163, 74, 0.2)"
                }}
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = "/admin"}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#e0e7e1",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
