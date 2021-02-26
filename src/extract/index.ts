import { createScraper } from "israeli-bank-scrapers";
import { normalizeTransactions, dumpTransactions } from "./utils";
import * as fs from "fs";
import { ScaperOptions } from "israeli-bank-scrapers/lib/scrapers/base-scraper";

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

export default async function main({
  type,
  start,
  destination,
  headless,
  verbose,
}) {
  if (!(CompanyTypes as any)[type]) {
    throw Error(`unknown type: ${type}`);
  }
  const options: ScaperOptions = {
    companyId: (CompanyTypes as any)[type],
    startDate: new Date(start),
    combineInstallments: false,
    showBrowser: !headless,
    verbose: verbose,
    args: process.env.PUPPETEER_ARGS.split(",") || [],
  };
  console.log("scraping");
  const scraperResult = await scrape(options);
  const txns = normalizeTransactions(scraperResult, type);
  if (destination) {
    console.log(`dumping to ${destination}`);
    fs.mkdirSync(destination, { recursive: true });
    await dumpTransactions(destination, txns);
  } else {
    txns.forEach((tx) => console.log(JSON.stringify(tx)));
  }
  console.log(`done`);
}
