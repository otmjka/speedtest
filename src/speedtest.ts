#!/usr/bin/env node
import { formatRequestLine, formatSummary } from './lib/format-report.js';
import { parseArgs, USAGE } from './lib/parse-args.js';
import { createProgressBar } from './lib/progress-bar/index.js';
import { REQUEST_COUNT, RequestFailedError, runMeasurements } from './lib/run-measurements.js';
import { summarize } from './lib/summarize.js';

// Exit-коды: 0 — ок, 1 — замер упал, 2 — плохой ввод.
const args = parseArgs(process.argv.slice(2));

if (args.kind === 'help') {
  console.log(USAGE);
} else if (args.kind === 'error') {
  console.error(`Error: ${args.message}\n\n${USAGE}`);
  process.exitCode = 2;
} else {
  console.log(`Downloading ${args.url.href} ${REQUEST_COUNT} times...`);
  // Прогресс — только в терминал; в пайпе/CI вывод как без него.
  const bar = process.stderr.isTTY ? createProgressBar({ stream: process.stderr }) : undefined;
  try {
    const measurements = await runMeasurements(args.url, {
      ...(bar && {
        onProgress: (index, progress) => {
          bar.update(index, REQUEST_COUNT, progress);
        },
      }),
      onResult: (index, measurement) => {
        bar?.clear();
        console.log(formatRequestLine(index, REQUEST_COUNT, measurement));
      },
    });
    const summary = summarize(measurements);
    console.log(`\n${formatSummary(summary)}`);
    if (summary.totalBytes === 0) {
      console.error('Warning: nothing downloaded, all responses had empty bodies');
    }
  } catch (error) {
    bar?.clear();
    if (!(error instanceof RequestFailedError)) {
      throw error;
    }
    console.error(error.message);
    process.exitCode = 1;
  }
}
