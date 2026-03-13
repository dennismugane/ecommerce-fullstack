import "./header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isLoggedIn, getUser, logout } from "../services/authService";

export function Header({ cart = [], products, setFilteredProducts }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const loggedIn  = isLoggedIn();
  const user      = getUser();

  let totalQuantity = 0;
  cart.forEach((item) => { totalQuantity += item.quantity; });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      {/* Logo */}
      <Link to="/" className="header-logo">
        <div className="header-logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span>SuperSimpleDev</span>
      </Link>

      {/* Nav links */}
      <nav className="header-nav">
        <Link to="/"
          className={`header-nav-link ${location.pathname === "/" ? "header-nav-link--active" : ""}`}>
          Home
        </Link>
        <button className="header-nav-link"
          onClick={() => {
            if (location.pathname === "/") {
              document.getElementById("shop-section")?.scrollIntoView({ behavior: "smooth" });
            } else { navigate("/"); }
          }}>Shop</button>
        <button className="header-nav-link"
          onClick={() => {
            if (location.pathname === "/") {
              document.getElementById("lp-deals")?.scrollIntoView({ behavior: "smooth" });
            } else { navigate("/"); }
          }}>Deals</button>
        {loggedIn && (
          <Link to="/orders"
            className={`header-nav-link ${location.pathname === "/orders" ? "header-nav-link--active" : ""}`}>
            Orders
          </Link>
        )}
      </nav>

      {/* Right section */}
      <div className="header-right">
        {loggedIn && (
          <Link className="header-cart" to="/checkout">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {totalQuantity > 0 && (
              <span className="header-cart-badge">{totalQuantity}</span>
            )}
          </Link>
        )}

        {loggedIn ? (
          <div className="header-user">
            <span className="header-user-email">{user?.email}</span>
            <button className="header-logout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        ) : (
          <Link to="/login" className="header-cta">Sign In →</Link>
        )}
      </div>

      <button className="header-mobile-menu" aria-label="Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </header>
  );
}
