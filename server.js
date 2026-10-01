// Production server for static hosting environments that support Node.js
// (e.g. Hostinger's Node.js hosting plans).
//
// This serves the built `dist/` SPA, proxies `/api/v1/*` to Laravel, and
// handles the AI endpoints using ./server/aiHandlers.js.
//
// Usage:
//   npm install
//   npm run build
//   npm start            (equivalent to: node server.js)
//
// Required environment variables (set them in a `.env` file next to this
// file, or via your host's environment-variable panel):
//   DEEPSEEK_API_KEY     - for AI study tips and the "Tanya Endzi" chatbot
//   LARAVEL_API_URL      - origin of the Database
//   PORT                 - port to listen on (most Node.js hosts inject this automatically)

import 'dotenv/config';
import express from 'express';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDailyTip, generateEndziReply, generateLearningContent } from './server/aiHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

const app = express();

// Forward the versioned application API to Laravel. Keep this before
// express.json() so request bodies are streamed without being consumed.
app.use('/api/v1', (req, res) => {
  const laravelApiUrl = process.env.LARAVEL_API_URL;
  if (!laravelApiUrl) {
    res.status(503).json({ message: 'LARAVEL_API_URL belum dikonfigurasi.' });
    return;
  }

  let target;
  try {
    target = new URL(req.originalUrl, laravelApiUrl);
  } catch {
    res.status(500).json({ message: 'Konfigurasi URL Laravel tidak valid.' });
    return;
  }

  const transport = target.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: target.host };
  delete headers.connection;
  delete headers['transfer-encoding'];
  const proxyRequest = transport.request(
    target,
    { method: req.method, headers },
    (apiResponse) => {
      res.writeHead(apiResponse.statusCode || 502, apiResponse.headers);
      apiResponse.pipe(res);
    },
  );

  proxyRequest.on('error', (error) => {
    console.error('Database proxy request failed:', error);
    if (!res.headersSent) {
      res.status(502).json({ message: 'Database tidak dapat dijangkau.' });
    } else {
      res.destroy(error);
    }
  });

  req.pipe(proxyRequest);
});

app.use(express.json());

// --- AI API routes (Laravel owns the versioned application API) ---

app.all('/api/deepseek/tips', async (req, res) => {
  const category = (req.body && req.body.category) || 'all';
  const topic = req.body && typeof req.body.topic === 'string' ? req.body.topic : '';
  const count = req.body && Number.isInteger(req.body.count) ? req.body.count : 1;
  const tip = await generateDailyTip(category, topic, count);
  res.json(tip);
});

app.post('/api/deepseek/chat', async (req, res) => {
  const { message, studentName, currentNav, history } = req.body || {};
  const reply = await generateEndziReply({ message, studentName, currentNav, history });
  res.json({ reply });
});

app.post('/api/deepseek/content', async (req, res) => {
  try {
    const data = await generateLearningContent(req.body || {});
    res.json({ data });
  } catch (error) {
    console.error('DeepSeek learning content generation error:', error);
    res.status(502).json({
      message: error instanceof Error ? error.message : 'DeepSeek gagal membuat materi. Silakan coba lagi.',
    });
  }
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
