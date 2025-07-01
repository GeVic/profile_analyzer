# AI Profile Analyzer

AI-powered CV analysis tool that matches candidates against job descriptions using Google Gemini AI.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment (see below for .env content)

# Start development
npm run dev
```

**Client**: http://localhost:5173  
**Server**: http://localhost:3000

## Environment Setup

Create `packages/server/.env`:

```env
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent
GEMINI_AUTH_TOKEN=your_google_ai_api_key_here
NODE_ENV=development
PORT=3000
```

Get your API key from [Google AI Studio](https://aistudio.google.com/).

## Commands

```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Client only
npm run dev:server       # Server only

# Production
npm run build           # Build both
npm start              # Start production servers

# Utilities
npm run clean          # Clean build artifacts
```

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + tRPC
- **AI**: Google Gemini API
- **PDF**: pdf-parse library

## How It Works

1. Upload job description PDF
2. Upload candidate CV PDF  
3. AI analyzes match and provides:
   - Alignment score (0-100%)
   - Key strengths
   - Areas for improvement
   - Recommendations

## Project Structure

```
profile_analyzer/
├── packages/
│   ├── client/          # React frontend
│   └── server/          # Express + tRPC backend
├── package.json         # Root workspace config
└── README.md
```

## Requirements

- Node.js 18+
- npm 8+
- Google AI API key

That's it! 🚀