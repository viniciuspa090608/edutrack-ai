import { Writable } from 'node:stream';
import express from 'express';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { errorHandler } from '../src/middlewares/error-handler.js';
import { requestContext } from '../src/middlewares/request-context.js';

function createTestLogger() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  return { logger: pino({ level: 'info' }, stream), lines };
}

describe('API HTTP foundation', () => {
  it('serves the public health contract and permits the configured origin', async () => {
    const { logger } = createTestLogger();
    const response = await request(
      createApp({ logger, webOrigin: 'http://localhost:5173' }),
    )
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns standard errors for unsupported methods, missing routes, and invalid JSON', async () => {
    const { logger } = createTestLogger();
    const app = createApp({ logger, webOrigin: 'http://localhost:5173' });

    const method = await request(app).post('/health');
    expect(method.status).toBe(405);
    expect(method.body.error.code).toBe('METHOD_NOT_ALLOWED');

    const missing = await request(app).get('/missing');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');

    const malformed = await request(app)
      .post('/missing')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('INVALID_JSON');
    expect(JSON.stringify(malformed.body)).not.toContain('stack');
  });

  it('blocks other browser origins and never logs request credentials', async () => {
    const { logger, lines } = createTestLogger();
    const app = createApp({ logger, webOrigin: 'http://localhost:5173' });

    const response = await request(app)
      .get('/health?token=private-query')
      .set('Origin', 'http://other.example')
      .set('Authorization', 'Bearer private-token')
      .set('Cookie', 'session=private-cookie');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
    expect(lines.join('')).not.toContain('private-token');
    expect(lines.join('')).not.toContain('private-cookie');
    expect(lines.join('')).not.toContain('private-query');
    expect(lines.join('')).toContain('"path":"/health"');
  });

  it('returns a generic 500 while logging the error type', async () => {
    const { logger, lines } = createTestLogger();
    const app = express();
    app.use(requestContext(logger));
    app.get('/failure', () => {
      throw new TypeError('private-details');
    });
    app.use(errorHandler(logger));

    const response = await request(app).get('/failure');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
    });
    expect(lines.join('')).toContain('TypeError');
    expect(lines.join('')).not.toContain('private-details');
  });
});
