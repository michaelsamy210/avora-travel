import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import TripCard from "./TripCard";
import "./Trips.css";

function Trips() {
  const [trips, setTrips] = useState([]);

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

  return (
    <div className="trips-page">

      <header className="trips-page-header">

        <Link to="/" className="trips-page-logo">
          <span>AVORA</span>
          <small>TRAVEL</small>
        </Link>

        <Link to="/" className="trips-back-link">
          ← Back to Home
        </Link>

      </header>

      <section className="trips-page-hero">

        <span>DISCOVER YOUR NEXT ADVENTURE</span>

        <h1>Our Trips</h1>

        <p>
          Choose your next adventure from our carefully
          selected trips and unforgettable destinations.
        </p>

      </section>

      <section className="trips-page-content">

        <div className="trips-container">

          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              {...trip}
            />
          ))}

        </div>

        {trips.length === 0 && (
          <div className="empty-trips">
            No trips available yet.
          </div>
        )}

      </section>

    </div>
  );
}

export default Trips;