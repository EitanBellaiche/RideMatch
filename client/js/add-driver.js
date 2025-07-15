document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addDriverForm");
  const driversContainer = document.getElementById("driversList"); // ודא שיש אלמנט כזה ב־HTML

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");
  const userId = localStorage.getItem("user_id");

  // אם חסר eventId – לא טוען כלום
  if (!eventId) {
    alert("לא נמצא מזהה אירוע ב־URL");
    return;
  }

  // 🟦 שלב 1: הצגת הנהגים באירוע
  fetch(`https://ridematch-a905.onrender.com/drivers/${eventId}`)
    .then(res => res.json())
    .then(drivers => {
      if (!drivers.length) {
        driversContainer.innerHTML = "<p>אין עדיין נהגים לאירוע הזה.</p>";
        return;
      }

      drivers.forEach(driver => {
        const driverDiv = document.createElement("div");
        driverDiv.classList.add("driver-card");
        driverDiv.innerHTML = `
          <p><strong>${driver.username}</strong></p>
          <p>⏰ שעת יציאה: ${driver.departure_time}</p>
          <p>🚘 רכב: ${driver.car_model} (${driver.car_color})</p>
          <p>📍 מקום איסוף: ${driver.pickup_location}</p>
          <p>💸 מחיר לנוסע: ${driver.price} ₪</p>
          <p>🪑 מקומות פנויים: ${driver.seats_available}</p>
        `;
        driversContainer.appendChild(driverDiv);
      });
    })
    .catch(err => {
      console.error("שגיאה בקבלת הנהגים:", err);
      driversContainer.innerHTML = "<p>שגיאה בטעינת הנהגים.</p>";
    });

  // 🟩 שלב 2: הוספת נהג חדש בטופס
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!eventId || !userId) {
      alert("משהו השתבש - חסר מזהה אירוע או משתמש.");
      return;
    }

    const driverData = {
      event_id: eventId,
      user_id: userId,
      departure_time: document.getElementById("departure_time").value,
      price: document.getElementById("price").value,
      car_model: document.getElementById("car_model").value,
      car_color: document.getElementById("car_color").value,
      pickup_location: document.getElementById("pickup_location").value,
      seats_available: document.getElementById("seats_available").value
    };

    try {
      const response = await fetch("https://ridematch-a905.onrender.com/add-driver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(driverData)
      });

      if (response.ok) {
        alert("נוספת בהצלחה כנהג לאירוע!");
        window.location.href = `event-details.html?id=${eventId}`;
      } else {
        const errMsg = await response.text();
        console.error("Error adding driver:", errMsg);
        alert("שגיאה בהוספת נהג. נסה שוב.");
      }
    } catch (err) {
      console.error("Error adding driver:", err);
      alert("שגיאת רשת. נסה שוב מאוחר יותר.");
    }
  });
});