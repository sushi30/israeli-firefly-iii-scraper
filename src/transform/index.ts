import * as fs from "fs";
import * as path from "path";
import transform, { dumpTransactions } from "./utils";

export type CommandArguments = {
  directory: string;
  installments: boolean;
  output: string;
};

export default async function main({
  directory,
  output,
  config,
  installments = false,
}: {
  directory: string;
  output: string;
  config: Map<string, any>;
  installments: boolean;
}) {
  const txns = fs
    .readdirSync(directory)
    .map((f) => JSON.parse(fs.readFileSync(path.join(directory, f)).toString()))
    .map((f) => transform(f, config, installments))
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
