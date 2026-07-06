const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const auth = require("../middleware/auth");
const { logAction } = require("../services/auditLogger");
const asyncHandler = require("../utils/asyncHandler");
const { isValidObjectId } = require("../utils/validators");
const { getAdminUsername } = require("../utils/helpers");

// Setup multer storage
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // 1. Double extension validation
    const parts = file.originalname.split(".");
    if (parts.length > 2) {
      return cb(new Error("Double extensions are not allowed."));
    }

    // 2. Strict extension validation
    const allowedExtensions = ["pdf", "docx", "doc", "jpg", "jpeg", "png"];
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Invalid file extension. Only PDF, DOCX, and Images are allowed."));
    }

    // 3. Strict MIME type validation
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/jpeg",
      "image/png"
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file MIME type. Only PDF, DOCX, and Images are allowed."));
    }

    cb(null, true);
  }
});

// 1. GET /api/documents (Public/Farmer/Admin) - Fetch all documents
router.get("/", asyncHandler(async (req, res) => {
  const docs = await Document.find().sort({ createdAt: -1 }).lean();
  res.json(docs);
}));

// 2. POST /api/documents/upload (Admin only) - Upload a new document
router.post("/upload", auth, (req, res, next) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a file to upload."
        });
      }

      const { title, description, category } = req.body;

      if (!title || typeof title !== "string" || title.trim() === "") {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Document Title is required and must be a valid string."
        });
      }

      if (title.length > 200) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Document Title is too long (maximum 200 characters)."
        });
      }

      // Format file size
      const bytes = req.file.size;
      let fileSizeStr = "0 Bytes";
      if (bytes > 0) {
        const k = 1024;
        const dm = 2;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        fileSizeStr = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
      }

      // URL to access the file
      const fileUrl = `/uploads/${req.file.filename}`;

      const newDoc = new Document({
        title: title.trim(),
        description: description ? String(description).trim() : "",
        category: category ? String(category).trim() : "Other",
        fileUrl,
        fileName: req.file.originalname,
        fileSize: fileSizeStr,
        uploadedBy: "Admin"
      });

      await newDoc.save();

      const adminUsername = await getAdminUsername(req.admin.id);
      await logAction(adminUsername, "Admin", "Documents", "CREATE", `Uploaded new document: ${newDoc.title} (${newDoc.fileName}, Category: ${newDoc.category})`, req.ip);

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        document: newDoc
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  });
});

// 3. DELETE /api/documents/:id (Admin only) - Delete a document
router.delete("/:id", auth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Document ID format."
    });
  }

  const doc = await Document.findById(req.params.id).lean();
  if (!doc) {
    return res.status(404).json({
      success: false,
      message: "Document not found"
    });
  }

  // Delete file from filesystem safely
  const filePath = path.join(__dirname, "../uploads", path.basename(doc.fileUrl));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await Document.findByIdAndDelete(req.params.id);

  const adminUsername = await getAdminUsername(req.admin.id);
  await logAction(adminUsername, "Admin", "Documents", "DELETE", `Deleted document: ${doc.title} (${doc.fileName})`, req.ip);

  res.json({
    success: true,
    message: "Document deleted successfully"
  });
}));

module.exports = router;
