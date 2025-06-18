const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Log token and middleware entry
    console.log('Auth middleware reached');
    console.log('Token received:', req.header('Authorization'));

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    // Handle mock tokens in development
    if (process.env.NODE_ENV === 'development' && token === 'mock-jwt-token-12345') {
      req.user = { id: '123', email: 'test@lexiflow.test', isPremium: false };
      req.token = token;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Veuillez vous authentifier' });
  }
};

module.exports = authMiddleware;
