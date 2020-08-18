import * as crypto from "crypto";
import stringify from "json-stable-stringify";
import { Transaction } from "israeli-bank-scrapers/lib/transactions";

interface FireflyTransaction {
  type: "withdrawal" | "deposit";
  date: string;
  amount: number;
  description: string;
  currency_code: string;
  foreign_amount?: number;
  destination_name: string;
  source_name: string;
  notes?: string;
  external_id?: string;
  foreign_currency_code?: string;
}

function convertLeumi(
  tx: Transaction,
  destinationAccount: string,
  sourceName?: string
): FireflyTransaction {
  const hash = crypto.createHash("sha256");
  hash.update(stringify(tx));
  return {
    currency_code: "ILS",
    amount: Math.abs(tx.chargedAmount),
    foreign_currency_code: tx.originalCurrency,
    date: new Date(tx.date).toISOString().split("T")[0],
    description: tx.description,
    destination_name: destinationAccount,
    source_name: sourceName,
    type: tx.chargedAmount > 0 ? "withdrawal" : "deposit",
    external_id: hash.copy().digest("hex"),
    notes: JSON.stringify(tx),
  };
}

function convertMax(
  tx: Transaction & { accountNumber: string },
  destinatino: string,
  source?: string
): FireflyTransaction {
  const hash = crypto.createHash("sha256");
  hash.update(stringify(tx));
  return {
    amount: Math.abs(tx.chargedAmount),
    currency_code: "ILS",
    foreign_currency_code: tx.originalCurrency,
    date: new Date(tx.date).toISOString().split("T")[0],
    description: tx.description,
    destination_name: destinatino?.replace("$ACCOUNT_NUMBER", tx.accountNumber),
    source_name: source,
    type: tx.chargedAmount < 0 ? "withdrawal" : "deposit",
    external_id: hash.copy().digest("hex"),
    notes: JSON.stringify(tx),
    foreign_amount: tx.originalAmount,
  };
}

const converters = { leumi: convertLeumi, max: convertMax };

export function convert(
  type: "leumi" | "max",
  txns: Array<Transaction>,
  destination: string | null,
  source: string | null
) {
  return txns.map((tx) => converters[type](tx as any, destination, source));
}
