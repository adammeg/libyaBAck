const HeroSlide = require('../models/heroSlideSchema');
const { uploadHeroImage, cloudinary } = require('../config/cloudinary');

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
        const { title, description, buttonText, buttonLink, order, isActive } = req.body;
        
        // Get image from Cloudinary upload (via uploadHeroImage middleware)
        const imageUrl = req.file ? req.file.path : null;
        
        if (!imageUrl) {
            return res.status(400).json({ message: 'Image is required' });
        }
        
        // Create new slide
        const newSlide = new HeroSlide({
            title,
            description,
            image: imageUrl,
            buttonText: buttonText || 'Learn More',
            buttonLink: buttonLink || '/search',
            order: order || 0,
            isActive: isActive === 'true',
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        
        await newSlide.save();
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
        const { title, description, buttonText, buttonLink, order, isActive } = req.body;
        
        // Find the slide
        const slide = await HeroSlide.findById(id);
        if (!slide) {
            return res.status(404).json({ message: 'Hero slide not found' });
        }
        
        // Update image if a new one is uploaded
        if (req.file) {
            // Delete old image from Cloudinary if it exists and is a Cloudinary URL
            if (slide.image && slide.image.includes('cloudinary')) {
                try {
                    // Extract public ID from Cloudinary URL
                    const publicId = extractPublicIdFromUrl(slide.image);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log('Successfully deleted old image from Cloudinary:', publicId);
                    }
                } catch (err) {
                    console.error('Error deleting image from Cloudinary:', err);
                }
            }
            
            // Update with new image URL
            slide.image = req.file.path;
        }
        
        // Update other fields
        if (title) slide.title = title;
        if (description) slide.description = description;
        if (order !== undefined) slide.order = order;
        if (isActive !== undefined) slide.isActive = isActive === 'true';
        if (buttonText) slide.buttonText = buttonText;
        if (buttonLink) slide.buttonLink = buttonLink;
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
        
        // Delete image from Cloudinary if it exists and is a Cloudinary URL
        if (slide.image && slide.image.includes('cloudinary')) {
            try {
                // Extract public ID from Cloudinary URL
                const publicId = extractPublicIdFromUrl(slide.image);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                    console.log('Successfully deleted image from Cloudinary:', publicId);
                }
            } catch (err) {
                console.error('Error deleting image from Cloudinary:', err);
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

// Helper function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
    try {
        // Handle URLs like: https://res.cloudinary.com/cloudname/image/upload/v1234567890/folder/filename.jpg
        if (!url || typeof url !== 'string') return null;
        
        // Extract the part after /upload/
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return null;
        
        // Get everything after /upload/ but remove the version part (v1234567890/) if present
        let path = url.substring(uploadIndex + 8); // +8 to skip "/upload/"
        
        // Remove file extension
        const extIndex = path.lastIndexOf('.');
        if (extIndex !== -1) {
            path = path.substring(0, extIndex);
        }
        
        // Remove version part if present (v1234567890/)
        const versionMatch = path.match(/^v\d+\//);
        if (versionMatch) {
            path = path.substring(versionMatch[0].length);
        }
        
        return path; // This should be the public ID including folder
    } catch (error) {
        console.error('Error extracting public ID from URL:', error);
        return null;
    }
}

module.exports = {
    getAllSlides,
    getActiveSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    uploadHeroImage // Export the middleware
};