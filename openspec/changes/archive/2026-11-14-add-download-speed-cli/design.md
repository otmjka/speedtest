## Context

Пустой репо. Требования — `specs/download-speed-cli/spec.md`.

## Goals / Non-Goals

**Goals:** мало кода, без runtime-зависимостей, падения покрыты тестами, CI.

**Non-Goals:** флаги кроме `--help`, параллельный режим, прогрев, медиана/p90, TTFB отдельно, upload, обработка Ctrl+C.

## Decisions

- **Сборка — esbuild в один файл** `release/speedtest.js` (ESM, node22, shebang сохраняется). `release/` не в git. Импорты с `.js` (js-fn-rules). Нативный запуск `.ts` — нет: `.ts`-импорты, свежий Node.
- **tsc — только типы и тесты:** `tsconfig.json` → `dist-test/` (в `.gitignore`). esbuild типы не проверяет — это делает `typecheck`.
- **Node 22+** (20 — EOL).
- **Структура по js-fn-rules**: папка — только у модуля с хелперами, мелкие — плоскими файлами; README один в корне:
  - `src/speedtest.ts` — точка входа: склейка, вывод, exit-код.
  - `src/lib/` — все модули; в корне `src/` из файлов только точка входа.
  - `src/lib/parse-args.ts` — argv → `help | url | error`. Чистая.
  - `src/lib/measure-request/` — один запрос → `{ ms, bytes }`, ошибка с причиной; `parts/`: idle-таймер, чтение тела, текст ошибки.
  - `src/lib/run-measurements.ts` — цикл, fail-fast, колбэк на каждый запрос.
  - `src/lib/summarize.ts` — итоговые числа. Чистая.
  - `src/lib/format-report.ts` — строки вывода. Чистая.
  - Тесты: CLI — `src/__tests__/`, модули — `src/lib/__tests__/`, у `measure-request` — свои `__tests__/`.
  - `src/test-utils/start-test-server.ts` — `http.Server` на порту 0, роуты под кейсы, счётчик запросов и макс. параллельность.
- **Байты** — суммой чанков из `response.body`, тело целиком не держим.
- **`Accept-Encoding: identity`** — иначе `fetch` распакует gzip и байты будут не те.
- **Кэш** — только заголовок, без query-параметра (ломает подписанные URL).
- **Idle-таймаут**, не общий: `AbortController` + таймер, сброс на каждом чанке. `idleTimeoutMs` параметром (по умолчанию 30 000), в тестах ~200 мс.
- **Таймер** — перед `fetch` → конец потока. В 1-й запрос входят DNS/TCP/TLS.
- **Скорость** = все байты / сумма времён; время 0 → скорость 0.
- **Exit-коды:** 0 — ок, 1 — замер упал, 2 — плохой ввод.
- **Тесты:** `node:test` + `node:assert` по `dist-test/**/*.test.js`. CLI-тесты запускают `node dist-test/speedtest.js` против тест-сервера. DNS — только руками.
- **Гейты** — `npm run check`: `format:check → lint → typecheck → test:coverage → build:smoke`.
  - Prettier; ESLint flat + `typescript-eslint` strict-type-checked + `eslint-config-prettier`, `complexity: 8`.
  - Покрытие: `--experimental-test-coverage --test-coverage-lines=90 --test-coverage-branches=80 --test-coverage-functions=90`, без тестовых файлов.
  - `build:smoke` = сборка + `node release/speedtest.js --help` — бандл запускается.
- **pre-commit** (husky, ставится через `prepare`): `npm run check` (~5 с). Проверяет рабочую копию, а не только staged.
- **CI** `.github/workflows/ci.yml` (push, PR): job `check` на Node 24 — `npm ci && npm run check`; job `test` — матрица Node 22/24, `npm ci && npm test`.
- **Релиз** `.github/workflows/release.yml`: push в `main` → `npm ci && npm run check` → `gh release create v<major.minor>.<run_number>` с `release/speedtest.js`, `--generate-notes`. Права `contents: write`, `concurrency: release`. Альтернатива — бот коммитит бандл в main: лишние коммиты, конфликт с защитой ветки.

## Risks / Trade-offs

- Бандл собран, но не запускается → `build:smoke` в pre-commit, CI и релизе.
- Прямой push в `main` без PR тоже выпускает релиз → релиз прогоняет `check` сам.
- 1-й запрос медленнее (рукопожатия) → в README.
- Маленький файл меряет задержку, а не канал → в README советуем тяжёлый.
- Keep-alive: запросы 2–10 без рукопожатий → принимаем.
- Сервер игнорирует `identity` и шлёт gzip → считаем распакованное, в README.
- Тайминговые тесты флакают на CI → запас: таймаут 200 мс против паузы 2 с, чанки каждые 50 мс.
