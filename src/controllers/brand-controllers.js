const Brand = require('../models/brandSchema');
const { uploadBrandLogo } = require('../config/cloudinary');

// Controller to create a new Brand
const createBrand = async (req, res) => {
  const { name } = req.body;
  
  // With Cloudinary, req.file will have a path property that contains the URL
  const logoUrl = req.file ? req.file.path : null;

  if (!logoUrl) {
    return res.status(400).json({ message: 'Logo is required.' });
  }

  try {
    const newBrand = new Brand({
      name,
      logo: logoUrl, // This is now a full URL from Cloudinary
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
  const logoUrl = req.file ? req.file.path : null;

  try {
    const updateData = { name };
    if (logoUrl) {
      updateData.logo = logoUrl;
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
