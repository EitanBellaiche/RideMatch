document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const messageArea = document.getElementById("messageArea");
  
    try {
      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
  
      const data = await res.json();
  
      if (res.ok) {
        messageArea.textContent = data.message || "נרשמת בהצלחה!";
        messageArea.style.color = "#22C55E";
        localStorage.setItem("username", username);
        localStorage.setItem("user_id", data.user_id);
  
        alert("ההרשמה בוצעה בהצלחה!");
        window.location.href = "home.html";
      } else {
        messageArea.textContent = data.message || "הרשמה נכשלה.";
        messageArea.style.color = "#F87171";
      }
    } catch (err) {
      messageArea.textContent = "תקלה בשרת, נסה שוב מאוחר יותר.";
      messageArea.style.color = "#F87171";
    }
  });
  