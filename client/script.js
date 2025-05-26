document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const messageArea = document.getElementById("messageArea");

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      messageArea.textContent = data.message;
      messageArea.style.color = "#22C55E"; // ירוק
    } else {
      messageArea.textContent = data.message;
      messageArea.style.color = "#F87171"; // אדום
    }
  } catch (err) {
    messageArea.textContent = "שגיאה בשרת.";
    messageArea.style.color = "#F87171";
  }

});


