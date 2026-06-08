'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Bell, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

export function Header({ title, showBack }: HeaderProps) {
  const isOnline = useOnlineStatus();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-background border-b border-border">
      <div className="flex items-center gap-2">
        {showBack && (
          <button 
            onClick={() => router.back()} 
            className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {!isOnline && (
          <span className="flex items-center text-xs text-destructive font-medium gap-1 bg-destructive/10 px-2 py-0.5 rounded-full">
            <WifiOff className="w-3 h-3" />
            Hors ligne
          </span>
        )}
      </div>
      <Link href="/alerts" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
      </Link>
    </header>
  );
}

