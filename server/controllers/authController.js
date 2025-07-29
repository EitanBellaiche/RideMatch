const pool = require('../db');

async function login(req, res) {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.status(200).json({
        message: "Login successful",
        user_id: result.rows[0].id,
        role: result.rows[0].role
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
}

async function signup(req, res) {
  const { username, password, email, phone_number, gender, birth_date } = req.body;

  if (!username || !password || !email || !phone_number || !gender || !birth_date) {
    return res.status(400).json({ message: "יש למלא את כל השדות" });
  }

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: "שם המשתמש כבר תפוס" });
    }

    const result = await pool.query(
      `INSERT INTO users 
      (username, password, email, phone_number, gender, birth_date) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id`,
      [username, password, email, phone_number, gender, birth_date]
    );

    res.status(201).json({
      message: "נרשמת בהצלחה!",
      user_id: result.rows[0].id
    });
  } catch (err) {
    console.error("שגיאה בהרשמה:", err);
    res.status(500).json({ message: "שגיאה בשרת בהרשמה" });
  }
}


module.exports = {
  login,
  signup
};
