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
     ed.seats_available,
     e.event_date
   FROM users u
   JOIN event_drivers ed ON u.id = ed.user_id
   JOIN events e ON ed.event_id = e.id
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

  if (parseInt(driver_user_id) === parseInt(passenger_user_id)) {
    return res.status(400).json({ message: "נהג אינו יכול להירשם לנסיעה של עצמו" });
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

app.get('/driver-trips', async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await pool.query(`
      SELECT 
        e.id as event_id, 
        e.title, 
        e.day AS date, 
        ed.departure_time, 
        ed.pickup_location
      FROM event_drivers ed
      JOIN events e ON ed.event_id = e.id
      WHERE ed.user_id = $1
        AND e.event_date >= CURRENT_DATE
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
        e.id AS event_id,
        e.title,
        e.day AS date,
        ed.departure_time,
        ed.pickup_location,
        u.username AS driver_name,
        ed.user_id AS driver_user_id,
        ep.status
      FROM event_passengers ep
      JOIN events e ON ep.event_id = e.id
      JOIN event_drivers ed ON ep.driver_user_id = ed.user_id AND ep.event_id = ed.event_id
      JOIN users u ON ed.user_id = u.id
      WHERE ep.passenger_user_id = $1
        AND e.event_date >= CURRENT_DATE
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
  const { event_id, passenger_user_id } = req.body;

  console.log("בקשת ביטול התקבלה עם:", { event_id, passenger_user_id });

  if (!event_id || !passenger_user_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // שלב 1: קבל את driver_user_id שמתאים לנוסע
    const driverRes = await pool.query(`
      SELECT driver_user_id
      FROM event_passengers
      WHERE event_id = $1 AND passenger_user_id = $2
      LIMIT 1
    `, [event_id, passenger_user_id]);

    if (driverRes.rows.length === 0) {
      return res.status(404).json({ message: "לא נמצאה הרשמה מתאימה לנסיעה" });
    }

    const driver_user_id = driverRes.rows[0].driver_user_id;

    // שלב 2: מחק את הנוסע מהנסיעה
    const result = await pool.query(`
      DELETE FROM event_passengers
      WHERE event_id = $1 AND passenger_user_id = $2
    `, [event_id, passenger_user_id]);

    console.log("נמחקו שורות:", result.rowCount);

    // שלב 3: עדכן את כמות המושבים אצל הנהג
    if (result.rowCount > 0) {
      await pool.query(`
        UPDATE event_drivers
        SET seats_available = seats_available + 1
        WHERE event_id = $1 AND user_id = $2
      `, [event_id, driver_user_id]);
    }

    res.status(200).json({ message: "ההרשמה לנסיעה בוטלה והמושב שוחרר" });
  } catch (err) {
    console.error("שגיאה בביטול ההרשמה:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

app.delete("/cancel-trip-by-driver", async (req, res) => {
  const { event_id, user_id } = req.body;

  try {
    if (!event_id || !user_id) {
      return res.status(400).json({ message: "חסר event_id או user_id" });
    }

    console.log("בקשת ביטול נסיעה על ידי נהג", { event_id, user_id });

    const result = await pool.query(
      `DELETE FROM event_drivers 
       WHERE event_id = $1 AND user_id = $2`,
      [event_id, user_id]
    );

    res.status(200).json({ message: "הנסיעה בוטלה בהצלחה, כל הנוסעים זוכו " });
  } catch (err) {
    console.error("שגיאה בביטול נסיעה ע\"י נהג:", err.message);
    res.status(500).json({ message: "שגיאה בביטול נסיעה." });
  }
});

app.get('/approved-passengers', async (req, res) => {
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
      WHERE ep.event_id = $1 AND ep.driver_user_id = $2 AND ep.status = 'paid'
    `, [event_id, driver_user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error("שגיאה בקבלת נוסעים מאושרים:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});
app.get('/get-messages', async (req, res) => {
  const { event_id, user_id, driver_user_id } = req.query;

  if (!event_id || !user_id || !driver_user_id) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    // בדיקה אם המשתמש חלק מהנסיעה הספציפית
    const checkUser = await pool.query(`
      SELECT 1
      FROM event_drivers
      WHERE event_id = $1 AND user_id = $2

      UNION

      SELECT 1
      FROM event_passengers
      WHERE event_id = $1
        AND passenger_user_id = $2
        AND driver_user_id = $3
        AND (status = 'approved' OR status = 'paid')
    `, [event_id, user_id, driver_user_id]);

    if (checkUser.rowCount === 0) {
      return res.status(403).json({ message: "אין לך הרשאה לראות את הודעות הצ'אט של נסיעה זו." });
    }

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
});


app.post('/send-message', async (req, res) => {
  const { event_id, user_id, content, driver_user_id } = req.body;

  if (!event_id || !user_id || !content || !driver_user_id) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    // בדיקה אם המשתמש שייך לנסיעה הזו
    const userCheck = await pool.query(`
      SELECT 1
      FROM event_drivers
      WHERE event_id = $1 AND user_id = $2

      UNION

      SELECT 1
      FROM event_passengers
      WHERE event_id = $1
        AND passenger_user_id = $2
        AND driver_user_id = $3
        AND (status = 'approved' OR status = 'paid')
    `, [event_id, user_id, driver_user_id]);

    if (userCheck.rowCount === 0) {
      return res.status(403).json({ message: "אין לך הרשאה לשלוח הודעות בצ'אט של נסיעה זו." });
    }

    // שמירת ההודעה עם driver_user_id
    await pool.query(`
      INSERT INTO chat_messages (event_id, user_id, content, driver_user_id)
      VALUES ($1, $2, $3, $4)
    `, [event_id, user_id, content, driver_user_id]);

    res.status(200).json({ message: "הודעה נשלחה בהצלחה" });
  } catch (err) {
    console.error("שגיאה בשליחת הודעה:", err);
    res.status(500).json({ message: "שגיאה בשרת בעת שליחת הודעה" });
  }
});


app.get('/driver-trip-details', async (req, res) => {
  const { event_id, driver_user_id } = req.query;

  if (!event_id || !driver_user_id) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const result = await pool.query(`
      SELECT 
  e.title,
  e.day AS date,
  e.event_date,
  ed.departure_time,
  ed.pickup_location
FROM events e
JOIN event_drivers ed ON e.id = ed.event_id
WHERE e.id = $1 AND ed.user_id = $2

    `, [event_id, driver_user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("שגיאה בקבלת פרטי נסיעה:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

app.get('/past-trips', async (req, res) => {
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
});

app.post('/submit-review', async (req, res) => {
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
});


app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "יש למלא שם משתמש וסיסמה" });
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
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, password]
    );

    res.status(201).json({
      message: "נרשמת בהצלחה!",
      user_id: result.rows[0].id
    });
  } catch (err) {
    console.error("שגיאה בהרשמה:", err);
    res.status(500).json({ message: "שגיאה בשרת בהרשמה" });
  }
});

app.get('/reviews', async (req, res) => {
  const { reviewee_user_id } = req.query;

  if (!reviewee_user_id) {
    return res.status(400).json({ message: "Missing reviewee_user_id" });
  }

  try {
    const result = await pool.query(`
      SELECT 
        rr.rating, rr.comment, rr.reviewer_user_id,
        u.username AS reviewer_username
      FROM ride_reviews rr
      JOIN users u ON rr.reviewer_user_id = u.id
      WHERE rr.reviewee_user_id = $1
      ORDER BY rr.submitted_at DESC
    `, [reviewee_user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error("שגיאה בקבלת ביקורות:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/trip-details", async (req, res) => {
  const { event_id, driver_user_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT ed.*, u.username
       FROM event_drivers ed
       JOIN users u ON ed.user_id = u.id
       WHERE ed.event_id = $1 AND ed.user_id = $2`,
      [event_id, driver_user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "האירוע לא נמצא" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("שגיאה בשליפת פרטי נסיעה:", err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});