import { action, program } from "commander";
import extract from "./extract";
import load from "./load";
program
  .version("0.0.1")
  .command("scrape")
  .requiredOption("-s, --start <date>", "start date")
  .requiredOption("-e, --end <end>", "end date")
  .requiredOption("-t, --type <type>", "type of scraper")
  .option("-h, --headless", "run headless")
  .option("-v, --verbose", "more verbose logs")
  .option("-d, --destination <directory>", "otuput directory")
  .action((options: any) => extract(options));

  program
  .command("load")
  .requiredOption("-d, --directory", "transactions directory")
  .requiredOption("-h, --host <host>", "firefly iii host")
  .action((options: any) => load(options));
program.parse(process.argv);