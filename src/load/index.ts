import * as fs from "fs";
import * as path from "path";
import { txExists } from "./utils";
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
  const fromFiles = fs
    .readdirSync(directory)
    .map((f) =>
      JSON.parse(fs.readFileSync(path.join(directory, f)).toString())
    );
  const txns = await awaitBatches(fromFiles.slice(0,30), async (tx) => ({
    tx,
    exists: await txExists(host, tx),
  })).then((res) => res.filter(({ exists }) => !exists));
  if (dryRun){
    txns.forEach(({tx}) => console.log(JSON.stringify(tx)));
  }
  console.log(`done`);
}
