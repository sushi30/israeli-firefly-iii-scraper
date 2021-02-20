import * as fs from "fs";
import * as path from "path";
import transform from "./transform";

export default async function main({ directory, host }) {
  const txns = fs.readdirSync(directory).map((f) => JSON.parse(fs.readFileSync(path.join(directory, f)).toString())).map(transform)
  console.log(txns)
  console.log(`done`);
}
