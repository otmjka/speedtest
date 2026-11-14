import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSpeedMeter } from '../../parts/create-speed-meter.js';

function fakeClock(): { now: () => number; set: (ms: number) => void } {
  let time = 0;

  return {
    now: () => time,
    set: (ms) => {
      time = ms;
    },
  };
}

describe('createSpeedMeter', () => {
  it('нет данных или один сэмпл → 0', () => {
    const clock = fakeClock();
    const meter = createSpeedMeter(clock.now);
    assert.equal(meter.bytesPerSecond(), 0);
    meter.add(0);
    assert.equal(meter.bytesPerSecond(), 0);
  });

  it('меньше окна → по фактическому интервалу', () => {
    const clock = fakeClock();
    const meter = createSpeedMeter(clock.now);
    meter.add(0);
    clock.set(500);
    meter.add(500_000);
    assert.equal(meter.bytesPerSecond(), 1_000_000);
  });

  it('скорость упала: 5 с по 10 MB/s, затем 1 с по 1 MB/s → ≈ 8 Mbit/s', () => {
    const clock = fakeClock();
    const meter = createSpeedMeter(clock.now);
    let received = 0;
    meter.add(received);
    for (let t = 100; t <= 6000; t += 100) {
      received += t <= 5000 ? 1_000_000 : 100_000;
      clock.set(t);
      meter.add(received);
    }
    const mbit = (meter.bytesPerSecond() * 8) / 1e6;
    assert.ok(Math.abs(mbit - 8) < 0.5, `got ${mbit}`);
  });

  it('окно 1 с: сэмплы старше окна не влияют', () => {
    const clock = fakeClock();
    const meter = createSpeedMeter(clock.now);
    meter.add(0);
    clock.set(100);
    meter.add(50_000_000);
    clock.set(1100);
    meter.add(50_000_000);
    clock.set(2100);
    meter.add(52_000_000);
    assert.equal(meter.bytesPerSecond(), 2_000_000);
  });
});
