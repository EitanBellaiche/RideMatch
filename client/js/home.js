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

  function renderEvents(events) {
    eventsGrid.innerHTML = "";
    if (events.length === 0) {
      eventsGrid.innerHTML = "<p>לא נמצאו אירועים מתאימים.</p>";
      return;
    }

    events.forEach(event => {
      const article = document.createElement("article");
      article.classList.add("event-card");

      article.innerHTML = `
        <header class="event-info">
          <h3>${event.title}</h3>
          <p>📍 ${event.location} | 🕒 ${event.day} ${event.time}</p>
        </header>
        <a href="event-details.html?id=${event.id}" class="details-button" data-event='${JSON.stringify(event)}'>צפה בפרטים</a>
      `;

      eventsGrid.appendChild(article);
    });
  }

  // event details storage
  eventsGrid.addEventListener("click", (e) => {
    if (e.target.matches(".details-button")) {
      e.preventDefault();
      const eventData = e.target.dataset.event;
      localStorage.setItem("selectedEvent", eventData);
      window.location.href = e.target.href;
    }
  });
});
