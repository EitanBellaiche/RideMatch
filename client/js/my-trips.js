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

document.querySelector("main").appendChild(pastSection);
  document.querySelector("main").appendChild(driverSection);
  document.querySelector("main").appendChild(passengerSection);

  loadDriverTrips(userId, driverSection);
  loadPassengerTrips(userId, passengerSection);
  loadPastTrips(userId, pastSection);
});

const baseUrl = "https://ridematch-a905.onrender.com";

async function loadDriverTrips(userId, container) {
  try {
    const res = await fetch(`${baseUrl}/driver-trips?user_id=${userId}`);
    if (!res.ok) throw new Error("בעיה בטעינת נסיעות כנהג");
    const trips = await res.json();

    if (trips.length === 0) {
      container.innerHTML += "<p>אין נסיעות שאתה נהג בהן.</p>";
      return;
    }

    trips.forEach(trip => {
      const tripCard = document.createElement("article");
      tripCard.classList.add("trip-card");
      tripCard.innerHTML = `
    <h3>${trip.title}</h3>
    <p>📅 תאריך: ${trip.date} | 🕒 שעת יציאה: ${trip.departure_time}</p>
    <p>📍 מקום איסוף: ${trip.pickup_location || '---'}</p>
<a href="driver-trip-details.html?event_id=${trip.event_id}" class="action-button details-button">צפה בפרטים</a>
    <button class="action-button cancel-button driver-cancel-button"
            data-event="${trip.event_id}"
            data-driver="${userId}">
      בטל נסיעה
    </button>
  `;
      container.appendChild(tripCard);
    });

    // האזנה לביטול נסיעה ע"י נהג
    container.addEventListener("click", async (e) => {
      if (e.target.classList.contains("driver-cancel-button")) {
        const eventId = e.target.dataset.event;
        const driverId = e.target.dataset.driver;

        const confirmCancel = confirm("האם אתה בטוח שברצונך לבטל את הנסיעה?");
        if (!confirmCancel) return;

        try {
          const res = await fetch(`${baseUrl}/cancel-trip-by-driver`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event_id: eventId,
              user_id: driverId,
            })
            ,
          });


          const data = await res.json();
          if (res.ok) {
            alert(data.message || "הנסיעה בוטלה בהצלחה");
            container.innerHTML = "<h2>🔵 נסיעות כנהג</h2>";
            loadDriverTrips(driverId, container); // רענון
          } else {
            alert(data.message || "שגיאה בביטול");
          }
        } catch (err) {
          console.error("שגיאה בביטול הנסיעה:", err);
          alert("שגיאה בביטול הנסיעה");
        }
      }
    });

  } catch (err) {
    console.error("שגיאה בטעינת נסיעות כנהג:", err);
    container.innerHTML += "<p style='color:red;'>שגיאה בטעינת נסיעות כנהג</p>";
  }
}


