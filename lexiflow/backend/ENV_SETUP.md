# Configuration des Variables d'Environnement

## Pour tester Stripe, créez un fichier `.env` avec:

```bash
# Environment
NODE_ENV=development
PORT=3001

# Database (à configurer avec Render plus tard)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secret
JWT_SECRET=lexiflow-secret-key-2024-change-this-in-production

# Email Configuration
EMAIL_USER=lexiflow.contact@gmail.com
EMAIL_PASS=[VOTRE_MOT_DE_PASSE_APPLICATION]

# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=[VOTRE_CLÉ_SECRÈTE_TEST]
STRIPE_PUBLISHABLE_KEY=[VOTRE_CLÉ_PUBLIQUE_TEST]
STRIPE_WEBHOOK_SECRET=[VOTRE_SECRET_WEBHOOK]
STRIPE_MONTHLY_PRICE_ID=[ID_PRIX_MENSUEL]
STRIPE_YEARLY_PRICE_ID=[ID_PRIX_ANNUEL]

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# DeepSeek API (optionnel)
DEEPSEEK_API_KEY=your_deepseek_key_here
```

## Vos vraies clés (à copier dans .env):

- EMAIL_PASS: `ntmxvkzflvmumknt`
- STRIPE_SECRET_KEY: `sk_test_51RpOQL2VEl7gdPoz3lOWEeSUKheSiuUy1RurdWypcJxaRWrM7PniDAxdGhFiOMsyCDViIMoFGxNIl2JVDLADCNrM00nZgcyIfH`
- STRIPE_PUBLISHABLE_KEY: `pk_test_51RpOQL2VEl7gdPoznvH25rNH6rWRPH77Ry8Wt37vWuebY3mn6Dkifc2p4jXEE5HOy1WGQLixAW32sx8DlwfpZmxE00jepdste5`
- STRIPE_WEBHOOK_SECRET: `whsec_RgnbL3T2Ml3AvajdRSPhN4A9TmG0gnjn`
- STRIPE_MONTHLY_PRICE_ID: `price_1RpQMQ2VEl7gdPozfYJSzL6B`
- STRIPE_YEARLY_PRICE_ID: `price_1RpQMQ2VEl7gdPoz3JtfaNEk`