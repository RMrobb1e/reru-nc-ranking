import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

app.get("/api/growth", async (req, res) => {
  const { ign } = req.query;

  if (!ign) {
    return res.status(400).json({ error: "Missing 'ign' query parameter" });
  }

  const url = `https://www.nightcrows.com/_next/data/gS2eBBlYqbNdFFZodjSYl/en/ranking/growth.json?regionCode=2020&wmsso_sign=check&keyword=${encodeURIComponent(
    ign,
  )}&rankingType=growth`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
