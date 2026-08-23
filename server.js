import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Set custom MIME types
express.static.mime.define({
  'application/manifest+json': ['webmanifest'],
  'application/javascript': ['js'],
  'image/svg+xml': ['svg']
});

// Serve static assets from project root
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Service-Worker-Allowed', '/');
    }
  }
}));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GAP//FLOW Money Command Center running on http://0.0.0.0:${PORT}`);
});
