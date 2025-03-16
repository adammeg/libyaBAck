const HeroSlide = require('../models/heroSlideSchema');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'hero');
        
        // Create the directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('Upload directory created/verified:', uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + '-' + file.originalname;
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
};

// Create multer upload instance
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Get all hero slides
const getAllSlides = async (req, res) => {
    try {
        const slides = await HeroSlide.find().sort({ order: 1 });
        res.status(200).json(slides);
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        res.status(500).json({ message: 'Error fetching hero slides', error: error.message });
    }
};

// Get active hero slides (for frontend)
const getActiveSlides = async (req, res) => {
    try {
        const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
        res.status(200).json(slides);
    } catch (error) {
        console.error('Error fetching active hero slides:', error);
        res.status(500).json({ message: 'Error fetching active hero slides', error: error.message });
    }
};

// Create a new hero slide
const createSlide = async (req, res) => {
    try {
        console.log('Create slide request received:', req.body);
        console.log('File received:', req.file);
        
        const { title, description, order, isActive, buttonText, buttonLink } = req.body;
        
        // Get image path from uploaded file
        const image = req.file ? req.file.path.replace(/\\/g, '/') : null;
        
        if (!image) {
            console.log('Image is required but not provided');
            return res.status(400).json({ message: 'Image is required' });
        }
        
        // Create new slide
        const newSlide = new HeroSlide({
            title,
            description,
            image,
            order: order || 0,
            isActive: isActive === 'true',
            buttonText: buttonText || 'Learn More',
            buttonLink: buttonLink || '/search',
            updatedAt: Date.now()
        });
        
        console.log('Creating new slide:', newSlide);
        
        await newSlide.save();
        console.log('Slide created successfully');
        res.status(201).json(newSlide);
    } catch (error) {
        console.error('Error creating hero slide:', error);
        res.status(500).json({ message: 'Error creating hero slide', error: error.message });
    }
};

// Update a hero slide
const updateSlide = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, order, isActive, buttonText, buttonLink } = req.body;
        
        // Find the slide
        const slide = await HeroSlide.findById(id);
        if (!slide) {
            return res.status(404).json({ message: 'Hero slide not found' });
        }
        
        // Update image if a new one is uploaded
        if (req.file) {
            // Delete old image if it exists
            if (slide.image) {
                try {
                    fs.unlinkSync(slide.image);
                } catch (err) {
                    console.error('Error deleting old image:', err);
                }
            }
            slide.image = req.file.path.replace(/\\/g, '/');
        }
        
        // Update other fields
        slide.title = title || slide.title;
        slide.description = description || slide.description;
        slide.order = order !== undefined ? order : slide.order;
        slide.isActive = isActive !== undefined ? isActive === 'true' : slide.isActive;
        slide.buttonText = buttonText || slide.buttonText;
        slide.buttonLink = buttonLink || slide.buttonLink;
        slide.updatedAt = Date.now();
        
        await slide.save();
        res.status(200).json(slide);
    } catch (error) {
        console.error('Error updating hero slide:', error);
        res.status(500).json({ message: 'Error updating hero slide', error: error.message });
    }
};

// Delete a hero slide
const deleteSlide = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the slide
        const slide = await HeroSlide.findById(id);
        if (!slide) {
            return res.status(404).json({ message: 'Hero slide not found' });
        }
        
        // Delete image file
        if (slide.image) {
            try {
                fs.unlinkSync(slide.image);
            } catch (err) {
                console.error('Error deleting image file:', err);
            }
        }
        
        // Delete the slide
        await HeroSlide.findByIdAndDelete(id);
        res.status(200).json({ message: 'Hero slide deleted successfully' });
    } catch (error) {
        console.error('Error deleting hero slide:', error);
        res.status(500).json({ message: 'Error deleting hero slide', error: error.message });
    }
};

module.exports = {
    getAllSlides,
    getActiveSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    upload
};