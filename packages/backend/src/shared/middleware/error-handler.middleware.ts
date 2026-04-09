import type { Request, Response, NextFunction } from 'express';
import { DomainError } from '../errors';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof DomainError) {
    res.status(err.httpStatus).json({ error: err.code, message: err.message });
    return;
  }

  console.error('[unhandled]', err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Algo salió mal. Intenta de nuevo.' });
}
