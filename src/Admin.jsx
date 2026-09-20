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
  section_id: "",
  hotel: "",
  description: "",
  duration: "",
  price: "",
  old_price: "",
  is_offer: false,
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

const emptySpecialOffersSettings = {
  id: null,
  image: "",
  title_en: "SPECIAL OFFERS",
  title_ru: "СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ",
  description_en:
    "Discover our best deals and enjoy unforgettable trips at special prices.",
  description_ru:
    "Откройте для себя лучшие предложения и наслаждайтесь незабываемыми путешествиями по специальным ценам.",
  active: true,
};

const emptySectionForm = {
  name_en: "",
  name_ru: "",
  slug: "",
  sort_order: 0,
  active: true,
  image: "",
};


function Admin() {
  const navigate = useNavigate();
  const [adminRole, setAdminRole] = useState(null);

  const [adminLoading, setAdminLoading] = useState(true);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] =
    useState(false);
  const [adminUsers, setAdminUsers] =
  useState([]);

const [adminUsersLoading, setAdminUsersLoading] =
  useState(false);

const [showUserForm, setShowUserForm] =
  useState(false);

const [userForm, setUserForm] = useState({
  display_name: "",
  email: "",
  password: "",
  role: "manager",
});
const [showUserPassword, setShowUserPassword] = useState(false);

const [userActionLoading, setUserActionLoading] =
  useState(false);

const [passwordForm, setPasswordForm] =
  useState({
    password: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [passwordLoading, setPasswordLoading] =
  useState(false);
  
  
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const isAdmin = adminRole === "admin";
  const isManager = adminRole === "manager";
  const isStaff = isAdmin || isManager;

  const [openSection, setOpenSection] = useState("dashboard");

  /* =========================
     SECTIONS
  ========================= */

  const [sections, setSections] = useState([]);
  const [sectionForm, setSectionForm] =
    useState(emptySectionForm);
  const [editingSectionId, setEditingSectionId] =
    useState(null);
  const [sectionSaving, setSectionSaving] =
    useState(false);

  /* =========================
     TRIP FORM
  ========================= */

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] =
    useState(false);

  /* =========================
     TRIP FILTERS
  ========================= */

  const [search, setSearch] = useState("");

  const [filterDestination, setFilterDestination] =
    useState("all");

  const [tripSectionFilter, setTripSectionFilter] =
    useState("all");

  const [tripOfferFilter, setTripOfferFilter] =
    useState("all");

  const [tripFeaturedFilter, setTripFeaturedFilter] =
    useState("all");

  const [tripStatusFilter, setTripStatusFilter] =
    useState("all");

  /* =========================
     BOOKING FILTERS
  ========================= */

  const [bookingSearch, setBookingSearch] =
    useState("");

  const [bookingStatusFilter, setBookingStatusFilter] =
    useState("all");

  const [bookingTripFilter, setBookingTripFilter] =
    useState("all");

  /* =========================
     SPECIAL OFFERS
  ========================= */

  const [
    specialOffersSettings,
    setSpecialOffersSettings,
  ] = useState(
    emptySpecialOffersSettings
  );

  const [
    specialOffersUploading,
    setSpecialOffersUploading,
  ] = useState(false);

  const [
    specialOffersSaving,
    setSpecialOffersSaving,
  ] = useState(false);

  const [
    pendingSpecialOffersOldImages,
    setPendingSpecialOffersOldImages,
  ] = useState([]);

  /* =========================
     AUTH
  ========================= */

  useEffect(() => {
  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setSession(null);
      setAdminRole(null);
      setAdminLoading(false);
      setAuthLoading(false);

      navigate("/admin/login", {
        replace: true,
      });

      return;
    }

    setSession(session);

    const { data, error } = await supabase
      .from("admin_users")
      .select("role, active")
      .eq("id", session.user.id)
      .single();

    if (
      error ||
      !data ||
      !data.active ||
      !["admin", "manager"].includes(data.role)
    ) {
      console.error(
        "Admin access error:",
        error
      );

      setAdminRole(null);
      setAdminLoading(false);
      setAuthLoading(false);

      await supabase.auth.signOut();

      navigate("/admin/login", {
        replace: true,
      });

      return;
    }

    setAdminRole(data.role);
    setAdminLoading(false);
    setAuthLoading(false);
  }

  checkAuth();
}, [navigate]);

  useEffect(() => {
  if (!authLoading && session) {
    getTrips();
    getBookings();
    getSections();
    getSpecialOffersSettings();
    getNotifications();
    getAdminUsers();
  }
}, [authLoading, session]);


useEffect(() => {
  if (!session || !isStaff) {
    return undefined;
  }

  const bookingsChannel = supabase
    .channel("avora-bookings-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "bookings",
      },
      async (payload) => {
        const booking = payload.new;

        setBookings((previous) => {
          if (
            previous.some(
              (item) =>
                item.id === booking.id
            )
          ) {
            return previous;
          }

          return [
            booking,
            ...previous,
          ];
        });

        const customerName =
          booking.customer_name ||
          "New customer";

        const tripName =
          booking.trip_name ||
          "New booking";

        const notification = {
          booking_id: booking.id,
          type: "new_booking",
          title: "New Booking",
          message: `${customerName} made a new booking${tripName ? ` for ${tripName}` : ""}.`,
          read: false,
        };

        const {
          data,
          error,
        } = await supabase
          .from("admin_notifications")
          .insert(notification)
          .select()
          .single();

        if (error) {
          console.error(
            "Notification creation error:",
            error
          );

          return;
        }

        setNotifications((previous) => [
          data,
          ...previous,
        ]);

        setMessage(
          `New booking received from ${customerName}.`
        );
      }
    )
    .subscribe((status) => {
      console.log(
        "Bookings realtime status:",
        status
      );
    });

  return () => {
    supabase.removeChannel(
      bookingsChannel
    );
  };
}, [session, isStaff]);

  /* =========================
     LOGOUT
  ========================= */

  async function handleLogout() {
    await supabase.auth.signOut();

    navigate("/admin/login", {
      replace: true,
    });
  }

  /* =========================
     GET SECTIONS
  ========================= */

  async function getSections() {
    const { data, error } = await supabase
      .from("trip_sections")
      .select("*")
      .order("sort_order", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error loading sections:",
        error
      );

      setErrorMessage(
        "Unable to load trip sections."
      );

      return;
    }

    setSections(data || []);
  }

  /* =========================
     GET TRIPS
  ========================= */

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

  async function getAdminUsers() {
  setAdminUsersLoading(true);
  setErrorMessage("");

  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Error loading admin users:",
      error
    );

    setErrorMessage(
      "Unable to load admin users."
    );

    setAdminUsersLoading(false);

    return;
  }

  setAdminUsers(data || []);
  setAdminUsersLoading(false);
}

async function changePassword() {
  setErrorMessage("");
  setMessage("");

  if (!passwordForm.password) {
    setErrorMessage("Please enter a new password.");
    return;
  }

  if (passwordForm.password.length < 8) {
    setErrorMessage(
      "Password must be at least 8 characters."
    );
    return;
  }

  if (
    passwordForm.password !==
    passwordForm.confirmPassword
  ) {
    setErrorMessage(
      "Passwords do not match."
    );
    return;
  }

  setPasswordLoading(true);

  const { error } =
    await supabase.auth.updateUser({
      password: passwordForm.password,
    });

  if (error) {
    console.error(
      "Password update error:",
      error
    );

    setErrorMessage(
      error.message ||
        "Unable to change password."
    );

    setPasswordLoading(false);
    return;
  }

  setPasswordForm({
    password: "",
    confirmPassword: "",
  });

  setPasswordLoading(false);

  setMessage(
    "Password changed successfully."
  );
}

