let allEvents = [];

document.addEventListener("DOMContentLoaded", async () => {
  const greetingEl = document.getElementById("greeting");
  const username = localStorage.getItem("username");
  if (username && greetingEl) {
    greetingEl.textContent = `שלום ${username}`;
  }

  const eventsGrid = document.querySelector(".events-grid");
  const searchInput = document.querySelector(".search-container input");

  const normalize = str =>
    str?.toString().trim().toLowerCase().replace(/[\u05BE-\u05C7]/g, "");

  try {
    const res = await fetch("https://ridematch-a905.onrender.com/events");
    allEvents = await res.json();
    console.log("All events loaded:", allEvents);
    renderEvents(allEvents);
  } catch (err) {
    console.error("Failed to load events:", err);
    eventsGrid.innerHTML = "<p>אירעה שגיאה בטעינת האירועים.</p>";
  }

  searchInput.addEventListener("input", () => {
    const searchTerm = normalize(searchInput.value);
    const filtered = allEvents.filter(event => {
      const title = normalize(event.title);
      const location = normalize(event.location);
      return title.includes(searchTerm) || location.includes(searchTerm);
    });
    renderEvents(filtered);
  });

  eventsGrid.addEventListener("click", (e) => {
    if (e.target.matches(".details-button")) {
      e.preventDefault();
      const eventData = e.target.dataset.event;
      localStorage.setItem("selectedEvent", eventData);
      window.location.href = e.target.href;
    }
  });

  checkPendingRequestsOnHome();
  checkPassengerApprovalStatusOnHome();
});
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function renderEvents(events) {
  const eventsGrid = document.querySelector(".events-grid");
  eventsGrid.innerHTML = "";

  if (events.length === 0) {
    eventsGrid.innerHTML = "<p>לא נמצאו אירועים מתאימים.</p>";
    return;
  }

  events.forEach(event => {
    const article = document.createElement("article");
    article.classList.add("event-card");

    const formattedDate = formatDate(event.event_date);

    article.innerHTML = `
      <header class="event-info">
        <h3>${event.title}</h3>
        <p>📅 ${formattedDate} | 📍 ${event.location} | 🕒 ${event.day} ${event.time}</p>
      </header>
      <a href="event-details.html?id=${event.id}" class="details-button" data-event='${JSON.stringify(event)}'>צפה בפרטים</a>
    `;

    eventsGrid.appendChild(article);
  });
}


function checkPendingRequestsOnHome() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const notifiedEvents = new Set();

  setInterval(async () => {
    try {
      const tripsRes = await fetch(`https://ridematch-a905.onrender.com/driver-trips?user_id=${userId}`);
      const driverTrips = await tripsRes.json();

      for (const trip of driverTrips) {
        const eventId = trip.event_id;

        if (notifiedEvents.has(eventId)) continue;

        const pendingRes = await fetch(`https://ridematch-a905.onrender.com/driver-requests?event_id=${eventId}&driver_user_id=${userId}`);
        const pending = await pendingRes.json();

        if (pending.length > 0) {
          showHomeAlert(pending[0].username); // מציג את הראשון בלבד
          notifiedEvents.add(eventId); // לא נציג שוב את אותו האירוע
        }
      }
    } catch (err) {
      console.error("שגיאה בבדיקת בקשות ממתינות בדף הבית:", err);
    }
  }, 3000); // כל 3 שניות
}

function showHomeAlert(username) {
  Swal.fire({
    icon: 'info',
    title: 'בקשה חדשה לנסיעה',
    html: `🚨 נוסע בשם <strong>${username}</strong> ממתין לאישור שלך.`,
    confirmButtonText: 'צפייה בנסיעות שלי',
    cancelButtonText: 'סגור',
    showCancelButton: true,
    confirmButtonColor: '#2563EB',
    cancelButtonColor: '#6B7280'
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = 'my-trips.html';
    }
  });
}

function checkPassengerApprovalStatusOnHome() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const approvedTripsNotified = new Set();

  setInterval(async () => {
    try {
      const res = await fetch(`https://ridematch-a905.onrender.com/passenger-trips?user_id=${userId}`);
      const trips = await res.json();

      trips.forEach(trip => {
        if (
          trip.status === "approved" &&
          !approvedTripsNotified.has(trip.event_id)
        ) {
          showPassengerAlert(trip.title);
          approvedTripsNotified.add(trip.event_id);
        }
      });
    } catch (err) {
      console.error("שגיאה בבדיקת סטטוס לנוסע בדף הבית:", err);
    }
  }, 3000); // כל 3 שניות
}

function showPassengerAlert(eventTitle) {
  Swal.fire({
    icon: 'success',
    title: `אושרת לנסיעה: ${eventTitle}`,
    text: 'תוכל כעת לשלם ולגשת לנסיעות שלך.',
    confirmButtonText: 'לנסיעות שלי',
    cancelButtonText: 'סגור',
    showCancelButton: true,
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280'
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = 'my-trips.html';
    }
  });
}

