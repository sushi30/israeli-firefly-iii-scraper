import { action, program } from "commander";
import scrape from "./scrape";
program
  .version("0.0.1")
  .command("scrape")
  .requiredOption("-s, --start <date>", "start date")
  .requiredOption("-e, --end <end>", "end date")
  .requiredOption("-t, --type <type>", "type of scraper")
  .option("-h, --headless", "run headless")
  .option("-v, --verbose", "more verbose logs")
  .option("-d, --destination <directory>", "otuput directory")
  .action((options: any) => scrape(options));
program.parse(process.argv);
console.log("setting options");