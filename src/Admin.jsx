import { useEffect, useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./Admin.css";

const emptyForm = {
  name: "",
  destination: "",
  hotel: "",
  description: "",
  duration: "",
  price: "",
  seats: "",
  meals: [],
  activities: [],
  transportation: [],
  included: [],
  not_included: [],
  start_date: "",
  end_date: "",
  featured: false,
  status: "active",
  image: "",
  gallery: [],
};

function Admin() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] =
    useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] =
    useState(false);

  const [search, setSearch] = useState("");
  const [filterDestination, setFilterDestination] =
    useState("all");

  const [bookingSearch, setBookingSearch] =
    useState("");

  const [bookingStatusFilter, setBookingStatusFilter] =
    useState("all");

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setAuthLoading(false);
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (!authLoading && session) {
      getTrips();
      getBookings();
    }
  }, [authLoading, session]);

  async function handleLogout() {
    await supabase.auth.signOut();

    navigate("/admin/login", {
      replace: true,
    });
  }

  async function getTrips() {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error loading trips:",
        error
      );

      setErrorMessage(
        "Unable to load trips."
      );

      return;
    }

    setTrips(data || []);
  }

  async function getBookings() {
    setBookingsLoading(true);

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        trips (
          name,
          destination,
          image
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error loading bookings:",
        error
      );

      setErrorMessage(
        "Unable to load bookings."
      );

      setBookingsLoading(false);

      return;
    }

    setBookings(data || []);
    setBookingsLoading(false);
  }

  async function updateBookingStatus(
    bookingId,
    newStatus
  ) {
    setErrorMessage("");
    setMessage("");

    const { error } = await supabase
      .from("bookings")
      .update({
        status: newStatus,
      })
      .eq("id", bookingId);

    if (error) {
      console.error(
        "Update booking status error:",
        error
      );

      setErrorMessage(
        "Unable to update booking status."
      );

      return;
    }

    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status: newStatus,
            }
          : booking
      )
    );

    setMessage(
      "Booking status updated successfully!"
    );
  }

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function addListItem(field, value) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      [field]: [
        ...previous[field],
        trimmedValue,
      ],
    }));
  }

  function removeListItem(field, index) {
    setForm((previous) => ({
      ...previous,
      [field]: previous[field].filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),
    }));
  }

  async function uploadImages(files) {
    if (!files || files.length === 0) {
      return;
    }

    setImageUploading(true);
    setErrorMessage("");

    const uploadedUrls = [];

    for (const file of files) {
      const fileExtension =
        file.name.split(".").pop();

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      const filePath = `trips/${fileName}`;

      const { error } = await supabase.storage
        .from("trip-images")
        .upload(filePath, file);

      if (error) {
        console.error(
          "Image upload error:",
          error
        );

        setErrorMessage(
          "There was an error uploading one of the images."
        );

        continue;
      }

      const { data } = supabase.storage
        .from("trip-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    if (uploadedUrls.length > 0) {
      setForm((previous) => ({
        ...previous,
        image:
          previous.image ||
          uploadedUrls[0],
        gallery: [
          ...previous.gallery,
          ...uploadedUrls,
        ],
      }));
    }

    setImageUploading(false);
  }

  async function deleteStorageImage(imageUrl) {
    if (!imageUrl) {
      return;
    }

    try {
      const url = new URL(imageUrl);

      const marker =
        "/storage/v1/object/public/trip-images/";

      const index =
        url.pathname.indexOf(marker);

      if (index === -1) {
        return;
      }

      const filePath = decodeURIComponent(
        url.pathname.substring(
          index + marker.length
        )
      );

      await supabase.storage
        .from("trip-images")
        .remove([filePath]);
    } catch (error) {
      console.error(
        "Storage delete error:",
        error
      );
    }
  }

  async function removeGalleryImage(url) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this image?"
    );

    if (!confirmed) {
      return;
    }

    await deleteStorageImage(url);

    setForm((previous) => {
      const newGallery =
        previous.gallery.filter(
          (image) => image !== url
        );

      let newMainImage = previous.image;

      if (previous.image === url) {
        newMainImage =
          newGallery[0] || "";
      }

      return {
        ...previous,
        gallery: newGallery,
        image: newMainImage,
      };
    });
  }

  function setMainImage(url) {
    setForm((previous) => ({
      ...previous,
      image: url,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");
    setLoading(true);

    const tripData = {
      name: form.name,
      destination: form.destination,
      hotel: form.hotel,
      description: form.description,
      duration: form.duration,
      price: form.price,
      seats: Number(form.seats) || 0,

      image: form.image,
      gallery: form.gallery,

      meals: form.meals,
      activities: form.activities,
      transportation:
        form.transportation,
      included: form.included,
      not_included:
        form.not_included,

      start_date:
        form.start_date || null,
      end_date:
        form.end_date || null,

      featured: form.featured,
      status: form.status,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("trips")
        .update(tripData)
        .eq("id", editingId);
    } else {
      result = await supabase
        .from("trips")
        .insert([tripData]);
    }

    if (result.error) {
      console.error(
        "Save trip error:",
        result.error
      );

      setErrorMessage(
        "Something went wrong. Please try again."
      );

      setLoading(false);
      return;
    }

    setMessage(
      editingId
        ? "Trip updated successfully!"
        : "Trip added successfully!"
    );

    resetForm();

    await getTrips();

    setLoading(false);
  }

  function editTrip(trip) {
    setEditingId(trip.id);

    setForm({
      name: trip.name || "",
      destination:
        trip.destination || "",
      hotel: trip.hotel || "",
      description:
        trip.description || "",
      duration:
        trip.duration || "",
      price:
        trip.price || "",
      seats: trip.seats ?? "",

      meals: trip.meals || [],
      activities:
        trip.activities || [],
      transportation:
        trip.transportation || [],
      included:
        trip.included || [],
      not_included:
        trip.not_included || [],

      start_date:
        trip.start_date || "",
      end_date:
        trip.end_date || "",

      featured:
        trip.featured || false,
      status:
        trip.status || "active",

      image: trip.image || "",
      gallery:
        trip.gallery || [],
    });

    setMessage("");
    setErrorMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteTrip(trip) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${trip.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", trip.id);

    if (error) {
      console.error(
        "Delete trip error:",
        error
      );

      setErrorMessage(
        "Unable to delete this trip."
      );

      return;
    }

    if (trip.gallery?.length) {
      for (const image of trip.gallery) {
        await deleteStorageImage(image);
      }
    }

    if (
      trip.image &&
      !trip.gallery?.includes(trip.image)
    ) {
      await deleteStorageImage(
        trip.image
      );
    }

    setMessage(
      "Trip deleted successfully!"
    );

    await getTrips();
  }

  function resetForm() {
    setForm({
      name: "",
      destination: "",
      hotel: "",
      description: "",
      duration: "",
      price: "",
      seats: "",
      meals: [],
      activities: [],
      transportation: [],
      included: [],
      not_included: [],
      start_date: "",
      end_date: "",
      featured: false,
      status: "active",
      image: "",
      gallery: [],
    });

    setEditingId(null);
  }

  const destinations = [
    ...new Set(
      trips
        .map(
          (trip) =>
            trip.destination
        )
        .filter(Boolean)
    ),
  ];

  const filteredTrips =
    trips.filter((trip) => {
      const searchValue =
        search.toLowerCase();

      const matchesSearch =
        trip.name
          ?.toLowerCase()
          .includes(searchValue) ||
        trip.destination
          ?.toLowerCase()
          .includes(searchValue);

      const matchesDestination =
        filterDestination ===
          "all" ||
        trip.destination ===
          filterDestination;

      return (
        matchesSearch &&
        matchesDestination
      );
    });

  const filteredBookings =
    bookings.filter((booking) => {
      const searchValue =
        bookingSearch.toLowerCase();

      const tripName =
        booking.trips?.name || "";

      const destination =
        booking.trips?.destination ||
        "";

      const customerName =
        booking.customer_name || "";

      const phone =
        booking.phone || "";

      const matchesSearch =
        customerName
          .toLowerCase()
          .includes(searchValue) ||
        phone
          .toLowerCase()
          .includes(searchValue) ||
        tripName
          .toLowerCase()
          .includes(searchValue) ||
        destination
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        bookingStatusFilter ===
          "all" ||
        booking.status ===
          bookingStatusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  const pendingBookings =
    bookings.filter(
      (booking) =>
        booking.status === "pending"
    ).length;

  const confirmedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "confirmed"
    ).length;

  const cancelledBookings =
    bookings.filter(
      (booking) =>
        booking.status === "cancelled"
    ).length;

  function formatDate(date) {
    if (!date) {
      return "Not specified";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  function formatDateTime(date) {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-content">
          <p>
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return (
    <div className="admin-page">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        <div className="admin-logo">

          <div className="admin-logo-main">
            SWAY
          </div>

          <div className="admin-logo-sub">
            TRAVEL
          </div>

        </div>


        <nav className="admin-menu">

          <a href="#dashboard">
            Dashboard
          </a>

          <a href="#trips">
            Trips
          </a>

          <a href="#add-trip">
            Add Trip
          </a>

          <a href="#bookings">
            Bookings
            {pendingBookings > 0 && (
              <span className="menu-badge">
                {pendingBookings}
              </span>
            )}
          </a>

        </nav>


        <div className="sidebar-footer">

          <span>
            SWAY Travel
          </span>

          <small>
            Management System
          </small>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>


      {/* CONTENT */}

      <div className="admin-content">

        {/* HEADER */}

        <header className="admin-header">

          <div>

            <span className="admin-eyebrow">
              TRAVEL MANAGEMENT
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              Manage your trips,
              destinations and
              travel experiences.
            </p>

          </div>


          <button
            type="button"
            className="primary-button"
            onClick={() => {
              resetForm();

              document
                .getElementById(
                  "add-trip"
                )
                ?.scrollIntoView({
                  behavior:
                    "smooth",
                });
            }}
          >
            + Add Trip
          </button>

        </header>


        {/* STATS */}

        <section
          className="stats-grid"
          id="dashboard"
        >

          <div className="stat-card">

            <span>
              Total Trips
            </span>

            <strong>
              {trips.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Destinations
            </span>

            <strong>
              {destinations.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Featured Trips
            </span>

            <strong>
              {
                trips.filter(
                  (trip) =>
                    trip.featured
                ).length
              }
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Active Trips
            </span>

            <strong>
              {
                trips.filter(
                  (trip) =>
                    trip.status ===
                    "active"
                ).length
              }
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Total Bookings
            </span>

            <strong>
              {bookings.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Pending Bookings
            </span>

            <strong>
              {pendingBookings}
            </strong>

          </div>

        </section>


        {/* MESSAGES */}

        {message && (
          <div className="success-message">
            ✓ {message}
          </div>
        )}

        {errorMessage && (
          <div className="error-message">
            ✕ {errorMessage}
          </div>
        )}


        {/* ADD / EDIT TRIP */}

        <section
          className="admin-panel"
          id="add-trip"
        >

          <div className="panel-heading">

            <div>

              <span className="admin-eyebrow">
                {editingId
                  ? "EDIT TRIP"
                  : "CREATE NEW"}
              </span>

              <h2>
                {editingId
                  ? "Edit Trip"
                  : "Add New Trip"}
              </h2>

            </div>


            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  resetForm
                }
              >
                Cancel Edit
              </button>
            )}

          </div>


          <form
            onSubmit={handleSubmit}
          >

            {/* BASIC INFORMATION */}

            <div className="form-section">

              <h3>
                Basic Information
              </h3>


              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Trip Name
                  </label>

                  <input
                    required
                    value={
                      form.name
                    }
                    onChange={(e) =>
                      updateField(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Sharm El Sheikh Trip"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Destination
                  </label>

                  <input
                    required
                    value={
                      form.destination
                    }
                    onChange={(e) =>
                      updateField(
                        "destination",
                        e.target.value
                      )
                    }
                    placeholder="Sharm El Sheikh"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Hotel
                  </label>

                  <input
                    value={
                      form.hotel
                    }
                    onChange={(e) =>
                      updateField(
                        "hotel",
                        e.target.value
                      )
                    }
                    placeholder="Sunrise Resort"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Duration
                  </label>

                  <input
                    value={
                      form.duration
                    }
                    onChange={(e) =>
                      updateField(
                        "duration",
                        e.target.value
                      )
                    }
                    placeholder="4 Days / 3 Nights"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Price
                  </label>

                  <input
                    value={
                      form.price
                    }
                    onChange={(e) =>
                      updateField(
                        "price",
                        e.target.value
                      )
                    }
                    placeholder="5000 EGP"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Available Seats
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.seats
                    }
                    onChange={(e) =>
                      updateField(
                        "seats",
                        e.target.value
                      )
                    }
                    placeholder="20"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.start_date
                    }
                    onChange={(e) =>
                      updateField(
                        "start_date",
                        e.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.end_date
                    }
                    onChange={(e) =>
                      updateField(
                        "end_date",
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>


              <div className="form-group full-width">

                <label>
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Describe the trip..."
                  rows="5"
                />

              </div>

            </div>


            {/* SETTINGS */}

            <div className="form-section">

              <h3>
                Trip Settings
              </h3>


              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      form.status
                    }
                    onChange={(e) =>
                      updateField(
                        "status",
                        e.target.value
                      )
                    }
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="draft">
                      Draft
                    </option>

                    <option value="sold_out">
                      Sold Out
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                  </select>

                </div>


                <label className="checkbox-label">

                  <input
                    type="checkbox"
                    checked={
                      form.featured
                    }
                    onChange={(e) =>
                      updateField(
                        "featured",
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Featured Trip
                  </span>

                </label>

              </div>

            </div>


            {/* IMAGES */}

            <div className="form-section">

              <h3>
                Trip Images
              </h3>


              <div className="upload-box">

                <input
                  id="trip-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    uploadImages(
                      e.target.files
                    )
                  }
                />


                <label htmlFor="trip-images">

                  <span className="upload-icon">
                    +
                  </span>

                  <strong>
                    {
                      imageUploading
                        ? "Uploading..."
                        : "Upload Trip Images"
                    }
                  </strong>

                  <small>
                    Select one or multiple
                    images
                  </small>

                </label>

              </div>


              {form.gallery.length >
                0 && (

                <div className="image-gallery">

                  {form.gallery.map(
                    (
                      image,
                      index
                    ) => (

                      <div
                        className={`image-item ${
                          form.image ===
                          image
                            ? "main-image"
                            : ""
                        }`}
                        key={image}
                      >

                        <img
                          src={image}
                          alt={`Trip ${
                            index + 1
                          }`}
                        />


                        {form.image ===
                          image && (
                          <span className="main-badge">
                            MAIN
                          </span>
                        )}


                        <div className="image-actions">

                          <button
                            type="button"
                            onClick={() =>
                              setMainImage(
                                image
                              )
                            }
                          >
                            Main
                          </button>


                          <button
                            type="button"
                            className="danger-small"
                            onClick={() =>
                              removeGalleryImage(
                                image
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>


            {/* LISTS */}

            <ListEditor
              title="Meals"
              items={
                form.meals
              }
              onAdd={(value) =>
                addListItem(
                  "meals",
                  value
                )
              }
              onRemove={(index) =>
                removeListItem(
                  "meals",
                  index
                )
              }
            />


            <ListEditor
              title="Activities"
              items={
                form.activities
              }
              onAdd={(value) =>
                addListItem(
                  "activities",
                  value
                )
              }
              onRemove={(index) =>
                removeListItem(
                  "activities",
                  index
                )
              }
            />


            <ListEditor
              title="Transportation"
              items={
                form.transportation
              }
              onAdd={(value) =>
                addListItem(
                  "transportation",
                  value
                )
              }
              onRemove={(index) =>
                removeListItem(
                  "transportation",
                  index
                )
              }
            />


            <ListEditor
              title="What's Included"
              items={
                form.included
              }
              onAdd={(value) =>
                addListItem(
                  "included",
                  value
                )
              }
              onRemove={(index) =>
                removeListItem(
                  "included",
                  index
                )
              }
            />


            <ListEditor
              title="What's Not Included"
              items={
                form.not_included
              }
              onAdd={(value) =>
                addListItem(
                  "not_included",
                  value
                )
              }
              onRemove={(index) =>
                removeListItem(
                  "not_included",
                  index
                )
              }
            />


            {/* SUBMIT */}

            <div className="form-submit">

              <button
                type="submit"
                className="primary-button large"
                disabled={
                  loading ||
                  imageUploading
                }
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Trip"
                  : "Save Trip"}
              </button>


              {editingId && (
                <button
                  type="button"
                  className="secondary-button large"
                  onClick={
                    resetForm
                  }
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </section>


        {/* ALL TRIPS */}

        <section
          className="admin-panel"
          id="trips"
        >

          <div className="panel-heading">

            <div>

              <span className="admin-eyebrow">
                TRIP MANAGEMENT
              </span>

              <h2>
                All Trips
              </h2>

            </div>

          </div>


          {/* FILTERS */}

          <div className="filters">

            <input
              type="search"
              placeholder="Search trips..."
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />


            <select
              value={
                filterDestination
              }
              onChange={(e) =>
                setFilterDestination(
                  e.target.value
                )
              }
            >

              <option value="all">
                All Destinations
              </option>


              {destinations.map(
                (destination) => (

                  <option
                    key={
                      destination
                    }
                    value={
                      destination
                    }
                  >
                    {
                      destination
                    }
                  </option>

                )
              )}

            </select>

          </div>


          {/* TRIP CARDS */}

          <div className="trips-admin-grid">

            {filteredTrips.map(
              (trip) => (

                <div
                  className="admin-trip-card"
                  key={
                    trip.id
                  }
                >

                  <div className="admin-trip-image">

                    {trip.image ? (
                      <img
                        src={
                          trip.image
                        }
                        alt={
                          trip.name
                        }
                      />
                    ) : (
                      <div className="image-placeholder">
                        No Image
                      </div>
                    )}


                    {trip.featured && (
                      <span className="featured-badge">
                        FEATURED
                      </span>
                    )}


                    <span
                      className={`status-badge ${trip.status}`}
                    >
                      {
                        trip.status
                      }
                    </span>

                  </div>


                  <div className="admin-trip-body">

                    <span className="trip-destination">
                      {
                        trip.destination
                      }
                    </span>


                    <h3>
                      {
                        trip.name
                      }
                    </h3>


                    <p>
                      {
                        trip.description ||
                        "No description added."
                      }
                    </p>


                    <div className="trip-meta">

                      <span>
                        🏨{" "}
                        {
                          trip.hotel ||
                          "No hotel"
                        }
                      </span>

                      <span>
                        ⏱{" "}
                        {
                          trip.duration ||
                          "N/A"
                        }
                      </span>

                      <span>
                        💰{" "}
                        {
                          trip.price ||
                          "N/A"
                        }
                      </span>

                      <span>
                        👥{" "}
                        {
                          trip.seats ??
                          0
                        }{" "}
                        seats
                      </span>

                    </div>


                    <div className="card-actions">

                      <button
                        type="button"
                        className="edit-button"
                        onClick={() =>
                          editTrip(
                            trip
                          )
                        }
                      >
                        Edit
                      </button>


                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          deleteTrip(
                            trip
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>


          {filteredTrips.length ===
            0 && (

            <div className="empty-state">

              <h3>
                No trips found
              </h3>

              <p>
                Try changing your
                search or add a
                new trip.
              </p>

            </div>

          )}

        </section>


        {/* BOOKINGS */}

        <section
          className="admin-panel bookings-panel"
          id="bookings"
        >

          <div className="panel-heading">

            <div>

              <span className="admin-eyebrow">
                BOOKING MANAGEMENT
              </span>

              <h2>
                Customer Bookings
              </h2>

              <p className="panel-description">
                Manage customer booking
                requests and update
                their status.
              </p>

            </div>


            <button
              type="button"
              className="secondary-button"
              onClick={getBookings}
              disabled={
                bookingsLoading
              }
            >
              {bookingsLoading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>


          {/* BOOKING STATS */}

          <div className="booking-stats">

            <div className="booking-stat-card">

              <span>
                Total
              </span>

              <strong>
                {bookings.length}
              </strong>

            </div>


            <div className="booking-stat-card pending">

              <span>
                Pending
              </span>

              <strong>
                {pendingBookings}
              </strong>

            </div>


            <div className="booking-stat-card confirmed">

              <span>
                Confirmed
              </span>

              <strong>
                {confirmedBookings}
              </strong>

            </div>


            <div className="booking-stat-card cancelled">

              <span>
                Cancelled
              </span>

              <strong>
                {cancelledBookings}
              </strong>

            </div>

          </div>


          {/* BOOKING FILTERS */}

          <div className="booking-filters">

            <input
              type="search"
              placeholder="Search by customer, phone or trip..."
              value={
                bookingSearch
              }
              onChange={(e) =>
                setBookingSearch(
                  e.target.value
                )
              }
            />


            <select
              value={
                bookingStatusFilter
              }
              onChange={(e) =>
                setBookingStatusFilter(
                  e.target.value
                )
              }
            >

              <option value="all">
                All Statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="confirmed">
                Confirmed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

            </select>

          </div>


          {/* BOOKINGS */}

          {bookingsLoading ? (

            <div className="empty-state">

              <h3>
                Loading bookings...
              </h3>

              <p>
                Please wait while we
                load customer bookings.
              </p>

            </div>

          ) : filteredBookings.length ===
            0 ? (

            <div className="empty-state">

              <h3>
                No bookings found
              </h3>

              <p>
                There are no bookings
                matching your filters.
              </p>

            </div>

          ) : (

            <div className="bookings-list">

              {filteredBookings.map(
                (booking) => (

                  <div
                    className="booking-card"
                    key={
                      booking.id
                    }
                  >

                    {/* TRIP */}

                    <div className="booking-trip">

                      {booking.trips?.image ? (

                        <img
                          src={
                            booking.trips
                              .image
                          }
                          alt={
                            booking.trips
                              .name ||
                            "Trip"
                          }
                        />

                      ) : (

                        <div className="booking-image-placeholder">
                          No Image
                        </div>

                      )}


                      <div>

                        <span className="trip-destination">
                          {
                            booking
                              .trips
                              ?.destination ||
                            "Unknown destination"
                          }
                        </span>

                        <h3>
                          {
                            booking
                              .trips
                              ?.name ||
                            "Unknown trip"
                          }
                        </h3>

                      </div>

                    </div>


                    {/* CUSTOMER */}

                    <div className="booking-section">

                      <span className="booking-section-title">
                        CUSTOMER
                      </span>

                      <div className="booking-customer-info">

                        <strong>
                          {
                            booking.customer_name
                          }
                        </strong>

                        <span>
                          📞{" "}
                          {
                            booking.phone
                          }
                        </span>

                        {booking.email && (
                          <span>
                            ✉️{" "}
                            {
                              booking.email
                          }
                          </span>
                        )}

                      </div>

                    </div>


                    {/* BOOKING DETAILS */}

                    <div className="booking-section">

                      <span className="booking-section-title">
                        BOOKING DETAILS
                      </span>

                      <div className="booking-details-grid">

                        <div>

                          <small>
                            Seats
                          </small>

                          <strong>
                            {
                              booking.seats
                            }
                          </strong>

                        </div>


                        <div>

                          <small>
                            Travel Date
                          </small>

                          <strong>
                            {formatDate(
                              booking.travel_date
                            )}
                          </strong>

                        </div>


                        <div>

                          <small>
                            Booked At
                          </small>

                          <strong>
                            {formatDateTime(
                              booking.created_at
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>


                    {/* NOTES */}

                    {booking.notes && (

                      <div className="booking-section">

                        <span className="booking-section-title">
                          NOTES
                        </span>

                        <p className="booking-notes">
                          {
                            booking.notes
                          }
                        </p>

                      </div>

                    )}


                    {/* STATUS */}

                    <div className="booking-actions">

                      <div>

                        <span className="booking-section-title">
                          STATUS
                        </span>

                        <span
                          className={`booking-status-badge ${booking.status}`}
                        >
                          {
                            booking.status
                          }
                        </span>

                      </div>


                      <div className="booking-status-actions">

                        <button
                          type="button"
                          className="booking-status-button pending"
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "pending"
                            )
                          }
                        >
                          Pending
                        </button>


                        <button
                          type="button"
                          className="booking-status-button confirmed"
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "confirmed"
                            )
                          }
                        >
                          Confirm
                        </button>


                        <button
                          type="button"
                          className="booking-status-button cancelled"
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "cancelled"
                            )
                          }
                        >
                          Cancel
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}


function ListEditor({
  title,
  items,
  onAdd,
  onRemove,
}) {
  const [newItem, setNewItem] =
    useState("");

  function handleAdd() {
    const value =
      newItem.trim();

    if (!value) {
      return;
    }

    onAdd(value);
    setNewItem("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="form-section list-editor">

      <div className="list-editor-header">

        <h3>
          {title}
        </h3>

      </div>


      <div className="list-add-row">

        <input
          type="text"
          className="list-add-input"
          value={
            newItem
          }
          onChange={(event) =>
            setNewItem(
              event.target.value
            )
          }
          onKeyDown={
            handleKeyDown
          }
          placeholder={`Add ${title.toLowerCase()}...`}
        />


        <button
          type="button"
          className="add-item-button"
          onClick={
            handleAdd
          }
        >
          + Add
        </button>

      </div>


      {items.length ===
        0 ? (

        <p className="empty-list">
          No items added yet.
        </p>

      ) : (

        <div className="items-list">

          {items.map(
            (
              item,
              index
            ) => (

              <div
                className="list-item"
                key={`${item}-${index}`}
              >

                <span>
                  ✓ {item}
                </span>


                <button
                  type="button"
                  onClick={() =>
                    onRemove(
                      index
                    )
                  }
                >
                  ×
                </button>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}

export default Admin;