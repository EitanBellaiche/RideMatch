document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("user_id");

  if (!userId) {
    document.getElementById("driver-reviews").innerText = "לא סופק מזהה נהג.";
    return;
  }

  try {
    const reviewsRes = await fetch(`https://ridematch-a905.onrender.com/reviews?reviewee_user_id=${userId}`);
    const reviews = await reviewsRes.json();

    if (reviews.length === 0) {
      document.getElementById("driver-reviews").innerHTML = "<p>אין עדיין ביקורות על הנהג הזה.</p>";
    } else {
      const reviewList = reviews.map(r => `
        <div class="review">
          <p><strong>⭐ ${r.rating}</strong> מאת ${r.reviewer_username}</p>
          <p>${r.comment || "ללא תגובה"}</p>
        </div>
      `).join("");
      document.getElementById("driver-reviews").innerHTML = reviewList;
    }
  } catch (err) {
    console.error("שגיאה בטעינת ביקורות:", err);
    document.getElementById("driver-reviews").innerText = "שגיאה בטעינת הביקורות.";
  }
});
