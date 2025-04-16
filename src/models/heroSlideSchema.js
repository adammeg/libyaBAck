const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
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
  description: {
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
  image: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  buttonText: {
    en: {
      type: String,
      default: 'Learn More'
    },
    ar: {
      type: String,
      default: 'اقرأ المزيد'
    }
  },
  buttonLink: {
    type: String,
    default: '/search'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HeroSlide', heroSlideSchema); 