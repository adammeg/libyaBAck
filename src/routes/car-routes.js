const express = require('express');
const router = express.Router();
const carController = require('../controllers/car-controllers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Car = require('../models/carSchema');

// Set up Multer storage for car photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'cars');

    // Create the directory if it doesn't exist
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err, uploadPath);
      }
      cb(null, uploadPath);
    });
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter for car photos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
};

// Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

// IMPORTANT: Put the search route BEFORE the :id routes to prevent conflicts
// Search cars
router.get('/search', carController.searchCars);

// Get all cars
router.get('/all-cars', carController.getAllCars);

// Create a new car - use upload.array for multiple photos
router.post('/create', upload.array('photos', 10), carController.createCar);

// Get a single car by ID
router.get('/:id', carController.getCarById);

// Update a car by ID
router.put('/:id', upload.array('photos', 10), carController.updateCar);

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