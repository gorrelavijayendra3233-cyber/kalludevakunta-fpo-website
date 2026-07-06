const { spawn } = require("child_process");
const http = require("http");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Force resolution of root node_modules for playwright
module.paths.push("c:/Users/gorre/kalludevakunta-fpo/node_modules");
const { chromium } = require("playwright");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Admin = require("../models/Admin");
const Farmer = require("../models/Farmer");

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 5173;
const JWT_SECRET = process.env.JWT_SECRET || "KDK_FPO_2026_8x9m2q7z1r5p4t6v";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkUrl = (url) => {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304 || res.statusCode === 404);
    }).on("error", () => {
      resolve(false);
    });
  });
};

async function runE2E() {
  console.log("=== Phase 5: End-to-End User Flow & Integration Verification ===");
  
  let backend = null;
  let frontend = null;
  let browser = null;
  
  try {
    // 1. Boot Servers
    const isBackendRunning = await checkUrl(`http://localhost:${BACKEND_PORT}/api/products`);
    if (isBackendRunning) {
      console.log(`Backend is already running on port ${BACKEND_PORT}. Reusing it.`);
    } else {
      console.log("Starting backend server...");
      backend = spawn("node", ["server.js"], {
        cwd: path.join(__dirname, ".."),
        env: { ...process.env, PORT: String(BACKEND_PORT) }
      });
      // Wait for boot
      for (let i = 0; i < 15; i++) {
        await sleep(1000);
        if (await checkUrl(`http://localhost:${BACKEND_PORT}/api/products`)) {
          console.log("Backend started successfully.");
          break;
        }
      }
    }

    const isFrontendRunning = await checkUrl(`http://localhost:${FRONTEND_PORT}/`);
    if (isFrontendRunning) {
      console.log(`Frontend is already running on port ${FRONTEND_PORT}. Reusing it.`);
    } else {
      console.log("Starting React Vite frontend...");
      frontend = spawn("npx", ["vite", "--port", String(FRONTEND_PORT)], {
        cwd: "c:/Users/gorre/kalludevakunta-fpo",
        shell: true
      });
      // Wait for boot
      for (let i = 0; i < 15; i++) {
        await sleep(1000);
        if (await checkUrl(`http://localhost:${FRONTEND_PORT}/`)) {
          console.log("Frontend started successfully.");
          break;
        }
      }
    }

    // 2. Connect to MongoDB to fetch reference credentials
    console.log("Connecting to MongoDB to load test data...");
    await mongoose.connect(process.env.MONGO_URI);
    const dbAdmin = await Admin.findOne();
    const dbFarmer = await Farmer.findOne();
    await mongoose.disconnect();

    if (!dbAdmin || !dbFarmer) {
      throw new Error("Could not find test admin or farmer in database.");
    }

    const adminToken = jwt.sign({ id: dbAdmin._id.toString(), role: "admin" }, JWT_SECRET);
    const farmerToken = jwt.sign({ farmerId: dbFarmer._id.toString() }, JWT_SECRET);
    const farmerData = {
      id: dbFarmer._id.toString(),
      farmerId: dbFarmer.farmerId,
      farmerName: dbFarmer.farmerName || dbFarmer.name,
      name: dbFarmer.name,
      phone: dbFarmer.phone,
      state: dbFarmer.state,
      district: dbFarmer.district,
      mandal: dbFarmer.mandal,
      village: dbFarmer.village
    };

    console.log("Generated JWT Tokens for E2E tests.");

    // 3. Launch Headless Browser
    console.log("Launching Playwright Chromium browser...");
    let launchOptions = { headless: true };
    try {
      browser = await chromium.launch({ ...launchOptions, channel: "chrome" });
      console.log("Launched local Chrome instance.");
    } catch (e) {
      try {
        browser = await chromium.launch({ ...launchOptions, channel: "msedge" });
        console.log("Launched local Edge instance.");
      } catch (err) {
        console.log("No local browser found. Launching default Playwright engine...");
        browser = await chromium.launch(launchOptions);
      }
    }

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    const results = [];
    const recordResult = (journey, assertName, status) => {
      results.push({ journey, assertName, status: status ? "✅ Pass" : "❌ Fail" });
      console.log(`[E2E] [${status ? "PASS" : "FAIL"}] ${journey} - ${assertName}`);
    };

    // JOURNEY 1: Farmer Dashboard Flow
    console.log("\nRunning Farmer Dashboard journey...");
    await page.goto(`http://localhost:${FRONTEND_PORT}/`);
    await sleep(2000);

    // Inject Farmer token
    await page.evaluate(({ token, farmer }) => {
      localStorage.setItem("farmerToken", token);
      localStorage.setItem("farmer_token", token);
      localStorage.setItem("farmer_data", JSON.stringify(farmer));
    }, { token: farmerToken, farmer: farmerData });

    // Navigate to Dashboard
    await page.goto(`http://localhost:${FRONTEND_PORT}/farmer-dashboard`);
    await sleep(3000);

    const hasWelcome = await page.locator("text=Welcome back").isVisible() || await page.locator(`text=${dbFarmer.name}`).isVisible();
    recordResult("Farmer Journey", "Access Farmer Dashboard", hasWelcome);

    // Verify bookings tab/link visible
    const hasBookingsTab = await page.locator("text=My Bookings").isVisible() || await page.locator("text=Machinery Bookings").isVisible() || await page.locator("text=Active Bookings").isVisible();
    recordResult("Farmer Journey", "My Bookings visibility", hasBookingsTab);

    // JOURNEY 2: Product Catalog & Details Modal Flow
    console.log("\nRunning Product Catalog journey...");
    await page.goto(`http://localhost:${FRONTEND_PORT}/products`);
    await sleep(3000);

    const hasProducts = await page.locator(".product-card-item").first().isVisible() || await page.locator("text=Groundnut").isVisible();
    recordResult("Product Catalog", "Catalog page rendered products", hasProducts);

    // Open Details Modal
    if (hasProducts) {
      await page.locator(".product-card-item").first().click();
      await sleep(1500);
      const isModalOpen = await page.locator(".modal-card").isVisible() || await page.locator("text=Close").isVisible();
      recordResult("Product Catalog", "Click card opens details modal", isModalOpen);
    } else {
      recordResult("Product Catalog", "Click card opens details modal", false);
    }

    // JOURNEY 3: Admin Dashboard Flow
    console.log("\nRunning Admin Dashboard journey...");
    await page.goto(`http://localhost:${FRONTEND_PORT}/admin`);
    await sleep(2000);

    // Inject Admin token
    await page.evaluate((token) => {
      localStorage.setItem("fpo_admin_token", token);
    }, adminToken);

    await page.goto(`http://localhost:${FRONTEND_PORT}/admin`);
    await sleep(3000);

    const hasAdminDashboard = await page.locator("text=Overview").isVisible() || await page.locator("text=Farmers Registered").isVisible() || await page.locator("text=Total Products").isVisible();
    recordResult("Admin Journey", "Access Admin Dashboard Overview", hasAdminDashboard);

    // Click Audit Logs tab
    const logsTab = page.locator("text=Audit Logs");
    if (await logsTab.isVisible()) {
      await logsTab.click();
      await sleep(2000);
      const hasLogs = await page.locator("text=Timestamp").first().isVisible() || 
                      await page.locator("text=Module / Action").first().isVisible() ||
                      await page.locator("text=No Audit Logs Found").first().isVisible();
      recordResult("Admin Journey", "Access Audit Logs tab", hasLogs);
    } else {
      recordResult("Admin Journey", "Access Audit Logs tab", false);
    }

    // Print E2E Summary Report
    console.log("\n### End-to-End E2E User Journey Test Results\n");
    console.log("| Journey | Validation Assertion | Status |");
    console.log("| --- | --- | --- |");
    for (const r of results) {
      console.log(`| ${r.journey} | ${r.assertName} | ${r.status} |`);
    }

  } catch (err) {
    console.error("E2E Test Run crashed:", err);
  } finally {
    if (browser) await browser.close();
    if (backend) {
      console.log("Stopping spawned backend server...");
      backend.kill();
    }
    if (frontend) {
      console.log("Stopping spawned React frontend...");
      frontend.kill();
    }
  }
}

runE2E();
