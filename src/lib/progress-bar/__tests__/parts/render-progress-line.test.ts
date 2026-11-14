import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderProgressLine } from '../../parts/render-progress-line.js';
import type { ProgressLineState } from '../../types/progress-line-state.js';

const state = (patch: Partial<ProgressLineState> = {}): ProgressLineState => ({
  index: 3,
  count: 10,
  received: 7_340_000,
  total: 14_680_000,
  bytesPerSecond: 7_750_000,
  ...patch,
});

describe('renderProgressLine', () => {
  it('размер известен — пример из спеки', () => {
    assert.equal(
      renderProgressLine(state(), 80),
      'Request  3/10 [█████░░░░░]  50%   7.34 / 14.68 MB  62.0 Mbit/s',
    );
  });

  it('размер неизвестен — без полосы и процента', () => {
    assert.equal(
      renderProgressLine(state({ total: undefined }), 80),
      'Request  3/10  7.34 MB  62.0 Mbit/s',
    );
  });

  it('0 % и 100 %', () => {
    assert.match(
      renderProgressLine(state({ received: 0 }), 80),
      /\[░+\] {3}0% {3}0\.00 \/ 14\.68 MB/,
    );
    assert.match(renderProgressLine(state({ received: 14_680_000 }), 80), /\[█+\] 100% /);
  });

  it('пустое тело с известным размером 0 → 100 %', () => {
    assert.match(renderProgressLine(state({ received: 0, total: 0 }), 80), /\[█+\] 100% /);
  });

  it('сервер прислал больше Content-Length → не больше 100 %', () => {
    assert.match(renderProgressLine(state({ received: 20_000_000 }), 80), /\[█+\] 100% /);
  });

  it('ширина 40 / 80 / 200: длина ≤ ширины, полоса всегда 10', () => {
    for (const columns of [40, 80, 200]) {
      const line = renderProgressLine(state(), columns);
      assert.ok(line.length < columns, `${columns}: ${line.length}`);
    }
    assert.equal(renderProgressLine(state(), 200), renderProgressLine(state(), 80));
    assert.match(renderProgressLine(state(), 63), /\[[█░]{10}\]/);
  });

  it('ширина полосы не зависит от числа цифр в скачанном', () => {
    const small = renderProgressLine(state({ received: 1_000_000 }), 80);
    const big = renderProgressLine(state({ received: 12_000_000 }), 80);
    assert.equal(small.indexOf(']'), big.indexOf(']'));
  });

  it('узко → без полосы', () => {
    const line = renderProgressLine(state(), 62);
    assert.equal(line, 'Request  3/10   50%   7.34 / 14.68 MB  62.0 Mbit/s');
    assert.doesNotMatch(renderProgressLine(state(), 40), /\[/);
  });

  it('очень узко → обрезано, ширина 0 → пусто', () => {
    assert.equal(renderProgressLine(state(), 10), 'Request  ');
    assert.equal(renderProgressLine(state({ total: undefined }), 0), '');
  });
});
