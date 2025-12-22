import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import assetsRouter from './routes/assets';
import assetModelsRouter from './routes/assetModels';
import assetTypesRouter from './routes/assetTypes';
import brandsRouter from './routes/brands';
import locationsRouter from './routes/locations';
import ownersRouter from './routes/owners';
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
app.use('/api/asset-models', assetModelsRouter);
app.use('/api/asset-types', assetTypesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/owners', ownersRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
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
