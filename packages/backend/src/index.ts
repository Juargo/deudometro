import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './config/logger';
import { requestLogger, errorHandler } from './shared/middleware';
import { createAuthRouter } from './routers/auth.router';
import {
  authManager,
  invitationManager,
  financialSpaceManager,
  profileResolverSkill,
  spaceResolver,
} from './container';

const app: Express = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(requestLogger);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const authRouter = createAuthRouter(
  authManager,
  invitationManager,
  financialSpaceManager,
  profileResolverSkill,
  spaceResolver
);
app.use('/api/v1', authRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Backend listening');
});

export default app;
