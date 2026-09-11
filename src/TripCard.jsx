import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./LanguageContext.jsx";
import "./TripCard.css";

function TripCard({
  id,
  name,
  image,
  destination,
  duration,
  price,
}) {
  const navigate = useNavigate();

  const {
    t,
    language,
    destinations,
    translateText,
  } = useLanguage();

  const [translatedName, setTranslatedName] =
    useState(name);

  const [translatedDuration, setTranslatedDuration] =
    useState(duration);

  const translatedDestination =
    destinations[
      destination?.trim().toUpperCase()
    ] || destination;

  useEffect(() => {
    console.log("TRIP CARD TRANSLATION STARTED:", {
      name,
      duration,
      language,
    });

    async function translateTripCard() {
      if (language === "en") {
        setTranslatedName(name);
        setTranslatedDuration(duration);
        return;
      }

      try {
        const [nameTranslation, durationTranslation] =
          await Promise.all([
            translateText(name),
            translateText(duration),
          ]);

        setTranslatedName(
          nameTranslation || name
        );

        setTranslatedDuration(
          durationTranslation || duration
        );
      } catch (error) {
        console.error(
          "Error translating trip card:",
          error
        );

        setTranslatedName(name);
        setTranslatedDuration(duration);
      }
    }

    translateTripCard();
  }, [
    name,
    duration,
    language,
    translateText,
  ]);

  return (
    <article className="trip-card">
      <img
        src={image}
        alt={
          translatedDestination ||
          translatedName
        }
      />

      <div className="trip-card-content">
        <span className="trip-card-destination">
          {translatedDestination}
        </span>

        <h3>{translatedName}</h3>

        <p className="trip-card-duration">
          {translatedDuration ||
            t.durationNotSpecified}
        </p>

        <p className="trip-card-price">
          {price || t.priceNotSpecified}
        </p>

        <button
          type="button"
          onClick={() => navigate(`/trip/${id}`)}
        >
          {t.viewDetails}
        </button>
      </div>
    </article>
  );
}

export default TripCard;