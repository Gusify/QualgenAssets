import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import assetsRouter from './routes/assets';
import locationsRouter from './routes/locations';
import { initDatabase } from './db';

const app = express();
const port = Number(process.env.PORT) || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*'
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/assets', assetsRouter);
app.use('/api/locations', locationsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  const maybeErr = err as { status?: unknown; statusCode?: unknown; type?: unknown };
  const status =
    typeof maybeErr.statusCode === 'number'
      ? maybeErr.statusCode
      : typeof maybeErr.status === 'number'
        ? maybeErr.status
        : 500;

  if (status === 400 && maybeErr.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  res.status(status).json({ message: status === 500 ? 'Internal server error' : 'Request failed' });
});

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`API server running on http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });
