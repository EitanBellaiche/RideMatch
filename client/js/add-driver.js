document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  const form = document.getElementById("addDriverForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = localStorage.getItem("username");
    if (!username) {
      alert("יש להתחבר לפני הוספה כנהג.");
      return;
    }

    const formData = new FormData(form);
    const driverData = {
      username,
      departure_time: formData.get("departure_time"),
      price: formData.get("price"),
      car_model: formData.get("car_model"),
      car_color: formData.get("car_color"),
      pickup_location: formData.get("pickup_location"),
      seats_available: formData.get("seats_available"),
    };

    try {
      const res = await fetch(`https://ridematch-a905.onrender.com/events/${eventId}/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverData),
      });

      if (res.ok) {
        alert("התווספת בהצלחה כנהג!");
        window.location.href = `event-details.html?id=${eventId}`;
      } else {
        const error = await res.json();
        alert("שגיאה: " + error.message);
      }
    } catch (err) {
      alert("שגיאה בשרת. נסה שוב מאוחר יותר.");
    }
  });
});
