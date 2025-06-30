document.addEventListener("DOMContentLoaded", async () => {
  const eventsGrid = document.querySelector(".events-grid");

  try {
    const res = await fetch("https://ridematch-a905.onrender.com/events");
    const events = await res.json();

    eventsGrid.innerHTML = "";

    events.forEach(event => {
      const article = document.createElement("article");
      article.classList.add("event-card");

      article.innerHTML = `
        <header class="event-info">
          <h3>${event.title}</h3>
          <p>📍 ${event.location} | 🕒 ${event.day} ${event.time}</p>
        </header>
        <a href="event-details.html" class="details-button">צפה בפרטים</a>
      `;

      eventsGrid.appendChild(article);
    });
  } catch (err) {
    console.error("Failed to load events:", err);
    eventsGrid.innerHTML = "<p>אירעה שגיאה בטעינת האירועים.</p>";
  }
});
