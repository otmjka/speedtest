#!/usr/bin/env node
import { formatRequestLine, formatSummary } from './lib/format-report.js';
import { parseArgs, USAGE } from './lib/parse-args.js';
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
  try {
    const measurements = await runMeasurements(args.url, {
      onResult: (index, measurement) => {
        console.log(formatRequestLine(index, REQUEST_COUNT, measurement));
      },
    });
    const summary = summarize(measurements);
    console.log(`\n${formatSummary(summary)}`);
    if (summary.totalBytes === 0) {
      console.error('Warning: nothing downloaded, all responses had empty bodies');
    }
  } catch (error) {
    if (!(error instanceof RequestFailedError)) {
      throw error;
    }
    console.error(error.message);
    process.exitCode = 1;
  }
}
