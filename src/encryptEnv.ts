import * as crypto from "crypto";
import { program } from "commander";
import * as fs from "fs";
import { Readable } from "stream";

const algorithm = "aes-192-cbc";

program
  .command("encrypt <file> <secret> [outfile]")
  .action((file, secret, outfile) => {
    const plaintext = fs.readFileSync(file).toString();
    const key = crypto.scryptSync("password", "a", 24);
    const iv = crypto.randomBytes(16); // Initialization vector.
    fs.writeFileSync(outfile, iv);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(file);
    const output = fs.createWriteStream(outfile, {
      flags: "a",
      encoding: "ascii",
    });
    input.pipe(cipher).pipe(output);
  });

function readFile(file) {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(file, {
      start: 0,
      end: 15,
    });
    let data = "";
    stream
      .on("data", function (chunk) {
        data += chunk.toString("binary");
      })
      .on("end", function () {
        return resolve(Buffer.from(data, "binary"));
      });
  });
}

program
  .command("decrypt <encrypted> <secret> [outfile]")
  .action(async (encrypted, secret, outfile) => {
    const key = crypto.scryptSync("password", "a", 24);
    const iv = await readFile(encrypted);
    const decipher = crypto.createDecipheriv(algorithm, key, iv as string);
    const input = fs.createReadStream(encrypted, { start: 16 });
    const output = fs.createWriteStream(outfile);
    input.pipe(decipher).pipe(output);
  });

program.parse(process.argv);
