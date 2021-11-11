import { createScraper } from "israeli-bank-scrapers";
import { normalizeTransactions, dumpTransactions } from "./utils";
import * as fs from "fs";
import { ScaperOptions } from "israeli-bank-scrapers/lib/scrapers/base-scraper";
import { envToBool } from "../utils";

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

function getEnv(env: string): string {
  if (!process.env[env]) {
    console.error(`Missing environment variable: ${env}`);
    throw Error(`Missing environment variable: ${env}`);
  }
  return process.env[env];
}

async function scrape(options: any) {
  const scraper = createScraper(options);
  const username = getEnv(`${options.companyId.toUpperCase()}_USER`);
  const password = getEnv(`${options.companyId.toUpperCase()}_PASSWORD`);
  const scrapeResult: any = await scraper.scrape({
    username,
    password,
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
  const startDate = new Date(start);
  const options: ScaperOptions = {
    companyId: (CompanyTypes as any)[type],
    startDate,
    combineInstallments: false,
    showBrowser: !(headless || envToBool("PUPPETEER_HEADLESS")),
    verbose: verbose,
    args: process.env.PUPPETEER_ARGS?.split(" ") || [],
  };
  console.log("scraping");
  console.debug({ options });
  const scraperResult = await scrape(options);
  const txns = normalizeTransactions(scraperResult, type).filter(
    ({ data: { date } }) => date >= startDate
  );
  if (destination) {
    console.log(`dumping to ${destination}`);
    fs.mkdirSync(destination, { recursive: true });
    await dumpTransactions(destination, txns);
  } else {
    txns.forEach((tx) => console.log(JSON.stringify(tx)));
  }
  console.log(`done`);
}
