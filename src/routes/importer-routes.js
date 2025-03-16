const express = require('express');
const router = express.Router();
const importerController = require('../controllers/importer-controllers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer storage (optional if handled in controller)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'profiles');

    // Create the directory if it doesn't exist
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err, uploadPath);
      }
      cb(null, uploadPath);
    });
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

// File filter for profile images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, PNG, and GIF images are allowed.'));
};

// Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

// Create a new importer
router.post('/create', upload.single('profileImage'), importerController.createImporter);

// Get all importers
router.get('/all-importers', importerController.getAllImporters);

// Get a single importer by ID
router.get('/:id', importerController.getImporterById);

// Update an importer by ID
router.put('/:id', upload.single('profileImage'), importerController.updateImporter);

// Delete an importer by ID
router.delete('/:id', importerController.deleteImporter);

module.exports = router;
