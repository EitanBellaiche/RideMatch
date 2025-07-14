document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  console.log("eventId is:", eventId); // בדיקה שה-id קיים

  if (!eventId) {
    console.error("No event ID found in URL");
    return;
  }

  try {
    const res = await fetch(`https://ridematch-a905.onrender.com/events/${eventId}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Response data:", data); // בדיקה שהתשובה מגיעה תקינה

    if (!data.event) {
      console.error("No event data found");
      document.querySelector(".event-header h1").innerText = "אירוע לא נמצא";
      return;
    }

    // עדכון כותרת האירוע
    document.querySelector(".event-header h1").innerText = data.event.title;
    document.querySelector(".event-header p").innerText =
      `📍 ${data.event.location} | 🕒 ${data.event.day} ${data.event.time}`;

    // עדכון אזור הנהגים
    const driversList = document.querySelector(".drivers-list");
    driversList.innerHTML = ""; // ניקוי קודם

    if (!data.drivers || data.drivers.length === 0) {
      driversList.innerHTML = "<p>אין נהגים זמינים כרגע לאירוע זה.</p>";
    } else {
      data.drivers.forEach(driver => {
        const article = document.createElement("article");
        article.classList.add("driver-card");

        article.innerHTML = `
          <header class="driver-info">
            <h3>${driver.username}</h3>
            <p>⏰ יציאה: ${driver.departure_time}</p>
            <p>💸 מחיר: ${driver.price} ש"ח</p>
            <p>🚘 רכב: ${driver.car_model}, ${driver.car_color}</p>
            <p>📍 מקום איסוף: ${driver.pickup_location}</p>
            <p>🪑 מקומות פנויים: ${driver.seats_available}</p>
          </header>
          <footer class="driver-actions">
            <button class="primary-button">שלח הודעה</button>
            <button class="secondary-button">הזמנת נסיעה</button>
          </footer>
        `;

        driversList.appendChild(article);
      });
    }

  } catch (err) {
    console.error("Failed to load event details:", err);
    document.querySelector(".event-header h1").innerText = "אירעה שגיאה בטעינת פרטי האירוע";
  }
});
