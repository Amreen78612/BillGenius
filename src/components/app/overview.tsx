'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Invoice } from '@/lib/types';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';


const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--primary))",
  },
}

export function Overview() {
  const firestore = useFirestore();
  const invoicesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'invoices') : null),
    [firestore]
  );
  const { data: invoices, isLoading } = useCollection<Invoice>(invoicesQuery);

  const data = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(0, i).toLocaleString('default', { month: 'short' }),
      total: 0,
    }));

    if (invoices) {
      invoices.forEach((invoice) => {
        if (invoice.status === 'Paid') {
          const month = new Date(invoice.issueDate).getMonth();
          const total = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
           const discountAmount = total * ((invoice.discount || 0) / 100);
          const subtotalAfterDiscount = total - discountAmount;
          const taxAmount = subtotalAfterDiscount * ((invoice.tax || 0) / 100);
          monthlyData[month].total += subtotalAfterDiscount + taxAmount;
        }
      });
    }

    return monthlyData;
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(value as number)}
          />
          <Tooltip 
             cursor={{ fill: 'hsl(var(--muted))' }}
             content={<ChartTooltipContent 
                formatter={(value) => formatCurrency(value as number)}
              />}
          />
          <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
