import { Transaction } from "./index.d";

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

function convertLeumiTx(tx: Transaction): FireflyTransaction {
  const accountName = `${tx.metadata.type} - ${tx.metadata.acountNumber}`;
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

// function convertMaxTx(
//   tx: Transaction & { accountNumber: string },
//   bankAccount: string,
//   creditCard: string
// ): FireflyTransaction {
//   const hash = crypto.createHash("sha256");
//   hash.update(stringify(tx));
//   const parsedCreditCard = creditCard?.replace(
//     "$ACCOUNT_NUMBER",
//     tx.accountNumber
//   );
//   return {
//     amount: Math.abs(tx.chargedAmount),
//     currency_code: "ILS",
//     date: new Date(tx.date).toISOString().split("T")[0],
//     description: tx.description,
//     destination_name:
//       tx.chargedAmount < 0
//         ? tx.type == "installments"
//           ? "Credit Card Installments"
//           : parsedCreditCard
//         : bankAccount,
//     source_name: tx.chargedAmount < 0 ? bankAccount : parsedCreditCard,
//     type: tx.chargedAmount < 0 ? "withdrawal" : "deposit",
//     external_id: hash.copy().digest("hex"),
//     notes: JSON.stringify(tx),
//     ...(tx.originalCurrency != "ILS"
//       ? {
//           foreign_amount: tx.originalAmount,
//           foreign_currency_code: tx.originalCurrency,
//         }
//       : {}),
//   };
// }

// function convertMaxInstallmentsToLiabilities(
//   tx: Transaction & { accountNumber: string },
//   bankAccount: string,
//   creditCard: string
// ): FireflyTransaction {
//   const hash = crypto.createHash("sha256");
//   hash.update(stringify(tx));
//   const parsedCreditCard = creditCard?.replace(
//     "$ACCOUNT_NUMBER",
//     tx.accountNumber
//   );
//   return {
//     amount: -tx.originalAmount,
//     currency_code: "ILS",
//     date: new Date(tx.date).toISOString().split("T")[0],
//     description: tx.description,
//     destination_name: parsedCreditCard,
//     source_name: "Credit Card Installments",
//     type: "withdrawal",
//     external_id: hash.copy().digest("hex"),
//     notes: JSON.stringify(tx),
//   };
// }

// const txConverters = { leumi: convertLeumiTx, max: convertMaxTx };
// const installmentConverters = { max: convertMaxInstallmentsToLiabilities };

const transformers: {
  [key: string]: (tx: Transaction) => FireflyTransaction;
} = {
  leumi: convertLeumiTx,
};

export default function transform(tx: Transaction) {
  return transformers[tx.metadata.type](tx);
}
