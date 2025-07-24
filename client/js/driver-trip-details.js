const baseUrl = "https://ridematch-a905.onrender.com";
let isPastTrip = false;


function idToColor(id) {
  let hash = parseInt(id); // ודא שזה מספר
  const r = (hash * 123) % 255;
  const g = (hash * 456) % 255;
  const b = (hash * 789) % 255;
  return `rgb(${r}, ${g}, ${b})`;
}


const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get("event_id");
const driverUserId = localStorage.getItem("user_id"); 

document.addEventListener("DOMContentLoaded", async () => {
  if (!eventId || !driverUserId) {
    document.getElementById("trip-details").innerText = "אירוע לא נמצא.";
    return;
  }


  try {
    const res = await fetch(`${baseUrl}/driver-trip-details?event_id=${eventId}&driver_user_id=${driverUserId}`);
    const trip = await res.json();
    const tripDate = new Date(trip.event_date);
    const now = new Date();
    isPastTrip = tripDate < now;


    if (!trip || !trip.title) {
      document.getElementById("trip-details").innerHTML = "<p>אירוע לא נמצא.</p>";
      return;
    }

    document.getElementById("trip-details").innerHTML = `
    <div class="trip-card">
      <h3>${trip.title}</h3>
      <p>📅 ${trip.date} ⏰ ${trip.departure_time}</p>
      <p>📍 ${trip.pickup_location}</p>
    </div>
  `;
  } catch (err) {
    console.error("שגיאה בקבלת פרטי הנסיעה:", err);
  }


  // שלב 2: נוסעים מאושרים
  try {
    const approvedRes = await fetch(`${baseUrl}/approved-passengers?event_id=${eventId}&driver_user_id=${driverUserId}`);
    const approved = await approvedRes.json();
    const container = document.getElementById("approved-passengers");

    if (!approved.length) {
      container.innerHTML = "<p>אין נוסעים מאושרים עדיין.</p>";
    } else {
      approved.forEach(p => {
        const div = document.createElement("div");
        div.className = "trip-card";

        div.innerHTML = `
    <p><strong>👤 ${p.username}</strong></p>
    ${isPastTrip ? `
      <label>⭐ דירוג:
        <select id="rating-${p.passenger_user_id}">
          <option value="1">⭐</option>
          <option value="2">⭐⭐</option>
          <option value="3">⭐⭐⭐</option>
          <option value="4">⭐⭐⭐⭐</option>
          <option value="5">⭐⭐⭐⭐⭐</option>
        </select>
      </label>
      <br>
      <textarea id="comment-${p.passenger_user_id}" placeholder="הוסף תגובה" rows="2"></textarea>
      <br>
      <button onclick="submitReview(${eventId}, ${driverUserId}, ${p.passenger_user_id}, 'driver')">
        שלח ביקורת
      </button>
    ` : ''}
  `;

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
      passengers.forEach(async (passenger) => {
        const div = document.createElement("div");
        div.className = "trip-card";

        // קבלת ביקורות לנוסע
        let reviewsHtml = "<p>אין ביקורות זמינות</p>";
        try {
          const res = await fetch(`${baseUrl}/reviews?reviewee_user_id=${passenger.passenger_user_id}`);
          const reviews = await res.json();

          if (reviews.length > 0) {
            reviewsHtml = reviews.map(r => `
        <div class="review-box">
          <strong>${r.reviewer_username}</strong> דירג: ⭐ ${r.rating}
          <p>${r.comment || ''}</p>
        </div>
      `).join('');
          }
        } catch (err) {
          console.error("שגיאה בקבלת ביקורות לנוסע:", err);
        }

        div.innerHTML = `
    <p><strong>שם:</strong> ${passenger.username}</p>
    <p><strong>סטטוס:</strong> ${passenger.status}</p>
    <div><strong>ביקורות:</strong><br>${reviewsHtml}</div>
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

  const userId = localStorage.getItem("user_id");
  loadMessages(eventId, userId);

setInterval(() => loadMessages(eventId, userId), 5000);

async function loadMessages(eventId, userId) {
  try {
const res = await fetch(`${baseUrl}/get-messages?event_id=${eventId}&user_id=${userId}&driver_user_id=${driverUserId}`);    const messages = await res.json();

    if (!Array.isArray(messages)) {
      console.error("התגובה אינה מערך:", messages);
      return;
    }

    const box = document.getElementById("chat-box");
    box.innerHTML = messages.map(m => {
const color = idToColor(m.user_id);
      return `<p><strong style="color: ${color}">${m.username}:</strong> ${m.content}</p>`;
    }).join("");
  } catch (err) {
    console.error("שגיאה בטעינת הודעות:", err);
  }
}


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

async function sendMessage() {
  const eventId = new URLSearchParams(window.location.search).get("event_id");
  const userId = localStorage.getItem("user_id");
  const content = document.getElementById("chat-message").value.trim();
  if (!content) return;

  try {
    await fetch(`${baseUrl}/send-message`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    event_id: eventId,
    user_id: userId,
    driver_user_id: driverUserId,
    content
  })
});


    document.getElementById("chat-message").value = "";
    loadMessages(eventId, userId);
  } catch (err) {
    console.error("שגיאה בשליחת הודעה:", err);
  }
}
async function submitReview(eventId, reviewerId, revieweeId, reviewerRole) {
  const rating = document.getElementById(`rating-${revieweeId}`).value;
  const comment = document.getElementById(`comment-${revieweeId}`).value;
  const button = document.querySelector(`button[onclick*="submitReview(${eventId}, ${reviewerId}, ${revieweeId}`); // הכפתור הרלוונטי

  try {
    const res = await fetch(`${baseUrl}/submit-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        reviewer_user_id: reviewerId,
        reviewee_user_id: revieweeId,
        reviewer_role: reviewerRole,
        rating,
        comment
      })
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (res.ok) {
      alert("✅ הביקורת נשלחה בהצלחה!");
      if (button) {
        button.outerHTML = `<p style="color: green; font-weight: bold;">✔️ ביקורת נשלחה</p>`;
      }
    } else {
      if (data.message?.includes("כבר שלחת ביקורת")) {
        if (button) {
          button.outerHTML = `<p style="color: red; font-weight: bold;">🔒 כבר נתת ביקורת לנוסע זה</p>`;
        }
      } else {
        alert(`❌ ${data.message || "שגיאה בשליחת ביקורת"}`);
      }
    }
  } catch (err) {
    console.error("שגיאה בשליחת ביקורת:", err);
    alert("❌ שגיאת רשת בעת שליחת הביקורת");
  }
}

