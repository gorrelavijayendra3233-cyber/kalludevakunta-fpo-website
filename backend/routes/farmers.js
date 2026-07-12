const express = require("express");
const router = express.Router();
const Farmer = require("../models/Farmer");
const auth = require("../middleware/auth");
const { logAction } = require("../services/auditLogger");
const asyncHandler = require("../utils/asyncHandler");
const { isValidPhone, isValidObjectId } = require("../utils/validators");
const { cleanPhone, getAdminUsername } = require("../utils/helpers");
const { STATUS } = require("../utils/constants");

// 1. Get Farmer Stats (Optimized with parallel Promise.all execution)
router.get("/stats", auth, asyncHandler(async (req, res) => {
  const [totalFarmers, uniqueVillages, landSum, activeFarmers] = await Promise.all([
    Farmer.countDocuments(),
    Farmer.distinct("village"),
    Farmer.aggregate([
      { $group: { _id: null, total: { $sum: "$landHolding" } } }
    ]),
    Farmer.countDocuments({ status: STATUS.ACTIVE })
  ]);

  const totalVillages = uniqueVillages.length;
  const totalLandHolding = landSum.length > 0 ? landSum[0].total : 0;

  res.json({
    success: true,
    data: {
      totalFarmers,
      totalVillages,
      totalLandHolding,
      activeFarmers
    }
  });
}));

// 2. Get All Farmers (with optional search query and pagination)
router.get("/", auth, asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) {
    // Sanitize input search query regex
    const sanitizedSearch = String(search).replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
    const searchRegex = new RegExp(sanitizedSearch, "i");
    query = {
      $or: [
        { farmerId: searchRegex },
        { name: searchRegex },
        { phone: searchRegex },
        { village: searchRegex }
      ]
    };
  }
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 0;

  let farmersQuery = Farmer.find(query).sort({ farmerId: 1 }).lean();
  if (limit > 0) {
    farmersQuery = farmersQuery.skip((page - 1) * limit).limit(limit);
  }

  const [farmers, total] = await Promise.all([
    farmersQuery,
    Farmer.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: farmers,
    pagination: limit > 0 ? {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    } : null
  });
}));

// 3. Add Farmer
router.post("/", auth, asyncHandler(async (req, res) => {
  const { state, district, mandal, village, name, farmerName, phone, landHolding, landArea } = req.body;

  const finalName = farmerName || name;
  if (!finalName || typeof finalName !== "string" || finalName.trim() === "" || finalName.length > 100) {
    return res.status(400).json({ success: false, message: "Farmer name is required (maximum 100 characters)." });
  }

  const cleanNum = cleanPhone(phone);
  if (!isValidPhone(cleanNum)) {
    return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits." });
  }

  const finalLand = landHolding !== undefined ? landHolding : landArea;
  if (finalLand !== undefined) {
    const numLand = parseFloat(finalLand);
    if (isNaN(numLand) || numLand < 0) {
      return res.status(400).json({ success: false, message: "Land holding must be a non-negative number." });
  }

  if (req.body.aadharNumber !== undefined && req.body.aadharNumber !== null && req.body.aadharNumber.trim() !== "") {
    const trimmed = req.body.aadharNumber.trim();
    if (!/^\d{12}$/.test(trimmed)) {
      return res.status(400).json({ success: false, message: "Aadhar number must be exactly 12 digits." });
    }
  }

  const { validateLocationHierarchy } = require("./locations");
  const validation = await validateLocationHierarchy({ state, district, mandal, village });
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const existingFarmer = await Farmer.findOne({ phone: cleanNum });
  if (existingFarmer) {
    return res.status(400).json({ success: false, message: "Mobile number is already registered." });
  }

  const farmerData = {
    ...req.body,
    name: finalName.trim(),
    farmerName: finalName.trim(),
    phone: cleanNum,
    landHolding: finalLand ? parseFloat(finalLand) : 0,
    landArea: finalLand ? String(finalLand).trim() : "0"
  };

  const farmer = new Farmer(farmerData);
  await farmer.save();

  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Farmers", "CREATE", `Manually registered new farmer: ${farmer.name} (Phone: ${farmer.phone}, Village: ${farmer.village})`, req.ip);
  
  // Auto generate notification
  try {
    const dateStr = new Date().toLocaleDateString("en-IN");
    const telegramMsg = `🌾 New Farmer Registered\n\nName: ${farmer.name}\nVillage: ${farmer.village}\nSurvey No: ${farmer.surveyNumber || "N/A"}\n\nDate: ${dateStr}`;
    const dashboardMsg = `Farmer ${farmer.name} has been added.`;

    const { triggerNotification } = require("../services/notificationService");
    await triggerNotification({
      title: "New Farmer Registered",
      dashboardMessage: dashboardMsg,
      telegramMessage: telegramMsg,
      type: "farmer",
      priority: "low"
    });
  } catch (err) {
    console.error("Failed to create farmer notification:", err);
  }

  res.status(201).json({ success: true, data: farmer });
}));

// 4. Get Single Farmer
router.get("/:id", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid Farmer ID format." });
  }

  const farmer = await Farmer.findById(req.params.id).lean();
  if (!farmer) {
    return res.status(404).json({ success: false, message: "Farmer not found" });
  }
  res.json({ success: true, data: farmer });
}));

