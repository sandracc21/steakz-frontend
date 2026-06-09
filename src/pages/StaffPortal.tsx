import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { DashboardRouter } from "../App";

export default function StaffPortal() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="staff-portal-wrapper">
      <div className="staff-topbar">
        <button className="staff-back-btn" onClick={() => navigate("/")}>
          ← Public Site
        </button>
        <div className="staff-topbar-center">
          <span className="staff-topbar-logo">🥘 Steakz</span>
          <span className="staff-topbar-divider">|</span>
          <span className="staff-topbar-label">Staff Portal</span>
        </div>
        <button className="staff-signout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
      <DashboardRouter role={user.role} />
    </div>
  );
}
