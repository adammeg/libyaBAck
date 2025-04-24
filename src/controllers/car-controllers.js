const Car = require('../models/carSchema');
const { uploadCarPhotos, cloudinary } = require('../config/cloudinary');

// Create a new car
const createCar = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);
        
        const { model, price, description, importer, type } = req.body;
        let brands = req.body.brands;
        
        // Ensure brands is an array
        if (!Array.isArray(brands)) {
            if (typeof brands === 'string') {
                try {
                    brands = JSON.parse(brands);
        } catch (err) {
                    brands = brands.split(',').map(b => b.trim());
                }
            } else if (!brands) {
                brands = [];
            } else {
                brands = [brands];
            }
        }
        
        // Get photo URLs from Cloudinary
        const photoUrls = req.files ? req.files.map(file => file.path) : [];
        
        if (photoUrls.length === 0) {
            return res.status(400).json({ message: 'At least one photo is required' });
        }
        
        // Create new car
        const newCar = new Car({
            model,
            brands,
            price,
            description,
            importer,
            type,
            photos: photoUrls,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        
        await newCar.save();
        
        // Populate the importer and brands for the response
        const populatedCar = await Car.findById(newCar._id)
            .populate('brands')
            .populate('importer');
        
        res.status(201).json(populatedCar);
    } catch (error) {
        console.error('Error creating car:', error);
        res.status(500).json({ message: 'Error creating car', error: error.message });
    }
};

// Get all cars
const getAllCars = async (req, res) => {
    try {
        const cars = await Car.find()
            .populate('brands')
            .populate('importer')
            .sort({ createdAt: -1 });
        
        res.status(200).json(cars);
    } catch (error) {
        console.error('Error fetching all cars:', error);
        res.status(500).json({ message: 'Error fetching cars', error: error.message });
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
        
        res.status(200).json(car);
    } catch (error) {
        console.error('Error fetching car:', error);
        res.status(500).json({ message: 'Error fetching car', error: error.message });
    }
};

// Update a car by ID
const updateCar = async (req, res) => {
    try {
        const { id } = req.params;
        const { model, price, description, importer, type } = req.body;
        let brands = req.body.brands;
        let photos = req.body.existingPhotos;
        
        // Find the car
        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        // Handle brands array
        if (!Array.isArray(brands)) {
            if (typeof brands === 'string') {
                try {
                    brands = JSON.parse(brands);
                } catch (err) {
                    brands = brands.split(',').map(b => b.trim());
                }
            } else if (!brands) {
                brands = [];
            } else {
                brands = [brands];
            }
        }
        
        // Handle existing photos array
        if (!Array.isArray(photos)) {
            if (typeof photos === 'string') {
                try {
                    photos = JSON.parse(photos);
                } catch (err) {
                    photos = photos ? [photos] : [];
                }
            } else if (!photos) {
                photos = [];
            } else {
                photos = [photos];
            }
        }
        
        // Get new photos from Cloudinary
        const newPhotoUrls = req.files ? req.files.map(file => file.path) : [];
        
        // Find photos to delete (photos in car.photos that are not in the existingPhotos array)
        const photosToDelete = car.photos.filter(oldPhoto => !photos.includes(oldPhoto));
        
        // Delete removed photos from Cloudinary
        for (const photoUrl of photosToDelete) {
            if (photoUrl && photoUrl.includes('cloudinary')) {
                try {
                    const publicId = extractPublicIdFromUrl(photoUrl);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log('Successfully deleted photo from Cloudinary:', publicId);
                    }
    } catch (err) {
                    console.error('Error deleting photo from Cloudinary:', err);
                }
            }
        }
        
        // Combine existing photos with new ones
        const updatedPhotos = [...photos, ...newPhotoUrls];
        
        // Update car fields
        car.model = model || car.model;
        car.brands = brands || car.brands;
        car.price = price || car.price;
        car.description = description || car.description;
        car.importer = importer || car.importer;
        car.type = type || car.type;
        car.photos = updatedPhotos;
        car.updatedAt = Date.now();
        
        await car.save();
        
        // Populate the importer and brands for the response
        const updatedCar = await Car.findById(id)
            .populate('brands')
            .populate('importer');
        
        res.status(200).json(updatedCar);
    } catch (error) {
        console.error('Error updating car:', error);
        res.status(500).json({ message: 'Error updating car', error: error.message });
    }
};

// Delete a car by ID
const deleteCar = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the car
        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        // Delete photos from Cloudinary
        for (const photoUrl of car.photos) {
            if (photoUrl && photoUrl.includes('cloudinary')) {
                try {
                    const publicId = extractPublicIdFromUrl(photoUrl);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                        console.log('Successfully deleted photo from Cloudinary:', publicId);
                    }
    } catch (err) {
                    console.error('Error deleting photo from Cloudinary:', err);
                }
            }
        }
        
        // Delete the car
        await Car.findByIdAndDelete(id);
        res.status(200).json({ message: 'Car deleted successfully' });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ message: 'Error deleting car', error: error.message });
    }
};

// Search cars
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

// Get similar cars
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
    createCar,
    getAllCars,
    getCarById,
    updateCar,
    deleteCar,
    searchCars,
    getSimilarCars,
};
