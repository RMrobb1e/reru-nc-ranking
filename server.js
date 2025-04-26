import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

// Needed because __dirname isn't available in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://reru-nc-ranking.onrender.com",
  ); // or specify the frontend domain here
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

// API proxy route
app.get("/api/growth", async (req, res) => {
  const { ign } = req.query;

  if (!ign) {
    return res.status(400).json({ error: "Missing 'ign' query parameter" });
  }

  const regionCode = "2020"; // Default region code
  const rankingType = "growth"; // Default ranking type

  const url = `https://www.nightcrows.com/_next/data/gS2eBBlYqbNdFFZodjSYl/en/ranking/growth.json?regionCode=${regionCode}&wmsso_sign=check&keyword=${encodeURIComponent(
    ign,
  )}&rankingType=${rankingType}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Catch-all route for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
