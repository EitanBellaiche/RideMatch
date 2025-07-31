const pool = require('../db');

async function getPassengerTrips(req, res) {
    const { user_id } = req.query;
    try {
        const result = await pool.query(`
      SELECT 
        e.id AS event_id,
        e.title,
        e.event_date,
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
}

async function approvePassenger(req, res) {
    const { event_id, driver_user_id, passenger_user_id } = req.body;

    if (!event_id || !driver_user_id || !passenger_user_id) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        await pool.query(`
      UPDATE event_passengers
      SET status = 'approved'
      WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3
    `, [event_id, driver_user_id, passenger_user_id]);

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
}

async function checkRegistration(req, res) {
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
            return res.status(200).json({ status: null });
        }
    } catch (err) {
        console.error("שגיאה בבדיקת הרשמה:", err);
        res.status(500).json({ message: "שגיאה בשרת" });
    }
}

async function confirmPayment(req, res) {
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
}

async function cancelRide(req, res) {
    const { event_id, passenger_user_id } = req.body;

    console.log("בקשת ביטול התקבלה עם:", { event_id, passenger_user_id });

    if (!event_id || !passenger_user_id) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
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

        const result = await pool.query(`
      DELETE FROM event_passengers
      WHERE event_id = $1 AND passenger_user_id = $2
    `, [event_id, passenger_user_id]);

        console.log("נמחקו שורות:", result.rowCount);

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
}

async function getApprovedPassengers(req, res) {
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
}

module.exports = {
    getPassengerTrips,
    approvePassenger,
    checkRegistration,
    confirmPayment,
    cancelRide,
    getApprovedPassengers
};


