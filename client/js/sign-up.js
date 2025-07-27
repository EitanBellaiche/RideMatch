document.getElementById("signForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const email = document.getElementById("email").value;
  const phone_number = document.getElementById("phone_number").value;
  const gender = document.getElementById("gender").value;
  const birth_date = document.getElementById("birth_date").value;
  const messageArea = document.getElementById("messageArea");

  try {
    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        email,
        phone_number,
        gender,
        birth_date
      })
    });

    const data = await res.json();

    if (res.ok) {
      messageArea.textContent = data.message || "נרשמת בהצלחה!";
      messageArea.style.color = "#22C55E";
      alert("ההרשמה בוצעה בהצלחה!");
      window.location.href = "login.html";
    } else {
      messageArea.textContent = data.message || "הרשמה נכשלה.";
      messageArea.style.color = "#F87171";
    }
  } catch (err) {
    messageArea.textContent = "תקלה בשרת, נסה שוב מאוחר יותר.";
    messageArea.style.color = "#F87171";
  }
});
