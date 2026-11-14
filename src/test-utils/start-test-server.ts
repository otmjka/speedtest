import { createServer } from 'node:http';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface TestServer {
  /** Базовый адрес, например `http://127.0.0.1:54321`. */
  readonly origin: string;
  /** Сколько запросов пришло (все роуты). */
  readonly requestCount: number;
  /** Максимум одновременно обрабатываемых запросов. */
  readonly maxConcurrent: number;
  /** Заголовки последнего запроса. */
  readonly lastHeaders: IncomingHttpHeaders | undefined;
  close(): Promise<void>;
}

type Handler = (args: string[], res: ServerResponse, nth: number) => void;

const CHUNK_SIZE = 64 * 1024;
const SLOW_INTERVAL_MS = 50;

/**
 * Локальный HTTP-сервер для тестов. Роуты (`/имя/аргументы`):
 * - `/bytes/N` — N байт с `Content-Length`;
 * - `/chunked/N` — N байт chunked, без `Content-Length`;
 * - `/status/CODE` — пустой ответ с кодом;
 * - `/fail-on/K/N` — K-й запрос (по счётчику сервера) → 500, иначе N байт;
 * - `/redirect/N` — 302 на `/bytes/N`;
 * - `/loop` — 302 на себя;
 * - `/hang` — заголовки и тишина;
 * - `/slow/MS` — чанк каждые 50 мс, всего MS мс;
 * - `/truncated/N` — обещает N байт, шлёт половину и рвёт соединение;
 * - `/empty` — 200 без тела.
 */
export async function startTestServer(): Promise<TestServer> {
  let requestCount = 0;
  let active = 0;
  let maxConcurrent = 0;
  let lastHeaders: IncomingHttpHeaders | undefined;

  const server = createServer((req, res) => {
    requestCount += 1;
    active += 1;
    maxConcurrent = Math.max(maxConcurrent, active);
    lastHeaders = req.headers;
    res.on('close', () => {
      active -= 1;
    });
    route(req, res, requestCount);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address() as AddressInfo;

  return {
    origin: `http://127.0.0.1:${port}`,
    get requestCount() {
      return requestCount;
    },
    get maxConcurrent() {
      return maxConcurrent;
    },
    get lastHeaders() {
      return lastHeaders;
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => {
          resolve();
        });
      }),
  };
}

const HANDLERS: Record<string, Handler> = {
  bytes: ([n], res) => {
    sendBytes(res, Number(n));
  },
  chunked: ([n], res) => {
    res.writeHead(200);
    writeChunked(res, Number(n));
  },
  status: ([code], res) => {
    res.writeHead(Number(code)).end();
  },
  'fail-on': ([k, n], res, nth) => {
    if (nth === Number(k)) {
      res.writeHead(500).end();
      return;
    }

    sendBytes(res, Number(n));
  },
  redirect: ([n], res) => {
    res.writeHead(302, { Location: `/bytes/${n ?? '0'}` }).end();
  },
  loop: (_args, res) => {
    res.writeHead(302, { Location: '/loop' }).end();
  },
  hang: (_args, res) => {
    res.writeHead(200);
    res.flushHeaders();
  },
  slow: ([ms], res) => {
    res.writeHead(200);
    const timer = setInterval(() => res.write(Buffer.alloc(1024)), SLOW_INTERVAL_MS);
    setTimeout(() => {
      clearInterval(timer);
      res.end();
    }, Number(ms));
  },
  truncated: ([n], res) => {
    const size = Number(n);
    res.writeHead(200, { 'Content-Length': size });
    res.write(Buffer.alloc(Math.floor(size / 2)), () => res.destroy());
  },
  empty: (_args, res) => {
    res.writeHead(200, { 'Content-Length': 0 }).end();
  },
};

function route(req: IncomingMessage, res: ServerResponse, nth: number): void {
  const [, name = '', ...args] = new URL(req.url ?? '/', 'http://x').pathname.split('/');
  const handler = HANDLERS[name];

  if (!handler) {
    res.writeHead(404).end();
    return;
  }

  handler(args, res, nth);
}

function sendBytes(res: ServerResponse, size: number): void {
  res.writeHead(200, { 'Content-Length': size });
  res.end(Buffer.alloc(size));
}

function writeChunked(res: ServerResponse, remaining: number): void {
  if (remaining <= 0) {
    res.end();
    return;
  }

  const size = Math.min(CHUNK_SIZE, remaining);
  res.write(Buffer.alloc(size), () => {
    writeChunked(res, remaining - size);
  });
}
