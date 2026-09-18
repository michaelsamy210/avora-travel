import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      console.error("Login error:", error);

      setErrorMessage(
        "Invalid email or password."
      );

      setLoading(false);
      return;
    }

    navigate("/admin", {
      replace: true,
    });
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-logo">
          <strong>AVORA</strong>
          <span>TRAVEL</span>
        </div>

        <div className="login-header">
          <span className="login-eyebrow">
            ADMIN PANEL
          </span>

          <h1>Welcome Back</h1>

          <p>
            Sign in to manage your trips and bookings.
          </p>
        </div>

        {errorMessage && (
          <div className="login-error-message">
            <span>✕</span>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div className="login-form-group">
            <label htmlFor="admin-email">
              Email
            </label>

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="admin-password">
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default AdminLogin;