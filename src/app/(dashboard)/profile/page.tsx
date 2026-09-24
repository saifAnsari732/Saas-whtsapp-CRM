'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionDetails } from '@/components/profile/subscription-details';
import { PaymentHistory } from '@/components/profile/payment-history';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCog, Shield, User as UserIcon, Settings, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { profile, isSuperAdmin } = useAuth();
  const { status, plan, daysRemaining, trialEndsAt, subscriptionExpiresAt, currentPlanLimits } = useSubscription();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock usage data for now, ideally fetched from an API
  const usage = {
    messagesSent: 450,
    messagesLimit: 1000,
    contactsCount: 120,
    contactsLimit: 500,
  };

  useEffect(() => {
    async function fetchTransactions() {
      if (!profile?.account_id) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('account_id', profile.account_id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        toast.error('Failed to load transaction history');
      } finally {
        setIsLoading(false);
      }
    }

    if (profile) {
      fetchTransactions();
    }
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and billing</p>
        </div>
        <Link href="/settings?tab=profile">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      {/* User Info Card */}
      <Card>
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage 
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`} 
              />
              <AvatarFallback className="text-2xl">{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Link 
              href="/settings?tab=profile"
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit3 className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="text-center sm:text-left flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <h2 className="text-2xl font-bold">{profile.full_name || 'Anonymous User'}</h2>
              <Badge variant="secondary" className="flex items-center gap-1.5 capitalize font-semibold">
                {isSuperAdmin ? <Shield className="h-3.5 w-3.5 text-purple-600" /> : <UserIcon className="h-3.5 w-3.5 text-emerald-600" />}
                {isSuperAdmin ? 'Admin' : 'User'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details */}
      <SubscriptionDetails
        status={status}
        plan={plan}
        daysRemaining={daysRemaining}
        trialEndsAt={trialEndsAt}
        expiresAt={subscriptionExpiresAt}
        limits={currentPlanLimits || {
          messages: 1000,
          contacts: 500,
          users: 1,
        }}
      />

      {/* Usage Statistics */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <h3 className="font-semibold">Current Usage</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Messages</span>
              <span className="font-medium">{usage.messagesSent} / {usage.messagesLimit}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(usage.messagesSent / usage.messagesLimit) * 100}%` }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contacts</span>
              <span className="font-medium">{usage.contactsCount} / {usage.contactsLimit}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(usage.contactsCount / usage.contactsLimit) * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {!isLoading && <PaymentHistory transactions={transactions} />}
    </div>
  );
}
