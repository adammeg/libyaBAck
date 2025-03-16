const Importer = require('../models/importerSchema');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer storage for profile images
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
    cb(null, Date.now() + '-' + file.originalname); // e.g., 1638316800000-profile.jpg
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and GIF images are allowed.'));
  }
};

// Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

// Controller to create a new Importer
const createImporter = async (req, res) => {
  const { name, address, telephone, email, brands } = req.body;
  const profileImage = req.file ? req.file.path : null; // Handle optional profileImage

  try {
    const newImporter = new Importer({
      name,
      address,
      telephone,
      email,
      profileImage,
      brands,
    });

    await newImporter.save();
    res.status(201).json({ message: 'Importer created successfully.', importer: newImporter });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get all importers
const getAllImporters = async (req, res) => {
  try {
    const importers = await Importer.find().populate('brands');
    res.json(importers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single importer by ID
const getImporterById = async (req, res) => {
  try {
    const importer = await Importer.findById(req.params.id).populate('brands');
    if (!importer) {
      return res.status(404).json({ message: 'Importer not found' });
    }
    res.json(importer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update an importer by ID
const updateImporter = async (req, res) => {
  const { name, address, telephone, email, brands } = req.body;
  const profileImage = req.file ? req.file.path : null; // Handle optional profileImage

  try {
    const updateData = {
      name,
      address,
      telephone,
      email,
      brands,
    };
    if (profileImage) {
      updateData.profileImage = profileImage;
    }

    const importer = await Importer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('brands');

    if (!importer) {
      return res.status(404).json({ message: 'Importer not found' });
    }

    res.json(importer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete an importer by ID
const deleteImporter = async (req, res) => {
  try {
    const importer = await Importer.findByIdAndDelete(req.params.id);
    if (!importer) {
      return res.status(404).json({ message: 'Importer not found' });
    }
    res.json({ message: 'Importer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createImporter,
  getAllImporters,
  getImporterById,
  updateImporter,
  deleteImporter,
};
