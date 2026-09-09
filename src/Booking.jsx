import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useLanguage } from "./LanguageContext.jsx";
import "./Booking.css";

function Booking() {
  const { id } = useParams();
  const { t } = useLanguage();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    email: "",
    seats: 1,
    travel_date: "",
    notes: "",
  });

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

      setTrip(data);
      setLoading(false);
    }

    getTrip();
  }, [id, t.unableToLoadTrip]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!trip) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("bookings")
      .insert([
        {
          trip_id: trip.id,
          customer_name: formData.customer_name,
          phone: formData.phone,
          email: formData.email || null,
          seats: Number(formData.seats),
          travel_date: formData.travel_date || null,
          notes: formData.notes || null,
        },
      ]);

    if (error) {
      console.error("Booking error:", error);

      setErrorMessage(
        "We couldn't submit your booking. Please try again."
      );

      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setBookingSuccess(true);
  }

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-loading">
          <div className="booking-spinner"></div>

          <p>{t.loadingTrip}</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !trip) {
    return (
      <div className="booking-page">
        <div className="booking-error">
          <div className="booking-error-icon">!</div>

          <h2>{t.tripNotFound}</h2>

          <p>{errorMessage}</p>

          <Link to="/" className="booking-home-button">
            {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="booking-page">
        <div className="booking-success">
          <div className="success-icon">✓</div>

          <span className="booking-success-eyebrow">
            SWAY TRAVEL
          </span>

          <h1>{t.bookingReceived}</h1>

          <p>
            {t.thankYou}{" "}
            <strong>{formData.customer_name}</strong>.
          </p>

          <p>
            {t.bookingRequestFor}{" "}
            <strong>{trip.name}</strong>{" "}
            {t.bookingSubmitted}
          </p>

          <p>
            {t.teamWillContact}
          </p>

          <div className="booking-success-actions">
            <Link
              to={`/trip/${trip.id}`}
              className="booking-success-button"
            >
              {t.backToTrip}
            </Link>

            <Link
              to="/"
              className="booking-home-link"
            >
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-wrapper">

        <Link
          to={`/trip/${trip.id}`}
          className="booking-back-link"
        >
          ← {t.backToTrip}
        </Link>

        <div className="booking-layout">

          <div className="booking-trip-card">

            {trip.image ? (
              <img
                src={trip.image}
                alt={trip.name}
                className="booking-trip-image"
              />
            ) : (
              <div className="booking-trip-image-placeholder">
                SWAY TRAVEL
              </div>
            )}

            <div className="booking-trip-content">

              <span className="booking-trip-destination">
                {trip.destination}
              </span>

              <h2>{trip.name}</h2>

              <div className="booking-trip-meta">
                <span>◷ {trip.duration}</span>
                <span>◆ {trip.price}</span>
              </div>

              {trip.hotel && (
                <div className="booking-trip-detail">
                  <small>{t.hotel}</small>

                  <strong>{trip.hotel}</strong>
                </div>
              )}

              {trip.seats && (
                <div className="booking-trip-detail">
                  <small>{t.availableSeats}</small>

                  <strong>{trip.seats}</strong>
                </div>
              )}

            </div>
          </div>

          <div className="booking-form-card">

            <div className="booking-form-header">
              <span>{t.bookYourTrip}</span>

              <h1>{t.completeBooking}</h1>

              <p>
                {t.bookingDescription}
              </p>
            </div>

            {errorMessage && (
              <div className="booking-form-error">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="booking-form-grid">

                <div className="booking-form-group full">
                  <label>{t.fullName}</label>

                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    placeholder={t.enterFullName}
                    required
                  />
                </div>

                <div className="booking-form-group">
                  <label>{t.phoneNumber}</label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </div>

                <div className="booking-form-group">
                  <label>{t.email}</label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="booking-form-group">
                  <label>{t.numberOfSeats}</label>

                  <input
                    type="number"
                    name="seats"
                    value={formData.seats}
                    onChange={handleChange}
                    min="1"
                    max={trip.seats || undefined}
                    required
                  />
                </div>

                <div className="booking-form-group">
                  <label>{t.travelDate}</label>

                  <input
                    type="date"
                    name="travel_date"
                    value={formData.travel_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="booking-form-group full">
                  <label>{t.notes}</label>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder={t.additionalNotes}
                    rows="5"
                  />
                </div>

              </div>

              <button
                type="submit"
                className="submit-booking-button"
                disabled={submitting}
              >
                {submitting
                  ? t.submittingBooking
                  : t.submitBooking}
              </button>

            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking;