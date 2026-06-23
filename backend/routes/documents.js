const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const auth = require("../middleware/auth"); // Admin auth middleware
const { logAction } = require("../services/auditLogger");

const getAdminUsername = async (adminId) => {
  try {
    const Admin = require("../models/Admin");
    const adminUser = await Admin.findById(adminId);
    return adminUser ? adminUser.username : "admin";
  } catch (err) {
    return "admin";
  }
};

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
    const allowedTypes = /pdf|docx|doc|jpg|jpeg|png/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and Images are allowed."));
    }
  }
});

// Helper for standardized error messages
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: error.message || "An unexpected error occurred."
  });
};

// 1. GET /api/documents (Public/Farmer/Admin) - Fetch all documents
router.get("/", async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    handleError(res, error);
  }
});

// 2. POST /api/documents/upload (Admin only) - Upload a new document
router.post("/upload", auth, (req, res) => {
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

      if (!title) {
        // Remove uploaded file if validation fails
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Document Title is required."
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
        title,
        description,
        category: category || "Other",
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
      handleError(res, error);
    }
  });
});

// 3. DELETE /api/documents/:id (Admin only) - Delete a document
router.delete("/:id", auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    // Delete file from filesystem
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
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
