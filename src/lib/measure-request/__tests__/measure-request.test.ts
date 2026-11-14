import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { startTestServer } from '../../../test-utils/start-test-server.js';
import type { TestServer } from '../../../test-utils/start-test-server.js';
import { measureRequest } from '../index.js';
import type { DownloadProgress } from '../index.js';

const IDLE_TIMEOUT_MS = 200;

async function freePort(): Promise<number> {
  const probe = createServer();
  await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise((resolve) => probe.close(resolve));

  return port;
}

describe('measureRequest', () => {
  let server: TestServer;
  const url = (path: string): URL => new URL(path, server.origin);
  const measure = (path: string) => measureRequest(url(path), { idleTimeoutMs: IDLE_TIMEOUT_MS });

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
  });

  it('точные байты и время', async () => {
    const result = await measure('/bytes/1000000');
    assert.equal(result.bytes, 1_000_000);
    assert.ok(result.ms > 0);
  });

  it('chunked без Content-Length', async () => {
    assert.equal((await measure('/chunked/5000000')).bytes, 5_000_000);
  });

  it('прогресс: /bytes/N → total = N, последний received = N', async () => {
    const seen: DownloadProgress[] = [];
    await measureRequest(url('/bytes/1000000'), { onProgress: (p) => seen.push(p) });
    assert.deepEqual(seen[0], { received: 0, total: 1_000_000 });
    assert.deepEqual(seen.at(-1), { received: 1_000_000, total: 1_000_000 });
    assert.ok(seen.every(({ total }) => total === 1_000_000));
  });

  it('прогресс: /chunked/N → total = undefined', async () => {
    const seen: DownloadProgress[] = [];
    await measureRequest(url('/chunked/500000'), { onProgress: (p) => seen.push(p) });
    assert.ok(seen.length > 1);
    assert.ok(seen.every(({ total }) => total === undefined));
    assert.equal(seen.at(-1)?.received, 500_000);
  });

  it('пустое тело → 0 байт', async () => {
    assert.equal((await measure('/empty')).bytes, 0);
  });

  it('204 без тела → 0 байт', async () => {
    assert.equal((await measure('/status/204')).bytes, 0);
  });

  it('шлёт Cache-Control и Accept-Encoding', async () => {
    await measure('/bytes/1');
    const headers = server.lastHeaders;
    assert.ok(headers);
    assert.equal(headers['cache-control'], 'no-cache');
    assert.equal(headers['accept-encoding'], 'identity');
  });

  it('не-2xx → ошибка со статусом', async () => {
    await assert.rejects(measure('/nope'), { message: 'HTTP 404 Not Found' });
    await assert.rejects(measure('/status/500'), { message: 'HTTP 500 Internal Server Error' });
  });

  it('302 → меряет финальный ответ', async () => {
    assert.equal((await measure('/redirect/1000000')).bytes, 1_000_000);
  });

  it('петля редиректов → ошибка', async () => {
    await assert.rejects(measure('/loop'), { message: /redirect count exceeded/ });
  });

  it('нет данных дольше таймаута → таймаут', async () => {
    await assert.rejects(measure('/hang'), { message: 'timeout: no data for 0.2 s' });
  });

  it('медленно, но данные идут → не обрывается', async () => {
    const result = await measure(`/slow/${IDLE_TIMEOUT_MS * 3}`);
    assert.ok(result.ms > IDLE_TIMEOUT_MS * 2);
    assert.ok(result.bytes > 0);
  });

  it('обрыв тела → ошибка', async () => {
    await assert.rejects(measure('/truncated/1000000'), { message: /terminated/ });
  });

  it('порт закрыт → ошибка соединения', async () => {
    const port = await freePort();
    await assert.rejects(measureRequest(new URL(`http://127.0.0.1:${port}/`)), {
      message: /fetch failed \(connect ECONNREFUSED/,
    });
  });
});
