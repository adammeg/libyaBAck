const Blog = require('../models/blogSchema');
const { cloudinary } = require('../config/cloudinary');
const { slugify } = require('../utils/helpers');

// Get all blog posts (with optional filters)
const getAllPosts = async (req, res) => {
  try {
    const { published, category, tag, search, limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query object
    const query = {};
    
    // Filter by published status
    if (published !== undefined) {
      query.published = published === 'true';
    }
    
    // Filter by category
    if (category) {
      query.categories = category;
    }
    
    // Filter by tag
    if (tag) {
      query.tags = tag;
    }
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Get total count for pagination
    const total = await Blog.countDocuments(query);
    
    // Get posts with pagination
    const posts = await Blog.find(query)
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Error fetching blog posts', error: error.message });
  }
};

// Get published blog posts (for frontend)
const getPublishedPosts = async (req, res) => {
  try {
    const { category, tag, search, limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query object
    const query = { published: true };
    
    // Filter by category
    if (category) {
      query.categories = category;
    }
    
    // Filter by tag
    if (tag) {
      query.tags = tag;
    }
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Get total count for pagination
    const total = await Blog.countDocuments(query);
    
    // Get posts with pagination
    const posts = await Blog.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching published blog posts:', error);
    res.status(500).json({ message: 'Error fetching published blog posts', error: error.message });
  }
};

// Get a single blog post by ID
const getPostById = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id)
      .populate('author', 'username email');
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
};

// Get a single blog post by slug (for frontend)
const getPostBySlug = async (req, res) => {
  try {
    const post = await Blog.findOne({ 
      slug: req.params.slug,
      published: true
    }).populate('author', 'username');
    
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
};

// Create a new blog post
const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, categories, tags, published } = req.body;
    
    // Generate a slug from the title
    let slug = slugify(title);
    
    // Check if slug already exists, and make it unique if needed
    const existingSlug = await Blog.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    
    // Get featured image from Cloudinary
    const featuredImageUrl = req.file ? req.file.path : null;
    
    // Create the new blog post
    const newPost = new Blog({
      title,
      slug,
      content,
      excerpt,
      featuredImage: featuredImageUrl,
      categories: categories ? JSON.parse(categories) : [],
      tags: tags ? JSON.parse(tags) : [],
      published: published === 'true',
      author: req.user.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    await newPost.save();
    
    const populatedPost = await Blog.findById(newPost._id)
      .populate('author', 'username email');
    
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ message: 'Error creating blog post', error: error.message });
  }
};

// Update a blog post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, categories, tags, published } = req.body;
    
    // Find the post
    const post = await Blog.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check if user is the author or an admin
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to update this post' });
    }
    
    // Check if title is being changed, update slug if needed
    let slug = post.slug;
    if (title && title !== post.title) {
      slug = slugify(title);
      
      // Check if new slug already exists
      const existingSlug = await Blog.findOne({ slug, _id: { $ne: id } });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    }
    
    // Update featured image if a new one is uploaded
    let featuredImage = post.featuredImage;
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (post.featuredImage && post.featuredImage.includes('cloudinary')) {
        try {
          const publicId = extractPublicIdFromUrl(post.featuredImage);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) {
          console.error('Error deleting old featured image:', err);
        }
      }
      
      featuredImage = req.file.path;
    }
    
    // Update post fields
    post.title = title || post.title;
    post.slug = slug;
    post.content = content || post.content;
    post.excerpt = excerpt || post.excerpt;
    post.featuredImage = featuredImage;
    post.categories = categories ? JSON.parse(categories) : post.categories;
    post.tags = tags ? JSON.parse(tags) : post.tags;
    post.published = published !== undefined ? published === 'true' : post.published;
    post.updatedAt = Date.now();
    
    await post.save();
    
    const updatedPost = await Blog.findById(id)
      .populate('author', 'username email');
    
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Error updating blog post', error: error.message });
  }
};

// Delete a blog post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the post
    const post = await Blog.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check if user is the author or an admin
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }
    
    // Delete featured image from Cloudinary if it exists
    if (post.featuredImage && post.featuredImage.includes('cloudinary')) {
      try {
        const publicId = extractPublicIdFromUrl(post.featuredImage);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err) {
        console.error('Error deleting featured image:', err);
      }
    }
    
    // Delete the post
    await Blog.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Error deleting blog post', error: error.message });
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
  getAllPosts,
  getPublishedPosts,
  getPostById,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost
};