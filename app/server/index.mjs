import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { comparePromiseDiff } from './openrouter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const app = express();
const port = Number(process.env.PORT || 8787);

const requestSchema = z.object({
  promisedText: z.string().trim().min(20, 'Add more promised text.'),
  shippedText: z.string().trim().min(20, 'Add more shipped text.'),
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(distDir));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/compare', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input.' });
  }

  try {
    const result = await comparePromiseDiff(parsed.data);
    return res.json({ model: process.env.OPENROUTER_MODEL, result });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || 'Analysis failed.',
      code: error.code || 'unknown_error',
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Promise Diff listening on ${port}`);
});
