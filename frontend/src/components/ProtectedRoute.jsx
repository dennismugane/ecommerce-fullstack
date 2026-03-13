// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  // Read directly from localStorage — no state, no re-renders
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
