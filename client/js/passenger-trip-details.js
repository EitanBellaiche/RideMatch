const params = new URLSearchParams(window.location.search);
const eventId = params.get("event_id");
const driverUserId = params.get("driver_user_id");
const userId = localStorage.getItem("user_id");

function idToColor(id) {
  let hash = parseInt(id);
  const r = (hash * 123) % 255;
  const g = (hash * 456) % 255;
  const b = (hash * 789) % 255;
  return `rgb(${r}, ${g}, ${b})`;
}


document.addEventListener("DOMContentLoaded", async () => {

  if (!eventId || !driverUserId || !userId) {
    alert("חסרים פרטים לזיהוי הנסיעה או המשתמש");
    return;
  }

  try {
    const res = await fetch(`/trip-details?event_id=${eventId}&driver_user_id=${driverUserId}`);
    const trip = await res.json();

    if (trip.username) {
      document.getElementById("ride-title").textContent = `שם הנהג: ${trip.username}`;
      document.getElementById("ride-date-time").textContent = `🕒 שעת יציאה: ${trip.departure_time}`;
      document.getElementById("pickup-location").textContent = `📍 מיקום איסוף: ${trip.pickup_location}`;
      document.getElementById("driver-info").textContent = `🚘 נהג: ${trip.username}, רכב: ${trip.car_model} (${trip.car_color})`;

      const navLink = document.createElement("a");
navLink.id = "navigate-button";
navLink.textContent = "🔗 פתח ניווט בגוגל מפות";
navLink.target = "_blank";
document.getElementById("pickup-location").after(navLink);


      try {
        const res = await fetch(`/api/navigation-link?address=${encodeURIComponent(trip.pickup_location)}`);
        const data = await res.json();
        if (data.link) {
          navLink.href = data.link;
        } else {
          navLink.textContent = "⚠️ לא ניתן לפתוח ניווט";
        }
      } catch (err) {
        console.error("שגיאה בקבלת קישור ניווט:", err);
        navLink.textContent = "⚠️ שגיאה בשרת";
      }

      const tripDate = new Date(trip.event_date);
      const now = new Date();
      if (tripDate < now) {
        renderReviewForm();
      }
    }
  } catch (err) {
    console.error("שגיאה בטעינת פרטי הנסיעה:", err);
  }


  try {
    const res = await fetch(`/approved-passengers?event_id=${eventId}&driver_user_id=${driverUserId}`);
    const passengers = await res.json();
    const list = document.getElementById("passengers-list");
    passengers.forEach(p => {
      const li = document.createElement("li");
      li.textContent = `👤 ${p.username}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("שגיאה בטעינת נוסעים:", err);
  }

  async function loadMessages() {
    try {
      const res = await fetch(`/get-messages?event_id=${eventId}&user_id=${userId}&driver_user_id=${driverUserId}`);
      const messages = await res.json();
      const chatBox = document.getElementById("chat-box");

      const isAtBottom = chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 5;
      chatBox.innerHTML = "";

      messages.forEach(msg => {
        const p = document.createElement("p");
        p.classList.add("chat-message");
        p.classList.add(msg.user_id == userId ? "chat-own" : "chat-other");
        const color = idToColor(msg.user_id);
        p.innerHTML = `<strong style="color:${color}">${msg.username}:</strong> ${msg.content}`;
        chatBox.appendChild(p);
      });

      if (isAtBottom) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    } catch (err) {
      console.error("שגיאה בטעינת צ'אט:", err);
    }
  }

  loadMessages();
  setInterval(loadMessages, 5000);


  document.getElementById("chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const content = input.value.trim();
    if (!content) return;

    try {
      await fetch("/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          user_id: userId,
          driver_user_id: driverUserId,
          content
        })

      });

      input.value = "";
      loadMessages();
    } catch (err) {
      console.error("שגיאה בשליחת הודעה:", err);
    }
  });
});
function renderReviewForm() {
  console.log("📌 נכנסנו לפונקציית renderReviewForm");

  const container = document.getElementById("review-section");
  container.innerHTML = `
    <div class="review-box">
      <h2>⭐ דרג את הנהג</h2>
      <hr>
      <form id="review-form">
        <label for="rating">דירוג (1 עד 5):</label>
        <input type="number" id="rating" min="1" max="5" required>

        <label for="comment">הערה (לא חובה):</label>
        <textarea id="comment" rows="3"></textarea>

        <button type="submit">שלח ביקורת</button>
      </form>
    </div>
  `;

  document.getElementById("review-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const rating = parseInt(document.getElementById("rating").value);
    const comment = document.getElementById("comment").value;

    try {
      const res = await fetch("/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          reviewer_user_id: userId,
          reviewee_user_id: driverUserId,
          reviewer_role: 'passenger', // הוספנו שזה מצד נוסע
          rating,
          comment
        })
      });

      if (res.ok) {
        container.innerHTML = "<p>✅ הביקורת נשמרה בהצלחה</p>";
      } else {
        container.innerHTML = "<p>❌ שגיאה בשמירת הביקורת</p>";
      }
    } catch (err) {
      console.error("שגיאה בשליחת ביקורת:", err);
      container.innerHTML = "<p>❌ שגיאה כללית</p>";
    }
  });
}