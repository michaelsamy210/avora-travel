import { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

const destinationTranslations = {
  en: {
    HURGHADA: "HURGHADA",
    "SHARM EL SHEIKH": "SHARM EL SHEIKH",
  },

  ru: {
    HURGHADA: "Хургада",
    "SHARM EL SHEIKH": "Шарм-эль-Шейх",
  },
};


/* ================= DYNAMIC TRIP TRANSLATIONS ================= */

const dynamicTranslations = {
  en: {
    "DOLPHIN HOUSE": "DOLPHIN HOUSE",

    "Yacht Trip": "Yacht Trip",
    "Snorkeling": "Snorkeling",

    "7-8 HOURS": "7-8 HOURS",
  },

  ru: {
    "DOLPHIN HOUSE": "ДОМ ДЕЛЬФИНОВ",

    "Yacht Trip": "Прогулка на яхте",
    "Snorkeling": "Снорклинг",

    "7-8 HOURS": "7–8 часов",
  },
};


function translateDynamic(value, language) {
  if (!value) {
    return value;
  }

  const translationsForLanguage =
    dynamicTranslations[language];

  if (!translationsForLanguage) {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value
    .trim()
    .toLowerCase();

  const translationKey =
    Object.keys(translationsForLanguage).find(
      (key) =>
        key.trim().toLowerCase() === normalizedValue
    );

  if (translationKey) {
    return translationsForLanguage[translationKey];
  }

  return value;
}


const translations = {
  en: {
    // Navbar
    navHome: "Home",
    navDestinations: "Destinations",
    navTrips: "Trips",
    navAbout: "About Us",
    navContact: "Contact",
    login: "Admin Login",

    // Trips Page
    tripsBackHome: "← Back to Home",
    tripsEyebrow: "DISCOVER YOUR NEXT ADVENTURE",
    tripsTitle: "Our Trips",
    tripsDescription:
      "Choose your next adventure from our carefully selected trips and unforgettable destinations.",
    tripsSearchPlaceholder:
      "Search trips or destinations...",
    allTrips: "All Trips",
    trip: "Trip",
    trips: "Trips",
    found: "Found",
    noTripsFound: "No trips found.",

    // Trip Card
    viewDetails: "View Details",
    durationNotSpecified: "Duration not specified",
    priceNotSpecified: "Price not specified",

    // Trip Details
    backToTrips: "← Back to Trips",
    loadingTrip: "Loading trip...",
    tripNotFound: "Trip not found",
    unableToLoadTrip: "Unable to load this trip.",
    backToHome: "Back to Home",
    noDescription: "No description available.",
    hotel: "Hotel",
    duration: "Duration",
    price: "Price",
    availableSeats: "Available Seats",
    startDate: "Start Date",
    endDate: "End Date",
    notSpecified: "Not specified",
    meals: "Meals",
    activities: "Activities",
    transportation: "Transportation",
    whatsIncluded: "What's Included",
    whatsNotIncluded: "What's Not Included",
    bookNow: "Book Now",

    // Booking
    bookingReceived: "Booking Received",
    thankYou: "Thank you,",
    bookingRequestFor: "Your booking request for",
    bookingSubmitted: "has been submitted successfully.",
    teamWillContact:
      "Our team will contact you soon to confirm the details of your trip.",
    backToTrip: "Back to Trip",
    bookYourTrip: "BOOK YOUR TRIP",
    completeBooking: "Complete Your Booking",
    bookingDescription:
      "Enter your information and our team will contact you to confirm your reservation.",
    fullName: "Full Name",
    enterFullName: "Enter your full name",
    phoneNumber: "Phone Number",
    email: "Email",
    numberOfSeats: "Number of Seats",
    travelDate: "Travel Date",
    notes: "Notes",
    additionalNotes:
      "Any additional notes or requests...",
    submittingBooking: "Submitting Booking...",
    submitBooking: "Submit Booking",

    // Hero
    heroEyebrow: "DISCOVER • EXPLORE • EXPERIENCE",
    heroTitle: "Your Journey Starts Here",
    heroText:
      "Discover unforgettable destinations, carefully selected trips, and experiences made for you.",
    heroButton: "Explore Trips",
    heroScroll: "Scroll to explore",

    // Destinations
    destinationsEyebrow: "EXPLORE THE WORLD",
    destinationsTitle: "Popular Destinations",
    destinationsText:
      "Explore some of the destinations waiting for you.",
    destinationText:
      "Discover beautiful places, amazing experiences, and unforgettable moments.",
    explore: "Explore",

    // About
    aboutEyebrow: "ABOUT SWAY",
    aboutTitle: "Travel With SWAY",
    aboutText:
      "At SWAY Travel, we believe that traveling is more than visiting a place. It is about discovering new experiences, meeting new people, and creating memories that last a lifetime.",
    aboutButton: "Explore Our Trips",

    // Contact CTA
    contactEyebrow: "START YOUR JOURNEY",
    contactTitle: "Ready For Your Next Adventure?",
    contactText:
      "Find your perfect destination and start planning your next unforgettable journey with SWAY Travel.",
    contactButton: "View Trips",

    // Contact Info
    contactInfoEyebrow: "GET IN TOUCH",
    contactInfoTitle: "Contact SWAY Travel",
    contactInfoText:
      "Have a question or ready to plan your next trip? We are here to help.",

    callUs: "CALL US",
    whatsapp: "WHATSAPP",
    email: "EMAIL",
    office: "OUR OFFICE",
    officeLocation: "Cairo, Egypt",
    followUs: "FOLLOW US",

    // Accessibility
    travelAlt: "Travel",
    toggleMenu: "Toggle navigation menu",
    contactWhatsApp: "Contact us on WhatsApp",

    // Footer
    footerText:
      "Your journey. Your story. Your SWAY.",
    rights:
      "© 2026 SWAY Travel. All rights reserved.",
  },

  ru: {
    // Navbar
    navHome: "Главная",
    navDestinations: "Направления",
    navTrips: "Туры",
    navAbout: "О нас",
    navContact: "Контакты",
    login: "Вход администратора",

    // Trips Page
    tripsBackHome: "← На главную",
    tripsEyebrow:
      "ОТКРОЙТЕ СВОЁ СЛЕДУЮЩЕЕ ПРИКЛЮЧЕНИЕ",
    tripsTitle: "Наши туры",
    tripsDescription:
      "Выберите своё следующее приключение среди тщательно подобранных туров и незабываемых направлений.",
    tripsSearchPlaceholder:
      "Поиск туров или направлений...",
    allTrips: "Все туры",
    trip: "Тур",
    trips: "Туры",
    found: "Найдено",
    noTripsFound: "Туры не найдены.",

    // Trip Card
    viewDetails: "Подробнее",
    durationNotSpecified:
      "Продолжительность не указана",
    priceNotSpecified: "Цена не указана",

    // Trip Details
    backToTrips: "← Назад к турам",
    loadingTrip: "Загрузка тура...",
    tripNotFound: "Тур не найден",
    unableToLoadTrip:
      "Не удалось загрузить этот тур.",
    backToHome: "На главную",
    noDescription: "Описание отсутствует.",
    hotel: "Отель",
    duration: "Продолжительность",
    price: "Цена",
    availableSeats: "Свободные места",
    startDate: "Дата начала",
    endDate: "Дата окончания",
    notSpecified: "Не указано",
    meals: "Питание",
    activities: "Активности",
    transportation: "Транспорт",
    whatsIncluded: "Что включено",
    whatsNotIncluded: "Что не включено",
    bookNow: "Забронировать",

    // Booking
    bookingReceived: "Бронирование получено",
    thankYou: "Спасибо,",
    bookingRequestFor:
      "Ваш запрос на бронирование тура",
    bookingSubmitted: "был успешно отправлен.",
    teamWillContact:
      "Наша команда свяжется с вами в ближайшее время для подтверждения деталей поездки.",
    backToTrip: "Назад к туру",
    bookYourTrip: "ЗАБРОНИРОВАТЬ ТУР",
    completeBooking: "Завершите бронирование",
    bookingDescription:
      "Введите свои данные, и наша команда свяжется с вами для подтверждения бронирования.",
    fullName: "Полное имя",
    enterFullName: "Введите ваше полное имя",
    phoneNumber: "Номер телефона",
    email: "Электронная почта",
    numberOfSeats: "Количество мест",
    travelDate: "Дата поездки",
    notes: "Примечания",
    additionalNotes:
      "Дополнительные заметки или пожелания...",
    submittingBooking: "Отправка бронирования...",
    submitBooking: "Отправить бронирование",

    // Hero
    heroEyebrow:
      "ОТКРОЙ • ИССЛЕДУЙ • ПУТЕШЕСТВУЙ",
    heroTitle: "Ваше путешествие начинается здесь",
    heroText:
      "Откройте для себя незабываемые направления, лучшие туры и уникальные впечатления.",
    heroButton: "Смотреть туры",
    heroScroll: "Прокрутите, чтобы узнать больше",

    // Destinations
    destinationsEyebrow: "ИССЛЕДУЙТЕ МИР",
    destinationsTitle: "Популярные направления",
    destinationsText:
      "Откройте для себя удивительные места, которые ждут вас.",
    destinationText:
      "Красивые места, незабываемые впечатления и новые приключения.",
    explore: "Подробнее",

    // About
    aboutEyebrow: "О SWAY",
    aboutTitle: "Путешествуйте с SWAY",
    aboutText:
      "SWAY Travel — это больше, чем просто путешествия. Мы открываем новые места, создаём уникальные впечатления и помогаем создавать воспоминания на всю жизнь.",
    aboutButton: "Смотреть наши туры",

    // Contact CTA
    contactEyebrow:
      "НАЧНИТЕ СВОЁ ПУТЕШЕСТВИЕ",
    contactTitle: "Готовы к новому приключению?",
    contactText:
      "Выберите идеальное направление и начните планировать своё следующее незабываемое путешествие с SWAY Travel.",
    contactButton: "Смотреть туры",

    // Contact Info
    contactInfoEyebrow: "СВЯЖИТЕСЬ С НАМИ",
    contactInfoTitle:
      "Свяжитесь с SWAY Travel",
    contactInfoText:
      "Есть вопросы или готовы спланировать следующую поездку? Мы готовы помочь.",

    callUs: "ПОЗВОНИТЕ НАМ",
    whatsapp: "WHATSAPP",
    email: "ЭЛЕКТРОННАЯ ПОЧТА",
    office: "НАШ ОФИС",
    officeLocation: "Каир, Египет",
    followUs: "ПОДПИСЫВАЙТЕСЬ НА НАС",

    // Accessibility
    travelAlt: "Путешествия",
    toggleMenu: "Открыть меню навигации",
    contactWhatsApp:
      "Связаться с нами в WhatsApp",

    // Footer
    footerText:
      "Ваше путешествие. Ваша история. Ваш SWAY.",
    rights:
      "© 2026 SWAY Travel. Все права защищены.",
  },
};


export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return (
      localStorage.getItem("sway-language") || "en"
    );
  });

  function changeLanguage(newLanguage) {
    setLanguage(newLanguage);
    localStorage.setItem(
      "sway-language",
      newLanguage
    );
  }

  const t = translations[language];
  const destinations =
    destinationTranslations[language];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
        destinations,
        translateDynamic: (value) =>
          translateDynamic(value, language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}


export function useLanguage() {
  return useContext(LanguageContext);
}