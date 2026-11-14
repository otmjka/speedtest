import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { startTestServer } from '../test-utils/start-test-server.js';
import type { TestServer } from '../test-utils/start-test-server.js';

const SCRIPT = fileURLToPath(new URL('../speedtest.js', import.meta.url));

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runCli(...args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    execFile(process.execPath, [SCRIPT, ...args], (error, stdout, stderr) => {
      resolve({ code: typeof error?.code === 'number' ? error.code : 0, stdout, stderr });
    });
  });
}

describe('speedtest CLI', () => {
  let server: TestServer;

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
  });

  it('без аргументов → usage в stderr, exit 2', async () => {
    const result = await runCli();
    assert.equal(result.code, 2);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /expected exactly one URL[\s\S]*Usage: speedtest <url>/);
  });

  it('плохой URL → exit 2, запросов нет', async () => {
    const before = server.requestCount;
    const result = await runCli(`ftp://${server.origin.slice('http://'.length)}/bytes/1`);
    assert.equal(result.code, 2);
    assert.match(result.stderr, /unsupported scheme "ftp:"/);
    assert.equal(server.requestCount, before);
  });

  it('--help → usage в stdout, exit 0', async () => {
    const result = await runCli('--help');
    assert.equal(result.code, 0);
    assert.match(result.stdout, /^Usage: speedtest <url>/);
    assert.equal(result.stderr, '');
  });

  it('404 → Request 1 failed, итога нет, exit 1', async () => {
    const result = await runCli(`${server.origin}/nope`);
    assert.equal(result.code, 1);
    assert.equal(result.stderr.trim(), 'Request 1 failed: HTTP 404 Not Found');
    assert.doesNotMatch(result.stdout, /Speed:/);
  });

  it('успех → 10 строк и итог, exit 0', async () => {
    const result = await runCli(`${server.origin}/bytes/1000000`);
    assert.equal(result.code, 0);
    assert.equal(result.stderr, '');
    assert.equal(
      result.stdout.match(/^Request +\d+\/10: [\d.]+ ms, 1000000 B \(1\.00 MB\), [\d.]+ Mbit\/s$/gm)
        ?.length,
      10,
    );
    assert.match(
      result.stdout,
      /Downloaded: +10\.00 MB\nSpeed: +[\d.]+ Mbit\/s \([\d.]+ MB\/s\)\n$/,
    );
  });

  it('не TTY → без прогресса: нет \\r и \\x1b ни в stdout, ни в stderr', async () => {
    for (const path of ['/bytes/1000000', '/chunked/1000000', '/nope']) {
      const { stdout, stderr } = await runCli(`${server.origin}${path}`);
      const output = stdout + stderr;
      assert.ok(!output.includes('\r') && !output.includes('\x1b'), path);
    }
  });

  it('пустые ответы → 0 MB и предупреждение, exit 0', async () => {
    const result = await runCli(`${server.origin}/empty`);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /Downloaded: +0\.00 MB\nSpeed: +0\.00 Mbit\/s/);
    assert.match(result.stderr, /Warning: nothing downloaded/);
  });
});
