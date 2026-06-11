import { Routes, Route } from "react-router-dom";

import Home             from "../pages/Home";
import About            from "../pages/About";
import Products         from "../pages/Products";
import Gallery          from "../pages/Gallery";
import Contact          from "../pages/Contact";
import SellCrops        from "../pages/SellCrop";
import EquipmentBooking from "../pages/EquipmentBooking";
import Admin            from "../pages/Admin";

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
    </Routes>
  );
}

export default AppRoutes;