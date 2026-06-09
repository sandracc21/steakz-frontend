import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  if (location.pathname.startsWith("/staff")) return null;

  const handleLogout = () => { logout(); navigate("/"); };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";

  return (
    <>
      <nav className={`navbar${scrolled ? " navbar-scrolled" : ""}`}>
        <div className="navbar-inner">
          <button className="navbar-logo" onClick={() => navigate("/")}>
            <span className="logo-icon">🥘</span>
            <span className="logo-text">Steakz</span>
          </button>

          <div className="navbar-links desktop-only">
            {[
              { label: "Home", path: "/" },
              { label: "Menu", path: "/menu" },
              // Only show Order link to guests and customers (role 6), not staff
              ...(!isAuthenticated || user?.role === 6 ? [
                { label: "Order",   path: "/order"   },
                { label: "Reserve", path: "/reserve" },
              ] : []),
            ].map(({ label, path }) => (
              <button
                key={path}
                className={`nav-link${location.pathname === path ? " active" : ""}`}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="navbar-auth desktop-only">
            {isAuthenticated && user?.role === 6 ? (
              <>
                <button className="nav-link" onClick={() => navigate("/my-orders")}>
                  My Orders
                </button>
                <div className="user-avatar" title={user.name} onClick={() => navigate("/my-orders")}>
                  {initials}
                </div>
                <button className="navbar-btn-outline" onClick={handleLogout}>Sign Out</button>
              </>
            ) : isAuthenticated ? (
              <>
                <button className="nav-link" onClick={() => navigate("/staff")}>Dashboard</button>
                <div className="user-avatar staff-avatar" title={user?.name ?? ""}>
                  {initials}
                </div>
                <button className="navbar-btn-outline" onClick={handleLogout}>Sign Out</button>
              </>
            ) : (
              <>
                <button className="nav-link" onClick={() => navigate("/login")}>Login</button>
                <button className="navbar-btn-primary" onClick={() => navigate("/login")}>
                  Sign Up
                </button>
              </>
            )}
          </div>

          <button
            className="hamburger mobile-only"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className={menuOpen ? "bar open" : "bar"} />
            <span className={menuOpen ? "bar open" : "bar"} />
            <span className={menuOpen ? "bar open" : "bar"} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-drawer">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/menu")}>Menu</button>
          {(!isAuthenticated || user?.role === 6) && (
            <button onClick={() => navigate("/order")}>Order Now</button>
          )}
          {(!isAuthenticated || user?.role === 6) && (
            <button onClick={() => navigate("/reserve")}>Reserve a Table</button>
          )}
          {isAuthenticated && user?.role === 6 && (
            <button onClick={() => navigate("/my-orders")}>My Orders</button>
          )}
          {isAuthenticated && user?.role !== 6 && (
            <button onClick={() => navigate("/staff")}>Staff Dashboard</button>
          )}
          {isAuthenticated ? (
            <button className="mobile-signout" onClick={handleLogout}>Sign Out</button>
          ) : (
            <button className="mobile-signup" onClick={() => navigate("/login")}>
              Login / Sign Up
            </button>
          )}
        </div>
      )}
    </>
  );
}
