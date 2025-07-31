const pool = require('../db');

async function getPastTrips(req, res) {
  const userId = req.query.user_id;

  try {
    const query = `
      SELECT 
        e.id AS event_id,
        e.title,
        e.event_date,
        e.time AS departure_time,
        ed.user_id AS driver_user_id,
        u.username AS driver_name,
        ed.pickup_location,
        CASE WHEN ed.user_id = $1 THEN TRUE ELSE FALSE END AS is_driver,
        CASE 
          WHEN ep.passenger_user_id = $1 AND ep.status IS NOT NULL THEN ep.status
          ELSE NULL 
        END AS passenger_status
      FROM events e
      LEFT JOIN event_drivers ed ON e.id = ed.event_id
      LEFT JOIN users u ON ed.user_id = u.id
      LEFT JOIN event_passengers ep 
        ON e.id = ep.event_id AND ep.passenger_user_id = $1
      WHERE 
        (ed.user_id = $1 OR ep.passenger_user_id = $1)
        AND e.event_date < CURRENT_DATE
      ORDER BY e.event_date DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('שגיאה בשליפת נסיעות שהסתיימו:', err);
    res.status(500).json({ message: 'שגיאה בשליפת נסיעות שהסתיימו' });
  }
}

async function submitReview(req, res) {
  const {
    event_id,
    reviewer_user_id,
    reviewee_user_id,
    reviewer_role,
    rating,
    comment
  } = req.body;

  if (!event_id || !reviewer_user_id || !reviewee_user_id || !reviewer_role || !rating) {
    return res.status(400).json({ message: "חסרים שדות חובה" });
  }

  try {
    await pool.query(`
      INSERT INTO ride_reviews 
        (event_id, reviewer_user_id, reviewee_user_id, reviewer_role, rating, comment, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      event_id,
      reviewer_user_id,
      reviewee_user_id,
      reviewer_role,
      rating,
      comment
    ]);

    res.status(200).json({ message: "הביקורת נשמרה בהצלחה!" });
  } catch (err) {
    console.error("שגיאה בשמירת ביקורת:", err);
    res.status(500).json({ message: "שגיאה בשרת בשמירת הביקורת" });
  }
}

async function getReviews(req, res) {
  const { reviewee_user_id } = req.query;

  if (!reviewee_user_id) {
    return res.status(400).json({ message: "חסר reviewee_user_id" });
  }

  try {
    const result = await pool.query(`
      SELECT r.*, u.username AS reviewer_username
      FROM ride_reviews r
      JOIN users u ON r.reviewer_user_id = u.id
      WHERE r.reviewee_user_id = $1
      ORDER BY r.submitted_at DESC
    `, [reviewee_user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error("שגיאה בקבלת ביקורות:", err);
    res.status(500).json({ message: "שגיאה בקבלת ביקורות" });
  }
}

module.exports = {
  getPastTrips,
  submitReview,
  getReviews
};
