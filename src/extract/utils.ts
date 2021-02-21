import { v5 as uuidv5 } from "uuid";
import stringify from "json-stable-stringify";
import * as fs from "fs/promises";
import { TransactionsAccount } from "israeli-bank-scrapers/lib/transactions";
import { ScaperScrapingResult } from "israeli-bank-scrapers/lib/scrapers/base-scraper";
const MY_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

export function normalizeTransactions(
  scraperResults: ScaperScrapingResult,
  type: string
) {
  return (scraperResults.accounts
    .map((account: TransactionsAccount) =>
      account.txns.map((tx) => ({
        data: tx,
        metadata: {
          type,
          acountNumber: account.accountNumber,
        },
        id: uuidv5(stringify(tx), MY_NAMESPACE),
      }))
    ) as any)
    .flat();
}

export async function dumpTransactions(destination: string, txns: Array<any>) {
  return Promise.all(
    txns.map((tx) =>
      fs.writeFile(`${destination}/${tx.id}.json`, JSON.stringify(tx))
    )
  );
}
