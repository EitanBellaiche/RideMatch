document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id");

  if (!userId) {
    alert("לא מחובר");
    window.location.href = "login.html";
    return;
  }

  // ברירת מחדל: הצג נסיעות כנהג
  loadTrips("driver");

  document.getElementById("driverView").addEventListener("click", () => {
    loadTrips("driver");
  });

  document.getElementById("passengerView").addEventListener("click", () => {
    loadTrips("passenger");
  });
});

const baseUrl = "https://ridematch-a905.onrender.com"; // ודא שזו כתובת השרת שלך

async function loadTrips(role) {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const upcomingSection = document.querySelector(".trip-section.upcoming");
  upcomingSection.innerHTML = "<h2>🟢 נסיעות מתוכננות</h2>";

  const endpoint = role === "driver"
    ? `${baseUrl}/driver-trips`
    : `${baseUrl}/passenger-trips`;

  try {
    const response = await fetch(`${endpoint}?user_id=${userId}`);
    if (!response.ok) throw new Error("Network response was not ok");

    const trips = await response.json();
    const now = new Date();
    let hasUpcoming = false;

    trips.forEach(trip => {
      const tripDateTime = new Date(`${trip.date}T${trip.time}`);
      if (tripDateTime >= now) {
        const tripCard = document.createElement("article");
        tripCard.classList.add("trip-card");

        tripCard.innerHTML = `
          <h3>${trip.title}</h3>
          <p>📅 תאריך: ${trip.date} | 🕒 שעה: ${trip.time}</p>
          <p>🚘 נהג: ${trip.driver_name || 'לא ידוע'}</p>
          <p>📍 מקום איסוף: ${trip.pickup_location || '---'}</p>
          <a href="event-details.html?id=${trip.event_id}" class="details-button">צפה בפרטים</a>
        `;

        upcomingSection.appendChild(tripCard);
        hasUpcoming = true;
      }
    });

    if (!hasUpcoming) {
      upcomingSection.innerHTML += "<p>לא נמצאו נסיעות מתוכננות</p>";
    }

  } catch (err) {
    console.error("שגיאה בטעינת נסיעות:", err);
    upcomingSection.innerHTML += "<p style='color: red;'>שגיאה בטעינת נסיעות</p>";
  }
}
