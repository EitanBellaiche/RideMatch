document.addEventListener("DOMContentLoaded", async () => {
  const eventData = localStorage.getItem("selectedEvent");
  const currentUserId = localStorage.getItem("user_id");

  if (!eventData) {
    document.querySelector(".event-header h1").innerText = "אירוע לא נמצא";
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

  try {
    const res = await fetch(`https://ridematch-a905.onrender.com/drivers/${event.id}`);
    const allDrivers = await res.json();

    renderDrivers(allDrivers, currentUserId);
    setupSearch(event, allDrivers, currentUserId);
  } catch (err) {
    console.error("שגיאה בטעינת הנהגים:", err);
    document.querySelector(".drivers-list").innerHTML = "<p>שגיאה בטעינת נהגים.</p>";
  }
});

function renderDrivers(driverList, currentUserId) {
  const container = document.querySelector(".drivers-list");
  container.innerHTML = "";

  if (!driverList.length) {
    container.innerHTML = "<p>לא נמצאו נהגים מתאימים.</p>";
    return;
  }

  driverList.forEach(async driver => {
    const driverCard = document.createElement("div");
    driverCard.classList.add("driver-card");

    let status = null;

    try {
      const checkRes = await fetch(`https://ridematch-a905.onrender.com/check-registration?event_id=${event.id}&driver_user_id=${driver.driver_user_id}&passenger_user_id=${currentUserId}`);
      const checkData = await checkRes.json();
      if (checkRes.ok) status = checkData.status;
    } catch (e) {
      console.error("שגיאה בבדיקת הרשמה מוקדמת:", e);
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

    container.appendChild(driverCard);
  });
}

function setupSearch(event, allDrivers, currentUserId) {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filtered = allDrivers.filter(driver => {
      const pickup = driver.pickup_location?.toLowerCase() || "";
      const title = event.title?.toLowerCase() || "";
      return pickup.includes(searchTerm) || title.includes(searchTerm);
    });

    renderDrivers(filtered, currentUserId);
  });
}
