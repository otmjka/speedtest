import assert from 'node:assert/strict';
import { request } from 'node:http';
import type { IncomingHttpHeaders } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { startTestServer } from '../start-test-server.js';
import type { TestServer } from '../start-test-server.js';

interface RawResponse {
  status: number;
  headers: IncomingHttpHeaders;
  bytes: number;
  error?: string;
}

/** Сырой GET без редиректов и таймаутов: смотрим, что сервер реально шлёт. */
function get(url: string, abortAfterMs?: number): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = request(url, (res) => {
      let bytes = 0;
      const status = res.statusCode ?? 0;
      const done = (error?: string): void => {
        resolve({ status, headers: res.headers, bytes, ...(error ? { error } : {}) });
      };
      res.on('data', (chunk: Buffer) => (bytes += chunk.length));
      res.on('end', () => {
        done();
      });
      res.on('error', (err) => {
        done(err.message);
      });
      if (abortAfterMs !== undefined) {
        setTimeout(() => {
          done('still open');
          req.destroy();
        }, abortAfterMs);
      }
    });
    req.on('error', reject);
    req.end();
  });
}

describe('startTestServer', () => {
  let server: TestServer;

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
  });

  it('/bytes/N — ровно N байт с Content-Length', async () => {
    const res = await get(`${server.origin}/bytes/1000`);
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-length'], '1000');
    assert.equal(res.bytes, 1000);
  });

  it('/chunked/N — chunked без Content-Length', async () => {
    const res = await get(`${server.origin}/chunked/200000`);
    assert.equal(res.headers['content-length'], undefined);
    assert.equal(res.headers['transfer-encoding'], 'chunked');
    assert.equal(res.bytes, 200000);
  });

  it('неизвестный роут и /status/CODE', async () => {
    assert.equal((await get(`${server.origin}/nope`)).status, 404);
    assert.equal((await get(`${server.origin}/status/503`)).status, 503);
  });

  it('/fail-on/K/N — 500 только на K-м запросе', async () => {
    const local = await startTestServer();
    try {
      const statuses = [];
      for (let i = 0; i < 3; i += 1) {
        statuses.push((await get(`${local.origin}/fail-on/2/10`)).status);
      }
      assert.deepEqual(statuses, [200, 500, 200]);
    } finally {
      await local.close();
    }
  });

  it('/redirect/N и /loop', async () => {
    const redirect = await get(`${server.origin}/redirect/5`);
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.location, '/bytes/5');
    const loop = await get(`${server.origin}/loop`);
    assert.equal(loop.headers.location, '/loop');
  });

  it('/hang — заголовки есть, тело не приходит', async () => {
    const res = await get(`${server.origin}/hang`, 150);
    assert.equal(res.status, 200);
    assert.equal(res.bytes, 0);
    assert.equal(res.error, 'still open');
  });

  it('/slow/MS — данные идут порциями до конца', async () => {
    const res = await get(`${server.origin}/slow/200`);
    assert.equal(res.error, undefined);
    assert.ok(res.bytes > 0);
  });

  it('/truncated/N — обрыв до конца тела', async () => {
    const res = await get(`${server.origin}/truncated/100000`);
    assert.ok(res.error);
    assert.ok(res.bytes < 100000);
  });

  it('/empty — пустое тело', async () => {
    const res = await get(`${server.origin}/empty`);
    assert.equal(res.status, 200);
    assert.equal(res.bytes, 0);
  });

  it('считает запросы, параллельность и заголовки', async () => {
    const local = await startTestServer();
    try {
      await Promise.all([get(`${local.origin}/slow/100`), get(`${local.origin}/slow/100`)]);
      assert.equal(local.requestCount, 2);
      assert.equal(local.maxConcurrent, 2);
      assert.equal(local.lastHeaders?.host, local.origin.replace('http://', ''));
    } finally {
      await local.close();
    }
  });
});
