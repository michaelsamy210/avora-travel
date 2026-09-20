
import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "./supabaseClient";

import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [mode, setMode] = useState(() => {
    const hash = window.location.hash;

    if (
      hash.includes("type=recovery") ||
      hash.includes("access_token=")
    ) {
      return "reset";
    }

    return "login";
  });

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
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

  async function handleForgotPassword(event) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage(
        "Please enter your email address."
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            `${window.location.origin}/admin/login`,
        }
      );

    if (error) {
      console.error(
        "Password reset error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to send password reset email."
      );

      setLoading(false);
      return;
    }

    setSuccessMessage(
      "Password reset email sent. Please check your inbox."
    );

    setLoading(false);
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!newPassword) {
      setErrorMessage(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (error) {
      console.error(
        "Password update error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to update password."
      );

      setLoading(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");

    setSuccessMessage(
      "Password changed successfully. You can now sign in."
    );

    setMode("login");
    setLoading(false);

    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}${window.location.search}`
    );
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

  function handleNewPasswordChange(event) {
    setNewPassword(event.target.value);

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  function handleConfirmPasswordChange(event) {
    setConfirmPassword(event.target.value);

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setErrorMessage("");
    setSuccessMessage("");
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-logo">
          <strong>AVORA</strong>
          <span>TRAVEL</span>
        </div>

        {mode === "login" && (
          <>
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

            {successMessage && (
              <div className="login-success-message">
                {successMessage}
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

                <div className="password-input-wrapper">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {showPassword ? (
                        <>
                          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="2.5" />
                        </>
                      ) : (
                        <>
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.5 5.3A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.1 3.8" />
                          <path d="M6.1 6.1C3.4 8.1 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 2.5-.3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
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

            <button
              type="button"
              className="login-forgot-button"
              onClick={() =>
                switchMode("forgot")
              }
            >
              Forgot Password?
            </button>
          </>
        )}

        {mode === "forgot" && (
          <>
            <div className="login-header">
              <span className="login-eyebrow">
                ACCOUNT RECOVERY
              </span>

              <h1>Reset Password</h1>

              <p>
                Enter your email and we'll send you a password reset link.
              </p>
            </div>

            {errorMessage && (
              <div className="login-error-message">
                <span>✕</span>
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="login-success-message">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>

              <div className="login-form-group">
                <label htmlFor="reset-email">
                  Email
                </label>

                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>

              <button
                type="submit"
                className="login-submit-button"
                disabled={loading}
              >
                {loading
                  ? "Sending..."
                  : "Send Reset Link"}
              </button>

            </form>

            <button
              type="button"
              className="login-forgot-button"
              onClick={() =>
                switchMode("login")
              }
            >
              Back to Sign In
            </button>
          </>
        )}

        {mode === "reset" && (
          <>
            <div className="login-header">
              <span className="login-eyebrow">
                ACCOUNT RECOVERY
              </span>

              <h1>Choose New Password</h1>

              <p>
                Enter and confirm your new password.
              </p>
            </div>

            {errorMessage && (
              <div className="login-error-message">
                <span>✕</span>
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="login-success-message">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword}>

              <div className="login-form-group">
                <label htmlFor="new-password">
                  New Password
                </label>

                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={
                    handleNewPasswordChange
                  }
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="login-form-group">
                <label htmlFor="confirm-password">
                  Confirm Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={
                    handleConfirmPasswordChange
                  }
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="login-submit-button"
                disabled={loading}
              >
                {loading
                  ? "Updating..."
                  : "Update Password"}
              </button>

            </form>
          </>
        )}

      </div>
    </div>
  );
}

export default AdminLogin;
