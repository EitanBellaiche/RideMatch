document.addEventListener("DOMContentLoaded", () => {
  const eventData = localStorage.getItem("selectedEvent");
  const currentUserId = localStorage.getItem("user_id");

  if (!eventData) {
    document.querySelector(".event-header h1").innerText = "אירוע לא נמצא";
    document.querySelector(".event-header p").innerText = "";
    return;
  }

  const event = JSON.parse(eventData);
  document.querySelector(".event-header h1").innerText = event.title;
  document.querySelector(".event-header p").innerText =
    `📍 ${event.location} | 🕒 ${event.day} ${event.time}`;

  const addDriverLink = document.getElementById("addDriverLink");
  if (addDriverLink && event.id) {
    addDriverLink.href = `add-driver.html?id=${event.id}`;
  }

  const driversListContainer = document.querySelector(".drivers-list");

  fetch(`https://ridematch-a905.onrender.com/drivers/${event.id}`)
    .then(res => res.json())
    .then(drivers => {
      if (!drivers.length) {
        driversListContainer.innerHTML = "<p>לא נוספו עדיין נהגים לאירוע.</p>";
        return;
      }

      drivers.forEach(async driver => {
        const driverCard = document.createElement("div");
        driverCard.classList.add("driver-card");

        let status = null;

        // שלב חדש: בדוק אם המשתמש כבר נרשם לנסיעה זו
        try {
          const checkRes = await fetch(`https://ridematch-a905.onrender.com/check-registration?event_id=${event.id}&driver_user_id=${driver.driver_user_id}&passenger_user_id=${currentUserId}`);
          const checkData = await checkRes.json();
          if (checkRes.ok) {
            status = checkData.status; // יכול להיות 'pending', 'paid', או null
          }
        } catch (e) {
          console.error("שגיאה בבדיקת הרשמה מוקדמת:", e);
        }

        // תוכן הכפתור בהתאם לסטטוס
        let buttonHTML = "";

        if (status === "paid") {
          buttonHTML = `<button class="disabled-button" disabled>✅ רשום לנסיעה</button>`;
        } else if (status === "pending") {
          buttonHTML = `<button class="disabled-button" disabled>⏳ ממתין לאישור</button>`;
        } else {
          buttonHTML = `<button class="secondary-button" onclick="registerToRide(${event.id}, ${driver.driver_user_id}, this)">🚗 הירשם לנסיעה</button>`;
        }

        driverCard.innerHTML = `
    <h3>${driver.username}</h3>
    <div class="driver-detail"><i>⏰</i><strong>שעת יציאה:</strong> ${driver.departure_time}</div>
    <div class="driver-detail"><i>🚘</i><strong>רכב:</strong> ${driver.car_model} (${driver.car_color})</div>
    <div class="driver-detail"><i>📍</i><strong>מקום איסוף:</strong> ${driver.pickup_location}</div>
    <div class="driver-detail"><i>💸</i><strong>מחיר:</strong> ${driver.price} ₪</div>
    <div class="driver-detail"><i>🪑</i><strong>מקומות פנויים:</strong> ${driver.seats_available}</div>
    <div class="driver-actions">
      <button class="primary-button" onclick="sendMessageToDriver('${driver.username}')">💬 שליחת הודעה</button>
      ${buttonHTML}
    </div>
  `;

        driversListContainer.appendChild(driverCard);
      });

    });
});

function sendMessageToDriver(username) {
  alert(`בעתיד תתווסף מערכת הודעות מול ${username}`);
}

function registerToRide(eventId, driverUserId, buttonElement) {
  const passengerUserId = localStorage.getItem("user_id");

  if (!passengerUserId) {
    alert("עליך להתחבר כדי להירשם לנסיעה.");
    return;
  }

  fetch("https://ridematch-a905.onrender.com/join-ride", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: eventId,
      driver_user_id: driverUserId,
      passenger_user_id: passengerUserId
    })
  })
    .then(async res => {
      const data = await res.json();
      alert(data.message);
      if (res.ok && buttonElement) {
        buttonElement.textContent = "✅ נרשמת לנסיעה";
        buttonElement.disabled = true;
        buttonElement.classList.remove("secondary-button");
        buttonElement.classList.add("disabled-button");
      }
    })
    .catch(err => {
      console.error("שגיאה בהרשמה לנסיעה:", err);
      alert("שגיאת רשת");
    });
}
