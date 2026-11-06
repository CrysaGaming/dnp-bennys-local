export type InvoiceRowData = {
  id: string;
  number: number;
  amount: number;
  status: string;
  issuedAt: Date;
  order: { id: string; number: number; customer: { name: string } } | null;
};
