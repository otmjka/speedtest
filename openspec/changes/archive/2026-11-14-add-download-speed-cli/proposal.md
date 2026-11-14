## Why

Нужно из консоли замерить скорость скачивания с конкретного URL.

## What Changes

- CLI на TypeScript: URL → 10 последовательных GET с полным чтением тела → строки по каждому запросу + итог (среднее время, общий объём, скорость).
- Валидация ввода и явные ошибки (плохой URL, сеть/HTTP, зависшая загрузка).
- Тесты: unit, интеграционные (локальный сервер), CLI.
- Сборка esbuild в один файл; релиз на GitHub при мерже в `main`.
- Гейты в pre-commit и CI: формат, линт, типы, тесты с порогом покрытия, сборка.
- README: запуск и единицы.

## Capabilities

### New Capabilities
- `download-speed-cli`: замер скорости скачивания URL из консоли.

### Modified Capabilities
<!-- нет -->

## Impact

- Новое: `src/**`, `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.husky/pre-commit`, `.github/workflows/{ci,release}.yml`, `README.md`.
- Node 22+, runtime-зависимостей нет. Dev: `typescript`, `@types/node`, `esbuild`, `eslint`, `typescript-eslint`, `prettier`, `husky`.
