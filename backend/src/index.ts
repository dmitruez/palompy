import express from 'express';
import cors from 'cors';
import shopsRouter from '../routes/shops';
import dataRouter from '../routes/data';
import chatRouter from '../routes/chat';
import surveysRouter from '../routes/surveys';
import surveyResponsesRouter from '../routes/surveyResponses';
import analyticsRouter from '../routes/analytics';
import { env } from '../config/env';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/shops', shopsRouter);
app.use('/api/shops', dataRouter);
app.use('/api/shops', surveysRouter);
app.use('/api/chat', chatRouter);
app.use('/api/surveys', surveyResponsesRouter);
app.use('/api/analytics', analyticsRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error instanceof Error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(500).json({ error: 'Unexpected error' });
});

app.listen(env.port, () => {
  console.log(`palompy backend listening on port ${env.port}`);
});
