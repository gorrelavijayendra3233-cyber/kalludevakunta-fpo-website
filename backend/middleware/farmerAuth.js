const jwt = require("jsonwebtoken");
const Farmer = require("../models/Farmer");

const farmerAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the farmer exists in the database
    const farmer = await Farmer.findById(decoded.id);
    if (!farmer) {
      return res.status(401).json({
        success: false,
        message: "Farmer account not found."
      });
    }

    // Verify farmer is active
    if (farmer.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Farmer account is inactive. Please contact the administrator."
      });
    }

    req.farmer = farmer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session token."
    });
  }
};

module.exports = farmerAuth;
