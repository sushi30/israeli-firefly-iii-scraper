import { createScraper } from "israeli-bank-scrapers";
import { program } from "commander";
import * as cliProgress from "cli-progress";
import { convert } from "./fireflyConverter";
import axios from "axios";
import { Profiler } from "inspector";

program
  .version("0.0.1")
  .requiredOption("--start <date>", "start date")
  .requiredOption("--type <type>", "type of scraper")
  .option("--source <source_name>", "name of source account")
  .option("--destination <destination_name>", "name of destination account")
  .option("--headless", "run headless")
  .option("--verbose", "more verbose logs")
  .option("--host <url>", "host for adding transactions");
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
    username: process.env[`${options.companyId.toUpperCase()}_USER`] as any,
    password: process.env[`${options.companyId.toUpperCase()}_PASSWORD`] as any,
  });

  if (scrapeResult.success) {
    return scrapeResult.accounts
      .map((account: any) =>
        account.txns.map((tx: any) => ({
          accountNumber: account.accountNumber,
          ...tx,
        }))
      )
      .flat();
  } else {
    throw new Error(`${scrapeResult.errorType}: ${scrapeResult.errorMessage}`);
  }
}

async function postWrapper(host, tx) {
  return await axios
    .post(
      `${host}/api/v1/transactions`,
      {
        transactions: [tx],
        error_if_duplicate_hash: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + process.env.FIREFLY_TOKEN,
        },
      }
    )
    .catch((e) => {
      console.error(`error while processing: ${e.config.data}`);
      throw Error(JSON.stringify(e.response.data));
    });
}

async function main() {
  console.log("setting options");
  if (!(CompanyTypes as any)[program.type]) {
    throw Error(`unknown type: ${program.type}`);
  }
  const options = {
    companyId: (CompanyTypes as any)[program.type],
    startDate: new Date(program.start),
    combineInstallments: true,
    showBrowser: !program.headless,
    verbose: program.verbose,
  };
  console.log("scraping");
  const txns = await scrape(options);
  console.log("converting to firefly format");
  const txnsFirefly = convert(
    program.type,
    txns,
    program.destination,
    program.source
  );
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  console.log("sending to firefly");
  bar.start(txnsFirefly.length);
  await Promise.all(
    txnsFirefly.map((tx: any) =>
      postWrapper(program.host, tx).then(() => bar.update(1))
    ) as any
  );
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e));
