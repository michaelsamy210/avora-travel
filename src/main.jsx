import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import Admin from "./Admin.jsx";
import AdminLogin from "./AdminLogin.jsx";
import TripDetails from "./TripDetails.jsx";
import Booking from "./Booking.jsx";
import Trips from "./Trips.jsx";

import { LanguageProvider } from "./LanguageContext.jsx";

const isGitHubPages =
  window.location.hostname.endsWith("github.io");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter
      basename={isGitHubPages ? "/avora-travel" : "/"}
    >
      <LanguageProvider>

        <Routes>

          <Route
            path="/"
            element={<App />}
          />

          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          <Route
            path="/admin"
            element={<Admin />}
          />

          <Route
            path="/trip/:id"
            element={<TripDetails />}
          />

          <Route
            path="/trip/:id/book"
            element={<Booking />}
          />

          <Route
            path="/trips"
            element={<Trips />}
          />

        </Routes>

      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);