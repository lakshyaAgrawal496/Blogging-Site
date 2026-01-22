// multerConfig.js
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// Configure storage
const storage = multer.diskStorage({
  // Destination folder for uploaded files
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  // Custom filename with random hex string + file extension
  filename: function (req, file, cb) {
    crypto.randomBytes(12, function (err, bytes) {
      if (err) return cb(err); // handle error properly
      const uniqueName =
        bytes.toString("hex") + path.extname(file.originalname);
      cb(null, uniqueName);
    });
  },
});
// Filter (only images/videos allowed)
const fileFilter = (req, file, cb) => {
  // Allow files without extensions (some browsers don't send extensions)
  if (!file.originalname || file.originalname.trim() === '') {
    return cb(null, true); // Allow empty file names
  }
  
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv|webp|jfif/;
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check MIME type as well
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp|jfif)|^video\/(mp4|mov|avi|mkv|webm)$/;
  
  if (allowedTypes.test(ext) || allowedMimeTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    console.log("File rejected:", file.originalname, "MIME:", file.mimetype, "EXT:", ext);
    cb(new Error("Only images and videos are allowed!"), false);
  }
};

// Initialize multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

module.exports = upload;
