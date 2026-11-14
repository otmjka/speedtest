## 1. Размер и колбэк прогресса

- [x] 1.1 `measure-request/parts/parse-content-length.ts`; проверка: unit-тесты — число, нет заголовка, мусор, отрицательное, gzip → `undefined`
- [x] 1.2 `readBodyBytes` отдаёт накопленные байты в `onChunk`; `MeasureOptions.onProgress`; проверка: интеграционный тест — `/bytes/N` даёт `total = N` и последний `received = N`, `/chunked/N` даёт `total = undefined`
- [x] 1.3 `runMeasurements` пробрасывает `onProgress(index, p)`; проверка: тест — индексы 1..10, прогресс приходит до `onResult` того же запроса

## 2. Прогресс-бар

- [x] 2.1 `progress-bar/parts/create-speed-meter.ts`; проверка: unit с фейковым `now` — окно 1 с, сценарий «скорость упала», меньше окна → по факту
- [x] 2.2 `progress-bar/parts/render-progress-line.ts`; проверка: строки для известного/неизвестного размера, 0 % и 100 %, ширина 40/80/200, узко → без полосы, длина ≤ ширины
- [x] 2.3 `progress-bar/progress-bar.ts` (`update`, `clear`, троттлинг 100 мс); проверка: фейковый stream — 1000 `update` за 1 с → ≤ 10 записей, `clear` пишет `\r\x1b[K`

## 3. CLI

- [x] 3.1 `src/speedtest.ts`: бар при `stderr.isTTY`, `clear()` перед строкой запроса и перед ошибкой; проверка: CLI-тесты (не TTY) — stdout/stderr без изменений, нет `\r` и `\x1b`
- [x] 3.2 Ручной прогон в терминале на `Fronalpstock_big.jpg` (размер известен) и `/chunked/N` тест-сервера (без размера), плюс `… 2>/dev/null | cat`; проверка: полоса, проценты, скорость, после запроса — обычная строка

## 4. Гейты и доки

- [x] 4.1 README: раздел про прогресс (когда показывается, текущая скорость — окно 1 с, stderr); проверка: `npm run check` зелёный, покрытие не ниже порогов

## 5. Скорость в строке запроса

- [x] 5.1 `formatRequestLine` дописывает `, N.NN Mbit/s` (байты / время запроса, время 0 → 0); проверка: unit — 35.22 Mbit/s на 104 857 600 B за 23 815.8 мс, CLI-тест на формат строки, README
