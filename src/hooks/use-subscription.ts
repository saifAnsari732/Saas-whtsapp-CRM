"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

export interface SubscriptionState {
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'loading';
  plan: string | null;
  trialEndsAt: string | null;
  subscriptionExpiresAt: string | null;
  daysRemaining: number;
  isActive: boolean;
  isOwner: boolean;
  loading: boolean;
  trialUsage: {
    messagesSent: number;
    contactsCreated: number;
    broadcastsSent: number;
    templatesUsed: number;
  } | null;
  blockedFeatures: string[];
  currentPlanLimits: { messages: number; contacts: number; users: number } | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  
  const [state, setState] = useState<Omit<SubscriptionState, 'refresh'>>({
    status: 'loading',
    plan: null,
    trialEndsAt: null,
    subscriptionExpiresAt: null,
    daysRemaining: 0,
    isActive: true, // Default to true to prevent flickering before load
    isOwner: false,
    loading: true,
    trialUsage: null,
    blockedFeatures: [],
    currentPlanLimits: null,
  });

  const fetchSubscription = useCallback(async () => {
    if (!user) return;
    
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await fetch('/api/billing/subscription');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      const data = await response.json();
      
      setState({
        status: data.status,
        plan: data.plan,
        trialEndsAt: data.trialEndsAt,
        subscriptionExpiresAt: data.subscriptionExpiresAt,
        daysRemaining: data.daysRemaining,
        isActive: data.isActive,
        isOwner: data.isOwner,
        loading: false,
        trialUsage: data.trialUsage,
        blockedFeatures: data.blockedFeatures,
        currentPlanLimits: data.currentPlanLimits,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    ...state,
    refresh: fetchSubscription
  };
}
