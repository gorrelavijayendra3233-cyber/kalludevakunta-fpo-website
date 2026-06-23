const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "../data/cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const STATES = [
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli",
  "Daman & Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

// Helper to load state data with caching
async function getStateData(stateName) {
  if (!STATES.includes(stateName)) {
    throw new Error("Invalid state name");
  }

  const cachePath = path.join(CACHE_DIR, `${stateName}.json`);

  // Check disk cache
  if (fs.existsSync(cachePath)) {
    try {
      const cachedContent = fs.readFileSync(cachePath, "utf8");
      return JSON.parse(cachedContent);
    } catch (err) {
      console.error(`Error reading cache file for ${stateName}:`, err);
      // fallback to fetch if file is corrupted
    }
  }

  // Fetch from GitHub
  const url = `https://raw.githubusercontent.com/pranshumaheshwari/indian-cities-and-villages/master/By%20States/${encodeURIComponent(stateName)}.json`;
  console.log(`Cache miss. Fetching from GitHub: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch location data for ${stateName}: ${response.statusText}`);
  }

  const data = await response.json();

  // Save to cache asynchronously
  fs.writeFile(cachePath, JSON.stringify(data), (err) => {
    if (err) {
      console.error(`Failed to write cache for ${stateName}:`, err);
    } else {
      console.log(`Successfully cached location data for ${stateName}`);
    }
  });

  return data;
}

// Validator function exported for use in other routes
async function validateLocationHierarchy({ state, district, mandal, village }) {
  if (!state || !district || !mandal || !village) {
    return { valid: false, message: "State, District, Mandal, and Village are all required." };
  }

  if (!STATES.includes(state)) {
    return { valid: false, message: `Invalid State: '${state}'` };
  }

  try {
    const data = await getStateData(state);
    const districtsArray = Array.isArray(data) ? data : (data.districts || []);

    const distObj = districtsArray.find(
      (d) => d.district.trim().toLowerCase() === district.trim().toLowerCase()
    );
    if (!distObj) {
      return { valid: false, message: `District '${district}' is not valid in state '${state}'` };
    }

    const mandalObj = distObj.subDistricts.find(
      (s) => s.subDistrict.trim().toLowerCase() === mandal.trim().toLowerCase()
    );
    if (!mandalObj) {
      return { valid: false, message: `Mandal/Taluk '${mandal}' is not valid in district '${district}'` };
    }

    const villageExists = mandalObj.villages.some(
      (v) => v.trim().toLowerCase() === village.trim().toLowerCase()
    );
    if (!villageExists) {
      return { valid: false, message: `Village '${village}' is not valid in mandal '${mandal}'` };
    }

    return { valid: true };
  } catch (err) {
    console.error("Location validation error:", err);
    return { valid: false, message: `Location hierarchy validation failed: ${err.message}` };
  }
}

// 1. GET /api/location/states
router.get("/states", (req, res) => {
  res.json({ success: true, states: STATES });
});

// 2. GET /api/location/districts?state=StateName
router.get("/districts", async (req, res) => {
  const { state } = req.query;
  if (!state) {
    return res.status(400).json({ success: false, message: "State parameter is required" });
  }

  try {
    const data = await getStateData(state);
    const districtsArray = Array.isArray(data) ? data : (data.districts || []);
    const districts = districtsArray.map((d) => d.district).sort();
    res.json({ success: true, districts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. GET /api/location/mandals?state=StateName&district=DistrictName
router.get("/mandals", async (req, res) => {
  const { state, district } = req.query;
  if (!state || !district) {
    return res.status(400).json({ success: false, message: "State and District parameters are required" });
  }

  try {
    const data = await getStateData(state);
    const districtsArray = Array.isArray(data) ? data : (data.districts || []);
    const distObj = districtsArray.find(
      (d) => d.district.trim().toLowerCase() === district.trim().toLowerCase()
    );

    if (!distObj) {
      return res.status(404).json({ success: false, message: "District not found in the selected State" });
    }

    const mandals = distObj.subDistricts.map((s) => s.subDistrict).sort();
    res.json({ success: true, mandals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET /api/location/villages?state=StateName&district=DistrictName&mandal=MandalName
router.get("/villages", async (req, res) => {
  const { state, district, mandal } = req.query;
  if (!state || !district || !mandal) {
    return res.status(400).json({ success: false, message: "State, District, and Mandal parameters are required" });
  }

  try {
    const data = await getStateData(state);
    const districtsArray = Array.isArray(data) ? data : (data.districts || []);
    const distObj = districtsArray.find(
      (d) => d.district.trim().toLowerCase() === district.trim().toLowerCase()
    );

    if (!distObj) {
      return res.status(404).json({ success: false, message: "District not found in the selected State" });
    }

    const mandalObj = distObj.subDistricts.find(
      (s) => s.subDistrict.trim().toLowerCase() === mandal.trim().toLowerCase()
    );

    if (!mandalObj) {
      return res.status(404).json({ success: false, message: "Mandal not found in the selected District" });
    }

    const villages = mandalObj.villages.sort();
    res.json({ success: true, villages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = {
  router,
  validateLocationHierarchy
};
