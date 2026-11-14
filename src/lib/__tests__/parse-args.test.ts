import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseArgs } from '../parse-args.js';

function errorOf(args: string[]): string {
  const result = parseArgs(args);
  assert.equal(result.kind, 'error');

  return result.message;
}

describe('parseArgs', () => {
  it('корректный http(s) URL', () => {
    for (const raw of ['https://example.com/big.jpg', 'http://127.0.0.1:8080/x?y=1']) {
      const result = parseArgs([raw]);
      assert.equal(result.kind, 'url');
      assert.equal(result.url.href, raw);
    }
  });

  it('нет аргументов или лишние', () => {
    assert.match(errorOf([]), /exactly one URL, got 0/);
    assert.match(errorOf(['https://a.com', 'https://b.com']), /exactly one URL, got 2/);
  });

  it('чужая схема — с названием схемы', () => {
    assert.match(errorOf(['ftp://example.com/f']), /unsupported scheme "ftp:"/);
    assert.match(errorOf(['file:///etc/hosts']), /unsupported scheme "file:"/);
    assert.match(errorOf(['data:text/plain,hi']), /unsupported scheme "data:"/);
  });

  it('без схемы — подсказка добавить https://', () => {
    for (const raw of ['example.com/big.jpg', 'localhost:8080/x', 'example.com:80']) {
      assert.match(errorOf([raw]), /add https:\/\//);
    }
  });

  it('битый URL со схемой', () => {
    assert.match(errorOf(['https://']), /invalid URL/);
  });

  it('логин/пароль в URL', () => {
    assert.match(errorOf(['https://user:pass@host/x']), /credentials/);
    assert.match(errorOf(['https://user@host/x']), /credentials/);
  });

  it('неизвестная опция', () => {
    assert.match(errorOf(['-v']), /unknown option: -v/);
  });

  it('--help / -h', () => {
    assert.deepEqual(parseArgs(['--help']), { kind: 'help' });
    assert.deepEqual(parseArgs(['-h']), { kind: 'help' });
    assert.deepEqual(parseArgs(['https://a.com', '--help']), { kind: 'help' });
  });
});
