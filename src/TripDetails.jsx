import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { supabase } from "./supabaseClient";
import { useLanguage } from "./LanguageContext.jsx";

import "./TripDetails.css";

function TripDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    t,
    language,
    destinations: destinationTranslations,
    translateText,
  } = useLanguage();

  const [trip, setTrip] = useState(null);
  const [translatedTrip, setTranslatedTrip] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState("");

  /* ================= FETCH TRIP ================= */

  useEffect(() => {
    async function getTrip() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(
          "Error fetching trip:",
          error
        );

        setErrorMessage(
          t.unableToLoadTrip
        );

        setLoading(false);
        return;
      }

      console.log(
        "TRIP DATA FROM SUPABASE:",
        data
      );

      setTrip(data);
      setSelectedImage(
        data.image || ""
      );

      setLoading(false);
    }

    getTrip();
  }, [id, t.unableToLoadTrip]);

  /* ================= TRANSLATE TRIP ================= */

  useEffect(() => {
    async function translateTrip() {
      if (!trip) {
        return;
      }

      /*
       * English does not need DeepL.
       * We simply use the original Supabase data.
       */
      if (language === "en") {
        setTranslatedTrip(trip);
        return;
      }

      setTranslating(true);

      try {
        /*
         * Translate a single value.
         */
        async function translateValue(
          value
        ) {
          if (!value) {
            return value;
          }

          if (
            typeof value !== "string"
          ) {
            return value;
          }

          return await translateText(
            value
          );
        }

        /*
         * Translate arrays such as:
         *
         * meals
         * activities
         * transportation
         * included
         * not_included
         */
        async function translateArray(
          value
        ) {
          if (!Array.isArray(value)) {
            return value;
          }

          return await Promise.all(
            value.map((item) =>
              translateValue(item)
            )
          );
        }

        const translated = {
          ...trip,

          name: await translateValue(
            trip.name
          ),

          description:
            await translateValue(
              trip.description
            ),

          hotel: await translateValue(
            trip.hotel
          ),

          duration:
            await translateValue(
              trip.duration
            ),

          meals:
            await translateArray(
              trip.meals
            ),

          activities:
            await translateArray(
              trip.activities
            ),

          transportation:
            await translateArray(
              trip.transportation
            ),

          included:
            await translateArray(
              trip.included
            ),

          not_included:
            await translateArray(
              trip.not_included
            ),
        };

        setTranslatedTrip(
          translated
        );
      } catch (error) {
        console.error(
          "Error translating trip:",
          error
        );

        /*
         * If translation fails,
         * show the original trip
         * instead of breaking the page.
         */
        setTranslatedTrip(trip);
      } finally {
        setTranslating(false);
      }
    }

    translateTrip();
  }, [
    trip,
    language,
    translateText,
  ]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="trip-details-page">
        <p>{t.loadingTrip}</p>
      </div>
    );
  }

  /* ================= ERROR ================= */

  if (errorMessage || !trip) {
    return (
      <div className="trip-details-page">
        <h2>{t.tripNotFound}</h2>

        <p>{errorMessage}</p>

        <Link to="/">
          {t.backToHome}
        </Link>
      </div>
    );
  }

  /*
   * While DeepL is translating,
   * use the original trip temporarily.
   */
  const displayTrip =
    translatedTrip || trip;

  /* ================= GALLERY ================= */

  const gallery =
    displayTrip.gallery?.length
      ? displayTrip.gallery
      : displayTrip.image
      ? [displayTrip.image]
      : [];

  /* ================= DESTINATION ================= */

  const translatedDestination =
    destinationTranslations[
      displayTrip.destination
        ?.trim()
        .toUpperCase()
    ] ||
    displayTrip.destination;

  /* ================= PAGE ================= */

  return (
    <div className="trip-details-page">

      <Link
        to="/"
        className="back-link"
      >
        {t.backToTrips}
      </Link>

      <div className="trip-details-container">

        {/* ================= GALLERY ================= */}

        <section className="trip-gallery">

          <div className="main-trip-image">

            {selectedImage && (
              <img
                src={selectedImage}
                alt={
                  displayTrip.name ||
                  "Trip"
                }
              />
            )}

          </div>

          {gallery.length > 1 && (
            <div className="trip-thumbnails">

              {gallery.map(
                (image, index) => (
                  <button
                    type="button"
                    className={
                      selectedImage ===
                      image
                        ? "trip-thumbnail active"
                        : "trip-thumbnail"
                    }
                    key={`${image}-${index}`}
                    onClick={() =>
                      setSelectedImage(
                        image
                      )
                    }
                  >
                    <img
                      src={image}
                      alt={`${displayTrip.name || "Trip"} ${
                        index + 1
                      }`}
                    />
                  </button>
                )
              )}

            </div>
          )}

        </section>

        {/* ================= BASIC INFORMATION ================= */}

        <section className="trip-info">

          <span className="trip-info-destination">
            {translatedDestination}
          </span>

          <h1>
            {displayTrip.name}
          </h1>

          <p className="trip-description">

            {displayTrip.description
              ? displayTrip.description
              : t.noDescription}

          </p>

          <div className="trip-info-grid">

            {/* HOTEL */}

            <div className="trip-info-item">

              <span>
                {t.hotel}
              </span>

              <strong>
                {displayTrip.hotel
                  ? displayTrip.hotel
                  : t.notSpecified}
              </strong>

            </div>

            {/* DURATION */}

            <div className="trip-info-item">

              <span>
                {t.duration}
              </span>

              <strong>
                {displayTrip.duration
                  ? displayTrip.duration
                  : t.notSpecified}
              </strong>

            </div>

            {/* PRICE */}

            <div className="trip-info-item">

              <span>
                {t.price}
              </span>

              <strong>
                {displayTrip.price ||
                  t.notSpecified}
              </strong>

            </div>

            {/* SEATS */}

            <div className="trip-info-item">

              <span>
                {t.availableSeats}
              </span>

              <strong>
                {displayTrip.seats ??
                  0}
              </strong>

            </div>

            {/* START DATE */}

            <div className="trip-info-item">

              <span>
                {t.startDate}
              </span>

              <strong>
                {displayTrip.start_date ||
                  t.notSpecified}
              </strong>

            </div>

            {/* END DATE */}

            <div className="trip-info-item">

              <span>
                {t.endDate}
              </span>

              <strong>
                {displayTrip.end_date ||
                  t.notSpecified}
              </strong>

            </div>

          </div>

          {/* ================= TRANSLATION STATUS ================= */}

          {translating &&
            language === "ru" && (
              <p
                style={{
                  fontSize: "14px",
                  opacity: 0.7,
                  marginTop: "10px",
                }}
              >
                Перевод...
              </p>
            )}

          {/* ================= DETAILS ================= */}

          <div className="trip-details-sections">

            {/* MEALS */}

            {displayTrip.meals
              ?.length > 0 && (
              <div className="details-section">

                <h2>
                  {t.meals}
                </h2>

                <ul>

                  {displayTrip.meals.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}

                </ul>

              </div>
            )}

            {/* ACTIVITIES */}

            {displayTrip.activities
              ?.length > 0 && (
              <div className="details-section">

                <h2>
                  {t.activities}
                </h2>

                <ul>

                  {displayTrip.activities.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}

                </ul>

              </div>
            )}

            {/* TRANSPORTATION */}

            {displayTrip
              .transportation
              ?.length > 0 && (
              <div className="details-section">

                <h2>
                  {t.transportation}
                </h2>

                <ul>

                  {displayTrip.transportation.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}

                </ul>

              </div>
            )}

            {/* INCLUDED */}

            {displayTrip.included
              ?.length > 0 && (
              <div className="details-section">

                <h2>
                  {t.whatsIncluded}
                </h2>

                <ul>

                  {displayTrip.included.map(
                    (item, index) => (
                      <li key={index}>
                        ✓ {item}
                      </li>
                    )
                  )}

                </ul>

              </div>
            )}

            {/* NOT INCLUDED */}

            {displayTrip.not_included
              ?.length > 0 && (
              <div className="details-section">

                <h2>
                  {t.whatsNotIncluded}
                </h2>

                <ul>

                  {displayTrip.not_included.map(
                    (item, index) => (
                      <li key={index}>
                        ✕ {item}
                      </li>
                    )
                  )}

                </ul>

              </div>
            )}

          </div>

          {/* ================= BOOK BUTTON ================= */}

          <button
            type="button"
            className="book-trip-button"
            onClick={() =>
              navigate(
                `/trip/${displayTrip.id}/book`
              )
            }
          >
            {t.bookNow}
          </button>

        </section>

      </div>

    </div>
  );
}

export default TripDetails;