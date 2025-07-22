const params = new URLSearchParams(window.location.search);
  const eventId = params.get("event_id");
  const driverUserId = params.get("driver_user_id");
  const userId = localStorage.getItem("user_id");

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = "#" + ((hash >> 24) & 0xFF).toString(16).padStart(2, "0") +
    ((hash >> 16) & 0xFF).toString(16).padStart(2, "0") +
    ((hash >> 8) & 0xFF).toString(16).padStart(2, "0");
  return color;
}

document.addEventListener("DOMContentLoaded", async () => {

  if (!eventId || !driverUserId || !userId) {
    alert("חסרים פרטים לזיהוי הנסיעה או המשתמש");
    return;
  }

  try {
    const res = await fetch(`/drivers/${eventId}`);
    const drivers = await res.json();
    const driver = drivers.find(d => d.driver_user_id == driverUserId);

    if (driver) {
  document.getElementById("ride-title").textContent = `שם הנהג: ${driver.username}`;
  document.getElementById("ride-date-time").textContent = `🕒 שעת יציאה: ${driver.departure_time}`;
  document.getElementById("pickup-location").textContent = `📍 מיקום איסוף: ${driver.pickup_location}`;
  document.getElementById("driver-info").textContent = `🚘 נהג: ${driver.username}`;

 const tripDate = new Date(driver.event_date); // רק תאריך
const today = new Date();
today.setHours(0, 0, 0, 0);         // אפס את השעה של היום
tripDate.setHours(0, 0, 0, 0);     // אפס את השעה של תאריך הנסיעה

if (tripDate < today) {
  renderReviewForm();
}



}

  } catch (err) {
    console.error("שגיאה בטעינת פרטי הנהג:", err);
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
      const res = await fetch(`/get-messages?event_id=${eventId}`);
      const messages = await res.json();
      const chatBox = document.getElementById("chat-box");

      const isAtBottom = chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 5;
      chatBox.innerHTML = "";

      messages.forEach(msg => {
        const p = document.createElement("p");
        p.classList.add("chat-message");
        p.classList.add(msg.user_id == userId ? "chat-own" : "chat-other");
        const color = stringToColor(msg.username);
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
        body: JSON.stringify({ event_id: eventId, user_id: userId, content })
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
  container.innerHTML += `
    <form id="review-form">
      <label for="rating">דירוג (1 עד 5):</label><br>
      <input type="number" id="rating" min="1" max="5" required><br><br>

      <label for="comment">הערה (לא חובה):</label><br>
      <textarea id="comment" rows="3" cols="40"></textarea><br><br>

      <button type="submit">שלח ביקורת</button>
    </form>
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
          reviewer_id: userId,
          reviewed_user_id: driverUserId,
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
