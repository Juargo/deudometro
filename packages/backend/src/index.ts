import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './config/logger';
import { requestLogger, errorHandler } from './shared/middleware';
import { jwtMiddleware } from './shared/middleware/jwt.middleware';
import { createAuthRouter } from './routers/auth.router';
import { createProfileRouter } from './routers/profile.router';
import { createDebtRouter } from './routers/debt.router';
import { createPlanRouter } from './routers/plan.router';
import {
  authManager,
  invitationManager,
  financialSpaceManager,
  profileResolverSkill,
  spaceResolver,
  profileManager,
  debtManager,
  analysisManager,
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

const profileRouter = createProfileRouter(profileManager, jwtMiddleware, spaceResolver);
app.use('/api/v1', profileRouter);

const debtRouter = createDebtRouter(debtManager, jwtMiddleware, spaceResolver);
app.use('/api/v1', debtRouter);

const planRouter = createPlanRouter(analysisManager, jwtMiddleware, spaceResolver);
app.use('/api/v1', planRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Backend listening');
});

export default app;