async function createAdminUser() {
  setErrorMessage("");
  setMessage("");

  const displayName =
    userForm.display_name.trim();

  const email =
    userForm.email.trim().toLowerCase();

  const password =
    userForm.password;

  if (!displayName) {
    setErrorMessage(
      "Please enter a display name."
    );
    return;
  }

  if (!email) {
    setErrorMessage(
      "Please enter an email address."
    );
    return;
  }

  if (password.length < 8) {
    setErrorMessage(
      "Password must be at least 8 characters."
    );
    return;
  }

  if (
    !["admin", "manager"].includes(
      userForm.role
    )
  ) {
    setErrorMessage(
      "Invalid account role."
    );
    return;
  }

  setUserActionLoading(true);

  const {
    data,
    error,
  } = await supabase.functions.invoke(
    "admin-user",
    {
      body: {
        action: "create",
        email,
        password,
        display_name: displayName,
        role: userForm.role,
      },
    }
  );

  if (error) {
    console.error(
      "Create admin user error:",
      error
    );

    setErrorMessage(
      error.message ||
        "Unable to create account."
    );

    setUserActionLoading(false);
    return;
  }

  if (data?.error) {
    setErrorMessage(data.error);
    setUserActionLoading(false);
    return;
  }

  setUserForm({
    display_name: "",
    email: "",
    password: "",
    role: "manager",
  });

  setShowUserForm(false);
  setUserActionLoading(false);

  await getAdminUsers();

  setMessage(
    "Account created successfully."
  );
}

async function updateAdminUserRole(
  userId,
  newRole
) {
  setErrorMessage("");
  setMessage("");

  if (
    !["admin", "manager"].includes(
      newRole
    )
  ) {
    setErrorMessage(
      "Invalid account role."
    );
    return;
  }

  if (userId === session?.user?.id) {
    setErrorMessage(
      "You cannot change your own role."
    );
    return;
  }

  setUserActionLoading(true);

  const { error } = await supabase
    .from("admin_users")
    .update({
      role: newRole,
    })
    .eq("id", userId);

  if (error) {
    console.error(
      "Update admin user role error:",
      error
    );

    setErrorMessage(
      error.message ||
        "Unable to update account role."
    );

    setUserActionLoading(false);
    return;
  }

  await getAdminUsers();

  setUserActionLoading(false);

  setMessage(
    "Account role updated successfully."
  );
}

async function toggleAdminUserActive(
  userId,
  currentActive
) {
  setErrorMessage("");
  setMessage("");

  if (userId === session?.user?.id) {
    setErrorMessage(
      "You cannot deactivate your own account."
    );
    return;
  }

  setUserActionLoading(true);

  const { error } = await supabase
    .from("admin_users")
    .update({
      active: !currentActive,
    })
    .eq("id", userId);

  if (error) {
    console.error(
      "Toggle admin user error:",
      error
    );

    setErrorMessage(
      error.message ||
        "Unable to update account status."
    );

    setUserActionLoading(false);
    return;
  }

  await getAdminUsers();

  setUserActionLoading(false);

  setMessage(
    `Account ${
      currentActive
        ? "deactivated"
        : "activated"
    } successfully.`
  );
}

async function deleteAdminUser(userId) {
  setErrorMessage("");
  setMessage("");

  if (userId === session?.user?.id) {
    setErrorMessage(
      "You cannot delete your own account."
    );
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to permanently delete this account?"
  );

  if (!confirmed) {
    return;
  }

  setUserActionLoading(true);

  const {
    data,
    error,
  } = await supabase.functions.invoke(
    "admin-user",
    {
      body: {
        action: "delete",
        user_id: userId,
      },
    }
  );

  if (error) {
    console.error(
      "Delete admin user error:",
      error
    );

    setErrorMessage(
      error.message ||
        "Unable to delete account."
    );

    setUserActionLoading(false);
    return;
  }

  if (data?.error) {
    setErrorMessage(data.error);
    setUserActionLoading(false);
    return;
  }

  await getAdminUsers();

  setUserActionLoading(false);

  setMessage(
    "Account deleted successfully."
  );
}



  /* =========================
     GET BOOKINGS
  ========================= */

  async function getBookings() {
    setBookingsLoading(true);

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        trips (
          id,
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

  async function getNotifications() {
  setNotificationsLoading(true);

  const { data, error } = await supabase
    .from("admin_notifications")
    .select("*")
    .order("created_at", {
      ascending: false,
    })
    .limit(30);

  if (error) {
    console.error(
      "Error loading notifications:",
      error
    );

    setNotificationsLoading(false);
    return;
  }

  setNotifications(data || []);
  setNotificationsLoading(false);
}

  /* =========================
     GET SPECIAL OFFERS SETTINGS
  ========================= */

  async function getSpecialOffersSettings() {
    const { data, error } = await supabase
      .from("special_offers_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Error loading special offers settings:",
        error
      );

      return;
    }

    if (data) {
      setSpecialOffersSettings({
        id: data.id,
        image: data.image || "",
        title_en:
          data.title_en ||
          "SPECIAL OFFERS",
        title_ru:
          data.title_ru ||
          "СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ",
        description_en:
          data.description_en || "",
        description_ru:
          data.description_ru || "",
        active:
          data.active ?? true,
      });

      setPendingSpecialOffersOldImages([]);
    }
  }

  /* =========================
     SECTION HELPERS
  ========================= */

  function updateSectionField(
    field,
    value
  ) {
    setSectionForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetSectionForm() {
    setSectionForm({
      name_en: "",
      name_ru: "",
      slug: "",
      sort_order: sections.length + 1,
      active: true,
      image: "",
    });

    setEditingSectionId(null);
  }

  function startEditSection(section) {
    setEditingSectionId(section.id);

    setSectionForm({
      name_en: section.name_en || "",
      name_ru: section.name_ru || "",
      slug: section.slug || "",
      sort_order: section.sort_order ?? 0,
      active: section.active ?? true,
      image: section.image || "",
    });

    setMessage("");
    setErrorMessage("");
  }

  function createSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* =========================
     SAVE SECTION
  ========================= */

  async function saveSection(event) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");
    setSectionSaving(true);

    const nameEn =
      sectionForm.name_en.trim();

    const nameRu =
      sectionForm.name_ru.trim();

    const slug =
      sectionForm.slug.trim() ||
      createSlug(nameEn);

    if (!nameEn) {
      setErrorMessage(
        "English section name is required."
      );

      setSectionSaving(false);
      return;
    }

    if (!nameRu) {
      setErrorMessage(
        "Russian section name is required."
      );

      setSectionSaving(false);
      return;
    }

    if (!slug) {
      setErrorMessage(
        "Section slug is required."
      );

      setSectionSaving(false);
      return;
    }

    const sectionData = {
      name_en: nameEn,
      name_ru: nameRu,
      slug,
      sort_order:
        Number(sectionForm.sort_order) || 0,
      active: sectionForm.active,
      image: sectionForm.image || null,
    };

    let result;

    if (editingSectionId) {
      result = await supabase
        .from("trip_sections")
        .update(sectionData)
        .eq(
          "id",
          editingSectionId
        );
    } else {
      result = await supabase
        .from("trip_sections")
        .insert([
          sectionData,
        ]);
    }

    if (result.error) {
      console.error(
        "Save section error:",
        result.error
      );

      if (
        result.error.code ===
        "23505"
      ) {
        setErrorMessage(
          "This section slug already exists. Please use a different slug."
        );
      } else {
        setErrorMessage(
          "Unable to save this section."
        );
      }

      setSectionSaving(false);
      return;
    }

    setMessage(
      editingSectionId
        ? "Section updated successfully!"
        : "Section created successfully!"
    );

    resetSectionForm();

    await getSections();

    setSectionSaving(false);
  }

  /* =========================
     UPLOAD SECTION IMAGE
  ========================= */

  async function uploadSectionImage(file) {
    if (!file) {
      return;
    }

    setErrorMessage("");
    setMessage("");

    const fileExtension =
      file.name.split(".").pop();

    const fileName =
      `section-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

    const filePath =
      `sections/${fileName}`;

    const { error } =
      await supabase.storage
        .from("trip-images")
        .upload(
          filePath,
          file
        );

    if (error) {
      console.error(
        "Section image upload error:",
        error
      );

      setErrorMessage(
        "There was an error uploading the section image."
      );

      return;
    }

    const { data } =
      supabase.storage
        .from("trip-images")
        .getPublicUrl(
          filePath
        );

    setSectionForm((previous) => ({
      ...previous,
      image: data.publicUrl,
    }));

    setMessage(
      "Section image uploaded. Save the section to apply it."
    );
  }

  /* =========================
     DELETE SECTION
  ========================= */

  async function deleteSection(section) {
    const usedTrips =
      trips.filter(
        (trip) =>
          String(
            trip.section_id
          ) ===
          String(section.id)
      );

    if (usedTrips.length > 0) {
      setErrorMessage(
        `"${section.name_en}" cannot be deleted because ${usedTrips.length} trip(s) are using this section. Move those trips to another section first.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${section.name_en}"?`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("trip_sections")
      .delete()
      .eq(
        "id",
        section.id
      );

    if (error) {
      console.error(
        "Delete section error:",
        error
      );

      setErrorMessage(
        "Unable to delete this section."
      );

      return;
    }

    setMessage(
      "Section deleted successfully!"
    );

    if (
      editingSectionId ===
      section.id
    ) {
      resetSectionForm();
    }

    await getSections();
  }

  /* =========================
     UPDATE BOOKING STATUS
  ========================= */

async function updateBookingStatus(
  bookingId,
  newStatus
) {
  const currentBooking = bookings.find(
    (booking) =>
      booking.id === bookingId
  );

  if (!currentBooking) {
    setErrorMessage(
      "Booking not found."
    );

    return;
  }

  if (
    currentBooking.status ===
    newStatus
  ) {
    return;
  }

  setErrorMessage("");
  setMessage("");

  /*
   * 1. Update booking status
   */
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
      error.message ||
        "Unable to update booking status."
    );

    return;
  }

  /*
   * 2. Update booking in the dashboard
   */
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

  /*
   * 3. Pending does not send an email
   */
  if (
    newStatus !== "confirmed" &&
    newStatus !== "cancelled"
  ) {
    setMessage(
      "Booking status updated successfully!"
    );

    return;
  }

  /*
   * 4. Confirm / Cancel
   * Send customer email through Edge Function
   */

  if (!currentBooking.email) {
  setErrorMessage(
    "Booking updated, but this customer has no email address."
  );

  return;
}

