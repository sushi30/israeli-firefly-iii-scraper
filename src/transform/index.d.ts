import { Transaction as ScraperTransaction } from "israeli-bank-scrapers/lib/transactions";

type CommandArguments = {
  directory: string;
  installments: boolean;
  output: string;
};

export default function main(params: CommandArguments): Promise<any>;

type Transaction = {
  data: ScraperTransaction;
  metadata: { type: string; acountNumber: string };
  id: string;
};
