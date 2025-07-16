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
    // בדוק אם כבר קיים
    const exists = await pool.query(
      `SELECT * FROM event_passengers 
       WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3`,
      [event_id, driver_user_id, passenger_user_id]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "כבר נרשמת לנסיעה זו" });
    }

    // בדיקת זמינות
    const available = await pool.query(
      `SELECT seats_available FROM event_drivers 
       WHERE event_id = $1 AND user_id = $2`,
      [event_id, driver_user_id]
    );

    if (available.rows.length === 0 || available.rows[0].seats_available <= 0) {
      return res.status(400).json({ message: "אין מקומות פנויים בנסיעה זו" });
    }

    // הוספה עם status = 'paid'
    await pool.query(
      `INSERT INTO event_passengers 
   (event_id, driver_user_id, passenger_user_id, status)
   VALUES ($1, $2, $3, 'pending')`,
      [event_id, driver_user_id, passenger_user_id]
    );

    // עדכון מקומות
    await pool.query(
      `UPDATE event_drivers 
       SET seats_available = seats_available - 1 
       WHERE event_id = $1 AND user_id = $2`,
      [event_id, driver_user_id]
    );

    res.status(200).json({ message: "נרשמת בהצלחה לנסיעה!" });

  } catch (err) {
    console.error("שגיאה בהרשמה לנסיעה:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

// נסיעות כנהג
app.get('/driver-trips', async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await pool.query(`
      SELECT e.id as event_id, e.title, e.day AS date, e.time, ed.pickup_location
      FROM event_drivers ed
      JOIN events e ON ed.event_id = e.id
      WHERE ed.user_id = $1
    `, [user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error("שגיאה בנסיעות כנהג:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

app.get('/passenger-trips', async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await pool.query(`
      SELECT 
        e.id as event_id,
        e.title,
        e.day AS date,
        e.time,
        ed.pickup_location,
        u.username as driver_name
      FROM event_passengers ep
      JOIN events e ON ep.event_id = e.id
      JOIN event_drivers ed ON ep.driver_user_id = ed.user_id AND ep.event_id = ed.event_id
      JOIN users u ON ed.user_id = u.id
      WHERE ep.passenger_user_id = $1
    `, [user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error("שגיאה בנסיעות כנוסע:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

app.get('/driver-requests', async (req, res) => {
  const { event_id, driver_user_id } = req.query;

  if (!event_id || !driver_user_id) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const result = await pool.query(`
      SELECT 
        ep.passenger_user_id,
        u.username,
        ep.status
      FROM event_passengers ep
      JOIN users u ON ep.passenger_user_id = u.id
      WHERE ep.event_id = $1 AND ep.driver_user_id = $2 AND ep.status = 'pending'
    `, [event_id, driver_user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error("שגיאה בקבלת בקשות הצטרפות:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});
app.post('/approve-passenger', async (req, res) => {
  const { event_id, driver_user_id, passenger_user_id } = req.body;

  if (!event_id || !driver_user_id || !passenger_user_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // עדכון הסטטוס ל־'paid'
    await pool.query(`
      UPDATE event_passengers
SET status = 'approved'
      WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3
    `, [event_id, driver_user_id, passenger_user_id]);

    // הפחתת מקומות במידה ולא ירדו עדיין
    await pool.query(`
      UPDATE event_drivers
      SET seats_available = seats_available - 1
      WHERE event_id = $1 AND user_id = $2 AND seats_available > 0
    `, [event_id, driver_user_id]);

    res.status(200).json({ message: "נוסע אושר בהצלחה" });
  } catch (err) {
    console.error("שגיאה באישור נוסע:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

app.get('/check-registration', async (req, res) => {
  const { event_id, driver_user_id, passenger_user_id } = req.query;

  if (!event_id || !driver_user_id || !passenger_user_id) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const result = await pool.query(`
      SELECT status FROM event_passengers
      WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3
    `, [event_id, driver_user_id, passenger_user_id]);

    if (result.rows.length > 0) {
      return res.status(200).json({ status: result.rows[0].status });
    } else {
      return res.status(200).json({ status: null }); // לא רשום
    }
  } catch (err) {
    console.error("שגיאה בבדיקת הרשמה:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

app.post('/confirm-payment', async (req, res) => {
  const { event_id, driver_user_id, passenger_user_id } = req.body;

  if (!event_id || !driver_user_id || !passenger_user_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    await pool.query(`
      UPDATE event_passengers
      SET status = 'paid'
      WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3 AND status = 'approved'
    `, [event_id, driver_user_id, passenger_user_id]);

    res.status(200).json({ message: "התשלום אושר והנוסע נוסף לנסיעה" });
  } catch (err) {
    console.error("שגיאה באישור תשלום:", err);
    res.status(500).json({ message: "שגיאה בשרת בעת אישור התשלום" });
  }
});

app.delete('/cancel-ride', async (req, res) => {
  const { event_id, driver_user_id, passenger_user_id } = req.body;

  console.log("בקשת ביטול התקבלה עם:", { event_id, driver_user_id, passenger_user_id });

  if (!event_id || !driver_user_id || !passenger_user_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const result = await pool.query(`
      DELETE FROM event_passengers
      WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3
    `, [event_id, driver_user_id, passenger_user_id]);

    console.log("מספר שורות שנמחקו:", result.rowCount);

    if (result.rowCount > 0) {
      await pool.query(`
        UPDATE event_drivers
        SET seats_available = seats_available + 1
        WHERE event_id = $1 AND user_id = $2
      `, [event_id, driver_user_id]);
    }

    res.status(200).json({ message: "ההרשמה לנסיעה בוטלה" });
  } catch (err) {
    console.error("שגיאה בביטול ההרשמה:", err); // שורה חשובה!
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});