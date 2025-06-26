const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`✅ Connected to DB. Time: ${result.rows[0].now}`);
  } catch (err) {
    console.error('❌ DB error:', err);
    res.status(500).send('DB error');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
