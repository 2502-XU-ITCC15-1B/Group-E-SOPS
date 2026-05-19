import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return null;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}