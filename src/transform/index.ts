import * as fs from "fs";
import * as path from "path";
import transform from "./transform";

export default async function main({
  directory,
  output,
  installments = false,
}) {
  const txns = fs
    .readdirSync(directory)
    .map((f) => JSON.parse(fs.readFileSync(path.join(directory, f)).toString()))
    .map((f) => transform(f, installments))
    .filter((tx) => !!tx);
  if (output) {
    console.log(`dumping to ${output}`);
    fs.mkdirSync(output, { recursive: true });
    await dumpTransactions(output, txns);
  } else {
    txns.forEach((tx) => console.log(JSON.stringify(tx)));
  }
  console.log(`done`);
}




export async function dumpTransactions(destination: string, txns: Array<any>) {
  return Promise.all(
    txns.map((tx) =>
      fs.writeFileSync(`${destination}/${tx.external_id}.json`, JSON.stringify(tx))
    )
  );
}
