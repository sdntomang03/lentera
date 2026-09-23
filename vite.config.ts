import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { generateDailyTip, generateEndziReply } from './server/aiHandlers.js';

export default defineConfig(({ mode }) => {
  // Vite's native config loader no longer auto-injects .env values into
  // process.env, so load them explicitly for use inside the dev-server API
  // middleware below (e.g. GEMINI_API_KEY, DEEPSEEK_API_KEY).
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-server-plugin',
        configureServer(server) {
          // Leaderboard mock/sync endpoint
          server.middlewares.use('/api/leaderboard', (req, res, next) => {
            if (req.method === 'GET' || req.method === 'POST') {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'success',
                  message: 'Leaderboard API alive',
                  timestamp: new Date().toISOString(),
                })
              );
              return;
            }
            next();
          });

          // Gemini AI Daily Study Tips endpoint
          server.middlewares.use('/api/gemini/tips', async (req, res, next) => {
            if (req.method === 'POST' || req.method === 'GET') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                let category = 'all';
                if (body) {
                  try {
                    const parsed = JSON.parse(body);
                    if (parsed.category) category = parsed.category;
                  } catch {
                    // ignore parse error
                  }
                }

                const tip = await generateDailyTip(category);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(tip));
              });
              return;
            }
            next();
          });

          // DeepSeek AI Chatbot with Endzi the Hornbill Mascot
          server.middlewares.use('/api/gemini/chat', async (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                let parsed: any = {};
                try {
                  parsed = JSON.parse(body);
                } catch {
                  parsed = {};
                }

                const reply = await generateEndziReply({
                  message: parsed.message,
                  studentName: parsed.studentName,
                  currentNav: parsed.currentNav,
                  history: parsed.history,
                });

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ reply }));
              });
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
