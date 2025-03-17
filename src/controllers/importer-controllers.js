const Importer = require('../models/importerSchema');
const { uploadImporterProfile, cloudinary } = require('../config/cloudinary');

// Controller to create a new Importer
const createImporter = async (req, res) => {
  const { name, address, telephone, email, brands } = req.body;
  const profileImageUrl = req.file ? req.file.path : null; // From Cloudinary

  try {
    // Parse brands array if it's a string
    let brandsArray = brands;
    if (typeof brands === 'string') {
      try {
        brandsArray = JSON.parse(brands);
      } catch (err) {
        brandsArray = brands.split(',').map(id => id.trim());
      }
    }

    const newImporter = new Importer({
      name,
      address,
      telephone,
      email,
      profileImage: profileImageUrl,
      brands: brandsArray,
    });

    await newImporter.save();
    const populatedImporter = await Importer.findById(newImporter._id).populate('brands');
    
    res.status(201).json(populatedImporter);
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
  const profileImageUrl = req.file ? req.file.path : null;

  try {
    const importer = await Importer.findById(req.params.id);
    if (!importer) {
      return res.status(404).json({ message: 'Importer not found' });
    }

    // Handle brands array
    let brandsArray = brands;
    if (typeof brands === 'string') {
      try {
        brandsArray = JSON.parse(brands);
      } catch (err) {
        brandsArray = brands.split(',').map(id => id.trim());
      }
    }

    // Delete old image from Cloudinary if uploading a new one
    if (profileImageUrl && importer.profileImage && importer.profileImage.includes('cloudinary')) {
      try {
        const publicId = extractPublicIdFromUrl(importer.profileImage);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err) {
        console.error('Error deleting old profile image:', err);
      }
    }

    // Update fields
    if (name) importer.name = name;
    if (address) importer.address = address;
    if (telephone) importer.telephone = telephone;
    if (email) importer.email = email;
    if (brandsArray) importer.brands = brandsArray;
    if (profileImageUrl) importer.profileImage = profileImageUrl;
    
    await importer.save();
    const updatedImporter = await Importer.findById(importer._id).populate('brands');
    res.json(updatedImporter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete an importer by ID
const deleteImporter = async (req, res) => {
  try {
    const importer = await Importer.findById(req.params.id);
    if (!importer) {
      return res.status(404).json({ message: 'Importer not found' });
    }

    // Delete profile image from Cloudinary if exists
    if (importer.profileImage && importer.profileImage.includes('cloudinary')) {
      try {
        const publicId = extractPublicIdFromUrl(importer.profileImage);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err) {
        console.error('Error deleting profile image:', err);
      }
    }

    await Importer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Importer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
  try {
    if (!url || typeof url !== 'string') return null;
    
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    
    let path = url.substring(uploadIndex + 8);
    
    const extIndex = path.lastIndexOf('.');
    if (extIndex !== -1) {
      path = path.substring(0, extIndex);
    }
    
    const versionMatch = path.match(/^v\d+\//);
    if (versionMatch) {
      path = path.substring(versionMatch[0].length);
    }
    
    return path;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

module.exports = {
  createImporter,
  getAllImporters,
  getImporterById,
  updateImporter,
  deleteImporter,
};
