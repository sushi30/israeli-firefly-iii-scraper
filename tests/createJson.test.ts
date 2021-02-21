import { normalizeTransactions } from "../src/extract/utils";
import * as fs from "fs";

test("max", async () => {
  const scraperResult = JSON.parse(
    fs.readFileSync("tests/max.json").toString()
  );
  const txns = normalizeTransactions(scraperResult, "max");
  txns.forEach((tx) => console.log(JSON.stringify(tx)));
});
