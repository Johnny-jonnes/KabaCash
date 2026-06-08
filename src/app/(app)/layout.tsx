'use client';

import { BottomNav } from '@/components/layout/BottomNav';
import { PinLock } from '@/components/auth/PinLock';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PinLock>
      <div className="flex flex-col min-h-screen bg-background text-foreground pb-16 md:pb-0 md:pl-64">
        <div className="hidden md:block fixed top-0 left-0 w-64 h-full z-50">
          <BottomNav />
        </div>
        
        <main className="flex-1 w-full max-w-screen-xl mx-auto relative p-0 md:p-6">
          {children}
        </main>
        
        <div className="md:hidden fixed bottom-0 w-full z-50">
          <BottomNav />
        </div>
      </div>
    </PinLock>
  );
}
