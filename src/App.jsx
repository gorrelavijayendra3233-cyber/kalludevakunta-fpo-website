import Navbar    from "./components/Navbar/Navbar";
import Footer    from "./components/Footer/Footer";
import AppRoutes from "./routes/AppRoutes";
import { useLocation } from "react-router-dom";
import "./index.css";

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminPage && <Navbar />}
      <AppRoutes />
      {!isAdminPage && <Footer />}
    </>
  );
}

export default App;