'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, Wallet, PieChart, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Accueil', href: '/dashboard', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Comptes', href: '/accounts', icon: Wallet },
  { name: 'Budgets', href: '/budgets', icon: PieChart },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Réglages', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full md:w-64 md:h-screen md:left-0 md:top-0 border-t md:border-t-0 md:border-r border-border bg-background pb-safe z-50">
      <div className="flex items-center justify-around md:flex-col md:justify-start md:p-6 h-16 md:h-full gap-2 md:gap-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col md:flex-row items-center md:justify-start justify-center w-full h-full md:h-12 space-y-1 md:space-y-0 md:space-x-3 text-muted-foreground transition-colors md:px-4 md:rounded-lg',
                isActive && 'text-primary md:bg-primary/10'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] md:text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
