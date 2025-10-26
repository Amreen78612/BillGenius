'use server';
/**
 * @fileOverview This file defines a Genkit flow for clarifying invoice text using AI.
 *
 * - clarifyInvoiceText - A function that takes invoice item descriptions and suggests clearer, standardized language.
 * - ClarifyInvoiceTextInput - The input type for the clarifyInvoiceText function.
 * - ClarifyInvoiceTextOutput - The return type for the clarifyInvoiceText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClarifyInvoiceTextInputSchema = z.object({
  itemDescription: z
    .string()
    .describe('The original item description entered on the invoice.'),
});
export type ClarifyInvoiceTextInput = z.infer<typeof ClarifyInvoiceTextInputSchema>;

const ClarifyInvoiceTextOutputSchema = z.object({
  clarifiedDescription: z
    .string()
    .describe('The AI-suggested clearer and more standardized item description.'),
});
export type ClarifyInvoiceTextOutput = z.infer<typeof ClarifyInvoiceTextOutputSchema>;

export async function clarifyInvoiceText(input: ClarifyInvoiceTextInput): Promise<ClarifyInvoiceTextOutput> {
  return clarifyInvoiceTextFlow(input);
}

const clarifyInvoiceTextPrompt = ai.definePrompt({
  name: 'clarifyInvoiceTextPrompt',
  input: {schema: ClarifyInvoiceTextInputSchema},
  output: {schema: ClarifyInvoiceTextOutputSchema},
  prompt: `You are an AI assistant that helps clarify invoice item descriptions. 
Given an item description, suggest a clearer and more standardized alternative.

Original Description: {{{itemDescription}}}

Clarified Description:`,
});

const clarifyInvoiceTextFlow = ai.defineFlow(
  {
    name: 'clarifyInvoiceTextFlow',
    inputSchema: ClarifyInvoiceTextInputSchema,
    outputSchema: ClarifyInvoiceTextOutputSchema,
  },
  async input => {
    const {output} = await clarifyInvoiceTextPrompt(input);
    return output!;
  }
);
