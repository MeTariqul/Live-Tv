'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Radio, Calendar, Film, Megaphone, Settings, LogOut } from 'lucide-react';
import { ADMIN_NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<any>> = { LayoutDashboard, Radio, Calendar, Film, Megaphone, Settings };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden lg:flex w-56 flex-col border-r bg-muted/30 p-4">
        <h2 className="mb-4 px-2 text-sm font-semibold text-muted-foreground">ADMIN</h2>
        <nav className="flex-1 space-y-1">
          {ADMIN_NAV_LINKS.map((link) => {
            const Icon = iconMap[link.icon] || LayoutDashboard;
            return <Link key={link.href} href={link.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', pathname === link.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')}><Icon className="h-4 w-4" />{link.label}</Link>;
          })}
        </nav>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 w-full mt-auto"><LogOut className="h-4 w-4" />Sign Out</button>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
