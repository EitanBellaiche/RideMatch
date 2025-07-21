const baseUrl = "https://ridematch-a905.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");
  const driverUserId = localStorage.getItem("user_id");

  if (!eventId || !driverUserId) {
    document.getElementById("trip-details").innerText = "אירוע לא נמצא.";
    return;
  }

  // שלב 1: פרטי נסיעה
  try {
    const eventRes = await fetch(`${baseUrl}/events`);
    const allEvents = await eventRes.json();
    const event = allEvents.find(e => e.id == eventId);

    if (!event) {
      document.getElementById("trip-details").innerHTML = "<p>אירוע לא נמצא.</p>";
      return;
    }

    document.getElementById("trip-details").innerHTML = `
      <div class="trip-card">
        <h3>${event.title}</h3>
        <p>📅 ${event.date} ⏰ ${event.departure_time}</p>
        <p>📍 ${event.pickup_location}</p>
      </div>
    `;
  } catch (err) {
    console.error("שגיאה בקבלת פרטי האירוע:", err);
  }

  // שלב 2: נוסעים מאושרים
  try {
    const approvedRes = await fetch(`${baseUrl}/approved-passengers?event_id=${eventId}`);
    const approved = await approvedRes.json();
    const container = document.getElementById("approved-passengers");

    if (!approved.length) {
      container.innerHTML = "<p>אין נוסעים מאושרים עדיין.</p>";
    } else {
      approved.forEach(p => {
        const div = document.createElement("div");
        div.className = "trip-card";
        div.innerHTML = `<p><strong>👤 ${p.username}</strong></p>`;
        container.appendChild(div);
      });
    }
  } catch (err) {
    console.error("שגיאה בטעינת נוסעים מאושרים:", err);
  }

  // שלב 3: בקשות להצטרפות
  try {
    const res = await fetch(`${baseUrl}/driver-requests?event_id=${eventId}&driver_user_id=${driverUserId}`);
    const passengers = await res.json();
    const requestsContainer = document.getElementById("passenger-requests");

    if (!passengers.length) {
      requestsContainer.innerHTML = "<p>אין בקשות להצטרפות כרגע.</p>";
    } else {
      passengers.forEach(passenger => {
        const div = document.createElement("div");
        div.className = "trip-card";
        div.innerHTML = `
          <p><strong>שם:</strong> ${passenger.username}</p>
          <p><strong>סטטוס:</strong> ${passenger.status}</p>
          <button onclick="approvePassenger(${eventId}, ${driverUserId}, ${passenger.passenger_user_id}, this)">
            אשר הצטרפות
          </button>
        `;
        requestsContainer.appendChild(div);
      });
    }
  } catch (err) {
    console.error("שגיאה בקבלת הנוסעים:", err);
  }

  // שלב 4: צ'אט
  loadMessages(eventId);
  setInterval(() => loadMessages(eventId), 5000);
});

async function approvePassenger(eventId, driverId, passengerId, button) {
  try {
    const res = await fetch(`${baseUrl}/approve-passenger`, {
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

async function loadMessages(eventId) {
  try {
    const res = await fetch(`${baseUrl}/get-messages?event_id=${eventId}`);
    const messages = await res.json();
    const box = document.getElementById("chat-box");
    box.innerHTML = messages.map(m => `<p><strong>${m.username}:</strong> ${m.content}</p>`).join("");
  } catch (err) {
    console.error("שגיאה בטעינת הודעות:", err);
  }
}

async function sendMessage() {
  const eventId = new URLSearchParams(window.location.search).get("event_id");
  const userId = localStorage.getItem("user_id");
  const content = document.getElementById("chat-message").value.trim();
  if (!content) return;

  try {
    await fetch(`${baseUrl}/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, user_id: userId, content })
    });

    document.getElementById("chat-message").value = "";
    loadMessages(eventId);
  } catch (err) {
    console.error("שגיאה בשליחת הודעה:", err);
  }
}
