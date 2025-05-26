const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // דוגמה בסיסית בלבד
  if (username === "admin" && password === "1234") {
    res.json({ message: "התחברת בהצלחה!" });
  } else {
    res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
  }
});

app.listen(3000, () => {
  console.log("port running in http://localhost:3000");
});
