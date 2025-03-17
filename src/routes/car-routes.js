const express = require('express');
const router = express.Router();
const carController = require('../controllers/car-controllers');
const { uploadCarPhotos } = require('../config/cloudinary');
const Car = require('../models/carSchema');

// IMPORTANT: Put the search route BEFORE the :id routes to prevent conflicts
// Search cars
router.get('/search', carController.searchCars);

// Get all cars
router.get('/all-cars', carController.getAllCars);

// Create a new car - use Cloudinary upload for multiple photos
router.post('/create', uploadCarPhotos.array('photos', 10), carController.createCar);

// Get a single car by ID
router.get('/:id', carController.getCarById);

// Update a car by ID - use Cloudinary upload for multiple photos
router.put('/:id', uploadCarPhotos.array('photos', 10), carController.updateCar);

// Delete a car by ID
router.delete('/:id', carController.deleteCar);

// Get similar cars by ID
router.get('/:id/similar', carController.getSimilarCars);

// Add or update this route in your car-routes.js file
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Filter by brand if provided
    if (req.query.brand) {
      query.brands = req.query.brand;
    }
    
    console.log("Car query:", query);
    
    const cars = await Car.find(query)
      .populate('brands')
      .populate('importer')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${cars.length} cars matching query`);
    res.status(200).json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Error fetching cars', error: error.message });
  }
});

module.exports = router;