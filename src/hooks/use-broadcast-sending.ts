'use client';

import { useState } from 'react';
import { MessageTemplate } from '@/types';

export type CustomFieldOperator = 'is' | 'is_not' | 'contains';

export interface CustomFieldFilter {
  fieldId: string;
  operator: CustomFieldOperator;
  value: string;
}

export interface AudienceConfig {
  type: 'all' | 'tags' | 'custom_field' | 'csv';
  tagIds?: string[];
  customField?: CustomFieldFilter;
  csvContacts?: { phone: string; name?: string }[];
  excludeTagIds?: string[];
}

export type VariableMapping =
  | { type: 'static'; value: string }
  | { type: 'field'; value: string }
  | { type: 'custom_field'; value: string };

export interface BroadcastPayload {
  name: string;
  template: MessageTemplate;
  audience: AudienceConfig;
  variables: Record<string, VariableMapping>;
  headerMediaUrl?: string;
  scheduledAt?: string;
  batchDelayMs?: number;
  delaySeconds?: number;
}

export interface UseBroadcastSendingReturn {
  createAndSendBroadcast: (payload: BroadcastPayload) => Promise<string>;
  createBroadcastAndStart: (payload: BroadcastPayload) => Promise<string>;
  isProcessing: boolean;
  progress: number;
}

export function useBroadcastSending(): UseBroadcastSendingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  async function createBroadcastAndStart(payload: BroadcastPayload): Promise<string> {
    setIsProcessing(true);
    setProgress(10);
    try {
      const res = await fetch('/api/whatsapp/broadcast/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start broadcast campaign');
      }

      setProgress(100);
      return data.broadcastId;
    } finally {
      setIsProcessing(false);
    }
  }

  async function createAndSendBroadcast(payload: BroadcastPayload): Promise<string> {
    return createBroadcastAndStart(payload);
  }

  return { createAndSendBroadcast, createBroadcastAndStart, isProcessing, progress };
}
