'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Inbox, Users, Radio, CreditCard, Settings, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const QUICK_ACTIONS = [
  { label: 'Go to Inbox', icon: Inbox, href: '/inbox', shortcut: 'G I' },
  { label: 'Go to Contacts', icon: Users, href: '/contacts', shortcut: 'G C' },
  { label: 'Go to Broadcasts', icon: Radio, href: '/broadcasts', shortcut: 'G B' },
  { label: 'Go to Billing', icon: CreditCard, href: '/billing', shortcut: 'G P' },
  { label: 'Go to Settings', icon: Settings, href: '/settings', shortcut: 'G S' },
  { label: 'Go to Profile', icon: User, href: '/profile', shortcut: 'G R' },
  { label: 'Go to Admin', icon: Shield, href: '/admin', shortcut: 'G A', ownerOnly: true },
];

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const router = useRouter();
  const { isSuperAdmin } = useAuth();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const actions = QUICK_ACTIONS.filter(a => !a.ownerOnly || isSuperAdmin);

  const filteredActions = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl bg-background/95 backdrop-blur-sm border-border">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search commands and resources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredActions.length > 0 ? (
            <div className="py-2">
              <div className="px-2 text-xs font-semibold text-muted-foreground mb-2">
                Quick Actions
              </div>
              {filteredActions.map((action, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted focus:bg-muted outline-none text-left"
                  onClick={() => handleSelect(action.href)}
                >
                  <div className="flex items-center">
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </div>
                  <div className="flex gap-1">
                    {action.shortcut.split(' ').map((key) => (
                      <kbd key={key} className="bg-muted-foreground/20 rounded px-1.5 py-0.5 text-[10px] font-mono">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
