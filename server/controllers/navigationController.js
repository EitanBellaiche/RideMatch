async function getNavigationLink(req, res) {
  const address = req.query.address;
  if (!address) return res.status(400).json({ error: "כתובת חסרה" });

  console.log("📥 בקשת ניווט לכתובת:", address);

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`;

  try {
    const geoRes = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "RideMatch App"
      }
    });
    const data = await geoRes.json();

    if (!data || data.length === 0) {
      console.warn("⚠️ לא נמצאה כתובת");
      return res.json({ error: "לא נמצאה כתובת" });
    }

    const { lat, lon } = data[0];
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    console.log("✅ קישור ניווט:", gmapsUrl);

    res.json({ link: gmapsUrl });
  } catch (err) {
    console.error("❌ שגיאה בתהליך הניווט:", err);
    res.status(500).json({ error: "שגיאה בשרת" });
  }
}

module.exports = {
  getNavigationLink
};
