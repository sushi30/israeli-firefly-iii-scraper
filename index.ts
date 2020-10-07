import { createScraper } from "israeli-bank-scrapers";
import { program } from "commander";
import * as cliProgress from "cli-progress";
import { convert } from "./fireflyConverter";
import { getWrapper, postWrapper } from "./fireflyApiUtils";

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
  const scraperTxns = await scrape(options);
  console.log("converting to firefly format");
  const existingTxns: Array<any> = await getWrapper(
    `${program.host}/api/v1/transactions`,
    {
      start: program.start,
      end: program.end,
    }
  ).then(({ data }): any =>
    data.data
      .map(({ attributes: { transactions } }) =>
        transactions.map(({ external_id }) => external_id)
      )
      .flat()
  );
  const fireflyTxns = convert(
    program.type,
    scraperTxns,
    program.bankAccount,
    program.creditCard
  )
    .filter(
      (t) =>
        new Date(program.start) <= new Date(t.date) &&
        new Date(t.date) <= new Date(program.end)
    )
    .filter(
      (t) =>
        program.type != "leumi" ||
        !t.description.includes("לאומי ויזה") ||
        !t.description.includes("מקס איט פיננ-י")
    )
    .filter(({ external_id }) => !existingTxns.includes(external_id));
  fireflyTxns.forEach((tx) => {
    if (JSON.parse(tx.notes).status == "pending") {
      throw Error(`Encountered pending transaction: ${JSON.stringify(tx)}`);
    }
  });
  if (program.dry) {
    console.log(fireflyTxns);
  } else {
    console.log("sending to firefly");
    const bar = new cliProgress.SingleBar(
      { synchronousUpdate: true },
      cliProgress.Presets.shades_classic
    );
    bar.start(fireflyTxns.length, 0);
    await Promise.all(
      fireflyTxns.map((tx: any) =>
        postWrapper(`${program.host}/api/v1/transactions`, {
          transactions: [tx],
          error_if_duplicate_hash: true,
        }).then(() => bar.increment())
      ) as any
    );
    bar.stop();
  }
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e);
    process.exit(-1);
  });
