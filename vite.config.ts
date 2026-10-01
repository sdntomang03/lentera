import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { generateDailyTip, generateEndziReply, generateLearningContent } from './server/aiHandlers.js';

export default defineConfig(({ mode }) => {
  // Vite's native config loader no longer auto-injects .env values into
  // process.env, so load them explicitly for use inside the dev-server API.
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-server-plugin',
        configureServer(server) {
          // DeepSeek AI Daily Study Tips endpoint
          server.middlewares.use('/api/deepseek/tips', async (req, res, next) => {
            if (req.method === 'POST' || req.method === 'GET') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                let category = 'all';
                let topic = '';
                let count = 1;
                if (body) {
                  try {
                    const parsed = JSON.parse(body);
                    if (parsed.category) category = parsed.category;
                    if (typeof parsed.topic === 'string') topic = parsed.topic;
                    if (Number.isInteger(parsed.count)) count = parsed.count;
                  } catch {
                    // ignore parse error
                  }
                }

                const tip = await generateDailyTip(category, topic, count);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(tip));
              });
              return;
            }
            next();
          });

          // DeepSeek AI Chatbot with Endzi the Hornbill Mascot
          server.middlewares.use('/api/deepseek/chat', async (req, res, next) => {
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

          server.middlewares.use('/api/deepseek/content', async (req, res, next) => {
            if (req.method !== 'POST') {
              next();
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const data = await generateLearningContent(parsed);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ data }));
              } catch (error) {
                console.error('DeepSeek learning content generation error:', error);
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  message: error instanceof Error ? error.message : 'DeepSeek gagal membuat materi. Silakan coba lagi.',
                }));
              }
            });
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
      proxy: {
        '/api/v1': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
