import { Routes, Route, Navigate } from "react-router-dom";

import Home             from "../pages/Home";
import About            from "../pages/About";
import Products         from "../pages/Products";
import Gallery          from "../pages/Gallery";
import Contact          from "../pages/Contact";
import SellCrops        from "../pages/SellCrop";
import EquipmentBooking from "../pages/EquipmentBooking";
import Admin            from "../pages/Admin";
import FarmerLogin     from "../pages/FarmerLogin";
import FarmerRegister  from "../pages/FarmerRegister";
import FarmerDashboard from "../pages/FarmerDashboard";
import FarmerProfile   from "../pages/FarmerProfile";
import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                  element={<Home />}             />
      <Route path="/about"             element={<About />}            />
      <Route path="/products"          element={<Products />}         />
      <Route path="/gallery"           element={<Gallery />}          />
      <Route path="/contact"           element={<Contact />}          />
      <Route path="/sell-crops"        element={<SellCrops />}        />
      <Route path="/equipment-booking" element={<EquipmentBooking />} />
      <Route path="/admin"             element={<Admin />}            />
      
      {/* Farmer Auth & Portal Routes */}
      <Route path="/farmer-login"      element={<FarmerLogin />} />
      <Route path="/farmer-register"   element={<FarmerRegister />} />
      <Route path="/farmer-dashboard"  element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
      <Route path="/farmer-profile"    element={<ProtectedRoute><FarmerProfile /></ProtectedRoute>} />

      {/* Legacy/Redirect protection routes */}
      <Route path="/crop-request"      element={<Navigate to="/sell-crops" replace />} />
      <Route path="/product-order"     element={<Navigate to="/products" replace />}   />
      <Route path="/my-crop-requests"  element={<Navigate to="/farmer-dashboard" replace />} />
      <Route path="/my-bookings"       element={<Navigate to="/farmer-dashboard" replace />} />
      <Route path="/my-orders"         element={<Navigate to="/farmer-dashboard" replace />} />
      <Route path="/my-profile"        element={<Navigate to="/farmer-dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;