document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("user_id");
  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  const userDetailsDiv = document.getElementById("user-details");
  const editForm = document.getElementById("editForm");
  const editBtn = document.getElementById("editBtn");

  try {
    const res = await fetch(`/user/${userId}`);
    if (!res.ok) throw new Error("Network error");
    const user = await res.json();

    userDetailsDiv.innerHTML = `
      <p><strong>שם משתמש:</strong> ${user.username}</p>
      <p><strong>אימייל:</strong> ${user.email}</p>
      <p><strong>טלפון:</strong> ${user.phone_number}</p>
      <p><strong>מגדר:</strong> ${user.gender}</p>
      <p><strong>תאריך לידה:</strong> ${user.birth_date ? user.birth_date.split('T')[0] : ''}</p>
    `;

    document.getElementById("editUsername").value = user.username;
    document.getElementById("editEmail").value = user.email;
    document.getElementById("editPhone").value = user.phone_number;

    editBtn.addEventListener("click", () => {
      editForm.style.display = "block";
      editBtn.style.display = "none";
    });

    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const updatedUser = {
        username: document.getElementById("editUsername").value,
        email: document.getElementById("editEmail").value,
        phone_number: document.getElementById("editPhone").value
      };

      try {
        const updateRes = await fetch(`/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedUser)
        });

        const data = await updateRes.json();
        if (updateRes.ok) {
          alert(data.message);
          location.reload();
        } else {
          alert("שגיאה בעדכון: " + data.message);
        }
      } catch (err) {
        alert("שגיאת רשת בעדכון המשתמש");
      }
    });

  } catch (err) {
    userDetailsDiv.innerHTML = `<p>שגיאה בטעינת פרטי המשתמש</p>`;
  }
});
