const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true,
      },
    ],
    model: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['SEDAN', 'SUV', 'PICKUP', 'BERLIN', 'COMPACT', 'COUPE', 'CABRIOLET', 'MONOSPACE'],
      default: 'SEDAN'
    },
    photos: [
      {
        type: String,
        // Each photo can be a URL or file path
        trim: true,
      },
    ],
    price: {
      type: String,
      required: true,
    },
    description: {
      en: {
        type: String,
        required: true
      },
      ar: {
        type: String,
        required: true
      }
    },
    importer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Importer',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Car', carSchema);
