const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog-controllers');
const { uploadBlogImage } = require('../config/cloudinary');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/published', blogController.getPublishedPosts);
router.get('/post/:slug', blogController.getPostBySlug);

// Protected routes (authentication required)
router.get('/all', requireAuth, blogController.getAllPosts);
router.get('/:id', requireAuth, blogController.getPostById);
router.post('/create', requireAuth, uploadBlogImage.single('featuredImage'), blogController.createPost);
router.put('/:id', requireAuth, uploadBlogImage.single('featuredImage'), blogController.updatePost);
router.delete('/:id', requireAuth, blogController.deletePost);

module.exports = router; 