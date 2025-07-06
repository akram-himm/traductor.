const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      throw new Error();
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Middleware to check if user is premium
const isPremium = async (req, res, next) => {
  try {
    if (!req.user.isPremium) {
      return res.status(403).json({ 
        error: 'This feature requires a premium subscription' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking subscription status' });
  }
};

module.exports = { auth, isPremium };