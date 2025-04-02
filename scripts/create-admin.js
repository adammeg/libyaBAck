require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userSchema');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://adambhedj13:libyaauto@libyaauto.q0wpg.mongodb.net/?retryWrites=true&w=majority&appName=libyaauto';

// Admin user details
const adminUser = {
  username: 'admin',
  email: 'admin@libyaauto.com',
  password: 'admin123', // Change this in production!
  role: 'admin'
};

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  createAdmin();
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

// Create admin user if doesn't exist
async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { username: adminUser.username }, 
        { email: adminUser.email }
      ] 
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Create new admin user
    const user = new User({
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    });
    
    // Set password
    user.password = adminUser.password;
    
    // Save user
    await user.save();
    
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
} 