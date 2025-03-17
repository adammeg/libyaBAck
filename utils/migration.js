const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../src/config/cloudinary');
const Car = require('../src/models/carSchema');
const Brand = require('../src/models/brandSchema');
const Importer = require('../src/models/importerSchema');
const HeroSlide = require('../src/models/heroSlideSchema');

// Run this function to migrate all images to Cloudinary
async function migrateImagesToCloudinary() {
  console.log('Starting migration of images to Cloudinary...');
  
  try {
    // 1. Migrate brand logos
    const brands = await Brand.find();
    for (const brand of brands) {
      if (brand.logo && !brand.logo.includes('cloudinary')) {
        try {
          console.log(`Migrating brand logo for ${brand.name}: ${brand.logo}`);
          const result = await cloudinary.uploader.upload(brand.logo, {
            folder: 'libya-auto/brands'
          });
          brand.logo = result.secure_url;
          await brand.save();
          console.log(`Migrated logo for ${brand.name} to Cloudinary`);
        } catch (error) {
          console.error(`Failed to migrate logo for brand ${brand.name}:`, error);
        }
      }
    }
    
    // 2. Migrate car photos
    const cars = await Car.find();
    for (const car of cars) {
      const updatedPhotos = [];
      for (const photo of car.photos) {
        if (photo && !photo.includes('cloudinary')) {
          try {
            console.log(`Migrating car photo for ${car.model}: ${photo}`);
            const result = await cloudinary.uploader.upload(photo, {
              folder: 'libya-auto/cars'
            });
            updatedPhotos.push(result.secure_url);
          } catch (error) {
            console.error(`Failed to migrate photo for car ${car.model}:`, error);
          }
        } else {
          updatedPhotos.push(photo);
        }
      }
      if (updatedPhotos.length > 0 && updatedPhotos.some(p => p.includes('cloudinary'))) {
        car.photos = updatedPhotos;
        await car.save();
        console.log(`Migrated photos for car ${car.model} to Cloudinary`);
      }
    }
    
    // 3. Migrate hero slides
    const slides = await HeroSlide.find();
    for (const slide of slides) {
      if (slide.image && !slide.image.includes('cloudinary')) {
        try {
          console.log(`Migrating hero slide image: ${slide.title}`);
          const result = await cloudinary.uploader.upload(slide.image, {
            folder: 'libya-auto/hero'
          });
          slide.image = result.secure_url;
          await slide.save();
          console.log(`Migrated image for hero slide ${slide.title} to Cloudinary`);
        } catch (error) {
          console.error(`Failed to migrate image for hero slide ${slide.title}:`, error);
        }
      }
    }
    
    // 4. Migrate importer profiles
    const importers = await Importer.find();
    for (const importer of importers) {
      if (importer.profileImage && !importer.profileImage.includes('cloudinary')) {
        try {
          console.log(`Migrating importer profile image: ${importer.name}`);
          const result = await cloudinary.uploader.upload(importer.profileImage, {
            folder: 'libya-auto/importers'
          });
          importer.profileImage = result.secure_url;
          await importer.save();
          console.log(`Migrated profile image for importer ${importer.name} to Cloudinary`);
        } catch (error) {
          console.error(`Failed to migrate profile image for importer ${importer.name}:`, error);
        }
      }
    }
    
    console.log('Migration to Cloudinary completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

module.exports = { migrateImagesToCloudinary }; 