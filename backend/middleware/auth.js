const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const auth = async (req, res, next) => {
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
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Ensure token is signed for admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin authorization required."
      });
    }

    // Database verification: verify admin account exists
    const adminExists = await Admin.findById(decoded.id);
    if (!adminExists) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Admin account not found."
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

module.exports = auth;
