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
          <button class="secondary-button" onclick="registerToRide(${event.id}, ${driver.driver_user_id}, this)">🚗 הרשמה לנסיעה</button>
          </div>
        `;

        driversListContainer.appendChild(driverCard);
      });
    });

  // בקשות ממתינות לאישור - אם המשתמש הוא נהג
  if (currentUserId) {
    fetch(`https://ridematch-a905.onrender.com/pending-passengers/${event.id}?driver_id=${currentUserId}`)
      .then(res => res.json())
      .then(passengers => {
        if (passengers.length === 0) return;

        const section = document.createElement("section");
        section.classList.add("approval-section");

        const heading = document.createElement("h3");
        heading.innerText = "בקשות ממתינות לאישור";
        section.appendChild(heading);

        passengers.forEach(p => {
          const div = document.createElement("div");
          div.innerHTML = `
            <p><strong>${p.username}</strong> ביקש להצטרף</p>
            <button onclick="approvePassenger(${event.id}, ${currentUserId}, ${p.passenger_user_id})">✔️ אשר</button>
          `;
          section.appendChild(div);
        });

        document.body.appendChild(section);
      });
  }

  // אם המשתמש אושר כמשתתף אך עדיין לא שילם – הצג לו אפשרות תשלום
  if (currentUserId) {
    fetch(`https://ridematch-a905.onrender.com/passenger-status/${event.id}?user_id=${currentUserId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "approved") {
          const payButton = document.createElement("button");
          payButton.innerText = "💳 שלם עבור הנסיעה";
          payButton.onclick = () => confirmPayment(event.id, data.driver_user_id, currentUserId);
          document.body.appendChild(payButton);
        }
      });
  }
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
        buttonElement.textContent = "🕒 ממתין לאישור";
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



function approvePassenger(eventId, driverUserId, passengerUserId) {
  fetch("https://ridematch-a905.onrender.com/approve-passenger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_id: eventId, driver_user_id: driverUserId, passenger_user_id: passengerUserId })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      location.reload();
    });
}

function confirmPayment(eventId, driverUserId, passengerUserId) {
  fetch("https://ridematch-a905.onrender.com/confirm-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_id: eventId, driver_user_id: driverUserId, passenger_user_id: passengerUserId })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      location.reload();
    });
}
