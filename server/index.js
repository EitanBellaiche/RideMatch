const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'login.html'));
});

app.get('/home.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'home.html'));
});

const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

const eventRoutes = require('./routes/eventRoutes');
app.use('/', eventRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

const driverRoutes = require('./routes/driverRoutes.js');
app.use('/', driverRoutes);

const passengerRoutes = require('./routes/passengerRoutes.js');
app.use('/', passengerRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/', chatRoutes);

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/', reviewRoutes);

const tripRoutes = require('./routes/tripRoutes');
app.use('/', tripRoutes);



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

app.use(express.static(path.join(__dirname, '..', 'client')));


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
