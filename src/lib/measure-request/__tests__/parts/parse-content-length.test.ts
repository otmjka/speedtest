import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseContentLength } from '../../parts/parse-content-length.js';

const parse = (init: Record<string, string>): number | undefined =>
  parseContentLength(new Headers(init));

describe('parseContentLength', () => {
  it('число', () => {
    assert.equal(parse({ 'Content-Length': '14679474' }), 14_679_474);
    assert.equal(parse({ 'Content-Length': '0' }), 0);
  });

  it('нет заголовка', () => {
    assert.equal(parse({}), undefined);
  });

  it('мусор и отрицательное', () => {
    for (const raw of ['abc', '12abc', '1.5', '1e6', '-1', '99999999999999999999']) {
      assert.equal(parse({ 'Content-Length': raw }), undefined, raw);
    }
  });

  it('сжатый ответ → неизвестно, identity → известно', () => {
    assert.equal(parse({ 'Content-Length': '100', 'Content-Encoding': 'gzip' }), undefined);
    assert.equal(parse({ 'Content-Length': '100', 'Content-Encoding': 'identity' }), 100);
  });
});
