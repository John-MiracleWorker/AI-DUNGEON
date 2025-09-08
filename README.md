# Dungeon AI Adventure

A web and mobile-friendly text adventure application that combines AI-driven storytelling with procedural image generation.

## Features

- Freeform text input with AI interpretation
- Rich second-person narration using OpenAI GPT-4
- AI-generated scene illustrations using DALL-E 3
- Persistent world state and game sessions
- Chat-style interface with save/load functionality
- Cross-platform support (web + mobile)

## Technology Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose ODM
- Redis for session storage
- OpenAI API (GPT-4 + DALL-E 3)
- JWT authentication

### Frontend
- React Native for cross-platform development
- Redux Toolkit with RTK Query
- React Navigation
- Styled Components

## Project Structure

```
dungeon-ai-adventure/
├── backend/           # Node.js API server
├── frontend/          # React Native application
├── shared/            # Shared types and utilities
├── docs/              # Documentation
└── docker/            # Docker configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup environment variables (see .env.example)
4. Start development servers: `npm run dev`

### Environment Variables

Create `.env` files in both backend and frontend directories:

#### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/dungeon-ai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
PORT=3001
```

#### Frontend (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

## Development

- `npm run dev` - Start both backend and frontend in development mode
- `npm run test` - Run all tests
- `npm run build` - Build for production

## Rebuild and Restart

- `./rebuild-dev.sh` - Completely rebuild and restart the development environment
- `./rebuild-prod.sh` - Completely rebuild and restart the production environment

## Deployment

Ensure your `.env` file defines `EXPO_PUBLIC_API_URL` pointing to the backend API.

```bash
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_URL=https://your-domain.com/api
./deploy.sh
```

## API Documentation

API documentation is available at `/api/docs` when running the development server.

## License

MIT