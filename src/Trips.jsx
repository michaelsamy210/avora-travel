import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import TripCard from "./TripCard";
import { useLanguage } from "./LanguageContext.jsx";
import "./Trips.css";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [searchParams, setSearchParams] =
    useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    language,
    t,
    destinations: destinationTranslations,
  } = useLanguage();

  const selectedDestination =
    searchParams.get("destination") || "All";

  const selectedSection =
    searchParams.get("section") || "All";

  const offersOnly =
    searchParams.get("offers") === "true";

  useEffect(() => {
    async function getTrips() {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error(
          "Error fetching trips:",
          error
        );
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
    const matchesOffer =
      !offersOnly || trip.is_offer === true;

    const matchesSection =
      selectedSection === "All" ||
      Number(trip.section_id) ===
        Number(selectedSection);

    const matchesDestination =
      selectedDestination === "All" ||
      trip.destination === selectedDestination;

    const search =
      searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      trip.name
        ?.toLowerCase()
        .includes(search) ||
      trip.destination
        ?.toLowerCase()
        .includes(search) ||
      trip.description
        ?.toLowerCase()
        .includes(search);

    return (
      matchesOffer &&
      matchesSection &&
      matchesDestination &&
      matchesSearch
    );
  });

  function handleDestinationChange(
    destination
  ) {
    const newParams = {};

    if (offersOnly) {
      newParams.offers = "true";
    }

    if (selectedSection !== "All") {
      newParams.section = selectedSection;
    }

    if (destination !== "All") {
      newParams.destination = destination;
    }

    setSearchParams(newParams);
  }

  function getTranslatedDestination(
    destination
  ) {
    if (!destination) {
      return destination;
    }

    const key =
      destination.trim().toUpperCase();

    return (
      destinationTranslations[key] ||
      destination
    );
  }

  const sectionTitle =
    selectedSection !== "All"
      ? language === "ru"
        ? "Туры в разделе"
        : "Section Trips"
      : "";

  return (
    <div className="trips-page">

      {/* ================= HEADER ================= */}

      <header className="trips-page-header">

        <Link
          to="/"
          className="trips-page-logo"
        >
          <span>SWAY</span>
          <small>TRAVEL</small>
        </Link>

        <Link
          to="/"
          className="trips-back-link"
        >
          {t.tripsBackHome}
        </Link>

      </header>


      {/* ================= HERO ================= */}

      <section className="trips-page-hero">

        <span>
          {t.tripsEyebrow}
        </span>

        <h1>
          {offersOnly
            ? language === "ru"
              ? "Специальные предложения"
              : "Special Offers"
            : selectedSection !== "All"
              ? sectionTitle
              : t.tripsTitle}
        </h1>

        <p>
          {offersOnly
            ? language === "ru"
              ? "Откройте для себя наши специальные предложения и лучшие цены."
              : "Discover our special offers and enjoy our best prices."
            : selectedSection !== "All"
              ? language === "ru"
                ? "Откройте доступные туры в этом разделе."
                : "Explore trips available in this section."
              : t.tripsDescription}
        </p>

      </section>


      {/* ================= CONTENT ================= */}

      <section className="trips-page-content">

        {/* Search */}

        <div className="trips-search">

          <input
            type="text"
            placeholder={
              t.tripsSearchPlaceholder
            }
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>


        {/* Filters */}

        <div className="trips-filter">

          <button
            type="button"
            className={
              selectedDestination ===
              "All"
                ? "trips-filter-button active"
                : "trips-filter-button"
            }
            onClick={() =>
              handleDestinationChange(
                "All"
              )
            }
          >
            {t.allTrips}
          </button>

          {destinations.map(
            (destination) => (
              <button
                key={destination}
                type="button"
                className={
                  selectedDestination ===
                  destination
                    ? "trips-filter-button active"
                    : "trips-filter-button"
                }
                onClick={() =>
                  handleDestinationChange(
                    destination
                  )
                }
              >
                {getTranslatedDestination(
                  destination
                )}
              </button>
            )
          )}

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

          {filteredTrips.map(
            (trip) => (
              <TripCard
                key={trip.id}
                {...trip}
              />
            )
          )}

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