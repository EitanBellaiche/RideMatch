const pool = require('../db');

async function addDriver(req, res) {
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
}

async function getDriversByEvent(req, res) {
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
}

async function getDriverTrips(req, res) {
  const { user_id } = req.query;
  try {
    const result = await pool.query(`
      SELECT 
        e.id as event_id, 
        e.title, 
        e.event_date,           
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
}

async function getDriverJoinRequests(req, res) {
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
}

async function getDriverTripDetails(req, res) {
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
        e.location,
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
}

async function cancelTripByDriver(req, res) {
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
}


module.exports = {
  addDriver,
  getDriversByEvent,
  getDriverTrips,
  getDriverJoinRequests,
  getDriverTripDetails,
  cancelTripByDriver
};