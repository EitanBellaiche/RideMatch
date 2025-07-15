document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id"); 

  if (!userId) {
    alert("לא מחובר");
    window.location.href = "login.html";
    return;
  }
});

async function loadTrips(role) {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const upcomingSection = document.querySelector(".trip-section.upcoming");
  const pastSection = document.querySelector(".trip-section.past");

  
  upcomingSection.innerHTML = "<h2>🟢 נסיעות מתוכננות</h2>";
  pastSection.innerHTML = "<h2>⚪ נסיעות קודמות</h2>";

  const endpoint = role === "driver" ? "/driver-trips" : "/passenger-trips";

  try {
    const response = await fetch(`${endpoint}?user_id=${userId}`);
    const trips = await response.json();

    trips.forEach(trip => {
      const tripCard = document.createElement("article");
      tripCard.classList.add("trip-card");

      tripCard.innerHTML = `
        <h3>${trip.title}</h3>
        <p>📅 תאריך: ${trip.date} | 🕒 שעה: ${trip.time}</p>
        <p>🚘 נהג: ${trip.driver_name || 'לא ידוע'}</p>
        <p>📍 מקום איסוף: ${trip.pickup_location || '---'}</p>
        <a href="event-details.html?id=${trip.event_id}" class="details-button">צפה בפרטים</a>
      `;

      const tripDate = new Date(trip.date);
      const now = new Date();
      const section = tripDate >= now ? upcomingSection : pastSection;
      section.appendChild(tripCard);
    });

    if (trips.length === 0) {
      upcomingSection.innerHTML += "<p>לא נמצאו נסיעות</p>";
    }

  } catch (err) {
    console.error("שגיאה בטעינת נסיעות:", err);
  }
}
