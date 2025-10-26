
'use server';

import { clarifyInvoiceText } from '@/ai/flows/clarify-invoice-text';

export async function clarifyItemDescription(itemDescription: string) {
  try {
    const result = await clarifyInvoiceText({ itemDescription });
    return { success: true, clarifiedDescription: result.clarifiedDescription };
  } catch (error) {
    console.error('AI clarification failed:', error);
    return { success: false, error: 'Failed to get clarification.' };
  }
}
