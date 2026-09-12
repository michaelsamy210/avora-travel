
import "./App.css";
import "./Trips.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useLanguage } from "./LanguageContext.jsx";

function SocialIcon({ type }) {
  if (type === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle
          cx="17.5"
          cy="6.5"
          r="1"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  if (type === "facebook") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M14 8h3V4h-3c-3.3 0-5 1.7-5 5v2H6v4h3v5h4v-5h3l1-4h-4V9c0-.7.3-1 1-1Z" />
      </svg>
    );
  }

  if (type === "telegram") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M21.5 3.2 2.9 10.4c-1.3.5-1.3 1.3-.2 1.7l4.8 1.5 1.8 5.7c.2.6.1.8.8.8.5 0 .7-.2.9-.4l2.3-2.2 4.8 3.5c.9.5 1.5.3 1.7-.8l3.1-14.9c.3-1.3-.5-1.9-1.6-1.5ZM8.2 13.2l9.9-6.2c.5-.3 1-.1.6.2l-8.2 7.4-.3 3.1-1.4-4.5-1.8-.6c-.4-.1-.4-.4.1-.6Z" />
      </svg>
    );
  }

  if (type === "tiktok") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M15.5 3c.4 2.4 1.7 3.8 4 4.1v3.1c-1.8.1-3.2-.4-4.1-1.1v6.5c0 4-2.7 6.4-6.1 6.4-3 0-5.3-2.1-5.3-5.1 0-3.1 2.5-5.4 5.8-5.4.4 0 .8 0 1.2.1v3.2c-.4-.1-.8-.2-1.2-.2-1.4 0-2.5.9-2.5 2.2 0 1.2.9 2 2.1 2 1.4 0 2.6-.9 2.6-3V3h3.5Z" />
      </svg>
    );
  }

  if (type === "whatsapp") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.9-1.3A9.5 9.5 0 1 0 12 2.5Zm0 17.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A7.7 7.7 0 1 1 12 19.7Zm4.2-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-1.7-.8-2.8-1.5-3.8-3.3-.3-.5.3-.5.7-1.2.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2 0 1.3.9 2.6 1 2.8.1.2 1.8 2.8 4.4 3.9 2.6 1.1 2.6.7 3 .7.5 0 1.4-.6 1.6-1.1.2-.5.2-.9.1-1-.1-.1-.3-.2-.5-.3Z" />
      </svg>
    );
  }

  return null;
}

