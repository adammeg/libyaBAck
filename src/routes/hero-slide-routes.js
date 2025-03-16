const express = require('express');
const router = express.Router();
const heroSlideController = require('../controllers/hero-slide-controllers');

// Get all hero slides (for admin)
router.get('/all-slides', heroSlideController.getAllSlides);

// Get active hero slides (for frontend)
router.get('/active-slides', heroSlideController.getActiveSlides);

// Create a new hero slide
router.post('/create', heroSlideController.upload.single('image'), heroSlideController.createSlide);

// Update a hero slide
router.put('/:id', heroSlideController.upload.single('image'), heroSlideController.updateSlide);

// Delete a hero slide
router.delete('/:id', heroSlideController.deleteSlide);

module.exports = router;