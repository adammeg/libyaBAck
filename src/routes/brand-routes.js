const express = require('express');
const multer = require('multer');
const brandController = require('../controllers/brand-controllers');
const path = require('path');
const fs = require('fs');
const Brand = require('../models/brandSchema');

const router = express.Router();

// Set up Multer storage for brand logos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'brands');
        
        // Create the directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// File filter for brand logos
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
};

// Initialize Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});

// Get all brands (for admin)
router.get('/all-brands', async (req, res) => {
    try {
        const brands = await Brand.find().sort({ name: 1 });
        res.status(200).json(brands);
    } catch (error) {
        console.error('Error fetching all brands:', error);
        res.status(500).json({ message: 'Error fetching brands', error: error.message });
    }
});

// Get active brands (for frontend)
router.get('/', async (req, res) => {
    try {
        const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
        res.status(200).json(brands);
    } catch (error) {
        console.error('Error fetching active brands:', error);
        res.status(500).json({ message: 'Error fetching active brands', error: error.message });
    }
});

// Get a single brand by ID
router.get('/:id', async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }
        res.status(200).json(brand);
    } catch (error) {
        console.error('Error fetching brand:', error);
        res.status(500).json({ message: 'Error fetching brand', error: error.message });
    }
});

// Create a new brand
router.post('/', upload.single('logo'), async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        
        // Check if brand with same name already exists
        const existingBrand = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingBrand) {
            return res.status(400).json({ message: 'A brand with this name already exists' });
        }
        
        // Get logo path from uploaded file
        const logo = req.file ? req.file.path.replace(/\\/g, '/') : null;
        
        if (!logo) {
            return res.status(400).json({ message: 'Logo is required' });
        }
        
        // Create new brand
        const newBrand = new Brand({
            name,
            description,
            logo,
            isActive: isActive === 'true',
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        
        await newBrand.save();
        res.status(201).json(newBrand);
    } catch (error) {
        console.error('Error creating brand:', error);
        res.status(500).json({ message: 'Error creating brand', error: error.message });
    }
});

// Update a brand
router.put('/:id', upload.single('logo'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        
        // Find the brand
        const brand = await Brand.findById(id);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }
        
        // Check if updating to a name that already exists (excluding this brand)
        if (name && name !== brand.name) {
            const existingBrand = await Brand.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: id }
            });
            
            if (existingBrand) {
                return res.status(400).json({ message: 'A brand with this name already exists' });
            }
        }
        
        // Update logo if a new one is uploaded
        if (req.file) {
            // Delete old logo if it exists
            if (brand.logo) {
                try {
                    fs.unlinkSync(brand.logo);
                } catch (err) {
                    console.error('Error deleting old logo:', err);
                }
            }
            brand.logo = req.file.path.replace(/\\/g, '/');
        }
        
        // Update other fields
        if (name) brand.name = name;
        if (description !== undefined) brand.description = description;
        if (isActive !== undefined) brand.isActive = isActive === 'true';
        brand.updatedAt = Date.now();
        
        await brand.save();
        res.status(200).json(brand);
    } catch (error) {
        console.error('Error updating brand:', error);
        res.status(500).json({ message: 'Error updating brand', error: error.message });
    }
});

// Delete a brand
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the brand
        const brand = await Brand.findById(id);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }
        
        // Delete logo file
        if (brand.logo) {
            try {
                fs.unlinkSync(brand.logo);
            } catch (err) {
                console.error('Error deleting logo file:', err);
            }
        }
        
        // Delete the brand
        await Brand.findByIdAndDelete(id);
        res.status(200).json({ message: 'Brand deleted successfully' });
    } catch (error) {
        console.error('Error deleting brand:', error);
        res.status(500).json({ message: 'Error deleting brand', error: error.message });
    }
});

module.exports = router;
