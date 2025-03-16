const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
try {
  // Only load dotenv in development
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
} catch (error) {
  console.warn('No .env file found, using environment variables');
}
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
  console.log('Connected to MongoDB successfully.');
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://libya-auto-nyx6.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Ensure uploads subdirectories exist
['cars', 'brands', 'profiles', 'hero'].forEach(dir => {
  const subDir = path.join(uploadsDir, dir);
  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true });
    console.log(`Created ${dir} subdirectory`);
  }
});

// Serve static files from 'public' and 'uploads' directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/cars', carRouter);
app.use('/brands', brandRouter);
app.use('/importers', importerRouter);
app.use('/hero-slides', heroSlideRouter);

// Add this middleware to log all requests for images
app.use((req, res, next) => {
  if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    console.log('Image request:', req.path);
  }
  next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // respond with the error
  res.status(err.status || 500);
  res.json({ message: err.message, error: res.locals.error });
});

// Use the PORT provided by Render or default to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;