# LexiFlow Backend API

Backend API for LexiFlow - A modern language learning application with flashcards and spaced repetition.

## Features

- User authentication with JWT
- Flashcard management system
- Subscription management with Stripe
- PostgreSQL database with Sequelize ORM
- RESTful API design
- Security best practices (Helmet, CORS, Rate limiting)

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT for authentication
- Stripe for payments
- Bcrypt for password hashing

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Stripe account for payment processing

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lexiflow-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
- Database credentials
- JWT secret
- Stripe API keys
- Client URL for CORS

5. Create the PostgreSQL database:
```sql
CREATE DATABASE lexiflow_db;
```

6. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/account` - Delete user account

### Flashcards
- `GET /api/flashcards` - Get all user flashcards
- `POST /api/flashcards` - Create a new flashcard
- `GET /api/flashcards/:id` - Get a specific flashcard
- `PUT /api/flashcards/:id` - Update a flashcard
- `DELETE /api/flashcards/:id` - Delete a flashcard
- `POST /api/flashcards/bulk` - Create multiple flashcards
- `DELETE /api/flashcards/bulk` - Delete multiple flashcards

### Subscription
- `POST /api/subscription/create-checkout-session` - Create Stripe checkout session
- `POST /api/subscription/webhook` - Stripe webhook endpoint
- `GET /api/subscription/status` - Get subscription status
- `POST /api/subscription/cancel` - Cancel subscription

## Database Schema

### Users Table
- id (UUID, Primary Key)
- email (String, Unique)
- password (String, Hashed)
- username (String)
- isPremium (Boolean)
- subscriptionId (String)
- subscriptionStatus (String)
- createdAt (Timestamp)
- updatedAt (Timestamp)

### Flashcards Table
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- front (Text)
- back (Text)
- category (String)
- difficulty (Integer)
- lastReviewed (Timestamp)
- nextReview (Timestamp)
- reviewCount (Integer)
- createdAt (Timestamp)
- updatedAt (Timestamp)

## Deployment

This application is configured for deployment on Render.com.

1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Render will automatically use the `render.yaml` configuration
4. Set environment variables in Render dashboard
5. Deploy!

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Rate limiting to prevent abuse
- Helmet.js for security headers
- CORS properly configured
- Input validation on all endpoints

## License

ISC