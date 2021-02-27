declare global {
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
}
