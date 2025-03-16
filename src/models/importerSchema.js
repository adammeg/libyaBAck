const mongoose = require('mongoose');

const importerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        telephone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        profileImage: {
            type: String,
            //required: true,
            trim: true,
        },
        brands: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Brand',
                required: true, // Ensure brands are required
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Importer', importerSchema);    
