import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      this.logger.log(`${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms requestId=${request.requestId ?? '-'}`);
    });
    next();
  }
}
