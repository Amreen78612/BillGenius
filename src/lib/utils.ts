import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Invoice } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateInvoiceTotal(invoice: Invoice): number {
  if (!invoice || !invoice.lineItems) return 0;
  
  const subtotal = invoice.lineItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
    0
  );
  const discountAmount = subtotal * ((invoice.discount || 0) / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = subtotalAfterDiscount * ((invoice.tax || 0) / 100);
  return subtotalAfterDiscount + taxAmount;
}
