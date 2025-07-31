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


app.use(express.static(path.join(__dirname, '..', 'client')));


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
