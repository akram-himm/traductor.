const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configuration Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://my-backend-api-cng7.onrender.com/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Pour le développement, créer un utilisateur mock
    const mockUser = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      googleId: profile.id,
      isPremium: false,
      subscriptionStatus: 'free'
    };

    // En production, vous devriez chercher/créer l'utilisateur dans la base de données
    // const user = await User.findOrCreate({
    //   where: { googleId: profile.id },
    //   defaults: {
    //     email: profile.emails[0].value,
    //     name: profile.displayName,
    //     googleId: profile.id
    //   }
    // });

    return done(null, mockUser);
  } catch (error) {
    return done(error, null);
  }
}));

// Sérialisation de l'utilisateur
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // En production, chercher l'utilisateur dans la base de données
  // User.findByPk(id).then(user => done(null, user));
  
  // Pour le développement
  done(null, { id });
});

module.exports = passport;