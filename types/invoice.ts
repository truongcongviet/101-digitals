export type InvoiceRecord = {
  id?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceReference?: string;
  reference?: string;
  customerName?: string;
  customer?: unknown;
  status?: unknown;
  invoiceStatus?: unknown;
  paymentStatus?: unknown;
  state?: unknown;
  workflowStatus?: unknown;
  currency?: unknown;
  totalAmount?: unknown;
  amount?: unknown;
  createdDate?: unknown;
  createdAt?: unknown;
  invoiceDate?: unknown;
  dueDate?: unknown;
};

export type InvoiceListResult = {
  invoices: InvoiceRecord[];
  total: number;
  pageNum: number;
  pageSize: number;
};
