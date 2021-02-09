import { createJsons } from "../utils";
import * as fs from "fs";

test("max", async () => {
  const scraperResult = JSON.parse(
    fs.readFileSync("tests/max.json").toString()
  );
  await createJsons("/tmp/scraper/", scraperResult, "max");
});
