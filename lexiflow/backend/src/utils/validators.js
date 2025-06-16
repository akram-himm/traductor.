const Joi = require('joi');

const validators = {
  // Validation inscription
  registration: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'Email requis'
      }),
    password: Joi.string()
      .min(8)
      .required()
      .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
      .messages({
        'string.min': 'Le mot de passe doit faire au moins 8 caractères',
        'string.pattern.base': 'Le mot de passe doit contenir au moins une lettre et un chiffre',
        'any.required': 'Mot de passe requis'
      }),
    name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Le nom doit faire au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 50 caractères'
      })
  }),

  // Validation connexion
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'Email requis'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Mot de passe requis'
      })
  }),

  // Validation création flashcard
  flashcard: Joi.object({
    front: Joi.string()
      .required()
      .max(500)
      .messages({
        'string.max': 'Le texte ne peut pas dépasser 500 caractères',
        'any.required': 'Texte requis'
      }),
    back: Joi.string()
      .required()
      .max(500)
      .messages({
        'string.max': 'La traduction ne peut pas dépasser 500 caractères',
        'any.required': 'Traduction requise'
      }),
    language: Joi.string()
      .required()
      .length(2)
      .messages({
        'string.length': 'Code langue invalide (2 caractères requis)',
        'any.required': 'Langue requise'
      }),
    folder: Joi.string()
      .max(50)
      .optional()
      .default('default')
      .messages({
        'string.max': 'Le nom du dossier ne peut pas dépasser 50 caractères'
      })
  }),

  // Validation texte pour traduction
  translation: Joi.object({
    text: Joi.string()
      .required()
      .custom((value, helpers) => {
        const user = helpers.state.user;
        const limit = user?.isPremium ? 350 : 100;
        if (value.length > limit) {
          return helpers.error('string.maxPremium', { limit });
        }
        return value;
      })
      .messages({
        'string.maxPremium': 'Le texte dépasse la limite de {{#limit}} caractères',
        'any.required': 'Texte requis'
      }),
    sourceLang: Joi.string()
      .length(2)
      .optional()
      .default('auto')
      .messages({
        'string.length': 'Code langue source invalide (2 caractères requis)'
      }),
    targetLang: Joi.string()
      .length(2)
      .required()
      .messages({
        'string.length': 'Code langue cible invalide (2 caractères requis)',
        'any.required': 'Langue cible requise'
      })
  }),

  // Validation mise à jour profil
  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Le nom doit faire au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 50 caractères'
      }),
    password: Joi.string()
      .min(8)
      .optional()
      .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
      .messages({
        'string.min': 'Le mot de passe doit faire au moins 8 caractères',
        'string.pattern.base': 'Le mot de passe doit contenir au moins une lettre et un chiffre'
      })
  })
};

module.exports = validators;
