#!/usr/bin/env node

import { Command } from "commander";
import extract from "./extract";
import transform from "./transform";
import load from "./load";
import * as fs from "fs/promises";
import { validateEnv } from "./utils";

const program = new Command();

async function main() {
  program.version("0.1.0");
  program
    .command("scrape")
    .requiredOption("-s, --start <date>", "start date")
    .requiredOption("-t, --type <type>", "type of scraper")
    .option(
      "-f, --firefly-iii-host <host>",
      "FireFly III host",
      "http://localhost:8080"
    )
    .option("-h, --headless", "run headless")
    .option("-v, --verbose", "more verbose logs")
    .requiredOption("-c, --config <config>", "config file")
    .action(async (options: any) => {
      validateEnv("FIREFLY_TOKEN");
      const config = JSON.parse((await fs.readFile(options.config)).toString());
      const dir = await fs.mkdtemp(".scraped-");
      try {
        await extract({ destination: `${dir}/scraped`, ...options });
        await transform({
          directory: `${dir}/scraped`,
          output: `${dir}/transformed`,
          ...{ ...options, config },
        });
        await load({
          directory: `${dir}/transformed`,
          host: options.fireflyIiiHost,
          ...options,
        });
      } finally {
        await fs.rmdir(dir, { recursive: true });
      }
    });

  program
    .command("extract <destination>")
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
    .option("-h, --host <host>", "FireFly III host", "http://localhost:8080")
    .option("--dry-run", "print transactions and dont send to FireFly III")
    .action((source, options: any) => load({ directory: source, ...options }));
  return await program.parseAsync(process.argv);
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
