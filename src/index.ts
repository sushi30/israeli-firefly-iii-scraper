import { action, program } from "commander";
import extract from "./extract";
import transform from "./transform";
program
  .version("0.0.1")
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
  .requiredOption("-o, --output <directory>", "directory to output transformed transaction")
  .option("-i, --installments", "whether to process installments")
  .action((options: any) => transform(options));
program.parse(process.argv);