import { createJsons } from "../utils";
import * as fs from "fs";

test("max", async () => {
  const scraperResult = JSON.parse(
    fs.readFileSync("tests/max.json").toString()
  );
  const txns = createJsons(scraperResult, "max");
  txns.forEach((tx) => console.log(JSON.stringify(tx)));
});
