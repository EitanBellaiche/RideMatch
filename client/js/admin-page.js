// public/js/admin.js

document.addEventListener("DOMContentLoaded", () => {
    const tabEvents = document.getElementById("tab-events");
    const tabUsers = document.getElementById("tab-users");
    const sectionEvents = document.getElementById("section-events");
    const sectionUsers = document.getElementById("section-users");
    const eventsTable = document.getElementById("eventsTable");
    const usersTable = document.getElementById("usersTable");
    const msg = document.getElementById("msg");
    const searchInput = document.querySelector(".search-container input");

    // --- פונקציית הצגת הודעה עם ניהול זמן --- 
    function showMsg(text, color = "#333", timeout = 3000) {
        msg.textContent = text;
        msg.style.color = color;
        msg.style.display = "block";
        if (timeout > 0) {
            setTimeout(() => {
                msg.textContent = "";
                msg.style.display = "none";
            }, timeout);
        }
    }

    // ברירת מחדל - הצג אירועים
    sectionEvents.style.display = "";
    sectionUsers.style.display = "none";
    tabEvents.classList.add("active");

    // מעבר בין טאבים
    tabEvents.onclick = () => {
        tabEvents.classList.add("active");
        tabUsers.classList.remove("active");
        sectionEvents.style.display = "";
        sectionUsers.style.display = "none";
        loadEvents();
    };
    tabUsers.onclick = () => {
        tabUsers.classList.add("active");
        tabEvents.classList.remove("active");
        sectionEvents.style.display = "none";
        sectionUsers.style.display = "";
        loadUsers();
    };

    // טעינת אירועים (עם תמיכה בחיפוש)
    async function loadEvents(filter = "") {
        eventsTable.innerHTML = "<tr><th>מס' אירוע</th><th>כותרת</th><th>סוג</th><th>תאריך</th><th>שעה</th><th>מיקום</th><th>פעולות</th></tr>";
        try {
            const res = await fetch("/events");
            const data = await res.json();
            let filtered = data;
            if (filter) {
                filtered = data.filter(e =>
                    (e.title && e.title.includes(filter)) ||
                    (e.location && e.location.includes(filter))
                );
            }
            filtered.forEach(event => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${event.id}</td>
                    <td>${event.title}</td>
                    <td>${event.type || ""}</td>
                    <td>${event.event_date ? event.event_date.split("T")[0] : ""}</td>
                    <td>${event.time || ""}</td>
                    <td>${event.location || ""}</td>
                    <td>
                        <button onclick="editEvent(${event.id})">ערוך</button>
                        <button onclick="deleteEvent(${event.id})">מחק</button>
                    </td>
                `;
                eventsTable.appendChild(tr);
            });
            if (filtered.length === 0) {
                eventsTable.innerHTML += `<tr><td colspan="7">לא נמצאו אירועים</td></tr>`;
            }
        } catch (err) {
            eventsTable.innerHTML += `<tr><td colspan="7">שגיאה בטעינת אירועים</td></tr>`;
        }
    }

    // טעינת משתמשים
    async function loadUsers() {
        usersTable.innerHTML = "<tr><th>מס' משתמש</th><th>שם</th><th>אימייל</th><th>טלפון</th><th>פעולות</th></tr>";
        try {
            const res = await fetch("/users");
            const data = await res.json();
            data.forEach(user => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.phone_number}</td>
                    <td>
                        <button onclick="editUser(${user.id})">ערוך</button>
                        <button onclick="deleteUser(${user.id})">מחק</button>
                    </td>
                `;
                usersTable.appendChild(tr);
            });
            if (data.length === 0) {
                usersTable.innerHTML += `<tr><td colspan="5">לא נמצאו משתמשים</td></tr>`;
            }
        } catch (err) {
            usersTable.innerHTML += `<tr><td colspan="5">שגיאה בטעינת משתמשים</td></tr>`;
        }
    }

    // חיפוש בזמן אמת
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const filter = e.target.value.trim();
            loadEvents(filter);
        });
    }

    // --- מחיקת אירוע ---
    window.deleteEvent = async (id) => {
        if (confirm("האם למחוק אירוע זה?")) {
            try {
                const res = await fetch(`/events/${id}`, { method: "DELETE" });
                const data = await res.json();
                loadEvents();
                showMsg(data.message || "אירוע נמחק", "#22C55E");
            } catch {
                showMsg("שגיאה במחיקת אירוע", "#F87171");
            }
        }
    };

    // --- מחיקת משתמש ---
    window.deleteUser = async (id) => {
        if (confirm("האם למחוק משתמש זה?")) {
            try {
                const res = await fetch(`/users/${id}`, { method: "DELETE" });
                const data = await res.json();
                loadUsers();
                showMsg(data.message || "משתמש נמחק", "#22C55E");
            } catch {
                showMsg("שגיאה במחיקת משתמש", "#F87171");
            }
        }
    };

    // --- עריכה (בשלב זה פופ־אפ/alert, בעתיד טופס) ---
    window.editEvent = (id) => { alert(`עריכת אירוע ${id} - להטמיע טופס עריכה בעתיד.`); };
    window.editUser = (id) => { alert(`עריכת משתמש ${id} - להטמיע טופס עריכה בעתיד.`); };

    // ברירת מחדל - טען אירועים
    loadEvents();
});
