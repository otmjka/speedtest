export type ParsedArgs =
  { kind: 'help' } | { kind: 'url'; url: URL } | { kind: 'error'; message: string };

export const USAGE = `Usage: speedtest <url>

Downloads <url> 10 times in a row and prints time and size of each request,
average time, total size and download speed.

Arguments:
  <url>         absolute http:// or https:// URL

Options:
  -h, --help    show this help`;

const SUPPORTED_PROTOCOLS: readonly string[] = ['http:', 'https:'];

/**
 * Разбирает аргументы CLI (без `node` и имени скрипта).
 *
 * @returns `help` — если есть `-h`/`--help`; `url` — ровно один валидный http(s) URL
 *          без логина/пароля; иначе `error` с причиной для stderr.
 */
export function parseArgs(args: readonly string[]): ParsedArgs {
  if (args.some((arg) => arg === '--help' || arg === '-h')) {
    return { kind: 'help' };
  }

  const [first] = args;

  if (first === undefined || args.length > 1) {
    return { kind: 'error', message: `expected exactly one URL, got ${args.length} arguments` };
  }

  if (first.startsWith('-')) {
    return { kind: 'error', message: `unknown option: ${first}` };
  }

  return validateUrl(first);
}

function validateUrl(raw: string): ParsedArgs {
  const missingScheme = `missing scheme in "${raw}": add https://, e.g. https://${raw}`;
  const url = URL.parse(raw);

  if (!url) {
    return { kind: 'error', message: raw.includes('://') ? `invalid URL: ${raw}` : missingScheme };
  }

  if (!SUPPORTED_PROTOCOLS.includes(url.protocol)) {
    return {
      kind: 'error',
      message:
        !raw.includes('://') && looksLikeHost(url.protocol)
          ? missingScheme
          : `unsupported scheme "${url.protocol}": only http: and https: are supported`,
    };
  }

  if (url.username || url.password) {
    return { kind: 'error', message: 'credentials in URL are not supported' };
  }

  return { kind: 'url', url };
}

/**
 * `localhost:8080/x` и `example.com:80` парсятся как URL со схемой `localhost:` / `example.com:`.
 * Считаем такую «схему» хостом, если это `localhost` или в ней есть точка.
 */
function looksLikeHost(protocol: string): boolean {
  const name = protocol.slice(0, -1);

  return name === 'localhost' || name.includes('.');
}
