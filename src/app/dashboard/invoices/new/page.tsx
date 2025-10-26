'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { services } from '@/lib/data';
import type { Service, Client } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Loader2,
  PlusCircle,
  Save,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react';
import { clarifyItemDescription } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  billingAddress: z.string().min(1, 'Billing address is required.'),
  paymentTerms: z.enum(['Net 15', 'Net 30', 'Net 60', 'Due on receipt']),
});
type ClientFormValues = z.infer<typeof clientSchema>;


const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required.'),
  issueDate: z.date(),
  dueDate: z.date(),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Overdue']),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1, 'Description is required.'),
        quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
        price: z.coerce.number().min(0, 'Price cannot be negative.'),
      })
    )
    .min(1, 'At least one line item is required.'),
  tax: z.coerce.number().min(0).max(100),
  discount: z.coerce.number().min(0).max(100),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

function AddClientForm({ onClientAdded }: { onClientAdded: (id: string) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      billingAddress: '',
      paymentTerms: 'Net 30',
    },
  });

  async function onSubmit(data: ClientFormValues) {
    if (!firestore) return;

    const clientsCollection = collection(firestore, 'clients');
    try {
      const docRef = await addDocumentNonBlocking(clientsCollection, data);
      toast({
        title: 'Client Added',
        description: `${data.name} has been added to your client list.`,
      });
      if(docRef?.id) {
        onClientAdded(docRef.id);
      }
      form.reset();
      setIsDialogOpen(false);
    } catch(error: any) {
       toast({
        variant: 'destructive',
        title: 'Error adding client',
        description: error.message || 'Failed to add client. Please try again.',
      });
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Add new client</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
         <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="font-headline">Add New Client</DialogTitle>
              <DialogDescription>
                Enter the details for the new client.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Acme Inc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="sales@acme.inc"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123 Main St, Anytown USA"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Due on receipt">
                          Due on receipt
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                 {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Client</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function NewInvoicePage() {
  const { toast } = useToast();
  const [isClarifying, setIsClarifying] = useState<number | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();

  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'clients') : null),
    [firestore]
  );
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);


  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: '',
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      lineItems: [{ description: '', quantity: 1, price: 0 }],
      tax: 8,
      discount: 0,
      status: 'Draft',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const watchLineItems = form.watch('lineItems');
  const watchTax = form.watch('tax');
  const watchDiscount = form.watch('discount');

  const subtotal = watchLineItems.reduce(
    (acc, item) => acc + (item.quantity || 0) * (item.price || 0),
    0
  );
  const discountAmount = subtotal * ((watchDiscount || 0) / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = subtotalAfterDiscount * ((watchTax || 0) / 100);
  const total = subtotalAfterDiscount + taxAmount;

  async function onSubmit(data: InvoiceFormValues) {
    if (!firestore) return;

    const selectedClient = clients?.find(c => c.id === data.clientId);
    if (!selectedClient) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Client not found. Please select a valid client.',
        });
        return;
    }

    const invoiceData = {
      ...data,
      issueDate: format(data.issueDate, 'yyyy-MM-dd'),
      dueDate: format(data.dueDate, 'yyyy-MM-dd'),
      client: selectedClient,
      totalAmount: total,
    };

    const invoicesCollection = collection(firestore, 'invoices');
    addDocumentNonBlocking(invoicesCollection, invoiceData);

    toast({
      title: 'Invoice Created',
      description: 'The new invoice has been saved successfully.',
    });
    router.push('/dashboard/invoices');
  }

  const handleClarify = async (index: number) => {
    setIsClarifying(index);
    const description = form.getValues(`lineItems.${index}.description`);
    if (!description) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a description to clarify.',
      });
      setIsClarifying(null);
      return;
    }
    const result = await clarifyItemDescription(description);
    if (result.success && result.clarifiedDescription) {
      form.setValue(`lineItems.${index}.description`, result.clarifiedDescription);
      toast({
        title: 'Description Clarified!',
        description: 'AI has suggested a clearer description.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Clarification Failed',
        description: result.error,
      });
    }
    setIsClarifying(null);
  };
  
  const addServiceAsLineItem = (service: Service) => {
    append({
      description: service.description,
      quantity: 1,
      price: service.rate,
    });
    setIsServiceModalOpen(false);
  };

  const handleClientAdded = (clientId: string) => {
    form.setValue('clientId', clientId);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold">New Invoice</h1>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Invoice
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Invoice Details</CardTitle>
            <CardDescription>
              Select client and set invoice dates.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-4">
            <div className='md:col-span-2 grid grid-cols-1 gap-2'>
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <div className='flex items-center gap-2'>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingClients}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <AddClientForm onClientAdded={handleClientAdded} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Issue Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-4 md:grid-cols-12 md:items-start"
              >
                <div className="md:col-span-6">
                  <FormLabel>Description</FormLabel>
                   <div className="relative">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.description`}
                      render={({ field }) => (
                        <Textarea {...field} placeholder="Item description" className="pr-12"/>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary hover:text-primary"
                      onClick={() => handleClarify(index)}
                      disabled={isClarifying !== null}
                      aria-label="Clarify with AI"
                    >
                      {isClarifying === index ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.price`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 flex items-end justify-between">
                  <div className='hidden md:block'>
                  <FormLabel>Total</FormLabel>
                  <p className="font-medium h-10 flex items-center">{formatCurrency(watchLineItems[index].price * watchLineItems[index].quantity)}</p>
                  </div>
                   <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => remove(index)}
                    className="self-end"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ description: '', quantity: 1, price: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
              <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Wrench className="mr-2 h-4 w-4" /> Add Machine/Service
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className='font-headline'>Select a Service</DialogTitle>
                    <DialogDescription>
                      Click on a service to add it to the invoice.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 pt-4">
                    {services.map((service) => (
                       <button
                        key={service.id}
                        onClick={() => addServiceAsLineItem(service)}
                        className="flex items-center justify-between rounded-md border p-4 text-left transition-colors hover:bg-accent"
                      >
                        <div>
                          <p className="font-semibold">{service.description}</p>
                          <p className="text-sm text-muted-foreground">{service.unit}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(service.rate)}</p>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <div className="w-full max-w-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

    