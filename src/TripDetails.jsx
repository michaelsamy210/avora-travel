import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useLanguage } from "./LanguageContext.jsx";
import "./TripDetails.css";

function TripDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    t,
    destinations: destinationTranslations,
    translateDynamic,
  } = useLanguage();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    async function getTrip() {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching trip:", error);
        setErrorMessage(t.unableToLoadTrip);
        setLoading(false);
        return;
      }

      console.log(
        "TRIP DATA FROM SUPABASE:",
        data
      );

      setTrip(data);
      setSelectedImage(data.image || "");
      setLoading(false);
    }

    getTrip();
  }, [id, t.unableToLoadTrip]);

  if (loading) {
    return (
      <div className="trip-details-page">
        <p>{t.loadingTrip}</p>
      </div>
    );
  }

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

  const gallery = trip.gallery?.length
    ? trip.gallery
    : trip.image
    ? [trip.image]
    : [];

  const translatedDestination =
    destinationTranslations[
      trip.destination?.trim().toUpperCase()
    ] || trip.destination;

  return (
    <div className="trip-details-page">
      <Link to="/" className="back-link">
        {t.backToTrips}
      </Link>

      <div className="trip-details-container">

        {/* GALLERY */}

        <section className="trip-gallery">
          <div className="main-trip-image">
            {selectedImage && (
              <img
                src={selectedImage}
                alt={translateDynamic(trip.name)}
              />
            )}
          </div>

          {gallery.length > 1 && (
            <div className="trip-thumbnails">
              {gallery.map((image, index) => (
                <button
                  type="button"
                  className={
                    selectedImage === image
                      ? "trip-thumbnail active"
                      : "trip-thumbnail"
                  }
                  key={`${image}-${index}`}
                  onClick={() =>
                    setSelectedImage(image)
                  }
                >
                  <img
                    src={image}
                    alt={`${translateDynamic(
                      trip.name
                    )} ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* BASIC INFORMATION */}

        <section className="trip-info">
          <span className="trip-info-destination">
            {translatedDestination}
          </span>

          <h1>
            {translateDynamic(trip.name)}
          </h1>

          <p className="trip-description">
            {trip.description
              ? translateDynamic(trip.description)
              : t.noDescription}
          </p>

          <div className="trip-info-grid">

            <div className="trip-info-item">
              <span>{t.hotel}</span>

              <strong>
                {trip.hotel
                  ? translateDynamic(trip.hotel)
                  : t.notSpecified}
              </strong>
            </div>

            <div className="trip-info-item">
              <span>{t.duration}</span>

              <strong>
                {trip.duration
                  ? translateDynamic(trip.duration)
                  : t.notSpecified}
              </strong>
            </div>

            <div className="trip-info-item">
              <span>{t.price}</span>

              <strong>
                {trip.price || t.notSpecified}
              </strong>
            </div>

            <div className="trip-info-item">
              <span>{t.availableSeats}</span>

              <strong>
                {trip.seats ?? 0}
              </strong>
            </div>

            <div className="trip-info-item">
              <span>{t.startDate}</span>

              <strong>
                {trip.start_date || t.notSpecified}
              </strong>
            </div>

            <div className="trip-info-item">
              <span>{t.endDate}</span>

              <strong>
                {trip.end_date || t.notSpecified}
              </strong>
            </div>

          </div>

          <div className="trip-details-sections">

            {/* MEALS */}

            {trip.meals?.length > 0 && (
              <div className="details-section">
                <h2>{t.meals}</h2>

                <ul>
                  {trip.meals.map((item, index) => (
                    <li key={index}>
                      {translateDynamic(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ACTIVITIES */}

            {trip.activities?.length > 0 && (
              <div className="details-section">
                <h2>{t.activities}</h2>

                <ul>
                  {trip.activities.map((item, index) => (
                    <li key={index}>
                      {translateDynamic(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TRANSPORTATION */}

            {trip.transportation?.length > 0 && (
              <div className="details-section">
                <h2>{t.transportation}</h2>

                <ul>
                  {trip.transportation.map((item, index) => (
                    <li key={index}>
                      {translateDynamic(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* INCLUDED */}

            {trip.included?.length > 0 && (
              <div className="details-section">
                <h2>{t.whatsIncluded}</h2>

                <ul>
                  {trip.included.map((item, index) => (
                    <li key={index}>
                      ✓ {translateDynamic(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* NOT INCLUDED */}

            {trip.not_included?.length > 0 && (
              <div className="details-section">
                <h2>{t.whatsNotIncluded}</h2>

                <ul>
                  {trip.not_included.map((item, index) => (
                    <li key={index}>
                      ✕ {translateDynamic(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          <button
            type="button"
            className="book-trip-button"
            onClick={() =>
              navigate(`/trip/${trip.id}/book`)
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