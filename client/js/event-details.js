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
        renderDriverCard(driver, event, currentUserId);
      });


      setupSearch(event, drivers, currentUserId);
    });
});

function renderDriverCard(driver, event, currentUserId) {
  const driversListContainer = document.querySelector(".drivers-list");
  const driverCard = document.createElement("div");
  driverCard.classList.add("driver-card");

  let status = null;

  fetch(`https://ridematch-a905.onrender.com/check-registration?event_id=${event.id}&driver_user_id=${driver.driver_user_id}&passenger_user_id=${currentUserId}`)
    .then(res => res.json())
    .then(checkData => {
      if (checkData && checkData.status) {
        status = checkData.status;
      }

      let buttonHTML = "";

      if (status === "paid") {
        buttonHTML = `<button class="disabled-button" disabled>✅ רשום לנסיעה</button>`;
      } else if (status === "approved") {
        buttonHTML = `<button class="pay-button" onclick="startPaymentProcess(this, ${event.id}, ${driver.driver_user_id})">💳 אושרת, שלם בבקשה</button>`;
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
          <a class="primary-button" href="driver-info.html?user_id=${driver.driver_user_id}">ℹ️ למידע על הנהג</a>
          ${buttonHTML}
        </div>
      `;

      driversListContainer.appendChild(driverCard);

      if (parseInt(currentUserId) === parseInt(driver.driver_user_id)) {
        checkPendingJoinRequests(event.id, driver.driver_user_id);
        checkPassengerApprovalStatusOnHome();
      }
    })
    .catch(err => {
      console.error("שגיאה בבדיקת הרשמה מוקדמת:", err);
    });
}

function setupSearch(event, allDrivers, currentUserId) {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredDrivers = allDrivers.filter(driver => {
      const pickup = driver.pickup_location?.toLowerCase() || "";
      const title = event.title?.toLowerCase() || "";
      return pickup.includes(searchTerm) || title.includes(searchTerm);
    });

    const container = document.querySelector(".drivers-list");
    container.innerHTML = "";

    if (!filteredDrivers.length) {
      container.innerHTML = "<p>לא נמצאו נהגים מתאימים.</p>";
      return;
    }

    filteredDrivers.forEach(driver => {
      renderDriverCard(driver, event, currentUserId);
    });
  });
}

function sendMessageToDriver(username) {
  alert(`בעתיד תתווסף מערכת הודעות מול ${username}`);
}

function registerToRide(eventId, driverUserId, buttonElement) {
  const passengerUserId = localStorage.getItem("user_id");

  if (!passengerUserId) {
    alert("עליך להתחבר כדי להירשם לנסיעה.");
    return;
  }

  if (parseInt(passengerUserId) === parseInt(driverUserId)) {
    alert("אינך יכול להירשם לנסיעה של עצמך.");
    return;
  }

  buttonElement.textContent = "⏳ ממתין לאישור";
  buttonElement.disabled = true;
  buttonElement.classList.remove("secondary-button");
  buttonElement.classList.add("disabled-button");

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
      if (!res.ok) {
        alert(data.message || "שגיאה בהרשמה");
        buttonElement.textContent = "🚗 הירשם לנסיעה";
        buttonElement.disabled = false;
        buttonElement.classList.remove("disabled-button");
        buttonElement.classList.add("secondary-button");
      }
    })
    .catch(err => {
      console.error("שגיאה בהרשמה לנסיעה:", err);
      alert("שגיאת רשת");
      buttonElement.textContent = "🚗 הירשם לנסיעה";
      buttonElement.disabled = false;
      buttonElement.classList.remove("disabled-button");
      buttonElement.classList.add("secondary-button");
    });
}

function startPaymentProcess(buttonElement, eventId, driverUserId) {
  const passengerUserId = localStorage.getItem("user_id");

  if (!passengerUserId) {
    alert("עליך להתחבר כדי לשלם.");
    return;
  }

  buttonElement.disabled = true;
  buttonElement.textContent = "🔄 מעבד תשלום...";

  setTimeout(() => {
    fetch("https://ridematch-a905.onrender.com/confirm-payment", {
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
        if (res.ok) {
          buttonElement.textContent = "✅ רשום לנסיעה";
          buttonElement.classList.remove("pay-button");
          buttonElement.classList.add("disabled-button");
        } else {
          buttonElement.textContent = "💳 אושרת, שלם בבקשה";
          buttonElement.disabled = false;
          alert(data.message || "שגיאה בעיבוד תשלום");
        }
      })
      .catch(err => {
        console.error("שגיאה ברשת:", err);
        buttonElement.textContent = "💳 אושרת, שלם בבקשה";
        buttonElement.disabled = false;
        alert("שגיאת רשת. נסה שוב.");
      });
  }, 2000);
}

function checkPendingJoinRequests(eventId, driverUserId) {
  const notified = new Set();

  setInterval(async () => {
    try {
      const res = await fetch(`https://ridematch-a905.onrender.com/driver-requests?event_id=${eventId}&driver_user_id=${driverUserId}`);
      const data = await res.json();

      data.forEach(passenger => {
        if (!notified.has(passenger.passenger_user_id)) {
          showDriverAlert(passenger.username);
          notified.add(passenger.passenger_user_id);
        }
      });
    } catch (err) {
      console.error("שגיאה בבדיקת בקשות הצטרפות:", err);
    }
  }, 5000);
}

function showDriverAlert(username) {
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
  }, 3000);
}

function showPassengerAlert(eventTitle) {
  Swal.fire({
    icon: 'success',
    title: 'אושרת לנסיעה!',
    html: `✅ אושרת לנסיעה: <strong>${eventTitle}</strong><br>תוכל כעת לשלם.`,
    confirmButtonText: 'מעבר לנסיעות שלי',
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
