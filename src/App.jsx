import Navbar    from "./components/Navbar/Navbar";
import Footer    from "./components/Footer/Footer";
import AppRoutes from "./routes/AppRoutes";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(13, 35, 21, 0.95)",
            color: "#e0e7e1",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(8px)",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "500",
            padding: "12px 16px"
          },
          success: {
            iconTheme: {
              primary: "#16a34a",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff"
            }
          }
        }}
      />
      {!isAdminPage && <Navbar />}
      <AppRoutes />
      {!isAdminPage && <Footer />}
    </>
  );
}

export default App;