import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { RequestFailedError, runMeasurements } from '../run-measurements.js';
import { startTestServer } from '../../test-utils/start-test-server.js';
import type { TestServer } from '../../test-utils/start-test-server.js';

describe('runMeasurements', () => {
  let server: TestServer;

  beforeEach(async () => {
    server = await startTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  it('10 запросов строго по одному, колбэк на каждый', async () => {
    const seen: number[] = [];
    const results = await runMeasurements(new URL('/chunked/300000', server.origin), {
      onResult: (index, { bytes }) => {
        assert.equal(bytes, 300_000);
        seen.push(index);
      },
    });
    assert.equal(results.length, 10);
    assert.deepEqual(seen, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(server.requestCount, 10);
    assert.equal(server.maxConcurrent, 1);
  });

  it('прогресс с номером запроса, до onResult того же запроса', async () => {
    const events: string[] = [];
    await runMeasurements(new URL('/bytes/1000', server.origin), {
      onProgress: (index, { received }) => events.push(`progress ${index} ${received}`),
      onResult: (index) => events.push(`result ${index}`),
    });
    const expected = Array.from({ length: 10 }, (_, i) => [
      `progress ${i + 1} 0`,
      `progress ${i + 1} 1000`,
      `result ${i + 1}`,
    ]).flat();
    assert.deepEqual(events, expected);
  });

  it('500 на 3-м → стоп, сервер видел ровно 3', async () => {
    const seen: number[] = [];
    await assert.rejects(
      runMeasurements(new URL('/fail-on/3/100', server.origin), {
        onResult: (index) => seen.push(index),
      }),
      (error: unknown) => {
        assert.ok(error instanceof RequestFailedError);
        assert.equal(error.index, 3);
        assert.equal(error.reason, 'HTTP 500 Internal Server Error');
        assert.equal(error.message, 'Request 3 failed: HTTP 500 Internal Server Error');

        return true;
      },
    );
    assert.deepEqual(seen, [1, 2]);
    assert.equal(server.requestCount, 3);
  });

  it('count и idleTimeoutMs пробрасываются', async () => {
    await assert.rejects(
      runMeasurements(new URL('/hang', server.origin), { count: 2, idleTimeoutMs: 100 }),
      { message: 'Request 1 failed: timeout: no data for 0.1 s' },
    );
    assert.equal(server.requestCount, 1);
  });
});
