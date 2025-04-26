import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import NodeCache from "node-cache";

// Needed because __dirname isn't available in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const cache = new NodeCache();

function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date();

  midnight.setHours(24, 0, 0, 0); // Set to next midnight
  return Math.floor((midnight - now) / 1000); // Convert ms to seconds
}

const weaponTypes = {
  All: 0,
  Bow: 21,
  OneHanded: 13,
  TwinSword: 12,
  Staff: 31,
  Wand: 32,
  TwoHanded: 11,
  Spear: 14,
  Dagger: 22,
  Rapier: 23,
};

const regionCodes = {
  All: 0,
  AsiaI: 2010,
  AsiaII: 2020,
  Naeu: 3010,
  Sa: 4010,
};

const rankingTypes = {
  growth: "growth",
  level: "level",
};

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

  const cacheKey = ign.toLowerCase();
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const regionCode = "0"; // Default region code
  const rankingType = "growth"; // Default ranking type
  const weaponType = "0"; // Default weapon type

  const url = `https://www.nightcrows.com/_next/data/gS2eBBlYqbNdFFZodjSYl/en/ranking/growth.json?regionCode=${regionCode}&weaponType=${weaponType}&wmsso_sign=check&keyword=${encodeURIComponent(
    ign,
  )}&rankingType=${rankingType}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Cache it until midnight
    const ttl = getSecondsUntilMidnight();
    cache.set(cacheKey, data, ttl);

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
