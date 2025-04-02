const User = require('../models/userSchema');
const { generateToken } = require('../utils/jwt');

// Controller to register a new user (admin only should use this in production)
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this username or email' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      role: role || 'viewer' // Default to viewer role
    });
    
    // Set password (uses virtual setter)
    user.password = password;
    
    // Save user
    await user.save();
    
    // Generate JWT
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Controller to login a user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    
    if (!user || !user.validPassword(password)) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    // Generate JWT
    const token = generateToken(user);
    
    res.status(200).json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Controller to get current user info
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user data', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe
}; 