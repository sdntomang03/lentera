// Production server for static hosting environments that support Node.js
// (e.g. Hostinger's Node.js hosting plans).
//
// This serves the built `dist/` SPA and implements the same `/api/*`
// endpoints that are available via Vite's dev-server middleware
// (see vite.config.ts). Both share their core logic via ./server/aiHandlers.js
// so behavior never drifts between `npm run dev` and production.
//
// Usage:
//   npm install
//   npm run build
//   npm start            (equivalent to: node server.js)
//
// Required environment variables (set them in a `.env` file next to this
// file, or via your host's environment-variable panel):
//   GEMINI_API_KEY      - for the "Daily Study Tips" feature
//   DEEPSEEK_API_KEY     - for the "Tanya Endzi" chatbot
//   PORT                 - port to listen on (most Node.js hosts inject this automatically)

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDailyTip, generateEndziReply } from './server/aiHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

const app = express();
app.use(express.json());

// --- API routes (mirrors vite.config.ts dev middleware) ---

app.all('/api/leaderboard', (req, res) => {
  res.json({
    status: 'success',
    message: 'Leaderboard API alive',
    timestamp: new Date().toISOString(),
  });
});

app.all('/api/gemini/tips', async (req, res) => {
  const category = (req.body && req.body.category) || 'all';
  const tip = await generateDailyTip(category);
  res.json(tip);
});

app.post('/api/gemini/chat', async (req, res) => {
  const { message, studentName, currentNav, history } = req.body || {};
  const reply = await generateEndziReply({ message, studentName, currentNav, history });
  res.json({ reply });
});

// --- Static SPA hosting ---

app.use(express.static(distDir));

// SPA fallback: any non-API GET route serves index.html so client-side routing works.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lentera server listening on port ${PORT}`);
});
