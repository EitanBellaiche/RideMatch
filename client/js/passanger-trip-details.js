document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("event_id");
  const driverUserId = params.get("driver_user_id");
  const userId = localStorage.getItem("user_id");

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
      document.getElementById("ride-date-time").textContent =
        `🕒 שעת יציאה: ${driver.departure_time}`;
      document.getElementById("pickup-location").textContent =
        `📍 מיקום איסוף: ${driver.pickup_location}`;
      document.getElementById("driver-info").textContent = `🚘 נהג: ${driver.username}`;
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
        p.innerHTML = `<strong>${msg.username}:</strong> ${msg.content}`;
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
