import { createScraper } from "israeli-bank-scrapers";
import { program } from "commander";
import { createJsons, dumpTransactions } from "./utils";
import * as fs from "fs";

export enum CompanyTypes {
  hapoalim = "hapoalim",
  hapoalimBeOnline = "hapoalimBeOnline",
  beinleumi = "beinleumi",
  union = "union",
  amex = "amex",
  isracard = "isracard",
  visaCal = "visaCal",
  max = "max",
  leumiCard = "leumiCard",
  otsarHahayal = "otsarHahayal",
  discount = "discount",
  mizrahi = "mizrahi",
  leumi = "leumi",
}

async function scrape(options: any) {
  const scraper = createScraper(options);
  const scrapeResult: any = await scraper.scrape({
    username: process.env[`${options.companyId.toUpperCase()}_USER`] as string,
    password: process.env[
      `${options.companyId.toUpperCase()}_PASSWORD`
    ] as string,
  });

  if (scrapeResult.success) {
    return scrapeResult;
  } else {
    throw new Error(`${scrapeResult.errorType}: ${scrapeResult.errorMessage}`);
  }
}

async function main() {
  program
    .version("0.0.1")
    .requiredOption("-s, --start <date>", "start date")
    .requiredOption("-e, --end <end>", "end date")
    .requiredOption("-t, --type <type>", "type of scraper")
    .option("-h, --headless", "run headless")
    .option("-v, --verbose", "more verbose logs")
    .option("-o, --output <type>", "output format")
    .option("-d, --destination <directory>", "otuput directory");
  program.parse(process.argv);
  console.log("setting options");
  if (!(CompanyTypes as any)[program.type]) {
    throw Error(`unknown type: ${program.type}`);
  }
  const options = {
    companyId: (CompanyTypes as any)[program.type],
    startDate: new Date(program.start),
    combineInstallments: false,
    showBrowser: !program.headless,
    verbose: program.verbose,
  };
  console.log("scraping");
  const scraperResult = await scrape(options);
  const txns = createJsons(scraperResult, program.type);
  if (program.destination) {
    fs.mkdirSync(program.destination, { recursive: true });
    await dumpTransactions(program.destination, txns);
  } else {
    txns.forEach((tx) => console.log(JSON.stringify(tx)));
  }
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e);
    process.exit(-1);
  });
