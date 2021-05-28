#!/usr/bin/env node

import { program } from "commander";
import extract from "./extract";
import transform from "./transform";
import load from "./load";

async function main() {
  program
    .version("0.1.0")
    .command("scrape")
    .requiredOption("-s, --start <date>", "start date")
    .requiredOption("-t, --type <type>", "type of scraper")
    .option("-h, --headless", "run headless")
    .option("-v, --verbose", "more verbose logs")
    .option("-d, --destination <directory>", "otuput directory")
    .action((options: any) => extract(options));

  program
    .command("transform")
    .requiredOption("-d, --directory <directory>", "transactions directory")
    .requiredOption(
      "-o, --output <directory>",
      "directory to output transformed transaction"
    )
    .option("-i, --installments", "whether to process installments")
    .action((options: any) => transform(options));

  program
    .command("load")
    .requiredOption("-d, --directory <directory>", "transactions directory")
    .requiredOption("-h, --host <host>", "FireFly III host")
    .option("--dry-run", "print transactions and dont send to FireFly III")
    .action((options: any) => load(options));
  return await program.parseAsync(process.argv);
}

(async () => {
  try {
    await main();
  } catch (e) {
    throw e;
  }
})();
