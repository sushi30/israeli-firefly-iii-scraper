import * as fs from "fs";
import * as path from "path";
import { postWrapper, txExists } from "./utils";
import { chunk } from "lodash";

async function awaitBatches(
  iterable: Array<any>,
  func: (...args: any) => Promise<any>,
  batchSize: number = 10
) {
  const res = [];
  for (let batch of chunk(iterable, batchSize)) {
    res.push(...(await Promise.all(batch.map(func))));
  }
  return res;
}

export default async function main({ directory, host, dryRun }) {
  console.log("reading files");
  const fromFiles = fs
    .readdirSync(directory)
    .map((f) =>
      JSON.parse(fs.readFileSync(path.join(directory, f)).toString())
    );
  console.log("checking which transactions exist...");
  const txns = await awaitBatches(fromFiles, async (tx) => ({
    tx,
    exists: await txExists(host, tx),
  })).then((res) => res.filter(({ exists }) => !exists));
  if (dryRun) {
    console.log("Dry run. Sending transactions to output.");
    txns.forEach(({ tx }) => console.log(JSON.stringify(tx)));
  } else {
    console.log("sending to FireFly III...");
    await awaitBatches(txns, ({ tx }) =>
      postWrapper(`${host}/api/v1/transactions`, {
        error_if_duplicate_hash: true,
        apply_rules: true,
        transactions: [tx],
      })
    );
  }
  console.log(`done`);
}
