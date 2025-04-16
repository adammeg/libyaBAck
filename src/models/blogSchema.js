const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    en: {
      type: String,
      required: true,
      trim: true
    },
    ar: {
      type: String,
      required: true,
      trim: true
    }
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  content: {
    en: {
      type: String,
      required: true
    },
    ar: {
      type: String,
      required: true
    }
  },
  excerpt: {
    en: {
      type: String,
      required: true
    },
    ar: {
      type: String,
      required: true
    }
  },
  featuredImage: {
    type: String,
    default: null
  },
  published: {
    type: Boolean,
    default: false
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categories: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
blogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a text index for search functionality
blogSchema.index({ 
  'title.en': 'text', 
  'title.ar': 'text', 
  'content.en': 'text', 
  'content.ar': 'text', 
  tags: 'text', 
  categories: 'text' 
});

module.exports = mongoose.model('Blog', blogSchema); 