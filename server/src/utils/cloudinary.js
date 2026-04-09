const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

// Verify environment variables are loaded
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "***" + process.env.CLOUDINARY_API_KEY.slice(-4) : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "***" : "MISSING"
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  console.log("File upload attempt:", {
    originalname: file.originalname,
    extension: fileExtension,
    mimetype: file.mimetype
  });

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format: ${fileExtension}. Allowed: ${allowedExtensions.join(', ')}`));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter,limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  }, });

module.exports = { upload, cloudinary };
