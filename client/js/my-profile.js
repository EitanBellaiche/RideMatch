document.addEventListener("DOMContentLoaded", async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      window.location.href = "login.html";
      return;
    }
    try {
      const res = await fetch(`/user/${userId}`);
      if (!res.ok) throw new Error("Network error");
      const user = await res.json();
  
      // הצגת הפרטים בדף
      document.querySelector(".profile-card").innerHTML = `
        <p><strong>שם משתמש:</strong> ${user.username}</p>
        <p><strong>אימייל:</strong> ${user.email}</p>
        <p><strong>טלפון:</strong> ${user.phone_number}</p>
        <p><strong>מגדר:</strong> ${user.gender}</p>
        <p><strong>תאריך לידה:</strong> ${user.birth_date ? user.birth_date.split('T')[0] : ''}</p>
        <button>עריכת פרטים</button>
      `;
    } catch (err) {
      document.querySelector(".profile-card").innerHTML = `<p>שגיאה בטעינת פרטי המשתמש</p>`;
    }
  });
  