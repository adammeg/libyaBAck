const Car = require('../models/carSchema');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer storage
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

// Create a new car
const createCar = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);
        
        const { model, price, description, importer } = req.body;
        let brands = req.body.brands;
        
        // Ensure brands is an array
        if (!Array.isArray(brands)) {
            brands = brands ? [brands] : [];
        }
        
        // Get photo paths from uploaded files
        const photos = req.files ? req.files.map(file => file.path) : [];
        
        // Create new car
        const newCar = new Car({
            model,
            price,
            description,
            photos,
            importer,
            brands
        });
        
        await newCar.save();
        
        // Populate the car with brand and importer data
        const populatedCar = await Car.findById(newCar._id)
            .populate('brands')
            .populate('importer');
            
        res.status(201).json({ 
            message: 'Car created successfully.', 
            car: populatedCar 
        });
    } catch (error) {
        console.error('Error creating car:', error);
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// Get all cars
const getAllCars = async (req, res) => {
    try {
        const cars = await Car.find()
            .populate('brands')
            .populate('importer');
        res.json(cars);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a single car by ID
const getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id)
            .populate('brands')
            .populate('importer');
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        res.json(car);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update a car by ID
const updateCar = async (req, res) => {
    try {
        const { model, price, description, importer } = req.body;
        let brands = req.body.brands;
        
        // Ensure brands is an array
        if (!Array.isArray(brands)) {
            brands = brands ? [brands] : [];
        }
        
        // Prepare update data
        const updateData = {
            model,
            price,
            description,
            importer,
            brands
        };
        
        // Add photos if files were uploaded
        if (req.files && req.files.length > 0) {
            updateData.photos = req.files.map(file => file.path);
        }
        
        const car = await Car.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).populate('brands importer');
        
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        res.json(car);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a car by ID
const deleteCar = async (req, res) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        res.json({ message: 'Car deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add this function to your car controller
const searchCars = async (req, res) => {
  try {
    console.log("Search query:", req.query);
    const { type, brand, model } = req.query;
    
    // Build query object
    const query = {};
    
    if (type && type !== 'all-types') {
      query.type = type;
    }
    
    if (brand && brand !== 'all-makes') {
      // Handle ObjectId validation
      try {
        // Check if it's a valid ObjectId
        if (brand.match(/^[0-9a-fA-F]{24}$/)) {
          query.brands = brand;
        }
      } catch (err) {
        console.log("Invalid brand ID format:", brand);
        // If not a valid ObjectId, just continue without this filter
      }
    }
    
    if (model && model !== 'all-models') {
      // Use regex for partial matching
      query.model = { $regex: model, $options: 'i' };
    }
    
    console.log("Final query:", query);
    
    // Find cars matching the query
    const cars = await Car.find(query)
      .populate('brands')
      .populate('importer')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${cars.length} cars matching the query`);
    res.status(200).json(cars);
  } catch (error) {
    console.error('Error searching cars:', error);
    res.status(500).json({ message: 'Error searching cars', error: error.message });
  }
};

// Add this function to your car controller
const getSimilarCars = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the current car to find similar ones
    const car = await Car.findById(id).populate('brands');
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Get the brand IDs
    const brandIds = car.brands.map(brand => 
      typeof brand === 'object' ? brand._id : brand
    );
    
    // Find cars with the same brands, excluding the current car
    const similarCars = await Car.find({
      _id: { $ne: id },
      brands: { $in: brandIds },
    })
      .populate('brands')
      .populate('importer')
      .limit(3)
      .sort({ createdAt: -1 });
    
    res.status(200).json(similarCars);
  } catch (error) {
    console.error('Error finding similar cars:', error);
    res.status(500).json({ message: 'Error finding similar cars', error: error.message });
  }
};

module.exports = {
    createCar,
    getAllCars,
    getCarById,
    updateCar,
    deleteCar,
    searchCars,
    getSimilarCars,
};
