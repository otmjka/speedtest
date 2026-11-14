import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { summarize } from '../summarize.js';

describe('summarize', () => {
  it('10 × 1 000 000 байт за 100 мс → 10 MB/s', () => {
    const summary = summarize(Array.from({ length: 10 }, () => ({ ms: 100, bytes: 1_000_000 })));
    assert.deepEqual(summary, {
      count: 10,
      averageMs: 100,
      totalBytes: 10_000_000,
      bytesPerSecond: 10_000_000,
    });
  });

  it('скорость = все байты / сумма времён', () => {
    const summary = summarize([
      { ms: 100, bytes: 1_000_000 },
      { ms: 300, bytes: 1_000_000 },
    ]);
    assert.equal(summary.averageMs, 200);
    assert.equal(summary.bytesPerSecond, 5_000_000);
  });

  it('пустое тело → 0', () => {
    assert.equal(summarize([{ ms: 5, bytes: 0 }]).bytesPerSecond, 0);
  });

  it('время 0 и пустой список → 0, без деления на ноль', () => {
    assert.equal(summarize([{ ms: 0, bytes: 100 }]).bytesPerSecond, 0);
    assert.deepEqual(summarize([]), { count: 0, averageMs: 0, totalBytes: 0, bytesPerSecond: 0 });
  });
});
