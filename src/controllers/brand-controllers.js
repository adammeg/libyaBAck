const Brand = require('../models/brandSchema');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer storage with absolute paths
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'logos');

    // Create the directory if it doesn't exist
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err, uploadPath);
      }
      cb(null, uploadPath);
    });
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append extension
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (mimeType && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: fileFilter,
}).single('logo'); // 'logo' is the field name in the form

// Controller to create a new Brand
const createBrand = async (req, res) => {
  const { name } = req.body;
  const logoPath = req.file ? req.file.path : null;

  if (!logoPath) {
    return res.status(400).json({ message: 'Logo is required.' });
  }

  try {
    const newBrand = new Brand({
      name,
      logo: logoPath,
    });

    await newBrand.save();
    res.status(201).json({ message: 'Brand created successfully.', brand: newBrand });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get all brands
const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single brand by ID
const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json(brand);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a brand by ID
const updateBrand = async (req, res) => {
  const { name } = req.body;
  const logoPath = req.file ? req.file.path : null;

  try {
    const updateData = { name };
    if (logoPath) {
      updateData.logo = logoPath;
    }

    const brand = await Brand.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.json(brand);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a brand by ID
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
