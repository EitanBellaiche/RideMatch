document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const messageArea = document.getElementById("messageArea");

  try {
      const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      messageArea.textContent = data.message;
      messageArea.style.color = "#22C55E";
      localStorage.setItem("username", username);
      localStorage.setItem("user_id", data.user_id);
      

      
      setTimeout(() => {
        window.location.href = "home.html";
      }, 1000);
    } else {
      messageArea.textContent = data.message;
      messageArea.style.color = "#F87171";
    }
  } catch (err) {
    messageArea.textContent = "Server error.";
    messageArea.style.color = "#F87171";
  }
});

document.getElementById("goToSignUp").onclick = function() {
  window.location.href = "sign-up.html";
};