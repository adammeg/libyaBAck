const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Create storage engine for brand logos
const brandStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'libya-auto/brands',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, crop: 'limit' }]
  }
});

// Create storage engine for car photos
const carStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'libya-auto/cars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }]
  }
});

// Create storage engine for hero slides
const heroStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'libya-auto/hero',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1920, crop: 'limit' }]
  }
});

// Create storage engine for importer profiles
const importerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'libya-auto/importers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, crop: 'limit' }]
  }
});

// Create multer instances
const uploadBrandLogo = multer({ storage: brandStorage });
const uploadCarPhotos = multer({ storage: carStorage });
const uploadHeroImage = multer({ storage: heroStorage });
const uploadImporterProfile = multer({ storage: importerStorage });

module.exports = {
  cloudinary,
  uploadBrandLogo,
  uploadCarPhotos,
  uploadHeroImage,
  uploadImporterProfile
}; 