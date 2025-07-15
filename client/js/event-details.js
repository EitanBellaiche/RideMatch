document.addEventListener("DOMContentLoaded", () => {
  const eventData = localStorage.getItem("selectedEvent");

  if (!eventData) {
    document.querySelector(".event-header h1").innerText = "אירוע לא נמצא";
    document.querySelector(".event-header p").innerText = "";
    return;
  }

  const event = JSON.parse(eventData);

  // הצגת פרטי האירוע
  document.querySelector(".event-header h1").innerText = event.title;
  document.querySelector(".event-header p").innerText =
    `📍 ${event.location} | 🕒 ${event.day} ${event.time}`;

  // קישור הוספת נהג
  const addDriverLink = document.getElementById("addDriverLink");
  if (addDriverLink && event.id) {
    addDriverLink.href = `add-driver.html?id=${event.id}`;
  }

  // הצגת הנהגים
  const driversListContainer = document.querySelector(".drivers-list");

  fetch(`https://ridematch-a905.onrender.com/drivers/${event.id}`)
    .then(res => res.json())
    .then(drivers => {
      if (!drivers.length) {
        driversListContainer.innerHTML = "<p>לא נוספו עדיין נהגים לאירוע.</p>";
        return;
      }

      drivers.forEach(driver => {
        const driverCard = document.createElement("div");
        driverCard.classList.add("driver-card");
        driverCard.innerHTML = `
          <p><strong>${driver.username}</strong></p>
          <p>⏰ שעת יציאה: ${driver.departure_time}</p>
          <p>🚘 רכב: ${driver.car_model} (${driver.car_color})</p>
          <p>📍 מקום איסוף: ${driver.pickup_location}</p>
          <p>💸 מחיר לנוסע: ${driver.price} ₪</p>
          <p>🪑 מקומות פנויים: ${driver.seats_available}</p>
        `;
        driversListContainer.appendChild(driverCard);
      });
    })
    .catch(err => {
      console.error("שגיאה בטעינת הנהגים:", err);
      driversListContainer.innerHTML = "<p>שגיאה בטעינת הנהגים מהשרת.</p>";
    });
});
