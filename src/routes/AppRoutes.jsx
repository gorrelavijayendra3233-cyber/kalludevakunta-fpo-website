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
import MyCropRequests  from "../pages/MyCropRequests";
import ProtectedRoute from "../components/ProtectedRoute";
import NotFound        from "../pages/NotFound";
import PrivacyPolicy   from "../pages/PrivacyPolicy";
import TermsConditions from "../pages/TermsConditions";
import CookiePolicy    from "../pages/CookiePolicy";
import Disclaimer      from "../pages/Disclaimer";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                  element={<Home />}             />
      <Route path="/about"             element={<About />}            />
      <Route path="/products"          element={<Products />}         />
      <Route path="/gallery"           element={<Gallery />}          />
      <Route path="/contact"           element={<Contact />}          />
      <Route path="/sell-crops"        element={<SellCrops />}        />
      <Route path="/sell-crop"         element={<SellCrops />}        />
      <Route path="/equipment-booking" element={<EquipmentBooking />} />
      <Route path="/admin"             element={<Admin />}            />
      <Route path="/privacy"           element={<PrivacyPolicy />}    />
      <Route path="/terms"             element={<TermsConditions />}  />
      <Route path="/cookie-policy"     element={<CookiePolicy />}     />
      <Route path="/disclaimer"        element={<Disclaimer />}       />
      
      {/* Farmer Auth & Portal Routes */}
      <Route path="/farmer-login"      element={<FarmerLogin />} />
      <Route path="/farmer-register"   element={<FarmerRegister />} />
      <Route path="/farmer-dashboard"  element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
      <Route path="/farmer-profile"    element={<ProtectedRoute><FarmerProfile /></ProtectedRoute>} />
      <Route path="/my-crop-requests"  element={<ProtectedRoute><MyCropRequests /></ProtectedRoute>} />

      {/* Legacy/Redirect protection routes */}
      <Route path="/crop-request"      element={<Navigate to="/sell-crop" replace />} />
      <Route path="/product-order"     element={<Navigate to="/products" replace />}   />
      <Route path="/my-bookings"       element={<Navigate to="/farmer-dashboard" replace />} />
      <Route path="/my-orders"         element={<Navigate to="/farmer-dashboard" replace />} />
      <Route path="/my-profile"        element={<Navigate to="/farmer-dashboard" replace />} />
      <Route path="*"                  element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;