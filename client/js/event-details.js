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
          <h3>${driver.username}</h3>

          <div class="driver-detail"><i>⏰</i><strong>שעת יציאה:</strong> ${driver.departure_time}</div>
          <div class="driver-detail"><i>🚘</i><strong>רכב:</strong> ${driver.car_model} (${driver.car_color})</div>
          <div class="driver-detail"><i>📍</i><strong>מקום איסוף:</strong> ${driver.pickup_location}</div>
          <div class="driver-detail"><i>💸</i><strong>מחיר:</strong> ${driver.price} ₪</div>
          <div class="driver-detail"><i>🪑</i><strong>מקומות פנויים:</strong> ${driver.seats_available}</div>

          <div class="driver-actions">
            <button class="primary-button" onclick="sendMessageToDriver('${driver.username}')">💬 שליחת הודעה</button>
            <button class="secondary-button" onclick="registerToRide(${event.id}, ${driver.driver_user_id})">🚗 הרשמה לנסיעה</button>
          </div>
        `;

        driversListContainer.appendChild(driverCard);
      });
    })
    .catch(err => {
      console.error("שגיאה בטעינת הנהגים:", err);
      driversListContainer.innerHTML = "<p>שגיאה בטעינת הנהגים מהשרת.</p>";
    });
});

// פונקציה לשליחת הודעה (עתידית)
function sendMessageToDriver(username) {
  alert(`בעתיד תתווסף מערכת הודעות מול ${username}`);
}

// פונקציה להרשמה לנסיעה
function registerToRide(eventId, driverUserId) {
  const passengerUserId = localStorage.getItem("user_id");

  if (!passengerUserId) {
    alert("עליך להתחבר כדי להירשם לנסיעה.");
    return;
  }

  fetch("https://ridematch-a905.onrender.com/join-ride", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event_id: eventId,
      driver_user_id: driverUserId,
      passenger_user_id: passengerUserId
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
    })
    .catch(err => {
      console.error("שגיאה בהרשמה:", err);
      alert("שגיאה בעת ההרשמה לנסיעה");
    });
}
