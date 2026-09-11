
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import TripCard from "./TripCard";
import { useLanguage } from "./LanguageContext.jsx";
import "./Trips.css";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");

  const { t, destinations: destinationTranslations } =
    useLanguage();

  const selectedDestination =
    searchParams.get("destination") || "All";

  useEffect(() => {
    async function getTrips() {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching trips:", error);
        return;
      }

      setTrips(data || []);
    }

    getTrips();
  }, []);

  const destinations = [
    ...new Set(
      trips
        .map((trip) => trip.destination)
        .filter(Boolean)
    ),
  ];

  const filteredTrips = trips.filter((trip) => {
    const matchesDestination =
      selectedDestination === "All" ||
      trip.destination === selectedDestination;

    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      trip.name?.toLowerCase().includes(search) ||
      trip.destination?.toLowerCase().includes(search) ||
      trip.description?.toLowerCase().includes(search);

    return matchesDestination && matchesSearch;
  });

  function handleDestinationChange(destination) {
    if (destination === "All") {
      setSearchParams({});
      return;
    }

    setSearchParams({
      destination,
    });
  }

  function getTranslatedDestination(destination) {
    if (!destination) {
      return destination;
    }

    const key = destination.trim().toUpperCase();

    return destinationTranslations[key] || destination;
  }

  return (
    <div className="trips-page">
      {/* ================= HEADER ================= */}

      <header className="trips-page-header">
        <Link to="/" className="trips-page-logo">
          <span>SWAY</span>
          <small>TRAVEL</small>
        </Link>

        <Link to="/" className="trips-back-link">
          {t.tripsBackHome}
        </Link>
      </header>

      {/* ================= HERO ================= */}

      <section className="trips-page-hero">
        <span>{t.tripsEyebrow}</span>

        <h1>{t.tripsTitle}</h1>

        <p>{t.tripsDescription}</p>
      </section>

      {/* ================= CONTENT ================= */}

      <section className="trips-page-content">
        {/* Search */}

        <div className="trips-search">
          <input
            type="text"
            placeholder={t.tripsSearchPlaceholder}
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        {/* Filters */}

        <div className="trips-filter">
          <button
            type="button"
            className={
              selectedDestination === "All"
                ? "trips-filter-button active"
                : "trips-filter-button"
            }
            onClick={() =>
              handleDestinationChange("All")
            }
          >
            {t.allTrips}
          </button>

          {destinations.map((destination) => (
            <button
              key={destination}
              type="button"
              className={
                selectedDestination === destination
                  ? "trips-filter-button active"
                  : "trips-filter-button"
              }
              onClick={() =>
                handleDestinationChange(destination)
              }
            >
              {getTranslatedDestination(destination)}
            </button>
          ))}
        </div>

        {/* Results Count */}

        <div className="trips-results-count">
          {filteredTrips.length}{" "}
          {filteredTrips.length === 1
            ? t.trip
            : t.trips}{" "}
          {t.found}
        </div>

        {/* Trips */}

        <div className="trips-container">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              {...trip}
            />
          ))}
        </div>

        {/* Empty State */}

        {filteredTrips.length === 0 && (
          <div className="empty-trips">
            {t.noTripsFound}
          </div>
        )}
      </section>
    </div>
  );
}

export default Trips;