async function loadPassengerTrips(userId, container) {
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

      let buttonHTML = "";
      let statusHTML = "";
      let status = ""
      try {
        const checkRes = await fetch(`${baseUrl}/check-registration?event_id=${trip.event_id}&driver_user_id=${trip.driver_user_id}&passenger_user_id=${userId}`);
        const checkData = await checkRes.json();
        status = checkData.status;

        if (status === "paid") {
          statusHTML = `<div class="trip-badge badge-paid">✅ אתה רשום לנסיעה</div>`;
        } else if (status === "approved") {
          statusHTML = `
    <div class="trip-badge badge-approved">💳 אושרת, שלם בבקשה</div>
    <button class="pay-now-button" onclick="startPaymentProcess(this, ${trip.event_id}, ${trip.driver_user_id})">
      שלם עכשיו
    </button>
  `;
        }
        else if (status === "pending") {
          statusHTML = `<div class="trip-badge badge-pending">⏳ ממתין לאישור נהג</div>`;
        }

      } catch (e) {
        console.warn("שגיאה בבדיקת סטטוס:", e);
      }

      let detailsButtonHTML = "";
if (status === "paid") {
  detailsButtonHTML = `<a href="passenger-trip-details.html?event_id=${trip.event_id}&driver_user_id=${trip.driver_user_id}" class="action-button details-button">צפה בפרטים</a>`;
}


      tripCard.innerHTML = `
  <h3>${trip.title}</h3>
  <p>📅 תאריך: ${trip.date} | 🕒 שעת יציאה: ${trip.departure_time}</p>
  <p>🚘 נהג: ${trip.driver_name || 'לא ידוע'}</p>
  <p>📍 מקום איסוף: ${trip.pickup_location || '---'}</p>
  ${detailsButtonHTML}
  ${buttonHTML}
  ${statusHTML}
  <button class="action-button cancel-button"
          data-event="${trip.event_id}"
          data-driver="${trip.driver_user_id}">
    בטל הרשמה
  </button>
`;

      container.appendChild(tripCard);
    }

    // ביטול הרשמה
    container.addEventListener("click", async (e) => {
      if (e.target.classList.contains("cancel-button")) {
        const eventId = e.target.dataset.event;
        const driverId = e.target.dataset.driver;
        const passengerId = localStorage.getItem("user_id");

        const confirmCancel = confirm("האם אתה בטוח שברצונך לבטל את ההרשמה לנסיעה זו?");
        if (!confirmCancel) return;

        try {
          const res = await fetch(`${baseUrl}/cancel-ride`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_id: eventId,
              driver_user_id: driverId,
              passenger_user_id: passengerId
            })
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
          console.error("שגיאה בביטול הנסיעה:", err);
          alert("שגיאה בביטול הנסיעה");
        }
      }
    });

  } catch (err) {
    console.error("שגיאה בטעינת נסיעות כנוסע:", err);
    container.innerHTML += "<p style='color:red;'>שגיאה בטעינת נסיעות כנוסע</p>";
  }
}
async function loadPastTrips(userId, container) {
  try {
    const res = await fetch(`${baseUrl}/past-trips?user_id=${userId}`);
    if (!res.ok) throw new Error("שגיאה בטעינת נסיעות שהסתיימו");
    const trips = await res.json();

    if (trips.length === 0) {
      container.innerHTML += "<p>אין נסיעות שהסתיימו להצגה.</p>";
      return;
    }

    for (const trip of trips) {
      const tripCard = document.createElement("article");
      tripCard.classList.add("trip-card");

      tripCard.innerHTML = `
        <h3>${trip.title}</h3>
        <p>📅 תאריך: ${trip.event_date}</p>
        <p>🧑‍✈️ תפקידך: ${trip.role === 'driver' ? 'נהג' : 'נוסע'}</p>
        <button class="action-button review-button" 
                data-event="${trip.event_id}" 
                data-role="${trip.role}">
          הוסף ביקורת
        </button>
      `;

      container.appendChild(tripCard);
    }

    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("review-button")) {
        const eventId = e.target.dataset.event;
        const role = e.target.dataset.role;
        const targetRole = role === "driver" ? "passenger" : "driver";
        const revieweeId = prompt("הזן את מזהה המשתמש שברצונך לדרג:");

        if (!revieweeId) return;

        const rating = prompt("דרג מ־1 עד 5:");
        const comment = prompt("הוסף תגובה:");

        if (!rating || !comment) return;

        fetch(`${baseUrl}/submit-review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: eventId,
            reviewer_user_id: userId,
            reviewee_user_id: revieweeId,
            reviewer_role: role,
            rating,
            comment
          })
        })
          .then(res => res.json())
          .then(data => alert(data.message))
          .catch(err => {
            console.error("שגיאה בשליחת ביקורת:", err);
            alert("שגיאה בשליחת ביקורת");
          });
      }
    });
  } catch (err) {
    console.error("שגיאה בטעינת נסיעות שהסתיימו:", err);
    container.innerHTML += "<p style='color:red;'>שגיאה בטעינה</p>";
  }
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

