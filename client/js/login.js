document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("username", username);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("role", data.role);

      Swal.fire({
        icon: 'success',
        title: 'התחברת בהצלחה',
        text: data.message,
        timer: 1500,
        showConfirmButton: false
      });

      setTimeout(() => {
        if (data.role === "admin") {
          window.location.href = "admin-page.html";
        } else {
          window.location.href = "home.html";
        }
      }, 1600);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'שגיאה',
        text: data.message
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'שגיאת שרת',
      text: 'לא ניתן להתחבר כרגע. נסה שוב מאוחר יותר.'
    });
  }
});

document.getElementById("goToSignUp").onclick = function () {
  window.location.href = "sign-up.html";
};
