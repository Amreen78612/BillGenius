export type Client = {
  id: string;
  name: string;
  email: string;
  billingAddress: string;
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 60' | 'Due on receipt';
};

export type LineItem = {
  description: string;
  quantity: number;
  price: number;
};

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export type Invoice = {
  id: string;
  clientId: string;
  client?: Client; // Client is optional as it will be denormalized
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  tax: number; // as a percentage
  discount: number; // as a percentage
  status: InvoiceStatus;
};

export type Service = {
  id: string;
  description: string;
  rate: number;
  unit: 'per_hour' | 'fixed';
};

export type CompanyProfile = {
  id: string;
  companyName: string;
  logoUrl?: string;
}
