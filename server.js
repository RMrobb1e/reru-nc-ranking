import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import NodeCache from "node-cache";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { rankingTypes, regions, weaponTypes } from "./utils/constants.js";

dotenv.config();

// Needed because __dirname isn't available in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const cache = new NodeCache();

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Rate limit exceeded. Please try again later." }, // Custom error message
});

app.use("/api", limiter);

function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date();

  midnight.setHours(24, 0, 0, 0); // Set to next midnight
  return Math.floor((midnight - now) / 1000); // Convert ms to seconds
}

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

// Expose Giphy API key via an endpoint (optional, for frontend use)
app.get("/api/giphy-key", (req, res) => {
  res.json({ apiKey: process.env.GIPHY_API_KEY });
});

// metadata
app.get("/api/metadata", (req, res) => {
  console.log({ called: "/api/metadata" });
  res.json({ regions, weaponTypes, rankingTypes });
});

// API proxy route
app.get("/api/growth", async (req, res) => {
  const { ign, regionCode } = req.query;

  if (!ign) {
    return res.status(400).json({ error: "Missing 'ign' query parameter" });
  }

  const cacheKey = [ign, regionCode].join("").toLowerCase();
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  // const regionCode = "0"; // Default region code
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
