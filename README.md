# V0 Clone - AI-Powered Website Builder

A real-time website builder that uses AI to generate and modify code based on natural language prompts. Built with React, TypeScript, and Google's Gemini AI.

## Features

- 🤖 AI-powered code generation using Google's Gemini model
- 💻 Real-time code preview with WebContainer
- 📝 Live code editing with Monaco Editor
- 🗂️ File system explorer
- 💬 Interactive chat interface for continuous development

## Project Structure

```
v0-clone/
├── frontend/           # React frontend application
│   ├── src/           # Source files
│   ├── public/        # Static files
│   └── package.json   # Frontend dependencies
└── be/                # Backend server
    ├── src/           # Source files
    └── package.json   # Backend dependencies
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/akuldeepj/v0-clone
cd v0-clone
```

2. Setup Backend:
```bash
cd be
cp .env.example .env    # Copy environment file
# Add your Google Gemini API key to .env file
npm install
npm run dev
```

3. Setup Frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Open your browser and navigate to:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Tech Stack

- **Frontend**:
  - React
  - TypeScript
  - Vite
  - Monaco Editor
  - WebContainer API
  - TailwindCSS
  - Axios

- **Backend**:
  - Node.js
  - Express
  - Google Generative AI SDK
  - TypeScript

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
