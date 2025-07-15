document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");
  const driverUserId = localStorage.getItem("user_id");

  if (!eventId || !driverUserId) {
    document.getElementById("trip-details").innerText = "אירוע לא נמצא.";
    return;
  }

  // שלב 1: הצגת פרטי הנסיעה
  try {
    const eventRes = await fetch(`https://ridematch-a905.onrender.com/events`);
    const allEvents = await eventRes.json();
    const event = allEvents.find(e => e.id == eventId);

    if (!event) {
      document.getElementById("trip-details").innerHTML = "<p>אירוע לא נמצא.</p>";
      return;
    }

    document.getElementById("trip-details").innerHTML = `
      <div class="trip-card">
        <h3>${event.title}</h3>
        <p>📅 ${event.day} ⏰ ${event.time}</p>
        <p>📍 ${event.location}</p>
      </div>
    `;
  } catch (err) {
    console.error("שגיאה בקבלת פרטי האירוע:", err);
  }

  // שלב 2: הצגת נוסעים שממתינים לאישור
  try {
    const response = await fetch(`https://ridematch-a905.onrender.com/driver-requests?event_id=${eventId}&driver_user_id=${driverUserId}`);
    const passengers = await response.json();

    const requestsContainer = document.getElementById("passenger-requests");
    requestsContainer.innerHTML = "";

    if (!passengers.length) {
      requestsContainer.innerHTML = "<p>אין בקשות להצטרפות כרגע.</p>";
      return;
    }

    passengers.forEach(passenger => {
      const div = document.createElement("div");
      div.className = "trip-card";
      div.innerHTML = `
        <p><strong>שם:</strong> ${passenger.username}</p>
        <p><strong>סטטוס:</strong> ${passenger.status}</p>
        <button onclick="approvePassenger(${eventId}, ${driverUserId}, ${passenger.passenger_user_id}, this)">אשר הצטרפות</button>
      `;
      requestsContainer.appendChild(div);
    });
  } catch (err) {
    console.error("שגיאה בקבלת הנוסעים:", err);
  }
});

async function approvePassenger(eventId, driverId, passengerId, button) {
  try {
    const res = await fetch("https://ridematch-a905.onrender.com/approve-passenger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        driver_user_id: driverId,
        passenger_user_id: passengerId
      })
    });

    const data = await res.json();
    if (res.ok) {
      button.innerText = "✅ אושר";
      button.disabled = true;
    } else {
      alert(data.message || "שגיאה באישור");
    }
  } catch (err) {
    console.error("שגיאה באישור נוסע:", err);
    alert("שגיאה באישור");
  }
}
