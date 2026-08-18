# Gemini React Clone

A polished React + Context API Gemini-style chat UI with:

- Responsive sidebar
- Persistent chat history using localStorage
- New chat / delete chat
- Gemini API integration through a small Express server
- Streaming responses
- Typing indicator animation
- Copy response button
- Mobile sidebar
- Suggestion cards
- Auto-scroll
- Enter to send / Shift+Enter for a new line

## 1. Requirements

- Node.js 18+
- A Gemini API key

Google currently recommends the official `@google/genai` JavaScript SDK for Gemini API projects.

## 2. Setup

```bash
npm install
```

Copy `.env.example` to `.env` and add your API key:

```env
GEMINI_API_KEY=your_key_here
PORT=3001
```

## 3. Run

```bash
npm run dev
```

Open:

http://localhost:5173

The React app runs on port 5173 and the API server on port 3001.

## Architecture

- `src/context/ChatContext.jsx` — global chat state, history, persistence, streaming
- `src/App.jsx` — UI components
- `src/styles.css` — responsive Gemini-inspired design
- `server/index.js` — secure server-side Gemini API call

The API key stays on the server instead of being bundled into the browser.

## Production note

For deployment, configure the server URL with an environment variable rather than hard-coding `http://localhost:3001`, and deploy the Express API separately from the static React frontend.