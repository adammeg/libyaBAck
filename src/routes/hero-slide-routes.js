const express = require('express');
const router = express.Router();
const heroSlideController = require('../controllers/hero-slide-controllers');
const { uploadHeroImage } = require('../config/cloudinary');

// Get all hero slides (for admin)
router.get('/all-slides', heroSlideController.getAllSlides);

// Get active hero slides (for frontend)
router.get('/active-slides', heroSlideController.getActiveSlides);

// Create a new hero slide
router.post('/create', uploadHeroImage.single('image'), heroSlideController.createSlide);

// Update a hero slide
router.put('/:id', uploadHeroImage.single('image'), heroSlideController.updateSlide);

// Delete a hero slide
router.delete('/:id', heroSlideController.deleteSlide);

module.exports = router;