import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createProgressBar } from '../index.js';
import type { ProgressStream } from '../index.js';

interface FakeStream extends ProgressStream {
  writes: string[];
}

function fakeStream(columns?: number): FakeStream {
  const writes: string[] = [];

  return { columns, writes, write: (chunk) => writes.push(chunk) };
}

function fakeClock(): { now: () => number; set: (ms: number) => void } {
  let time = 0;

  return {
    now: () => time,
    set: (ms) => {
      time = ms;
    },
  };
}

describe('createProgressBar', () => {
  it('1000 update за 1 с → не больше 10 записей', () => {
    const stream = fakeStream(80);
    const clock = fakeClock();
    const bar = createProgressBar({ stream, now: clock.now });
    for (let i = 0; i < 1000; i += 1) {
      clock.set(i);
      bar.update(1, 10, { received: i * 1000, total: 1_000_000 });
    }
    assert.ok(stream.writes.length <= 10, String(stream.writes.length));
    assert.ok(stream.writes.length >= 9);
  });

  it('перерисовка на месте: \\r + строка + \\x1b[K, без переводов строки', () => {
    const stream = fakeStream(80);
    const bar = createProgressBar({ stream, now: () => 0 });
    bar.update(3, 10, { received: 0, total: undefined });
    assert.deepEqual(stream.writes, ['\rRequest  3/10  0.00 MB  0.0 Mbit/s\x1b[K']);
  });

  it('новый запрос рисуется сразу, скорость — заново', () => {
    const stream = fakeStream(80);
    const clock = fakeClock();
    const bar = createProgressBar({ stream, now: clock.now });
    bar.update(1, 10, { received: 0, total: undefined });
    clock.set(500);
    bar.update(1, 10, { received: 5_000_000, total: undefined });
    clock.set(510);
    bar.update(2, 10, { received: 0, total: undefined });
    assert.equal(stream.writes.length, 3);
    assert.match(stream.writes[1] ?? '', /80\.0 Mbit\/s/);
    assert.match(stream.writes[2] ?? '', /Request {2}2\/10 {2}0\.00 MB {2}0\.0 Mbit\/s/);
  });

  it('clear пишет \\r\\x1b[K только если строка нарисована', () => {
    const stream = fakeStream(80);
    const bar = createProgressBar({ stream, now: () => 0 });
    bar.clear();
    assert.equal(stream.writes.length, 0);
    bar.update(1, 10, { received: 0, total: 100 });
    bar.clear();
    assert.equal(stream.writes.at(-1), '\r\x1b[K');
    bar.clear();
    assert.equal(stream.writes.length, 2);
  });

  it('после clear тот же запрос рисуется сразу', () => {
    const stream = fakeStream(80);
    const bar = createProgressBar({ stream, now: () => 0 });
    bar.update(1, 10, { received: 0, total: 100 });
    bar.clear();
    bar.update(1, 10, { received: 50, total: 100 });
    assert.equal(stream.writes.length, 3);
  });

  it('нет columns или 0 → ширина 80', () => {
    const draw = (columns?: number): string | undefined => {
      const stream = fakeStream(columns);
      createProgressBar({ stream, now: () => 0 }).update(1, 10, { received: 0, total: 100 });

      return stream.writes[0];
    };
    assert.notEqual(draw(80), draw(40));
    assert.equal(draw(undefined), draw(80));
    assert.equal(draw(0), draw(80));
  });

  it('по умолчанию часы — performance.now', () => {
    const stream = fakeStream(80);
    const bar = createProgressBar({ stream });
    bar.update(1, 10, { received: 0, total: 100 });
    assert.equal(stream.writes.length, 1);
  });
});
