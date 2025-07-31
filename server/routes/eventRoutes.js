const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  addEvent,
  joinRide,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

router.get('/events', getAllEvents);
router.post('/events', addEvent);
router.post('/join-ride', joinRide);
router.delete('/events/:id', deleteEvent);
router.get('/events/:id', getEventById);
router.put('/events/:id', updateEvent);



module.exports = router;
