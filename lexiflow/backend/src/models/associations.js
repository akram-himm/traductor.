// Définir les associations entre les modèles
const User = require('./User');
const Subscription = require('./Subscription');

// Un utilisateur peut avoir plusieurs souscriptions
User.hasMany(Subscription, {
  foreignKey: 'userId',
  as: 'subscriptions'
});

// Une souscription appartient à un utilisateur
Subscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  User,
  Subscription
};