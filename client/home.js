document.addEventListener("DOMContentLoaded", async () => {
  const eventsSection = document.querySelector(".events-section");

  try {
    const res = await fetch("https://ridematch-a905.onrender.com/events");
    const events = await res.json();

    eventsSection.innerHTML = "<h2>אירועים השבוע</h2>";

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

      eventsSection.appendChild(article);
    });
  } catch (err) {
    console.error("Failed to load events:", err);
    eventsSection.innerHTML += "<p>אירעה שגיאה בטעינת האירועים.</p>";
  }
});
