import { createScraper } from "israeli-bank-scrapers";
import { program } from "commander";
import { createJsons } from "./utils";

program
  .version("0.0.1")
  .requiredOption("--start <date>", "start date")
  .requiredOption("--end <end>", "end date")
  .requiredOption("--type <type>", "type of scraper")
  .option("--headless", "run headless")
  .option("-v", "--verbose", "more verbose logs")
  .option("-o", "--output <type>", "output format")
  .option("-d", "--destination <directory>", "otuput directory")
  .option("--dry", "print transactions instead of sending");
program.parse(process.argv);

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
  if (program.destination) {
    await createJsons(program.destination, scraperResult, program.type);
  } else {
    console.log(JSON.stringify(scraperResult, null, 2));
  }
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e);
    process.exit(-1);
  });
