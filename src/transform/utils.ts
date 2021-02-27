import stringify from "json-stable-stringify";
import { v5 as uuidv5 } from "uuid";
import * as fs from "fs";
import { Transaction as ScraperTransaction } from "israeli-bank-scrapers/lib/transactions";

const INSTALLMENTS_NAMESPACE = "1000bd0f-9f58-487d-b540-9f8d5b6a3423";

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

export interface Transaction {
  data: ScraperTransaction;
  metadata: { type: string; acountNumber: string };
  id: string;
}

const accountNames = {
  "leumi - ‎903-35822_71‎": "Leumi",
};

function convertLeumiTx(tx: Transaction): FireflyTransaction {
  const accountName =
    accountNames[`${tx.metadata.type} - ${tx.metadata.acountNumber}`];
  return {
    amount: Math.abs(tx.data.chargedAmount),
    currency_code: "ILS",
    date: new Date(tx.data.date).toISOString().split("T")[0],
    description: tx.data.description,
    destination_name: tx.data.chargedAmount < 0 ? null : accountName,
    source_name: tx.data.chargedAmount < 0 ? accountName : null,
    type: tx.data.chargedAmount < 0 ? "withdrawal" : "deposit",
    external_id: tx.id,
    notes: JSON.stringify(tx),
  };
}

const sourceAccounts = {
  "max - 3547": "Leumi",
  "max - 4941": "Leumi",
  "max - 6092": "Leumi",
};

function convertMaxTx(tx: Transaction): FireflyTransaction {
  const accountName = `${tx.metadata.type} - ${tx.metadata.acountNumber}`;
  const sourceAccount = sourceAccounts[accountName];
  return {
    amount: Math.abs(tx.data.chargedAmount),
    currency_code: "ILS",
    date: new Date(tx.data.date).toISOString().split("T")[0],
    description: tx.data.description,
    destination_name:
      tx.data.chargedAmount < 0
        ? tx.data.type == "installments"
          ? "Credit Card Installments"
          : accountName
        : sourceAccount,
    source_name: tx.data.chargedAmount < 0 ? sourceAccount : accountName,
    type: tx.data.chargedAmount < 0 ? "withdrawal" : "deposit",
    external_id: tx.id,
    notes: JSON.stringify(tx),
    ...(tx.data.originalCurrency != "ILS"
      ? {
          foreign_amount: tx.data.originalAmount,
          foreign_currency_code: tx.data.originalCurrency,
        }
      : {}),
  };
}

function convertCredtCardInstallment(tx: Transaction): FireflyTransaction {
  if (tx.data.installments?.number == 1) {
    const accountName = `${tx.metadata.type} - ${tx.metadata.acountNumber}`;
    return {
      amount: -tx.data.originalAmount,
      currency_code: "ILS",
      date: new Date(tx.data.date).toISOString().split("T")[0],
      description: tx.data.description,
      destination_name: accountName,
      source_name: "Credit Card Installments",
      type: "withdrawal",
      external_id: uuidv5(stringify(tx.data), INSTALLMENTS_NAMESPACE),
      notes: JSON.stringify(tx),
    };
  } else {
    return null;
  }
}

const transformers: {
  [key: string]: (tx: Transaction) => FireflyTransaction;
} = {
  leumi: convertLeumiTx,
  max: convertMaxTx,
  installment: convertCredtCardInstallment,
};

export default function transform(
  tx: Transaction,
  installments: boolean = false
) {
  if (!transformers[tx.metadata.type]) {
    throw Error(`unrecognized type: ${tx.metadata.type}`);
  } else if (tx.data.status != "completed") {
    return null;
  } else if (installments) {
    return transformers.installment(tx);
  } else {
    return transformers[tx.metadata.type](tx);
  }
}

export async function dumpTransactions(destination: string, txns: Array<any>) {
  return Promise.all(
    txns.map((tx) =>
      fs.writeFileSync(
        `${destination}/${tx.external_id}.json`,
        JSON.stringify(tx)
      )
    )
  );
}
