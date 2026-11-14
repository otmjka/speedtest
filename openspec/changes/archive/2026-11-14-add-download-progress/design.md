## Context

Сейчас: `readBodyBytes(body, onChunk)` зовёт `onChunk()` без аргументов (только сброс idle-таймера); `runMeasurements` отдаёт наружу только `onResult` после запроса; вывод — `console.log` в `src/speedtest.ts`. Требования — `specs/download-speed-cli/spec.md`.

## Goals / Non-Goals

**Goals:** живой прогресс в терминале без влияния на замер и на вывод в пайп.

**Non-Goals:** общий прогресс по всем 10 запросам, ETA, цвета, флаг `--no-progress`, `HEAD`-запрос, предупреждение о маленьком файле.

## Decisions

- **Размер — из заголовков `GET`**, не `HEAD`: без лишнего запроса, тот же ответ, что меряем. Парсинг — `parts/parse-content-length.ts` в `measure-request`: число ≥ 0, иначе `undefined`; `Content-Encoding` ≠ `identity`/пусто → `undefined`.
- **Колбэк прогресса.** `MeasureOptions.onProgress?: (p: { received: number; total: number | undefined }) => void`. `readBodyBytes` передаёт в `onChunk` накопленные байты. `runMeasurements` оборачивает в `onProgress(index, p)`.
- **Модуль `src/lib/progress-bar/`** (js-fn-rules):
  - `progress-bar.ts` — `createProgressBar({ stream, now })` → `{ update(index, total, p), clear() }`. Держит троттлинг и скорость, пишет в `stream`.
  - `parts/render-progress-line.ts` — чистая: состояние + ширина → строка. Полоса фиксированная — 10 символов; строка с ней не влезает в `stream.columns` (по умолчанию 80) — полоса пропадает. Скачанное выровнено по ширине итога.
  - `parts/create-speed-meter.ts` — скользящее окно 1 с по сэмплам `(time, received)`; `now` инъектируется.
- **Перерисовка:** `\r` + строка + `\x1b[K` (стереть хвост). `clear()` = `\r\x1b[K`. Троттлинг 100 мс по `now()`, без таймеров — рисуем только из `update`, поэтому после завершения запроса ничего не «догоняет».
- **TTY:** `src/speedtest.ts` создаёт бар, только если `process.stderr.isTTY`; иначе `onProgress` не передаётся. Перед `onResult` и перед выводом ошибки — `clear()`.
- **stderr, не stdout:** stdout остаётся чистым (строки запросов и итог), прогресс не попадает в пайп.
- **Форматирование MB** — переиспользуем из `format-report.ts` (экспорт `formatMegabytes`).

## Risks / Trade-offs

- Колбэк на каждый чанк → лишняя работа в горячем цикле → троттлинг 100 мс, рендер только по таймеру-сравнению, без аллокаций в пропущенных вызовах.
- Узкий терминал / ресайз → ширина читается на каждой перерисовке.
- Сервер соврал в `Content-Length` → процент может застрять < 100 % или обрыв; замер всё равно по реальным байтам, `fetch` бросит ошибку при нехватке.
- CLI-тесты идут без TTY → прогресс там не проверить; покрываем unit-тестами рендера, спидометра и `createProgressBar` с фейковым stream (`isTTY`, `columns`, `write`).
