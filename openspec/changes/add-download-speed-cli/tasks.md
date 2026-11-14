## 1. Обвязка

- [x] 1.1 `git init`, `package.json` (`type: module`, `engines.node >=22`, devDeps, скрипты `build`, `build:smoke`, `start`, `test`, `test:coverage`, `lint`, `format`, `format:check`, `typecheck`, `check`), `.gitignore` (`node_modules`, `dist`, `dist-test`); проверка: `npm install` ок
- [x] 1.2 `tsconfig.json` (strict, nodenext, всё → `dist-test/`); проверка: `npm run typecheck` ок
- [x] 1.3 `eslint.config.js` и `.prettierrc`; проверка: `npm run lint` и `npm run format:check` зелёные

## 2. Тест-сервер

- [x] 2.1 `src/test-utils/start-test-server.ts`: роуты — тело N байт, chunked, 404, 500 на N-м, редирект, петля, зависание, медленно-но-идёт, обрыв тела, пустое тело; счётчик, макс. параллельность, заголовки последнего запроса; проверка: smoke-тест по всем роутам

## 3. Модули (тесты в `__tests__/`)

- [x] 3.1 `parse-args`; проверка: unit-тесты на все сценарии «Аргумент URL» и «Справка»
- [x] 3.2 `measure-request`; проверка: точные байты, chunked, заголовки, 404, редирект, петля, зависание → таймаут, медленно → ок, обрыв → ошибка, порт закрыт
- [x] 3.3 `run-measurements`; проверка: 10 запросов при параллельности 1; 500 на 3-м → сервер видел ровно 3
- [x] 3.4 `summarize`; проверка: пример из спеки (80.00 Mbit/s), пустое тело, время 0
- [x] 3.5 `format-report`; проверка: сравнение строк

## 4. CLI

- [x] 4.1 `src/speedtest.ts`; проверка: CLI-тесты — без аргументов → 2, `--help` → 0, 404 → 1 + `Request 1 failed`, успех → 0 + итог
- [x] 4.2 Ручной прогон: тяжёлая картинка и `https://nonexistent.invalid`; проверка: вывод и exit-коды

## 5. Гейты

- [x] 5.1 Сборка esbuild → `release/speedtest.js`, `release/` в `.gitignore`; проверка: `npm run check` зелёный (вкл. `build:smoke`)
- [ ] 5.2 `.github/workflows/ci.yml`; проверка: `actionlint`, после первого пуша — зелёный прогон
- [x] 5.3 pre-commit через husky: `npm run check`; проверка: коммит с красной проверкой блокируется
- [ ] 5.4 `.github/workflows/release.yml`: релиз при push в `main`; проверка: после мержа PR в Releases есть `speedtest.js`, `node speedtest.js --help` работает

## 6. Доки

- [x] 6.1 `README.md`: требования, запуск (из Releases и из исходников), пример вывода, единицы, как меряем, ограничения, exit-коды, как гонять проверки; проверка: свежий клон запускается по README
