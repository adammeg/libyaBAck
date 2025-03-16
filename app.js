const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');

const heroSlideRouter = require('./src/routes/hero-slide-routes');
const carRouter = require('./src/routes/car-routes');
const brandRouter = require('./src/routes/brand-routes');
const importerRouter = require('./src/routes/importer-routes');
const app = express();

// MongoDB connection using Mongoose
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://adambhedj13:libyaauto@libyaauto.q0wpg.mongodb.net/?retryWrites=true&w=majority&appName=libyaauto';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB successfully.')
  app.listen(5000, () => {
    console.log('Server is running on port 5000')
  })
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Serve static files from 'public' and 'uploads' directories
app.use(express.static(path.join(__dirname, 'public')));

// First, try serving from the uploads directory at the app root
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// If that fails, try serving from one level up (if your uploads folder is outside the app directory)
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  console.log('Looking for file at:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// Handle Windows-style paths that might come from the server
app.get('*/uploads/*', (req, res, next) => {
  // Extract the filename from the path
  const matches = req.path.match(/.*uploads\/(.+)/);
  if (matches && matches[1]) {
    const filename = matches[1];
    const possiblePaths = [
      path.join(__dirname, 'uploads', filename),
      path.join(__dirname, '..', 'uploads', filename)
    ];
    
    // Try each possible path
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }
  }
  next();
});

// Add a fallback for image files
app.get('/*.jpg|*.jpeg|*.png|*.gif|*.webp', (req, res, next) => {
  const filename = path.basename(req.path);
  const possiblePaths = [
    path.join(__dirname, 'uploads', 'cars', filename),
    path.join(__dirname, 'uploads', 'brands', filename),
    path.join(__dirname, 'uploads', 'profiles', filename),
    path.join(__dirname, 'uploads', filename)
  ];
  
  // Try each possible path
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  next();
});

// Add this middleware to log all requests for images
app.use((req, res, next) => {
  if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    console.log('Image request:', req.path);
  }
  next();
});

app.use('/cars', carRouter)
app.use('/brands', brandRouter)
app.use('/importers', importerRouter)
app.use('/hero-slides', heroSlideRouter)
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // respond with the error
  res.status(err.status || 500)
  res.json({ message: err.message, error: res.locals.error })
})

module.exports = app
