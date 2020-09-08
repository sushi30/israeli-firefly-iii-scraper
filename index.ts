import { createScraper } from "israeli-bank-scrapers";
import { program } from "commander";
import * as cliProgress from "cli-progress";
import { convert } from "./fireflyConverter";
import axios from "axios";

program
  .version("0.0.1")
  .requiredOption("--start <date>", "start date")
  .requiredOption("--end <end>", "end date")
  .requiredOption("--type <type>", "type of scraper")
  .option("--bank-account <account_name>", "name of source account")
  .option("--credit-card <account_name>", "name of destination account")
  .option("--headless", "run headless")
  .option("--verbose", "more verbose logs")
  .option("--dry", "print transactions instead of sending")
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
    return scrapeResult;
  } else {
    throw new Error(`${scrapeResult.errorType}: ${scrapeResult.errorMessage}`);
  }
}

async function postWrapper(host, tx) {
  return axios
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
      console.error(JSON.stringify(e.response.data, null, 1));
      throw Error("error while sending to firefly");
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
  const scrpaerTxns = await scrape(options);
  console.log("converting to firefly format");
  const fireflyTxns = convert(
    program.type,
    scrpaerTxns,
    program.bankAccount,
    program.creditCard
  )
    .filter((t) => new Date(t.date) <= new Date(program.end))
    .filter(
      (t) => program.type == "leumi" && !t.description.includes("לאומי ויזה")
    );
  fireflyTxns.forEach((tx) => {
    if (tx.status == "pending") {
      throw Error(`Encountered pending transaction: ${JSON.stringify(tx)}`);
    }
  });
  if (program.dry) {
    console.log(fireflyTxns);
  } else {
    console.log("sending to firefly");
    const bar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    bar.start(fireflyTxns.length);
    await Promise.all(
      fireflyTxns.map((tx: any) =>
        postWrapper(program.host, tx).then(() => bar.increment())
      ) as any
    );
  }
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e);
    process.exit(-1);
  });
