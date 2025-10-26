'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MainNav } from '@/components/app/main-nav';
import { UserNav } from '@/components/app/user-nav';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FilePlus, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar className="no-print">
          <SidebarHeader>
            <div className="flex items-center justify-between p-2">
              <h1 className="font-headline text-2xl font-bold text-primary">BillGenius</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <div className="p-2">
              <Button asChild className="w-full">
                <Link href="/dashboard/invoices/new">
                  <FilePlus className="mr-2 h-4 w-4" />
                  New Invoice
                </Link>
              </Button>
            </div>
            <MainNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 no-print">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <UserNav />
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
