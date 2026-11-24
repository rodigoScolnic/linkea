import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading, isGuest } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="route-loading">Cargando Linkea...</div>;
  }

  if (!user && !isGuest) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
