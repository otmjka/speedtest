import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatRequestLine, formatSummary } from '../format-report.js';

describe('formatRequestLine', () => {
  it('номер выровнен по общему числу', () => {
    assert.equal(
      formatRequestLine(3, 10, { ms: 123.456, bytes: 1_234_567 }),
      'Request  3/10: 123.5 ms, 1234567 B (1.23 MB)',
    );
    assert.equal(
      formatRequestLine(10, 10, { ms: 0.04, bytes: 0 }),
      'Request 10/10: 0.0 ms, 0 B (0.00 MB)',
    );
  });
});

describe('formatSummary', () => {
  it('пример из спеки: 100 мс, 10.00 MB, 80.00 Mbit/s (10.00 MB/s)', () => {
    assert.equal(
      formatSummary({ count: 10, averageMs: 100, totalBytes: 10_000_000, bytesPerSecond: 1e7 }),
      [
        'Average time: 100.0 ms',
        'Downloaded:   10.00 MB',
        'Speed:        80.00 Mbit/s (10.00 MB/s)',
      ].join('\n'),
    );
  });

  it('нулевая скорость', () => {
    assert.match(
      formatSummary({ count: 1, averageMs: 1, totalBytes: 0, bytesPerSecond: 0 }),
      /Speed: {8}0\.00 Mbit\/s \(0\.00 MB\/s\)$/,
    );
  });
});
