'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Invoice, InvoiceStatus, CompanyProfile } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import React from 'react';
import Image from 'next/image';


export default function InvoiceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const firestore = useFirestore();
  const { user } = useUser();

  const invoiceRef = useMemoFirebase(
    () => (firestore && params.id ? doc(firestore, 'invoices', params.id) : null),
    [firestore, params.id]
  );
  const { data: invoice, isLoading: isInvoiceLoading } = useDoc<Invoice>(invoiceRef);

  const settingsRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'companyProfiles', user.uid) : null),
    [firestore, user]
  );
  const { data: companyProfile, isLoading: isSettingsLoading } = useDoc<CompanyProfile>(settingsRef);
  
  const isLoading = isInvoiceLoading || isSettingsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    notFound();
  }

  const subtotal = invoice.lineItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const discountAmount = subtotal * (invoice.discount / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = subtotalAfterDiscount * (invoice.tax / 100);
  const total = subtotalAfterDiscount + taxAmount;

  const statusVariant: Record<
    InvoiceStatus,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    Paid: 'default',
    Sent: 'secondary',
    Overdue: 'destructive',
    Draft: 'outline',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" asChild>
           <Link href="/dashboard/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
      </div>

      <Card className="printable-area">
        <CardHeader className="grid grid-cols-2">
          <div>
            {companyProfile?.logoUrl ? (
              <Image src={companyProfile.logoUrl} alt={companyProfile.companyName} width={120} height={120} className='mb-2 h-auto w-auto max-h-20' />
            ) : (
               <h1 className="font-headline text-3xl font-bold text-primary">{companyProfile?.companyName || 'BillGenius'}</h1>
            )}
            <p className="text-muted-foreground">Invoice</p>
          </div>
          <div className="text-right">
            <CardTitle className='font-headline'>Invoice #{invoice.id.substring(0, 7)}</CardTitle>
            <CardDescription>
              Issued on: {invoice.issueDate}
            </CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-6 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Billed To</h3>
              <address className="not-italic text-muted-foreground">
                <strong>{invoice.client?.name}</strong>
                <br />
                {invoice.client?.billingAddress.split(',').map((line, i) => (
                  <React.Fragment key={i}>
                    {line.trim()}
                    <br />
                  </React.Fragment>
                ))}
                 {invoice.client?.email}
              </address>
            </div>
            <div className="text-right">
              <h3 className="font-semibold">Payment Details</h3>
              <p className="text-muted-foreground">
                Due Date: {invoice.dueDate}
                <br />
                Payment Terms: {invoice.client?.paymentTerms}
              </p>
              <Badge variant={statusVariant[invoice.status]} className="mt-2 text-lg">
                {invoice.status}
              </Badge>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <Separator />
        <CardFooter className="justify-end pt-6">
          <div className="w-full max-w-sm space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount ({invoice.discount}%)</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({invoice.tax}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
