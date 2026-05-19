import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export function AdminRoute({ children }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return null;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}