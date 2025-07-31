const pool = require('../db');

async function deleteUser(req, res) {
   const userId = req.params.id;
  try {
    await pool.query('DELETE FROM event_drivers WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM event_passengers WHERE driver_user_id = $1 OR passenger_user_id = $1', [userId]);
    await pool.query('DELETE FROM ride_reviews WHERE reviewee_user_id = $1 OR reviewer_user_id = $1', [userId]);
    
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: "המשתמש נמחק בהצלחה" });
  } catch (err) {
    console.error("שגיאה במחיקת משתמש:", err);
    res.status(500).json({ message: "שגיאה במחיקת משתמש" });
  }
}
async function getUserById(req, res) {
  const userId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT username, email, phone_number, gender, birth_date FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("שגיאה בשליפת משתמש:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function getAllUsers(req, res) {
  try {
    const result = await pool.query('SELECT id, username, email, phone_number FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error("שגיאה בטעינת משתמשים:", err);
    res.status(500).json({ message: "שגיאה בטעינת משתמשים" });
  }
}

async function updateUser(req, res) {
 const userId = req.params.id;
  const { username, email, phone_number } = req.body;
  try {
    await pool.query(
      'UPDATE users SET username = $1, email = $2, phone_number = $3 WHERE id = $4',
      [username, email, phone_number, userId]
    );
    res.json({ message: "המשתמש עודכן בהצלחה" });
  } catch (err) {
    console.error("שגיאה בעדכון משתמש:", err);
    res.status(500).json({ message: "שגיאה בעדכון משתמש" });
  }
}

module.exports = {
  deleteUser,
  getUserById,
  getAllUsers,
  updateUser
};