const pool = require('../db');

async function getMessages(req, res) {
  const { event_id, driver_user_id } = req.query;

  if (!event_id || !driver_user_id) {
    return res.status(400).json({ message: "Missing event_id or driver_user_id" });
  }

  try {
    const result = await pool.query(`
      SELECT cm.*, u.username
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.event_id = $1 AND cm.driver_user_id = $2
      ORDER BY cm.timestamp ASC
    `, [event_id, driver_user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error("שגיאה בקבלת הודעות:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function sendMessage(req, res) {
  const { event_id, user_id, driver_user_id, content } = req.body;

  if (!event_id || !user_id || !driver_user_id || !content) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    await pool.query(
      `INSERT INTO chat_messages (event_id, driver_user_id, user_id, content) 
       VALUES ($1, $2, $3, $4)`,
      [event_id, driver_user_id, user_id, content]
    );
    res.status(200).json({ message: "Message sent" });
  } catch (err) {
    console.error("שגיאה בשליחת הודעה:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getMessages,
  sendMessage
};
