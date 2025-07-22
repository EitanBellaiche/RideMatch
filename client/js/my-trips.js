const baseUrl = "https://ridematch-a905.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("user_id");
  if (!userId) {
    alert("לא מחובר");
    window.location.href = "login.html";
    return;
  }

  const driverSection = document.createElement("section");
  driverSection.className = "trip-section driver-trips";
  driverSection.innerHTML = "<h2>🔵 נסיעות כנהג</h2>";

  const passengerSection = document.createElement("section");
  passengerSection.className = "trip-section passenger-trips";
  passengerSection.innerHTML = "<h2>🟢 נסיעות כנוסע</h2>";

  const pastSection = document.createElement("section");
  pastSection.className = "trip-section past-trips";
  pastSection.innerHTML = "<h2>🕒 נסיעות שהסתיימו</h2>";

  document.querySelector("main").appendChild(driverSection);
  document.querySelector("main").appendChild(passengerSection);
  document.querySelector("main").appendChild(pastSection);

  loadDriverTrips(userId, driverSection, pastSection);
  loadPassengerTrips(userId, passengerSection, pastSection);

});

function isTripPast(trip) {
  const tripDateTime = new Date(`${trip.event_date}T${trip.departure_time}`);
  return tripDateTime < new Date();
}


async function loadDriverTrips(userId, upcomingContainer, pastContainer) {
  try {
    const res = await fetch(`${baseUrl}/driver-trips?user_id=${userId}`);
    if (!res.ok) throw new Error("בעיה בטעינת נסיעות כנהג");
    const trips = await res.json();

    if (trips.length === 0) {
      container.innerHTML += "<p>אין נסיעות שאתה נהג בהן.</p>";
      return;
    }

    for (const trip of trips) {
      const past = isTripPast(trip);
      const tripCard = document.createElement("article");
      tripCard.classList.add("trip-card");

      let inner = `
        <h3>${trip.title}</h3>
<p>📅 תאריך: ${trip.event_date} | 🕒 שעת יציאה: ${trip.departure_time}</p>
        <p>📍 מקום איסוף: ${trip.pickup_location || '---'}</p>
        <a href="driver-trip-details.html?event_id=${trip.event_id}" class="action-button details-button">צפה בפרטים</a>
        <button class="action-button cancel-button driver-cancel-button"
                data-event="${trip.event_id}" data-driver="${userId}">
          בטל נסיעה
        </button>
      `;

      if (past) {
        try {
          const paxRes = await fetch(`${baseUrl}/approved-passengers?event_id=${trip.event_id}&driver_user_id=${userId}`);
          const pax = paxRes.ok ? await paxRes.json() : [];
          if (pax.length > 0) {
            inner += `<hr/><h4>נוסעים שנסעו:</h4>`;
            inner += pax.map(p =>
              `<div>
                 ${p.username}
                 <button class="review-button"
                   data-role="driver"
                   data-reviewer="${userId}"
                   data-reviewee="${p.passenger_user_id}"
                   data-event="${trip.event_id}">
                   ✍️ דרג
                 </button>
               </div>`
            ).join("");
          }
        } catch (err) {
          console.warn("שגיאה בקבלת נוסעים:", err);
        }
      }

      tripCard.innerHTML = inner;
      (past ? pastContainer : upcomingContainer).appendChild(tripCard);

    }

    container.addEventListener("click", async (e) => {
      if (!e.target.classList.contains("driver-cancel-button")) return;
      const eventId = e.target.dataset.event;
      const driverId = e.target.dataset.driver;

      if (!confirm("האם אתה בטוח שברצונך לבטל את הנסיעה?")) return;

      try {
        const res = await fetch(`${baseUrl}/cancel-trip-by-driver`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId, user_id: driverId })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          container.innerHTML = "<h2>🔵 נסיעות כנהג</h2>";
          loadDriverTrips(driverId, container);
        } else {
          alert(data.message);
        }
      } catch (err) {
        alert("שגיאה בביטול הנסיעה");
      }
    });

  } catch (err) {
    container.innerHTML += "<p style='color:red;'>שגיאה בטעינת נסיעות כנהג</p>";
  }
}

