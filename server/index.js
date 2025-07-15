const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'login.html'));
});

app.get('/home.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'home.html'));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.status(200).json({
        message: "Login successful",
        user_id: result.rows[0].id
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

app.get('/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: "Server error while fetching events" });
  }
});

app.post('/add-driver', async (req, res) => {
  const {
    event_id,
    user_id,
    departure_time,
    price,
    car_model,
    car_color,
    pickup_location,
    seats_available
  } = req.body;

  if (!event_id || !user_id) {
    return res.status(400).json({ message: "חסרים מזהים חיוניים" });
  }

  try {
    const query = `
      INSERT INTO event_drivers 
      (event_id, user_id, departure_time, price, car_model, car_color, pickup_location, seats_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (event_id, user_id) 
      DO UPDATE SET
        departure_time = EXCLUDED.departure_time,
        price = EXCLUDED.price,
        car_model = EXCLUDED.car_model,
        car_color = EXCLUDED.car_color,
        pickup_location = EXCLUDED.pickup_location,
        seats_available = EXCLUDED.seats_available
    `;

    await pool.query(query, [
      event_id,
      user_id,
      departure_time,
      price,
      car_model,
      car_color,
      pickup_location,
      seats_available
    ]);

    res.status(200).json({ message: "נהג נוסף/עודכן בהצלחה" });
  } catch (err) {
    console.error("שגיאה בהוספת נהג:", err.stack || err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

app.get('/drivers/:eventId', async (req, res) => {
  const eventId = req.params.eventId;

  try {
    const driversResult = await pool.query(
      `SELECT 
         u.id AS driver_user_id,
         u.username, 
         ed.departure_time, 
         ed.price, 
         ed.car_model, 
         ed.car_color, 
         ed.pickup_location, 
         ed.seats_available
       FROM users u
       JOIN event_drivers ed ON u.id = ed.user_id
       WHERE ed.event_id = $1`,
      [eventId]
    );

    res.status(200).json(driversResult.rows);
  } catch (error) {
    console.error('שגיאה בקבלת הנהגים:', error);
    res.status(500).json({ message: 'שגיאה בשרת בקבלת הנהגים' });
  }
});


app.post('/join-ride', async (req, res) => {
  const { event_id, driver_user_id, passenger_user_id } = req.body;

  if (!event_id || !driver_user_id || !passenger_user_id) {
    return res.status(400).json({ message: "חסרים שדות נדרשים" });
  }

  try {
    // בדיקה אם כבר ביקש להצטרף
    const exists = await pool.query(
      `SELECT * FROM event_passengers 
       WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3`,
      [event_id, driver_user_id, passenger_user_id]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "כבר שלחת בקשה לנסיעה זו" });
    }

    // שלב בקשה בלבד (לא נוגע במקומות פנויים עדיין)
    await pool.query(
      `INSERT INTO event_passengers 
       (event_id, driver_user_id, passenger_user_id, status)
       VALUES ($1, $2, $3, 'pending')`,
      [event_id, driver_user_id, passenger_user_id]
    );

    res.status(200).json({ message: "הבקשה להצטרפות נשלחה. ממתינה לאישור הנהג." });

  } catch (err) {
    console.error("שגיאה בבקשת הצטרפות:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});


app.post('/approve-passenger', async (req, res) => {
  const { event_id, driver_user_id, passenger_user_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE event_passengers
       SET status = 'approved'
       WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3 AND status = 'pending'`,
      [event_id, driver_user_id, passenger_user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "לא נמצאה בקשה או שכבר אושרה" });
    }

    res.status(200).json({ message: "הנוסע אושר. כעת הוא יכול לשלם." });
  } catch (err) {
    console.error("שגיאה באישור נוסע:", err);
    res.status(500).json({ message: "שגיאה באישור" });
  }
});

app.post('/confirm-payment', async (req, res) => {
  const { event_id, driver_user_id, passenger_user_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE event_passengers
       SET status = 'paid'
       WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3 AND status = 'approved'`,
      [event_id, driver_user_id, passenger_user_id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "הנוסע לא אושר עדיין או כבר שילם" });
    }

    // הפחתת מקומות פנויים
    await pool.query(
      `UPDATE event_drivers
       SET seats_available = seats_available - 1
       WHERE event_id = $1 AND user_id = $2 AND seats_available > 0`,
      [event_id, driver_user_id]
    );

    res.status(200).json({ message: "התשלום הצליח. הצטרפת לנסיעה!" });
  } catch (err) {
    console.error("שגיאה בתשלום:", err);
    res.status(500).json({ message: "שגיאה בשרת באישור תשלום" });
  }
});

app.get('/pending-passengers/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const { driver_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT u.id AS passenger_user_id, u.username
       FROM event_passengers ep
       JOIN users u ON ep.passenger_user_id = u.id
       WHERE ep.event_id = $1 AND ep.driver_user_id = $2 AND ep.status = 'pending'`,
      [eventId, driver_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("שגיאה בקבלת נוסעים ממתינים:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});
app.get('/passenger-status/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const { user_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT status, driver_user_id
       FROM event_passengers
       WHERE event_id = $1 AND passenger_user_id = $2
       ORDER BY id DESC LIMIT 1`,
      [eventId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "לא נמצאה הרשמה לאירוע זה" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("שגיאה בקבלת סטטוס נוסע:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});