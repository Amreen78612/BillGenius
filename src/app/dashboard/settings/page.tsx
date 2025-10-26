'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { CompanyProfile } from '@/lib/types';
import { useEffect } from 'react';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  logoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'companyProfiles', user.uid) : null),
    [firestore, user]
  );
  const { data: companyProfile, isLoading } = useDoc<CompanyProfile>(settingsRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: '',
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (companyProfile) {
      form.reset({
        companyName: companyProfile.companyName || '',
        logoUrl: companyProfile.logoUrl || '',
      });
    }
  }, [companyProfile, form]);

  async function onSubmit(data: SettingsFormValues) {
    if (!settingsRef) return;
    
    setDocumentNonBlocking(settingsRef, data, { merge: true });

    toast({
      title: 'Settings Saved',
      description: 'Your company profile has been updated.',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Company Profile</CardTitle>
          <CardDescription>
            Update your company's information and logo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your Company LLC" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://example.com/logo.png"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                   {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
