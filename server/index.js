const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// static files
app.use(express.static(path.join(__dirname, '..', 'client')));

// redirect login.html -> home.html
app.get('/login.html', (req, res) => {
  res.redirect('/home.html');
});

// login page
app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'login.html'));
});

// login route
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

// get all events
app.get('/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: "Server error while fetching events" });
  }
});

// get event by id + drivers
app.get('/events/:id', async (req, res) => {
  const eventId = req.params.id;

  console.log("Fetching event with ID:", eventId);

  if (!eventId) {
    console.log("eventId is undefined or null");
    return res.status(400).json({ message: "Missing event ID" });
  }

  try {
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1', [eventId]
    );
    console.log("Event result:", eventResult.rows);

    const driversResult = await pool.query(
      `SELECT u.username, u.departure_time, u.price, u.car_model, u.car_color, u.pickup_location, ed.seats_available
       FROM users u
       JOIN event_drivers ed ON u.id = ed.user_id
       WHERE ed.event_id = $1`,
      [eventId]
    );
    console.log("Drivers result:", driversResult.rows);

    res.json({
      event: eventResult.rows[0],
      drivers: driversResult.rows
    });

  } catch (err) {
    console.error('Error fetching event details:', err.stack || err);
    res.status(500).json({ message: 'שגיאה בטעינת פרטי האירוע' });
  }
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
