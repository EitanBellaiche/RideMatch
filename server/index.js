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
      res.status(200).json({ message: "Login successful" });
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


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});