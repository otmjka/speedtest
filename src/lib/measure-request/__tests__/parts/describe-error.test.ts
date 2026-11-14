import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { describeError } from '../../parts/describe-error.js';

describe('describeError', () => {
  it('сообщение + причина из cause', () => {
    const error = new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND x') });
    assert.equal(describeError(error), 'fetch failed (getaddrinfo ENOTFOUND x)');
  });

  it('Error без cause и не-Error', () => {
    assert.equal(describeError(new Error('boom')), 'boom');
    assert.equal(describeError('raw'), 'raw');
  });
});
