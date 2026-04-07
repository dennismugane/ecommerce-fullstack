import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../../services/authService";
import "./AuthPage.css";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate("/"); // redirect to homepage after auth
    } catch (err) {
      setError(err.response?.data || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span>SuperSimpleDev</span>
          </div>
          <h1 className="auth-left-title">
            Your favourite
            <br />
            store, <em>simplified.</em>
          </h1>
          <p className="auth-left-sub">
            Thousands of products, fast delivery, and a seamless shopping
            experience — all in one place.
          </p>
          <div className="auth-left-stats">
            <div>
              <span className="auth-stat-num">12K+</span>
              <span className="auth-stat-label">Products</span>
            </div>
            <div>
              <span className="auth-stat-num">98%</span>
              <span className="auth-stat-label">Satisfaction</span>
            </div>
            <div>
              <span className="auth-stat-num">24h</span>
              <span className="auth-stat-label">Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          {/* Tab toggle */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? "auth-tab--active" : ""}`}
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${!isLogin ? "auth-tab--active" : ""}`}
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
            >
              Create Account
            </button>
          </div>

          <h2 className="auth-form-title">
            {isLogin ? "Welcome back" : "Join us today"}
          </h2>
          <p className="auth-form-sub">
            {isLogin
              ? "Sign in to access your cart and orders."
              : "Create an account to start shopping."}
          </p>

          {/* Error message */}
          {error && (
            <div className="auth-error">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Submit */}
          <button
            className="auth-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : isLogin ? (
              "Sign In →"
            ) : (
              "Create Account →"
            )}
          </button>

          {/* Switch mode */}
          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              className="auth-switch-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
