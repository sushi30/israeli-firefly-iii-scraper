import { Transaction as ScraperTransaction } from "israeli-bank-scrapers/lib/transactions";

type CommandArguments = {
  directory: string;
  host: boolean;
};

export default function main(params: CommandArguments): Promise<any>;

type FireflyTransaction = {
  external_id: string;
  date: string;
};

declare module utils {
  export function txExists(
    url: string,
    tx: FireflyTransaction
  ): Promise<boolean>;
}
