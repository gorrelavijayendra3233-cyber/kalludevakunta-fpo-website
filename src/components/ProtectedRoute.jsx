import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("farmer_token");

  if (!token) {
    return <Navigate to="/farmer-login" replace />;
  }

  return children;
}

export default ProtectedRoute;
