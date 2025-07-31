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

module.exports = {
  getTripDetails
};
