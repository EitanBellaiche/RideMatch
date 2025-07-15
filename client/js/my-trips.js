document.addEventListener("DOMContentLoaded", async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
        alert("לא מחובר");
        window.location.href = "login.html";
        return;
    }

    const driverSection = document.createElement("section");
    driverSection.className = "trip-section driver-trips";
    driverSection.innerHTML = "<h2>🔵 נסיעות כנהג</h2>";

    const passengerSection = document.createElement("section");
    passengerSection.className = "trip-section passenger-trips";
    passengerSection.innerHTML = "<h2>🟢 נסיעות כנוסע</h2>";

    document.querySelector("main").appendChild(driverSection);
    document.querySelector("main").appendChild(passengerSection);

    loadDriverTrips(userId, driverSection);
    loadPassengerTrips(userId, passengerSection);
});

const baseUrl = "https://ridematch-a905.onrender.com";

async function loadDriverTrips(userId, container) {
    try {
        const res = await fetch(`${baseUrl}/driver-trips?user_id=${userId}`);
        if (!res.ok) throw new Error("בעיה בטעינת נסיעות כנהג");
        const trips = await res.json();

        if (trips.length === 0) {
            container.innerHTML += "<p>אין נסיעות שאתה נהג בהן.</p>";
            return;
        }

        trips.forEach(trip => {
            const tripCard = document.createElement("article");
            tripCard.classList.add("trip-card");
            tripCard.innerHTML = `
                <h3>${trip.title}</h3>
                <p>📅 תאריך: ${trip.date} | 🕒 שעה: ${trip.time}</p>
                <p>🚘 נהג: ${trip.driver_name || 'לא ידוע'}</p>
                <p>📍 מקום איסוף: ${trip.pickup_location || '---'}</p>
                <a href="driver-trip-details.html?id=${trip.event_id}" class="details-button">צפה בפרטים</a>
            `;
            container.appendChild(tripCard);
        });

    } catch (err) {
        console.error("שגיאה בטעינת נסיעות כנהג:", err);
        container.innerHTML += "<p style='color:red;'>שגיאה בטעינת נסיעות כנהג</p>";
    }
}

async function loadPassengerTrips(userId, container) {
    try {
        const res = await fetch(`${baseUrl}/passenger-trips?user_id=${userId}`);
        if (!res.ok) throw new Error("בעיה בטעינת נסיעות כנוסע");
        const trips = await res.json();

        if (trips.length === 0) {
            container.innerHTML += "<p>אין נסיעות שאתה נוסע בהן.</p>";
            return;
        }

        trips.forEach(trip => {
            const tripCard = document.createElement("article");
            tripCard.classList.add("trip-card");
            tripCard.innerHTML = `
                <h3>${trip.title}</h3>
                <p>📅 תאריך: ${trip.date} | 🕒 שעה: ${trip.time}</p>
                <p>🚘 נהג: ${trip.driver_name || 'לא ידוע'}</p>
                <p>📍 מקום איסוף: ${trip.pickup_location || '---'}</p>
                <a href="event-details.html?id=${trip.event_id}" class="details-button">צפה בפרטים</a>
            `;
            container.appendChild(tripCard);
        });

    } catch (err) {
        console.error("שגיאה בטעינת נסיעות כנוסע:", err);
        container.innerHTML += "<p style='color:red;'>שגיאה בטעינת נסיעות כנוסע</p>";
    }
}