async function loadPassengerTrips(userId, upcomingContainer, pastContainer) {

  try {
    const res = await fetch(`${baseUrl}/passenger-trips?user_id=${userId}`);
    if (!res.ok) throw new Error("בעיה בטעינת נסיעות כנוסע");
    const trips = await res.json();

    if (trips.length === 0) {
      container.innerHTML += "<p>אין נסיעות שאתה נוסע בהן.</p>";
      return;
    }

    for (const trip of trips) {
      const tripCard = document.createElement("article");
      tripCard.classList.add("trip-card");

      let status = "";
      let statusHTML = "";
      try {
        const checkRes = await fetch(`${baseUrl}/check-registration?event_id=${trip.event_id}&driver_user_id=${trip.driver_user_id}&passenger_user_id=${userId}`);
        const checkData = await checkRes.json();
        status = checkData.status;

        if (status === "paid") {
          statusHTML = `<div>✅ אתה רשום לנסיעה</div>`;
        } else if (status === "approved") {
          statusHTML = `
            <div>💳 אושרת, שלם בבקשה</div>
            <button class="pay-now-button" onclick="startPaymentProcess(this, ${trip.event_id}, ${trip.driver_user_id})">שלם עכשיו</button>
          `;
        } else if (status === "pending") {
          statusHTML = `<div>⏳ ממתין לאישור נהג</div>`;
        }
      } catch (e) {
        console.warn("שגיאה בבדיקת סטטוס:", e);
      }

      const past = isTripPast(trip);
      let reviewButtonHTML = "";
      if (past && status === "paid") {
        reviewButtonHTML = `
          <button class="review-button"
            data-role="passenger"
            data-reviewer="${userId}"
            data-reviewee="${trip.driver_user_id}"
            data-event="${trip.event_id}">
            ✍️ דרג את הנהג
          </button>`;
      }

      tripCard.innerHTML = `
        <h3>${trip.title}</h3>
        <p>📅 תאריך: ${trip.date} | 🕒 שעת יציאה: ${trip.departure_time}</p>
        <p>🚘 נהג: ${trip.driver_name || 'לא ידוע'}</p>
        <p>📍 מקום איסוף: ${trip.pickup_location || '---'}</p>
        ${statusHTML}
        ${reviewButtonHTML}
        <button class="action-button cancel-button"
          data-event="${trip.event_id}" data-driver="${trip.driver_user_id}">
          בטל הרשמה
        </button>
      `;

      (past ? pastContainer : upcomingContainer).appendChild(tripCard);
    }

    container.addEventListener("click", async (e) => {
      if (!e.target.classList.contains("cancel-button")) return;
      const eventId = e.target.dataset.event;
      const driverId = e.target.dataset.driver;
      const passengerId = localStorage.getItem("user_id");

      if (!confirm("לבטל את ההרשמה לנסיעה זו?")) return;

      try {
        const res = await fetch(`${baseUrl}/cancel-ride`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId, driver_user_id: driverId, passenger_user_id: passengerId })
        });

        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          container.innerHTML = "<h2>🟢 נסיעות כנוסע</h2>";
          loadPassengerTrips(passengerId, container);
        } else {
          alert(data.message || "שגיאה בביטול");
        }
      } catch (err) {
        alert("שגיאה בביטול הנסיעה");
      }
    });

  } catch (err) {
    container.innerHTML += "<p style='color:red;'>שגיאה בטעינת נסיעות כנוסע</p>";
  }
}

function startPaymentProcess(buttonElement, eventId, driverUserId) {
  const passengerUserId = localStorage.getItem("user_id");

  buttonElement.disabled = true;
  buttonElement.textContent = "🔄 מעבד תשלום...";

  setTimeout(() => {
    fetch(`${baseUrl}/confirm-payment`, {
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
          buttonElement.disabled = true;
        } else {
          buttonElement.textContent = "💳 אושרת, שלם בבקשה";
          buttonElement.disabled = false;
          alert(data.message || "שגיאה בתשלום");
        }
      })
      .catch(err => {
        console.error("שגיאת רשת:", err);
        buttonElement.textContent = "💳 אושרת, שלם בבקשה";
        buttonElement.disabled = false;
      });
  }, 2000);
}

async function loadCompletedTrips(userId, container) {
  try {
    const res = await fetch(`${baseUrl}/completed-trips?user_id=${userId}`);
    const trips = await res.json();

    if (trips.length === 0) {
      container.innerHTML += "<p>אין נסיעות שהסתיימו.</p>";
      return;
    }

    trips.forEach(trip => {
      const tripCard = document.createElement("div");
      tripCard.className = "trip-card";
      tripCard.innerHTML = `
        <h3>${trip.title}</h3>
        <p>🗓️ ${trip.event_date} | 🕒 ${trip.departure_time}</p>
        <p>📍 ${trip.location}</p>
        <p>סטטוס: נסיעה הסתיימה (${trip.role === 'driver' ? 'נהג' : 'נוסע'})</p>
        <textarea placeholder="כתוב ביקורת כאן..." rows="3" style="width: 100%; margin-top: 10px;"></textarea>
        <button class="action-button details-button" style="margin-top: 8px;">שלח ביקורת</button>
      `;
      container.appendChild(tripCard);
    });
  } catch (err) {
    console.error("Error loading completed trips:", err);
  }
}

// האזנה לכל כפתור דרוג
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("review-button")) return;

  const eventId = e.target.dataset.event;
  const reviewer = e.target.dataset.reviewer;
  const reviewee = e.target.dataset.reviewee;
  const role = e.target.dataset.role;

  const rating = prompt("דרג מ־1 עד 5:");
  if (!rating) return;
  const comment = prompt("כתוב ביקורת:");
  if (!comment) return;

  try {
    const res = await fetch(`${baseUrl}/submit-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, reviewer_user_id: reviewer, reviewee_user_id: reviewee, reviewer_role: role, rating: parseInt(rating), comment })
    });
    const data = await res.json();
    if (res.ok) {
      alert("✅ הביקורת נשמרה");
      e.target.disabled = true;
      e.target.textContent = "✔️ נשלח";
    } else {
      alert(data.message || "שגיאה בשמירת הביקורת");
    }
  } catch (err) {
    alert("שגיאת רשת בעת שליחת ביקורת");
  }
});
