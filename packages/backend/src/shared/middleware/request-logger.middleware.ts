import pinoHttp from 'pino-http';
import { logger } from '../../config/logger';
import { randomUUID } from 'node:crypto';

export const requestLogger = pinoHttp({
  logger,
  genReqId: () => randomUUID(),
  customProps(req) {
    return {
      requestId: req.id,
    };
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage(req, _res, err) {
    return `${req.method} ${req.url} ${err.message}`;
  },
});
