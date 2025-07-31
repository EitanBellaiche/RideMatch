const pool = require('../db');

async function getTripDetails(req, res) {
  const { event_id, driver_user_id } = req.query;

  try {
    const result = await pool.query(`
      SELECT ed.*, u.username, e.event_date
      FROM event_drivers ed
      JOIN users u ON ed.user_id = u.id
      JOIN events e ON ed.event_id = e.id
      WHERE ed.event_id = $1 AND ed.user_id = $2
    `, [event_id, driver_user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "האירוע לא נמצא" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("שגיאה בשליפת פרטי נסיעה:", err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

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

module.exports = {
  getTripDetails,
  getPastTrips
};