function App() {
  const [trips, setTrips] = useState([]);
  const [sections, setSections] = useState([]);

  const [
    specialOffersSettings,
    setSpecialOffersSettings,
  ] = useState({
    image: "",
    title_en: "SPECIAL OFFERS",
    title_ru: "СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ",
    description_en:
      "Discover our best deals and enjoy unforgettable trips at special prices.",
    description_ru:
      "Откройте для себя лучшие предложения и наслаждайтесь незабываемыми путешествиями по специальным ценам.",
    active: true,
  });

  const {
    language,
    setLanguage,
    t,
  } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    async function getHomeData() {
      const [
        tripsResult,
        sectionsResult,
        specialOffersResult,
      ] = await Promise.all([
        supabase
          .from("trips")
          .select("*")
          .order("id", {
            ascending: true,
          }),

        supabase
          .from("trip_sections")
          .select("*")
          .eq("active", true)
          .order("sort_order", {
            ascending: true,
          })
          .order("id", {
            ascending: true,
          }),

        supabase
          .from("special_offers_settings")
          .select("*")
          .limit(1)
          .maybeSingle(),
      ]);

      if (tripsResult.error) {
        console.error(
          "Error fetching trips:",
          tripsResult.error
        );
      } else {
        setTrips(tripsResult.data || []);
      }

      if (sectionsResult.error) {
        console.error(
          "Error fetching trip sections:",
          sectionsResult.error
        );
      } else {
        setSections(sectionsResult.data || []);
      }

      if (specialOffersResult.error) {
        console.error(
          "Error fetching Special Offers settings:",
          specialOffersResult.error
        );
      } else if (specialOffersResult.data) {
        setSpecialOffersSettings({
          image:
            specialOffersResult.data.image ||
            "",
          title_en:
            specialOffersResult.data.title_en ||
            "SPECIAL OFFERS",
          title_ru:
            specialOffersResult.data.title_ru ||
            "СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ",
          description_en:
            specialOffersResult.data
              .description_en || "",
          description_ru:
            specialOffersResult.data
              .description_ru || "",
          active:
            specialOffersResult.data.active ??
            true,
        });
      }
    }

    getHomeData();
  }, []);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  const socialLinks = [
    {
      name: "Instagram",
      type: "instagram",
      url: "https://instagram.com",
    },
    {
      name: "Facebook",
      type: "facebook",
      url: "https://facebook.com",
    },
    {
      name: "Telegram",
      type: "telegram",
      url: "https://t.me",
    },
    {
      name: "TikTok",
      type: "tiktok",
      url: "https://tiktok.com",
    },
  ];

  const specialOffersTitle =
    language === "ru"
      ? specialOffersSettings.title_ru
      : specialOffersSettings.title_en;

  const specialOffersDescription =
    language === "ru"
      ? specialOffersSettings.description_ru
      : specialOffersSettings.description_en;

  return (
    <div className="site">

      {/* ================= NAVBAR ================= */}

      <header className="site-navbar">

        <Link
          to="/"
          className="site-logo"
          onClick={closeMobileMenu}
        >
          <span>SWAY</span>
          <small>TRAVEL</small>
        </Link>

        <nav className="site-nav-links">

          <a href="#home">
            {t.navHome}
          </a>

          <a href="#destinations">
            {t.navDestinations}
          </a>

          <Link to="/trips">
            {t.navTrips}
          </Link>

          <a href="#about">
            {t.navAbout}
          </a>

          <a href="#contact-info">
            {t.navContact}
          </a>

        </nav>

        <div className="navbar-actions">

          <div className="language-switcher">

            <button
              type="button"
              className={
                language === "en"
                  ? "language-button active"
                  : "language-button"
              }
              onClick={() =>
                setLanguage("en")
              }
            >
              EN
            </button>

            <span>/</span>

            <button
              type="button"
              className={
                language === "ru"
                  ? "language-button active"
                  : "language-button"
              }
              onClick={() =>
                setLanguage("ru")
              }
            >
              RU
            </button>

          </div>

          <Link
            to="/admin/login"
            className="admin-login-link"
          >
            {t.login}
          </Link>

          <button
            type="button"
            className={
              mobileMenuOpen
                ? "mobile-menu-button active"
                : "mobile-menu-button"
            }
            onClick={() =>
              setMobileMenuOpen(
                (current) => !current
              )
            }
            aria-label={t.toggleMenu}
            aria-expanded={mobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>

      </header>


      {/* ================= MOBILE MENU ================= */}

      <div
        className={
          mobileMenuOpen
            ? "mobile-menu open"
            : "mobile-menu"
        }
      >

        <nav className="mobile-menu-links">

          <a
            href="#home"
            onClick={closeMobileMenu}
          >
            {t.navHome}
          </a>

          <a
            href="#destinations"
            onClick={closeMobileMenu}
          >
            {t.navDestinations}
          </a>

          <Link
            to="/trips"
            onClick={closeMobileMenu}
          >
            {t.navTrips}
          </Link>

          <a
            href="#about"
            onClick={closeMobileMenu}
          >
            {t.navAbout}
          </a>

          <a
            href="#contact-info"
            onClick={closeMobileMenu}
          >
            {t.navContact}
          </a>

        </nav>

        <div className="mobile-menu-language">

          <button
            type="button"
            className={
              language === "en"
                ? "language-button active"
                : "language-button"
            }
            onClick={() => {
              setLanguage("en");
              closeMobileMenu();
            }}
          >
            EN
          </button>

          <span>/</span>

          <button
            type="button"
            className={
              language === "ru"
                ? "language-button active"
                : "language-button"
            }
            onClick={() => {
              setLanguage("ru");
              closeMobileMenu();
            }}
          >
            RU
          </button>

        </div>

      </div>


      {/* ================= HERO ================= */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <span className="hero-eyebrow">
            {t.heroEyebrow}
          </span>

          <h1>
            {t.heroTitle}
          </h1>

          <p>
            {t.heroText}
          </p>

          <Link
            to="/trips"
            className="hero-button"
          >
            {t.heroButton}
            <span>→</span>
          </Link>

        </div>

        <div className="hero-scroll">
          <span></span>
          {t.heroScroll}
        </div>

      </section>


      {/* ================= DESTINATIONS / TRIP SECTIONS ================= */}

      <section
        className="destinations"
        id="destinations"
      >

        <div className="section-heading">

          <span className="section-eyebrow">
            {t.destinationsEyebrow}
          </span>

          <h2>
            {t.destinationsTitle}
          </h2>

          <p>
            {t.destinationsText}
          </p>

        </div>

        <div className="destinations-container">

          {sections.map((section) => {

            const sectionTrips = trips.filter(
              (trip) =>
                Number(trip.section_id) ===
                Number(section.id)
            );

            if (sectionTrips.length === 0) {
              return null;
            }

            const firstTrip =
              sectionTrips[0];

            const sectionName =
              language === "ru"
                ? section.name_ru
                : section.name_en;

            return (
              <div
                className="destination-card"
                key={section.id}
              >

                <div className="destination-image">

                  {firstTrip.image ? (
                    <img
                      src={firstTrip.image}
                      alt={sectionName}
                    />
                  ) : (
                    <div className="image-placeholder">
                      <span>
                        {sectionName}
                      </span>
                    </div>
                  )}

                  <div className="destination-overlay">

                    <span>
                      {sectionName}
                    </span>

                  </div>

                </div>

                <div className="destination-content">

                  <h3>
                    {sectionName}
                  </h3>

                  <p>
                    {t.destinationText}
                  </p>

                  <Link
                    to={
                      "/trips?section=" +
                      encodeURIComponent(
                        section.id
                      )
                    }
                    className="destination-explore-button"
                  >
                    {t.explore}

                    <span>→</span>

                  </Link>

                </div>

              </div>
            );
          })}


          {/* ================= SPECIAL OFFERS ================= */}

          {specialOffersSettings.active && (
            <div className="destination-card special-offers-card">

              <div className="destination-image">

                {specialOffersSettings.image ? (
                  <img
                    src={
                      specialOffersSettings.image
                    }
                    alt={
                      specialOffersTitle
                    }
                  />
                ) : (
                  <div className="image-placeholder">
                    <span>
                      {specialOffersTitle}
                    </span>
                  </div>
                )}

                <div className="destination-overlay">

                  <span>
                    {specialOffersTitle}
                  </span>

                </div>

              </div>

              <div className="destination-content">

                <h3>
                  {specialOffersTitle}
                </h3>

                <p>
                  {
                    specialOffersDescription
                  }
                </p>

                <Link
                  to="/trips?offers=true"
                  className="destination-explore-button"
                >
                  {language === "ru"
                    ? "Смотреть предложения"
                    : "Explore Offers"}

                  <span>→</span>

                </Link>

              </div>

            </div>
          )}

        </div>

      </section>


      {/* ================= ABOUT ================= */}

      <section
        className="about-section"
        id="about"
      >

        <div className="about-image">

          <img
            src="/images/hero.jpg"
            alt={t.travelAlt}
          />

        </div>

        <div className="about-content">

          <span className="section-eyebrow">
            {t.aboutEyebrow}
          </span>

          <h2>
            {t.aboutTitle}
          </h2>

          <p>
            {t.aboutText}
          </p>

          <Link
            to="/trips"
            className="dark-button"
          >
            {t.aboutButton}

            <span>→</span>
          </Link>

        </div>

      </section>


      {/* ================= CONTACT CTA ================= */}

      <section
        className="contact-section"
        id="contact"
      >

        <div className="contact-overlay"></div>

        <div className="contact-content">

          <span className="section-eyebrow">
            {t.contactEyebrow}
          </span>

          <h2>
            {t.contactTitle}
          </h2>

          <p>
            {t.contactText}
          </p>

          <Link
            to="/trips"
            className="hero-button"
          >
            {t.contactButton}

            <span>→</span>
          </Link>

        </div>

      </section>


      {/* ================= CONTACT INFO ================= */}

      <section
        className="contact-info-section"
        id="contact-info"
      >

        <div className="section-heading">

          <span className="section-eyebrow">
            {t.contactInfoEyebrow}
          </span>

          <h2>
            {t.contactInfoTitle}
          </h2>

          <p>
            {t.contactInfoText}
          </p>

        </div>

        <div className="contact-info-container">

          <a
            href="tel:+201001234567"
            className="contact-info-card"
          >

            <div className="contact-info-icon">
              ☎
            </div>

            <div>

              <span>
                {t.callUs}
              </span>

              <strong>
                +20 100 123 4567
              </strong>

            </div>

          </a>


          <a
            href="https://wa.me/201001234567"
            target="_blank"
            rel="noreferrer"
            className="contact-info-card"
          >

            <div className="contact-info-icon">
              <SocialIcon type="whatsapp" />
            </div>

            <div>

              <span>
                {t.whatsapp}
              </span>

              <strong>
                +20 100 123 4567
              </strong>

            </div>

          </a>


          <a
            href="mailto:info@swaytravel.com"
            className="contact-info-card"
          >

            <div className="contact-info-icon">
              ✉
            </div>

            <div>

              <span>
                {t.email}
              </span>

              <strong>
                info@swaytravel.com
              </strong>

            </div>

          </a>


          <div className="contact-info-card">

            <div className="contact-info-icon">
              📍
            </div>

            <div>

              <span>
                {t.office}
              </span>

              <strong>
                {t.officeLocation}
              </strong>

            </div>

          </div>

        </div>


        {/* ================= SOCIAL MEDIA ================= */}

        <div className="social-media">

          <span className="social-media-title">
            {t.followUs}
          </span>

          <div className="social-links">

            {socialLinks.map(
              (social) => (
                <a
                  key={social.type}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={
                    "Follow SWAY Travel on " +
                    social.name
                  }
                  className={
                    "social-link social-" +
                    social.type
                  }
                >

                  <SocialIcon
                    type={social.type}
                  />

                  <span>
                    {social.name}
                  </span>

                </a>
              )
            )}

          </div>

        </div>

      </section>


      {/* ================= FLOATING SOCIAL MEDIA ================= */}

      <div className="floating-social-bar">

        {socialLinks.map(
          (social) => (
            <a
              key={social.type}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              aria-label={
                "SWAY Travel " +
                social.name
              }
              className={
                "floating-social-link floating-" +
                social.type
              }
            >

              <SocialIcon
                type={social.type}
              />

            </a>
          )
        )}

      </div>


      {/* ================= FLOATING WHATSAPP ================= */}

      <a
        href="https://wa.me/201001234567"
        target="_blank"
        rel="noreferrer"
        className="floating-whatsapp"
        aria-label={t.contactWhatsApp}
      >

        <SocialIcon type="whatsapp" />

        <strong>
          {t.whatsapp}
        </strong>

      </a>


      {/* ================= FOOTER ================= */}

      <footer className="site-footer">

        <div className="footer-logo">

          <span>
            SWAY
          </span>

          <small>
            TRAVEL
          </small>

        </div>

        <p>
          {t.footerText}
        </p>

        <div className="footer-links">

          <a href="#home">
            {t.navHome}
          </a>

          <Link to="/trips">
            {t.navTrips}
          </Link>

          <a href="#about">
            {t.navAbout}
          </a>

          <a href="#contact-info">
            {t.navContact}
          </a>

          <Link to="/admin/login">
            {t.login}
          </Link>

        </div>

        <div className="footer-bottom">

          <span>
            {t.rights}
          </span>

          <span>
            {t.designedBy}
          </span>

        </div>

      </footer>

    </div>
  );
}

export default App;
