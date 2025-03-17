const express = require('express');
const router = express.Router();
const importerController = require('../controllers/importer-controllers');
const { uploadImporterProfile } = require('../config/cloudinary');

// Create a new importer
router.post('/create', uploadImporterProfile.single('profileImage'), importerController.createImporter);

// Get all importers
router.get('/all-importers', importerController.getAllImporters);

// Get a single importer by ID
router.get('/:id', importerController.getImporterById);

// Update an importer by ID
router.put('/:id', uploadImporterProfile.single('profileImage'), importerController.updateImporter);

// Delete an importer by ID
router.delete('/:id', importerController.deleteImporter);

module.exports = router;
