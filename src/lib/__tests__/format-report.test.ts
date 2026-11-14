import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatRequestLine, formatSummary } from '../format-report.js';

describe('formatRequestLine', () => {
  it('номер выровнен по общему числу', () => {
    assert.equal(
      formatRequestLine(3, 10, { ms: 123.4567, bytes: 1_234_567 }),
      'Request  3/10: 123.5 ms, 1234567 B (1.23 MB), 80.00 Mbit/s',
    );
    assert.equal(
      formatRequestLine(10, 10, { ms: 0.04, bytes: 0 }),
      'Request 10/10: 0.0 ms, 0 B (0.00 MB), 0.00 Mbit/s',
    );
  });
});

describe('formatRequestLine: скорость запроса', () => {
  it('байты / время этого запроса; время 0 → 0', () => {
    assert.match(
      formatRequestLine(1, 10, { ms: 23_815.8, bytes: 104_857_600 }),
      /\(104\.86 MB\), 35\.22 Mbit\/s$/,
    );
    assert.match(formatRequestLine(1, 10, { ms: 0, bytes: 100 }), /, 0\.00 Mbit\/s$/);
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
