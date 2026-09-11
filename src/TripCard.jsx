```jsx
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
  const { t, destinations } = useLanguage();

  const translatedDestination =
    destinations[destination?.trim().toUpperCase()] || destination;

  return (
    <article className="trip-card">

      <img
        src={image}
        alt={name}
      />

      <div className="trip-card-content">

        <span className="trip-card-destination">
          {translatedDestination}
        </span>

        <h3>
          {name}
        </h3>

        <p className="trip-card-duration">
          {duration || t.durationNotSpecified}
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
```
