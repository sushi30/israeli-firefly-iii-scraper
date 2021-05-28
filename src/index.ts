#!/usr/bin/env node

import { program } from "commander";
import extract from "./extract";
import transform from "./transform";
import load from "./load";

async function main() {
  program
    .version("0.1.0")
    .command("scrape <destination>")
    .requiredOption("-s, --start <date>", "start date")
    .requiredOption("-t, --type <type>", "type of scraper")
    .option("-h, --headless", "run headless")
    .option("-v, --verbose", "more verbose logs")
    .action((destination: string, options: any) =>
      extract({ destination, ...options })
    );

  program
    .command("transform <directory> [output]")
    .option("-i, --installments", "whether to process installments")
    .action((source: string, destination: string, options: any) =>
      transform({ directory: source, output: destination, ...options })
    );

  program
    .command("load <source>")
    .requiredOption(
      "-h, --host <host>",
      "FireFly III host",
      "http://localhost:8080"
    )
    .option("--dry-run", "print transactions and dont send to FireFly III")
    .action((source, options: any) => load({ directory: source, ...options }));
  return await program.parseAsync(process.argv);
}

(async () => {
  try {
    await main();
  } catch (e) {
    throw e;
  }
})();
