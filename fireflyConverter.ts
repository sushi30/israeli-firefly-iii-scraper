import * as crypto from "crypto";
import stringify from "json-stable-stringify";
import { Transaction } from "israeli-bank-scrapers/lib/transactions";
import { ScaperScrapingResult } from "israeli-bank-scrapers/lib/scrapers/base-scraper";

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

function convertLeumiTx(
  tx: Transaction,
  bankAccount,
  ..._
): FireflyTransaction {
  const hash = crypto.createHash("sha256");
  hash.update(stringify(tx));
  return {
    amount: Math.abs(tx.chargedAmount),
    currency_code: "ILS",
    foreign_currency_code: tx.originalCurrency,
    date: new Date(tx.date).toISOString().split("T")[0],
    description: tx.description,
    destination_name: tx.chargedAmount < 0 ? null : bankAccount,
    source_name: tx.chargedAmount < 0 ? bankAccount : null,
    type: tx.chargedAmount < 0 ? "withdrawal" : "deposit",
    external_id: hash.copy().digest("hex"),
    notes: JSON.stringify(tx),
  };
}

function convertMaxTx(
  tx: Transaction & { accountNumber: string },
  bankAccount: string,
  creditCard: string
): FireflyTransaction {
  const hash = crypto.createHash("sha256");
  hash.update(stringify(tx));
  const parsedCreditCard = creditCard?.replace(
    "$ACCOUNT_NUMBER",
    tx.accountNumber
  );
  return {
    amount: Math.abs(tx.chargedAmount),
    currency_code: "ILS",
    date: new Date(tx.date).toISOString().split("T")[0],
    description: tx.description,
    destination_name:
      tx.chargedAmount < 0
        ? tx.type == "installments"
          ? "Credit Card Installments"
          : parsedCreditCard
        : bankAccount,
    source_name: tx.chargedAmount < 0 ? bankAccount : parsedCreditCard,
    type: tx.chargedAmount < 0 ? "withdrawal" : "deposit",
    external_id: hash.copy().digest("hex"),
    notes: JSON.stringify(tx),
    ...(tx.originalCurrency != "ILS"
      ? {
          foreign_amount: tx.originalAmount,
          foreign_currency_code: tx.originalCurrency,
        }
      : {}),
  };
}

function convertMaxInstallments(
  tx: Transaction & { accountNumber: string },
  bankAccount: string,
  creditCard: string
): FireflyTransaction {
  const hash = crypto.createHash("sha256");
  hash.update(stringify(tx));
  const parsedCreditCard = creditCard?.replace(
    "$ACCOUNT_NUMBER",
    tx.accountNumber
  );
  return {
    amount: -tx.originalAmount,
    currency_code: "ILS",
    date: new Date(tx.date).toISOString().split("T")[0],
    description: tx.description,
    destination_name: parsedCreditCard,
    source_name: "Credit Card Installments",
    type: "withdrawal",
    external_id: hash.copy().digest("hex"),
    notes: JSON.stringify(tx),
  };
}

const txConverters = { leumi: convertLeumiTx, max: convertMaxTx };
const installmentConverters = { max: convertMaxInstallments };

export function convert(
  type: "leumi" | "max",
  txns: ScaperScrapingResult,
  bankAccount: string | null,
  creditCard: string | null
) {
  const flatTxns = txns.accounts
    .map((account: any) =>
      account.txns.map((tx: any) => ({
        accountNumber: account.accountNumber,
        ...tx,
      }))
    )
    .flat();
  flatTxns.forEach((tx) => {
    if (tx.status == "pending") {
      throw Error(`Encountered pending transaction: ${JSON.stringify(tx)}`);
    }
  });
  return [
    ...flatTxns.map((tx) =>
      txConverters[type](tx as any, bankAccount, creditCard)
    ),
    ...flatTxns
      .filter((t) => t.type == "installments" && t.installments.number == 1)
      .map((tx) =>
        installmentConverters[type](tx as any, bankAccount, creditCard)
      ),
  ];
}