setErrorMessage("");

setMessage(
  newStatus === "confirmed"
    ? "Booking confirmed. Sending confirmation email..."
    : "Booking cancelled. Sending notification email..."
);

const {
  data,
  error: emailError,
} = await supabase.functions.invoke(
  "booking-email",
  {
    body: {
      bookingId,
      status: newStatus,
    },
  }
);

if (emailError) {
  console.error(
    "Booking email error:",
    emailError
  );

  setMessage("");

  setErrorMessage(
    "Booking status updated, but the customer email could not be sent."
  );

  return;
}

if (data?.error) {
  console.error(
    "Booking email service error:",
    data.error
  );

  setMessage("");

  setErrorMessage(
    `Booking updated, but email failed: ${data.error}`
  );

  return;
}

setErrorMessage("");

setMessage(
  newStatus === "confirmed"
    ? "Booking confirmed and confirmation email sent successfully!"
    : "Booking cancelled and customer email sent successfully!"
);
}
  /* =========================
     DELETE BOOKING 
  ========================= */

  async function deleteBooking(booking) {
  setErrorMessage("");
  setMessage("");

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", booking.id);

  if (error) {
    console.error(
      "Error deleting booking:",
      error
    );

    setErrorMessage(
      error.message ||
        "Unable to delete this booking."
    );

    return;
  }

  setBookings((previous) =>
    previous.filter(
      (item) => item.id !== booking.id
    )
  );

  setMessage(
    "Booking deleted successfully."
  );
}

  /* =========================
     FORM HELPERS
  ========================= */

  function updateField(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function addListItem(
    field,
    value
  ) {
    const trimmedValue =
      value?.trim();

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

  function removeListItem(
    field,
    index
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: previous[field].filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),
    }));
  }

  /* =========================
     UPLOAD TRIP IMAGES
  ========================= */

  async function uploadImages(
    files
  ) {
    if (
      !files ||
      files.length === 0
    ) {
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

      const filePath =
        `trips/${fileName}`;

      const { error } =
        await supabase.storage
          .from("trip-images")
          .upload(
            filePath,
            file
          );

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

      const { data } =
        supabase.storage
          .from("trip-images")
          .getPublicUrl(
            filePath
          );

      uploadedUrls.push(
        data.publicUrl
      );
    }

    if (
      uploadedUrls.length > 0
    ) {
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

  /* =========================
     UPLOAD SPECIAL OFFERS IMAGE
  ========================= */

  async function uploadSpecialOffersImage(
    file
  ) {
    if (!file) {
      return;
    }

    setSpecialOffersUploading(true);
    setErrorMessage("");
    setMessage("");

    const oldImage =
      specialOffersSettings.image;

    const fileExtension =
      file.name.split(".").pop();

    const fileName =
      `special-offer-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

    const filePath =
      `special-offers/${fileName}`;

    const { error } =
      await supabase.storage
        .from("trip-images")
        .upload(
          filePath,
          file
        );

    if (error) {
      console.error(
        "Special offers image upload error:",
        error
      );

      setErrorMessage(
        "There was an error uploading the Special Offers image."
      );

      setSpecialOffersUploading(
        false
      );

      return;
    }

    const { data } =
      supabase.storage
        .from("trip-images")
        .getPublicUrl(
          filePath
        );

    if (
      oldImage &&
      oldImage !== data.publicUrl
    ) {
      setPendingSpecialOffersOldImages(
        (previous) =>
          previous.includes(
            oldImage
          )
            ? previous
            : [
                ...previous,
                oldImage,
              ]
      );
    }

    setSpecialOffersSettings(
      (previous) => ({
        ...previous,
        image:
          data.publicUrl,
      })
    );

    setMessage(
      "Special Offers image uploaded. Click Save Settings to apply it."
    );

    setSpecialOffersUploading(
      false
    );
  }

  /* =========================
     REMOVE SPECIAL OFFERS IMAGE
  ========================= */

  function removeSpecialOffersImage() {
    if (
      !specialOffersSettings.image
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove the Special Offers image?"
      );

    if (!confirmed) {
      return;
    }

    const oldImage =
      specialOffersSettings.image;

    setPendingSpecialOffersOldImages(
      (previous) =>
        previous.includes(oldImage)
          ? previous
          : [
              ...previous,
              oldImage,
            ]
    );

    setSpecialOffersSettings(
      (previous) => ({
        ...previous,
        image: "",
      })
    );

    setMessage(
      "Image removed. Click Save Settings to apply the change."
    );
  }

  /* =========================
     SAVE SPECIAL OFFERS SETTINGS
  ========================= */

  async function saveSpecialOffersSettings() {
    setSpecialOffersSaving(true);
    setErrorMessage("");
    setMessage("");

    const settingsData = {
      image:
        specialOffersSettings.image ||
        null,

      title_en:
        specialOffersSettings.title_en.trim() ||
        "SPECIAL OFFERS",

      title_ru:
        specialOffersSettings.title_ru.trim() ||
        "СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ",

      description_en:
        specialOffersSettings.description_en?.trim() ||
        null,

      description_ru:
        specialOffersSettings.description_ru?.trim() ||
        null,

      active:
        specialOffersSettings.active,
    };

    let result;

    if (
      specialOffersSettings.id
    ) {
      result = await supabase
        .from(
          "special_offers_settings"
        )
        .update(
          settingsData
        )
        .eq(
          "id",
          specialOffersSettings.id
        )
        .select()
        .single();
    } else {
      result = await supabase
        .from(
          "special_offers_settings"
        )
        .insert([
          settingsData,
        ])
        .select()
        .single();
    }

    if (result.error) {
      console.error(
        "Save special offers settings error:",
        result.error
      );

      setErrorMessage(
        "Unable to save Special Offers settings."
      );

      setSpecialOffersSaving(
        false
      );

      return;
    }

    for (const oldImage of
      pendingSpecialOffersOldImages) {
      if (
        oldImage &&
        oldImage !==
          result.data.image
      ) {
        await deleteStorageImage(
          oldImage
        );
      }
    }

    setPendingSpecialOffersOldImages(
      []
    );

    setSpecialOffersSettings({
      id: result.data.id,
      image:
        result.data.image || "",
      title_en:
        result.data.title_en ||
        "SPECIAL OFFERS",
      title_ru:
        result.data.title_ru ||
        "СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ",
      description_en:
        result.data.description_en ||
        "",
      description_ru:
        result.data.description_ru ||
        "",
      active:
        result.data.active ?? true,
    });

    setMessage(
      "Special Offers settings saved successfully!"
    );

    setSpecialOffersSaving(
      false
    );
  }

  /* =========================
     STORAGE DELETE
  ========================= */

  async function deleteStorageImage(
    imageUrl
  ) {
    if (!imageUrl) {
      return;
    }

    try {
      const url =
        new URL(imageUrl);

      const marker =
        "/storage/v1/object/public/trip-images/";

      const index =
        url.pathname.indexOf(
          marker
        );

      if (index === -1) {
        return;
      }

      const filePath =
        decodeURIComponent(
          url.pathname.substring(
            index +
              marker.length
          )
        );

      await supabase.storage
        .from("trip-images")
        .remove([
          filePath,
        ]);
    } catch (error) {
      console.error(
        "Storage delete error:",
        error
      );
    }
  }

  /* =========================
     REMOVE GALLERY IMAGE
  ========================= */

  async function removeGalleryImage(
    url
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this image?"
      );

    if (!confirmed) {
      return;
    }

    await deleteStorageImage(url);

    setForm((previous) => {
      const newGallery =
        previous.gallery.filter(
          (image) =>
            image !== url
        );

      let newMainImage =
        previous.image;

      if (
        previous.image ===
        url
      ) {
        newMainImage =
          newGallery[0] ||
          "";
      }

      return {
        ...previous,
        gallery:
          newGallery,
        image:
          newMainImage,
      };
    });
  }

  function setMainImage(
    url
  ) {
    setForm((previous) => ({
      ...previous,
      image: url,
    }));
  }

  /* =========================
     SAVE TRIP
  ========================= */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");
    setLoading(true);

    const tripData = {
      name: form.name,
      destination:
        form.destination,

      section_id:
        form.section_id
          ? Number(
              form.section_id
            )
          : null,

      hotel: form.hotel,
      description:
        form.description,
      duration:
        form.duration,
      price: form.price,

      old_price:
        form.is_offer
          ? Number(
              form.old_price
            ) || null
          : null,

      is_offer:
        form.is_offer,

      seats:
        Number(form.seats) ||
        0,

      image:
        form.image,

      gallery:
        form.gallery,

      meals:
        form.meals,

      activities:
        form.activities,

      transportation:
        form.transportation,

      included:
        form.included,

      not_included:
        form.not_included,

      start_date:
        form.start_date ||
        null,

      end_date:
        form.end_date ||
        null,

      featured:
        form.featured,

      status:
        form.status,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("trips")
        .update(tripData)
        .eq(
          "id",
          editingId
        );
    } else {
      result = await supabase
        .from("trips")
        .insert([
          tripData,
        ]);
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

  /* =========================
     EDIT TRIP
  ========================= */

  function editTrip(trip) {
    setEditingId(
      trip.id
    );

    setForm({
      name:
        trip.name || "",

      destination:
        trip.destination || "",

      section_id:
        trip.section_id
          ? String(
              trip.section_id
            )
          : "",

      hotel:
        trip.hotel || "",

      description:
        trip.description || "",

      duration:
        trip.duration || "",

      price:
        trip.price || "",

      old_price:
        trip.old_price ??
        "",

      is_offer:
        trip.is_offer ||
        false,

      seats:
        trip.seats ?? "",

      meals:
        trip.meals || [],

      activities:
        trip.activities ||
        [],

      transportation:
        trip.transportation ||
        [],

      included:
        trip.included ||
        [],

      not_included:
        trip.not_included ||
        [],

      start_date:
        trip.start_date ||
        "",

      end_date:
        trip.end_date ||
        "",

      featured:
        trip.featured ||
        false,

      status:
        trip.status ||
        "active",

      image:
        trip.image || "",

      gallery:
        trip.gallery || [],
    });

    setMessage("");
    setErrorMessage("");

    document
      .getElementById(
        "add-trip"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",
      });
  }

  /* =========================
     REMOVE SPECIAL OFFER
  ========================= */

  async function removeSpecialOffer(
    trip
  ) {
    const confirmed =
      window.confirm(
        `Remove the Special Offer from "${trip.name}"?`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    const { error } =
      await supabase
        .from("trips")
        .update({
          is_offer: false,
        })
        .eq(
          "id",
          trip.id
        );

    if (error) {
      console.error(
        "Remove special offer error:",
        error
      );

      setErrorMessage(
        "Unable to remove the Special Offer."
      );

      return;
    }

    setTrips((previous) =>
      previous.map(
        (item) =>
          item.id ===
          trip.id
            ? {
                ...item,
                is_offer:
                  false,
              }
            : item
      )
    );

    setMessage(
      `"${trip.name}" is no longer a Special Offer.`
    );
  }

  /* =========================
     DELETE TRIP
  ========================= */

  async function deleteTrip(
    trip
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${trip.name}"?`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    const { error } =
      await supabase
        .from("trips")
        .delete()
        .eq(
          "id",
          trip.id
        );

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

    if (
      trip.gallery?.length
    ) {
      for (const image of
        trip.gallery) {
        await deleteStorageImage(
          image
        );
      }
    }

    if (
      trip.image &&
      !trip.gallery?.includes(
        trip.image
      )
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

  /* =========================
     RESET TRIP FORM
  ========================= */

  function resetForm() {
    setForm({
      ...emptyForm,
    });

    setEditingId(null);
  }

  /* =========================
     DESTINATIONS
  ========================= */

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

  /* =========================
     SPECIAL OFFER TRIPS
  ========================= */

  const specialOfferTrips =
    trips.filter(
      (trip) =>
        trip.is_offer === true
    );

  /* =========================
     FILTERED TRIPS
  ========================= */

  const filteredTrips =
    trips.filter((trip) => {
      const searchValue =
        search
          .toLowerCase()
          .trim();

      const matchesSearch =
        !searchValue ||
        trip.name
          ?.toLowerCase()
          .includes(
            searchValue
          ) ||
        trip.destination
          ?.toLowerCase()
          .includes(
            searchValue
          );

      const matchesDestination =
        filterDestination ===
          "all" ||
        trip.destination ===
          filterDestination;

      const matchesSection =
        tripSectionFilter ===
          "all" ||
        String(
          trip.section_id
        ) ===
          String(
            tripSectionFilter
          );

      const matchesOfferFilter =
        tripOfferFilter ===
          "all" ||
        (tripOfferFilter ===
          "offers" &&
          trip.is_offer ===
            true) ||
        (tripOfferFilter ===
          "regular" &&
          trip.is_offer !==
            true);

      const matchesFeaturedFilter =
        tripFeaturedFilter ===
          "all" ||
        (tripFeaturedFilter ===
          "featured" &&
          trip.featured ===
            true) ||
        (tripFeaturedFilter ===
          "not_featured" &&
          trip.featured !==
            true);

      const matchesStatusFilter =
        tripStatusFilter ===
          "all" ||
        trip.status ===
          tripStatusFilter;

      return (
        matchesSearch &&
        matchesDestination &&
        matchesSection &&
        matchesOfferFilter &&
        matchesFeaturedFilter &&
        matchesStatusFilter
      );
    });

  /* =========================
     FILTERED BOOKINGS
  ========================= */

  const filteredBookings =
    bookings.filter(
      (booking) => {
        const searchValue =
          bookingSearch
            .toLowerCase()
            .trim();

        const tripName =
          booking.trips?.name ||
          "";

        const destination =
          booking.trips
            ?.destination ||
          "";

        const customerName =
          booking.customer_name ||
          "";

        const phone =
          booking.phone ||
          "";

        const matchesSearch =
          !searchValue ||
          customerName
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          phone
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          tripName
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          destination
            .toLowerCase()
            .includes(
              searchValue
            );

        const matchesStatus =
          bookingStatusFilter ===
            "all" ||
          booking.status ===
            bookingStatusFilter;

        const matchesTrip =
          bookingTripFilter ===
            "all" ||
          String(
            booking.trip_id
          ) ===
            String(
              bookingTripFilter
            ) ||
          String(
            booking.trips?.id
          ) ===
            String(
              bookingTripFilter
            );

        return (
          matchesSearch &&
          matchesStatus &&
          matchesTrip
        );
      }
    );

  /* =========================
     BOOKING STATS
  ========================= */

  const pendingBookings =
    bookings.filter(
      (booking) =>
        booking.status ===
        "pending"
    ).length;

  const confirmedBookings =
    bookings.filter(
      (booking) =>
        booking.status ===
        "confirmed"
    ).length;

  const cancelledBookings =
    bookings.filter(
      (booking) =>
        booking.status ===
        "cancelled"
    ).length;

  const specialOffersCount =
    trips.filter(
      (trip) =>
        trip.is_offer === true
    ).length;

  /* =========================
     DATE HELPERS
  ========================= */

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

  function formatDateTime(
    date
  ) {
    if (!date) {
      return "N/A";
    }

    return new Date(
      date
    ).toLocaleString(
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

  /* =========================
     AUTH LOADING
  ========================= */

  
if (authLoading || adminLoading) {
  return (
    <div className="admin-page">
      <div className="admin-content">
        <p>
          Checking access...
        </p>
      </div>
    </div>
  );
}

if (!session || !isStaff) {
  return (
    <Navigate
      to="/admin/login"
      replace
    />
  );
}

  return (
    <div className="admin-page">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="admin-sidebar">

        <div className="admin-logo">

          <div className="admin-logo-main">
            AVORA
          </div>

          <div className="admin-logo-sub">
            TRAVEL
          </div>

        </div>

        <nav className="admin-menu">
          
  <button
    type="button"
    className={`admin-menu-item ${
      openSection === "dashboard" ? "active" : ""
    }`}
    onClick={() => setOpenSection("dashboard")}
  >
    Dashboard
  </button>

  <button
    type="button"
    className={`admin-menu-item ${
      openSection === "account-management" ? "active" : ""
    }`}
    onClick={() =>
      setOpenSection("account-management")
    }
  >
    Account Management
  </button>

  <button
    type="button"
    className={`admin-menu-item ${
      openSection === "sections" ? "active" : ""
    }`}
    onClick={() => setOpenSection("sections")}
  >
    Trip Sections
  </button>

  <button
    type="button"
    className={`admin-menu-item ${
      openSection === "special-offers" ? "active" : ""
    }`}
    onClick={() =>
      setOpenSection("special-offers")
    }
  >
    Special Offers
  </button>

  <button
    type="button"
    className={`admin-menu-item ${
      openSection === "trips" ? "active" : ""
    }`}
    onClick={() => setOpenSection("trips")}
  >
    Trips
  </button>

  <button
    type="button"
    className={`admin-menu-item ${
      openSection === "add-trip" ? "active" : ""
    }`}
    onClick={() => setOpenSection("add-trip")}
  >
    Add Trip
  </button>

  <button
    type="button"
    className={`admin-menu-item ${
      openSection === "bookings" ? "active" : ""
    }`}
    onClick={() => setOpenSection("bookings")}
  >
    <span>Bookings</span>

    {pendingBookings > 0 && (
      <span className="menu-badge">
        {pendingBookings}
      </span>
    )}
  </button>
</nav>

        <div className="sidebar-footer">

           <span>
             AVORA Travel
          </span>

        <small>
           Management System
       </small>

       <div
         style={{
          marginTop: "12px",
      marginBottom: "12px",
      padding: "8px 12px",
      borderRadius: "8px",
      background:
        "rgba(255, 255, 255, 0.08)",
      fontSize: "12px",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "1px",
      textAlign: "center",
    }}
  >
    {isAdmin ? "Admin" : "Manager"}
  </div>

             <button
              type="button"
             className="logout-button"
              onClick={() => navigate("/")}
              >
            ← Back to Website
             </button>

             <button
                      type="button"
                  className="logout-button"
                   onClick={handleLogout}
                  >
                  Logout
             </button>

          </div>

      </aside>

      {/* =========================
          CONTENT
      ========================= */}

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
              destinations, sections
              and travel experiences.
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

        {/* =========================
            STATS
        ========================= */}



   {openSection === "dashboard" && (
  <section
    id="dashboard"
    className="admin-section"
  >

    <section>
      <div className="dashboard-topbar">

  <div>
    <h2>Dashboard</h2>
    <p>Overview of your travel business</p>
  </div>

  <div className="admin-notification-area">

    <button
      type="button"
      className="notification-button"
      onClick={() =>
        setNotifications((previous) =>
          previous.map((item) => ({
            ...item,
            read: true,
          }))
        )
      }
    >
      🔔

      {notifications.filter(
        (item) => !item.read
      ).length > 0 && (
        <span className="notification-count">
          {
            notifications.filter(
              (item) => !item.read
            ).length
          }
        </span>
      )}
    </button>

    <div className="notification-dropdown">

      <div className="notification-header">
        <strong>
          Notifications
        </strong>

        <span>
          {
            notifications.filter(
              (item) => !item.read
            ).length
          }{" "}
          new
        </span>
      </div>

      {notificationsLoading ? (
        <p className="notification-empty">
          Loading...
        </p>
      ) : notifications.length === 0 ? (
        <p className="notification-empty">
          No notifications
        </p>
      ) : (
        notifications.map(
          (notification) => (
            <div
              key={notification.id}
              className={
                notification.read
                  ? "notification-item"
                  : "notification-item unread"
              }
            >
              <strong>
                {notification.title}
              </strong>

              <p>
                {notification.message}
              </p>

              <small>
                {formatDateTime(
                  notification.created_at
                )}
              </small>
            </div>
          )
        )
      )}

    </div>

  </div>

</div>
</section>
</section>
   )}

{openSection === "account-management" && (
  <section
    id="account-management"
    className="admin-section account-management-section"
  >
    {/* =====================================================
        ACCOUNT MANAGEMENT HEADER
        ===================================================== */}

    <div className="account-page-header">
      <div className="account-page-title">
        <span className="account-page-eyebrow">
          AVORA ADMIN
        </span>

        <h2>Account Management</h2>

        <p>
          Manage administrator and manager access to your AVORA dashboard.
        </p>
      </div>

      {isAdmin && (
        <button
          type="button"
          className="account-add-button"
          onClick={() =>
            setShowUserForm(!showUserForm)
          }
        >
          <span className="account-add-icon">
            +
          </span>

          <span>
            {showUserForm
              ? "Close Form"
              : "Add Account"}
          </span>
        </button>
      )}
    </div>

    {/* =====================================================
        ADD ACCOUNT
        ===================================================== */}

    {isAdmin && showUserForm && (
      <div className="account-create-card">
        <div className="account-card-header">
          <div>
            <span className="account-card-eyebrow">
              NEW ACCOUNT
            </span>

            <h3>Create Account</h3>

            <p>
              Add a new administrator or manager to AVORA.
            </p>
          </div>
        </div>

        <div className="account-form-grid">
          <div className="account-form-group">
            <label htmlFor="user-display-name">
              Display Name
            </label>

            <input
              id="user-display-name"
              type="text"
              value={userForm.display_name}
              onChange={(event) =>
                setUserForm((previous) => ({
                  ...previous,
                  display_name:
                    event.target.value,
                }))
              }
              placeholder="e.g. Michael Samy"
              disabled={userActionLoading}
            />
          </div>

          <div className="account-form-group">
            <label htmlFor="user-email">
              Email Address
            </label>

            <input
              id="user-email"
              type="email"
              value={userForm.email}
              onChange={(event) =>
                setUserForm((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
              placeholder="name@example.com"
              disabled={userActionLoading}
            />
          </div>

          <div className="account-form-group">
            <label htmlFor="user-password">
              Temporary Password
            </label>

            <div className="password-input-wrapper">
              <input
                id="user-password"
                type={
                  showUserPassword
                    ? "text"
                    : "password"
                }
                value={userForm.password}
                onChange={(event) =>
                  setUserForm((previous) => ({
                    ...previous,
                    password:
                      event.target.value,
                  }))
                }
                placeholder="Minimum 8 characters"
                disabled={userActionLoading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowUserPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showUserPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {showUserPassword ? (
                    <>
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </>
                  ) : (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.5 5.3A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.1 3.8" />
                      <path d="M6.1 6.1C3.4 8.1 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 2.5-.3" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            <small>
              The account holder can change this password later.
            </small>
          </div>

          <div className="account-form-group">
            <label htmlFor="user-role">
              Account Role
            </label>

            <select
              id="user-role"
              value={userForm.role}
              onChange={(event) =>
                setUserForm((previous) => ({
                  ...previous,
                  role: event.target.value,
                }))
              }
              disabled={userActionLoading}
            >
              <option value="manager">
                Manager
              </option>

              <option value="admin">
                Admin
              </option>
            </select>

            <small>
              Admins have full dashboard access.
            </small>
          </div>
        </div>

        <div className="account-form-actions">
          <button
            type="button"
            className="account-primary-button"
            onClick={createAdminUser}
            disabled={userActionLoading}
          >
            {userActionLoading
              ? "Creating Account..."
              : "Create Account"}
          </button>

          <button
            type="button"
            className="account-secondary-button"
            onClick={() => {
              setShowUserForm(false);

              setUserForm({
                display_name: "",
                email: "",
                password: "",
                role: "manager",
              });
            }}
            disabled={userActionLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    )}

    {/* =====================================================
        USERS
        ===================================================== */}

    <div className="account-users-card">
      <div className="account-card-header users-header">
        <div>
          <span className="account-card-eyebrow">
            TEAM ACCESS
          </span>

          <h3>Users</h3>

          <p>
            Manage existing AVORA administrator accounts and permissions.
          </p>
        </div>

        <div className="account-users-count">
          <strong>
            {adminUsers.length}
          </strong>

          <span>
            {adminUsers.length === 1
              ? "Account"
              : "Accounts"}
          </span>
        </div>
      </div>

      {adminUsersLoading ? (
        <div className="account-loading-state">
          <div className="account-loading-dot" />
          <span>Loading accounts...</span>
        </div>
      ) : adminUsers.length === 0 ? (
        <div className="account-empty-state">
          <strong>No accounts found</strong>

          <span>
            Create the first AVORA administrator account.
          </span>
        </div>
      ) : (
        <div className="account-users-table">
          <div className="account-table-head">
            <span>User</span>
            <span>Role</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="account-table-body">
            {adminUsers.map((user) => {
              const isCurrentUser =
                user.id === session?.user?.id;

              return (
                <div
                  className={`account-user-row ${
                    isCurrentUser
                      ? "current-user"
                      : ""
                  }`}
                  key={user.id}
                >
                  {/* USER */}

                  <div className="account-user-cell account-user-main">
                    <div className="account-user-avatar">
                      {(
                        user.display_name ||
                        user.email ||
                        "A"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="account-user-details">
                      <strong>
                        {user.display_name ||
                          "AVORA User"}
                      </strong>

                      <span>
                        {user.email ||
                          "No email available"}
                      </span>

                      {isCurrentUser && (
                        <small>
                          Current account
                        </small>
                      )}
                    </div>
                  </div>

                  {/* ROLE */}

                  <div className="account-user-cell">
                    {isAdmin && !isCurrentUser ? (
                      <select
                        className="account-role-select"
                        value={
                          user.role ||
                          "manager"
                        }
                        onChange={(event) =>
                          updateAdminUserRole(
                            user.id,
                            event.target.value
                          )
                        }
                        disabled={
                          userActionLoading
                        }
                      >
                        <option value="manager">
                          Manager
                        </option>

                        <option value="admin">
                          Admin
                        </option>
                      </select>
                    ) : (
                      <span
                        className={`account-role-badge ${
                          user.role ===
                          "admin"
                            ? "admin"
                            : "manager"
                        }`}
                      >
                        {user.role ===
                        "admin"
                          ? "Admin"
                          : "Manager"}
                      </span>
                    )}
                  </div>

                  {/* STATUS */}

                  <div className="account-user-cell">
                    <span
                      className={`account-status-badge ${
                        user.active
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      <span className="account-status-dot" />

                      {user.active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  {/* ACTIONS */}

                  <div className="account-user-cell account-user-actions">
                    {isAdmin &&
                    !isCurrentUser ? (
                      <>
                        <button
                          type="button"
                          className="account-action-button secondary"
                          onClick={() =>
                            toggleAdminUserActive(
                              user.id,
                              user.active
                            )
                          }
                          disabled={
                            userActionLoading
                          }
                        >
                          {user.active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          className="account-action-button danger"
                          onClick={() =>
                            deleteAdminUser(
                              user.id
                            )
                          }
                          disabled={
                            userActionLoading
                          }
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="account-protected-label">
                        {isCurrentUser
                          ? "Your account"
                          : "Protected"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* =====================================================
        CHANGE PASSWORD
        ===================================================== */}

    <div className="account-password-card">
      <div className="account-password-icon">
        🔐
      </div>

      <div className="account-password-content">
        <span className="account-card-eyebrow">
          SECURITY
        </span>

        <h3>Change Password</h3>

        <p>
          Update the password for your current AVORA account.
        </p>

        <div className="account-form-grid password-grid">
          <div className="account-form-group">
            <label htmlFor="new-password">
              New Password
            </label>

          <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm((previous) => ({
                    ...previous,
                    password: event.target.value,
                  }))
                }
                placeholder="Minimum 8 characters"
                disabled={passwordLoading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowNewPassword((previous) => !previous)
                }
                aria-label={
                  showNewPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {showNewPassword ? (
                    <>
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </>
                  ) : (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.5 5.3A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.1 3.8" />
                      <path d="M6.1 6.1C3.4 8.1 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 2.5-.3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="account-form-group">
            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

           <div className="password-input-wrapper">
              <input
                id="confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={
                  passwordForm.confirmPassword
                }
                onChange={(event) =>
                  setPasswordForm((previous) => ({
                    ...previous,
                    confirmPassword:
                      event.target.value,
                  }))
                }
                placeholder="Repeat your new password"
                disabled={passwordLoading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {showConfirmPassword ? (
                    <>
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </>
                  ) : (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.5 5.3A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.1 3.8" />
                      <path d="M6.1 6.1C3.4 8.1 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 2.5-.3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="account-form-actions">
          <button
            type="button"
            className="account-primary-button"
            onClick={changePassword}
            disabled={passwordLoading}
          >
            {passwordLoading
              ? "Updating Password..."
              : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  </section>
)}
{openSection === "dashboard" && (
 <section
   id="dashboard"
    className="admin-section"
  >
    <section className="stats-grid">
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
              Sections
            </span>

            <strong>
              {
                sections.filter(
                  (section) =>
                    section.active
                ).length
              }
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Destinations
            </span>

            <strong>
              {
                destinations.length
              }
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
              Special Offers
            </span>

            <strong>
              {
                specialOffersCount
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
              {
                bookings.length
              }
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Pending Bookings
            </span>

            <strong>
              {
                pendingBookings
              }
            </strong>
          </div>

        </section>
        </section>

            )}

        {/* =========================
            MESSAGES
        ========================= */}

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

        {/* =========================
            SECTIONS
        ========================= */}

        {openSection === "sections" && (
        <section
          className="admin-panel"
          id="sections"
        >

          <div className="panel-heading">

            <div>

              <span className="admin-eyebrow">
                WEBSITE SECTIONS
              </span>

              <h2>
                Trip Sections
              </h2>

              <p className="panel-description">
                Create and manage the
                sections where trips
                appear on the website.
              </p>

            </div>

          </div>

          {/* SECTION FORM */}

          <div className="form-section">

            <div className="panel-heading">

              <div>

                <h3>
                  {editingSectionId
                    ? "Edit Section"
                    : "Add New Section"}
                </h3>

                <p className="panel-description">
                  Example: Dahab,
                  Marsa Alam or Cairo.
                </p>

              </div>

              {editingSectionId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    resetSectionForm
                  }
                >
                  Cancel Edit
                </button>
              )}

            </div>

            <form
              onSubmit={saveSection}
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    English Name
                  </label>

                  <input
                    required
                    value={
                      sectionForm.name_en
                    }
                    onChange={(e) =>
                      updateSectionField(
                        "name_en",
                        e.target.value
                      )
                    }
                    placeholder="Dahab"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Russian Name
                  </label>

                  <input
                    required
                    value={
                      sectionForm.name_ru
                    }
                    onChange={(e) =>
                      updateSectionField(
                        "name_ru",
                        e.target.value
                      )
                    }
                    placeholder="Дахаб"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Slug
                  </label>

                  <input
                    value={
                      sectionForm.slug
                    }
                    onChange={(e) =>
                      updateSectionField(
                        "slug",
                        e.target.value
                      )
                    }
                    placeholder="dahab"
                  />

                  <small
                    style={{
                      display:
                        "block",
                      marginTop:
                        "6px",
                      opacity:
                        0.6,
                    }}
                  >
                    Leave empty to
                    generate it
                    automatically.
                  </small>

                </div>

                <div className="form-group">

                  <label>
                    Display Order
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      sectionForm.sort_order
                    }
                    onChange={(e) =>
                      updateSectionField(
                        "sort_order",
                        e.target.value
                      )
                    }
                    placeholder="1"
                  />

                </div>

              </div>

              {/* SECTION IMAGE */}

              <div className="form-section">

                <h3>
                  Section Image
                </h3>

                <div className="upload-box">

                  <input
                    id="section-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      uploadSectionImage(
                        e.target.files?.[0]
                      )
                    }
                  />

                  <label htmlFor="section-image">

                    <span className="upload-icon">
                      +
                    </span>

                    <strong>
                      Upload Section Image
                    </strong>

                    <small>
                      Choose one image for this website section
                    </small>

                  </label>

                </div>

                {sectionForm.image && (
                  <div
                    style={{
                      marginTop:
                        "20px",
                      maxWidth:
                        "500px",
                    }}
                  >

                    <img
                      src={
                        sectionForm.image
                      }
                      alt={
                        sectionForm.name_en ||
                        "Section"
                      }
                      style={{
                        width:
                          "100%",
                        height:
                          "220px",
                        objectFit:
                          "cover",
                        borderRadius:
                          "12px",
                        display:
                          "block",
                      }}
                    />

                  </div>
                )}

              </div>

              <label className="checkbox-label">

                <input
                  type="checkbox"
                  checked={
                    sectionForm.active
                  }
                  onChange={(e) =>
                    updateSectionField(
                      "active",
                      e.target.checked
                    )
                  }
                />

                <span>
                  Active Section
                </span>

              </label>

              <div className="form-submit">

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    sectionSaving
                  }
                >
                  {
                    sectionSaving
                      ? "Saving..."
                      : editingSectionId
                      ? "Update Section"
                      : "Create Section"
                  }
                </button>

              </div>

            </form>

          </div>

          {/* EXISTING SECTIONS */}

          <div className="form-section">

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "20px",
                gap: "15px",
                flexWrap:
                  "wrap",
              }}
            >

              <div>

                <h3>
                  Existing Sections
                </h3>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    opacity:
                      0.7,
                  }}
                >
                  These sections
                  control where
                  trips will appear
                  on the website.
                </p>

              </div>

              <strong>
                {
                  sections.length
                } Sections
              </strong>

            </div>

            {sections.length ===
            0 ? (

              <div className="empty-state">

                <h3>
                  No Sections
                </h3>

                <p>
                  Create your first
                  section above.
                </p>

              </div>

            ) : (

              <div className="trips-admin-grid">

                {sections.map(
                  (section) => {

                    const sectionTrips =
                      trips.filter(
                        (trip) =>
                          String(
                            trip.section_id
                          ) ===
                          String(
                            section.id
                          )
                      );

                    return (
                      <div
                        className="admin-trip-card"
                        key={
                          section.id
                        }
                      >

                        <div
                          className="admin-trip-image"
                          style={{
                            minHeight:
                              "180px",
                          }}
                        >

                          {section.image ? (
                            <img
                              src={
                                section.image
                              }
                              alt={
                                section.name_en
                              }
                            />
                          ) : (
                            <div
                              style={{
                                width:
                                  "100%",
                                height:
                                  "100%",
                                minHeight:
                                  "180px",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                fontSize:
                                  "30px",
                                fontWeight:
                                  "700",
                              }}
                            >
                              {section.name_en
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>
                          )}

                          <span className="featured-badge">
                            {section.active
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>

                        </div>

                        <div className="admin-trip-body">

                          <span className="trip-destination">
                            {
                              section.slug
                            }
                          </span>

                          <h3>
                            {
                              section.name_en
                            }
                          </h3>

                          <p>
                            {
                              section.name_ru
                            }
                          </p>

                          <div className="trip-meta">

                            <span>
                              📦{" "}
                              {
                                sectionTrips.length
                              }{" "}
                              trips
                            </span>

                            <span>
                              🔢 Order:{" "}
                              {
                                section.sort_order
                              }
                            </span>

                          </div>

                          <div className="card-actions">

                            <button
                              type="button"
                              className="edit-button"
                              onClick={() =>
                                startEditSection(
                                  section
                                )
                              }
                            >
                              Edit
                            </button>

                            {isAdmin && (
  <button
    type="button"
    className="delete-button"
    onClick={() =>
      deleteSection(section)
    }
  >
    Delete
  </button>
)}

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </section>
        )}

        {/* =========================
            SPECIAL OFFERS
        ========================= */}

        {openSection === "special-offers" && (
        <section
          className="admin-panel"
          id="special-offers"
        >

          <div className="panel-heading">

            <div>

              <span className="admin-eyebrow">
                SPECIAL OFFERS
              </span>

              <h2>
                Special Offers
                Settings
              </h2>

              <p className="panel-description">
                Manage the Special
                Offers section shown
                on the website.
              </p>

            </div>

            <div
              style={{
                textAlign:
                  "right",
              }}
            >

              <span
                style={{
                  display:
                    "block",
                  fontSize:
                    "13px",
                  opacity:
                    0.65,
                  marginBottom:
                    "4px",
                }}
              >
                Active Offers
              </span>

              <strong
                style={{
                  fontSize:
                    "28px",
                }}
              >
                {
                  specialOffersCount
                }
              </strong>

            </div>

          </div>

          {/* CURRENT SPECIAL OFFERS */}

          <div className="form-section">

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: "20px",
                marginBottom:
                  "20px",
                flexWrap:
                  "wrap",
              }}
            >

              <div>

                <h3>
                  Current Special
                  Offers
                </h3>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    opacity:
                      0.7,
                  }}
                >
                  These trips are
                  currently displayed
                  as Special Offers.
                </p>

              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setTripOfferFilter(
                    "offers"
                  );

                  document
                    .getElementById(
                      "trips"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    });
                }}
                disabled={
                  specialOfferTrips.length ===
                  0
                }
              >
                Manage All
                Offers
              </button>

            </div>

            {specialOfferTrips.length ===
            0 ? (

              <div className="empty-state">

                <h3>
                  No Special
                  Offers
                </h3>

                <p>
                  Edit a trip below
                  and enable the
                  Special Offer
                  option to add it
                  here.
                </p>

              </div>

            ) : (

              <div className="trips-admin-grid">

                {specialOfferTrips.map(
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

                        <span className="featured-badge">
                          SPECIAL OFFER
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

                        <div className="trip-meta">

                          <span>
                            💰 Current:
                            {" "}
                            <strong>
                              {
                                trip.price ||
                                "N/A"
                              }
                            </strong>
                          </span>

                          <span>
                            🏷 Old Price:
                            {" "}
                            <s>
                              {
                                trip.old_price ||
                                "Not set"
                              }
                            </s>
                          </span>

                          <span>
                            ⏱{" "}
                            {
                              trip.duration ||
                              "N/A"
                            }
                          </span>

                          <span>
                            📌 Status:
                            {" "}
                            {
                              trip.status ||
                              "N/A"
                            }
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
                            Edit Offer
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              removeSpecialOffer(
                                trip
                              )
                            }
                          >
                            Remove Offer
                          </button>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          {/* DISPLAY SETTINGS */}

          <div className="form-section">

            <h3>
              Display Settings
            </h3>

            <div className="form-grid">

              <div className="form-group">

                <label>
                  English Title
                </label>

                <input
                  value={
                    specialOffersSettings.title_en
                  }
                  onChange={(e) =>
                    setSpecialOffersSettings(
                      (previous) => ({
                        ...previous,
                        title_en:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="SPECIAL OFFERS"
                />

              </div>

              <div className="form-group">

                <label>
                  Russian Title
                </label>

                <input
                  value={
                    specialOffersSettings.title_ru
                  }
                  onChange={(e) =>
                    setSpecialOffersSettings(
                      (previous) => ({
                        ...previous,
                        title_ru:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ"
                />

              </div>

              <div className="form-group">

                <label>
                  English Description
                </label>

                <textarea
                  value={
                    specialOffersSettings.description_en
                  }
                  onChange={(e) =>
                    setSpecialOffersSettings(
                      (previous) => ({
                        ...previous,
                        description_en:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="Discover our best deals..."
                  rows="4"
                />

              </div>

              <div className="form-group">

                <label>
                  Russian Description
                </label>

                <textarea
                  value={
                    specialOffersSettings.description_ru
                  }
                  onChange={(e) =>
                    setSpecialOffersSettings(
                      (previous) => ({
                        ...previous,
                        description_ru:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="Откройте для себя лучшие предложения..."
                  rows="4"
                />

              </div>

            </div>

            <label className="checkbox-label">

              <input
                type="checkbox"
                checked={
                  specialOffersSettings.active
                }
                onChange={(e) =>
                  setSpecialOffersSettings(
                    (previous) => ({
                      ...previous,
                      active:
                        e.target.checked,
                    })
                  )
                }
              />

              <span>
                Show Special Offers
                section
              </span>

            </label>

          </div>

          {/* SPECIAL OFFERS IMAGE */}

          <div className="form-section">

            <h3>
              Special Offers
              Image
            </h3>

            <div className="upload-box">

              <input
                id="special-offers-image"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  uploadSpecialOffersImage(
                    e.target.files?.[0]
                  )
                }
              />

              <label htmlFor="special-offers-image">

                <span className="upload-icon">
                  +
                </span>

                <strong>
                  {
                    specialOffersUploading
                      ? "Uploading..."
                      : "Upload Special Offers Image"
                  }
                </strong>

                <small>
                  Choose one image
                </small>

              </label>

            </div>

            {specialOffersSettings.image && (
              <div
                style={{
                  marginTop:
                    "20px",
                  maxWidth:
                    "500px",
                }}
              >

                <img
                  src={
                    specialOffersSettings.image
                  }
                  alt="Special Offers"
                  style={{
                    width:
                      "100%",
                    height:
                      "220px",
                    objectFit:
                      "cover",
                    borderRadius:
                      "12px",
                    display:
                      "block",
                  }}
                />

                <button
                  type="button"
                  className="delete-button"
                  style={{
                    marginTop:
                      "12px",
                  }}
                  onClick={
                    removeSpecialOffersImage
                  }
                >
                  Remove Image
                </button>

              </div>
            )}

          </div>

          <div className="form-submit">

            <button
              type="button"
              className="primary-button large"
              onClick={
                saveSpecialOffersSettings
              }
              disabled={
                specialOffersUploading ||
                specialOffersSaving
              }
            >
              {
                specialOffersSaving
                  ? "Saving..."
                  : "Save Special Offers Settings"
              }
            </button>

          </div>

        </section>
        )}


        {/* =========================
            ADD / EDIT TRIP
        ========================= */}
        {openSection === "add-trip" && (
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
            onSubmit={
              handleSubmit
            }
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
                    Website Section
                  </label>

                  <select
                    value={
                      form.section_id
                    }
                    onChange={(e) =>
                      updateField(
                        "section_id",
                        e.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      Select Section
                    </option>

                    {sections
                      .filter(
                        (section) =>
                          section.active
                      )
                      .map(
                        (section) => (
                          <option
                            key={
                              section.id
                            }
                            value={
                              section.id
                            }
                          >
                            {
                              section.name_en
                            }
                          </option>
                        )
                      )}

                  </select>

                  <small
                    style={{
                      display:
                        "block",
                      marginTop:
                        "6px",
                      opacity:
                        0.6,
                    }}
                  >
                    This determines
                    which website
                    section will show
                    this trip.
                  </small>

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

                <div className="form-group">

                  <label>
                    Old Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.old_price
                    }
                    onChange={(e) =>
                      updateField(
                        "old_price",
                        e.target.value
                      )
                    }
                    placeholder="5500"
                    disabled={
                      !form.is_offer
                    }
                  />

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

                <label className="checkbox-label">

                  <input
                    type="checkbox"
                    checked={
                      form.is_offer
                    }
                    onChange={(e) =>
                      updateField(
                        "is_offer",
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Special Offer
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
                    Select one or
                    multiple images
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
                        key={
                          image
                        }
                      >

                        <img
                          src={
                            image
                          }
                          alt={`Trip ${
                            index +
                            1
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
        )}

        {/* =========================
            ALL TRIPS
        ========================= */}
        {openSection === "trips" && (
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

              <p className="panel-description">
                Search, filter and
                manage all trips
                and Special Offers.
              </p>

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
                tripSectionFilter
              }
              onChange={(e) =>
                setTripSectionFilter(
                  e.target.value
                )
              }
            >

              <option value="all">
                All Sections
              </option>

              {sections.map(
                (section) => (

                  <option
                    key={
                      section.id
                    }
                    value={
                      section.id
                    }
                  >
                    {
                      section.name_en
                    }
                  </option>

                )
              )}

            </select>

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

            <select
              value={
                tripOfferFilter
              }
              onChange={(e) =>
                setTripOfferFilter(
                  e.target.value
                )
              }
            >

              <option value="all">
                All Trips
              </option>

              <option value="offers">
                Special Offers
              </option>

              <option value="regular">
                Regular Trips
              </option>

            </select>

            <select
              value={
                tripFeaturedFilter
              }
              onChange={(e) =>
                setTripFeaturedFilter(
                  e.target.value
                )
              }
            >

              <option value="all">
                All Featured
              </option>

              <option value="featured">
                Featured
              </option>

              <option value="not_featured">
                Not Featured
              </option>

            </select>

            <select
              value={
                tripStatusFilter
              }
              onChange={(e) =>
                setTripStatusFilter(
                  e.target.value
                )
              }
            >

              <option value="all">
                All Statuses
              </option>

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

          {/* FILTER RESULT */}

          <div
            style={{
              marginBottom:
                "20px",
              opacity:
                0.7,
              fontSize:
                "14px",
            }}
          >
            Showing{" "}
            <strong>
              {
                filteredTrips.length
              }
            </strong>{" "}
            trip
            {filteredTrips.length !==
            1
              ? "s"
              : ""}
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

                    {trip.is_offer && (
                      <span className="featured-badge">
                        SPECIAL OFFER
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
                        📂{" "}
                        {
                          sections.find(
                            (
                              section
                            ) =>
                              String(
                                section.id
                              ) ===
                              String(
                                trip.section_id
                              )
                          )
                            ?.name_en ||
                          "No section"
                        }
                      </span>

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

                        {trip.is_offer &&
                          trip.old_price && (
                          <>
                            {" "}
                            <s>
                              {
                                trip.old_price
                              }
                            </s>
                          </>
                        )}

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

                      {trip.is_offer && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            removeSpecialOffer(
                              trip
                            )
                          }
                        >
                          Remove Offer
                        </button>
                      )}

                      {isAdmin && (
                       <button
                         type="button"
                         className="delete-button"
                         onClick={() =>
                         deleteTrip(trip)
                         }
                       >
                          Delete
                       </button>
                          )}

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
                filters or add a
                new trip.
              </p>

            </div>

          )}

        </section>
        )}

        {/* =========================
            BOOKINGS
        ========================= */}

        {openSection === "bookings" && (
       <section
          id="bookings"
          className="admin-section"
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
                Manage customer
                booking requests
                and update their
                status.
              </p>

            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={
                getBookings
              }
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
                {
                  bookings.length
                }
              </strong>

            </div>

            <div className="booking-stat-card pending">

              <span>
                Pending
              </span>

              <strong>
                {
                  pendingBookings
                }
              </strong>

            </div>

            <div className="booking-stat-card confirmed">

              <span>
                Confirmed
              </span>

              <strong>
                {
                  confirmedBookings
                }
              </strong>

            </div>

            <div className="booking-stat-card cancelled">

              <span>
                Cancelled
              </span>

              <strong>
                {
                  cancelledBookings
                }
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
                bookingTripFilter
              }
              onChange={(e) =>
                setBookingTripFilter(
                  e.target.value
                )
              }
            >

              <option value="all">
                All Trips
              </option>

              {trips.map(
                (trip) => (

                  <option
                    key={
                      trip.id
                    }
                    value={
                      trip.id
                    }
                  >
                    {
                      trip.name
                    }
                  </option>

                )
              )}

            </select>

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
                Please wait while
                we load customer
                bookings.
              </p>

            </div>

          ) : filteredBookings.length ===
            0 ? (

            <div className="empty-state">

              <h3>
                No bookings found
              </h3>

              <p>
                There are no
                bookings matching
                your filters.
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
                            booking
                              .trips
                              .image
                          }
                          alt={
                            booking
                              .trips
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
                          disabled={
                            booking.status ===
                            "pending"
                          }
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
  disabled={booking.status === "confirmed"}
  onClick={() => {
    console.log("CONFIRM BUTTON CLICKED", booking.id);

    updateBookingStatus(
      booking.id,
      "confirmed"
    );
  }}
>
  Confirm
</button>

                        <button
                          type="button"
                          className="booking-status-button cancelled"
                          disabled={
                            booking.status ===
                            "cancelled"
                          }
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "cancelled"
                            )
                          }
                        >
                          Cancel
                        </button>

                        {isAdmin && (
                        <button
                           type="button"
                           className="booking-delete-button"
                           onClick={() =>
                           deleteBooking(booking)
                           }
                           >
                           Delete Booking
                         </button>
                        )}

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

       </section>
        )}

      </div>
    </div>
  );
}
    
  
/* =========================
   LIST EDITOR
========================= */

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

  function handleKeyDown(
    event
  ) {
    if (
      event.key ===
      "Enter"
    ) {
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