// 5. Update Farmer
router.put("/:id", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid Farmer ID format." });
  }

  const { state, district, mandal, village, name, farmerName, phone, landHolding, landArea } = req.body;

  const existingFarmer = await Farmer.findById(req.params.id);
  if (!existingFarmer) {
    return res.status(404).json({ success: false, message: "Farmer not found" });
  }

  const finalName = farmerName || name;
  if (finalName !== undefined && (typeof finalName !== "string" || finalName.trim() === "" || finalName.length > 100)) {
    return res.status(400).json({ success: false, message: "Invalid farmer name (maximum 100 characters)." });
  }

  let cleanNum = "";
  if (phone !== undefined) {
    cleanNum = cleanPhone(phone);
    if (!isValidPhone(cleanNum)) {
      return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits." });
    }
  }

  const finalLand = landHolding !== undefined ? landHolding : landArea;
  if (finalLand !== undefined) {
    const numLand = parseFloat(finalLand);
    if (isNaN(numLand) || numLand < 0) {
      return res.status(400).json({ success: false, message: "Land holding must be a non-negative number." });
  }

  if (req.body.aadharNumber !== undefined && req.body.aadharNumber !== null && req.body.aadharNumber.trim() !== "") {
    const trimmed = req.body.aadharNumber.trim();
    if (!/^\d{12}$/.test(trimmed)) {
      return res.status(400).json({ success: false, message: "Aadhar number must be exactly 12 digits." });
    }
  }

  if (state || district || mandal || village) {
    const updatedState = state || existingFarmer.state || "Andhra Pradesh";
    const updatedDistrict = district || existingFarmer.district;
    const updatedMandal = mandal || existingFarmer.mandal;
    const updatedVillage = village || existingFarmer.village;

    const { validateLocationHierarchy } = require("./locations");
    const validation = await validateLocationHierarchy({
      state: updatedState,
      district: updatedDistrict,
      mandal: updatedMandal,
      village: updatedVillage
    });
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }
  }

  const updateData = {
    ...req.body
  };
  if (finalName !== undefined) {
    updateData.name = finalName.trim();
    updateData.farmerName = finalName.trim();
  }
  if (phone !== undefined) {
    updateData.phone = cleanNum;
  }
  if (finalLand !== undefined) {
    updateData.landHolding = parseFloat(finalLand);
    updateData.landArea = String(finalLand).trim();
  }

  const farmer = await Farmer.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );
  if (!farmer) {
    return res.status(404).json({ success: false, message: "Farmer not found" });
  }

  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Farmers", "UPDATE", `Updated details for farmer: ${farmer.name} (Phone: ${farmer.phone})`, req.ip);

  res.json({ success: true, data: farmer });
}));

// 6. Delete Farmer
router.delete("/:id", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid Farmer ID format." });
  }

  const farmer = await Farmer.findByIdAndDelete(req.params.id);
  if (!farmer) {
    return res.status(404).json({ success: false, message: "Farmer not found" });
  }

  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Farmers", "DELETE", `Deleted farmer record: ${farmer.name} (Phone: ${farmer.phone})`, req.ip);

  res.json({ success: true, message: "Farmer deleted successfully" });
}));

module.exports = router;
