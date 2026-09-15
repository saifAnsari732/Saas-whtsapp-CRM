"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ConnectWhatsappBannerProps {
  isConnected?: boolean;
}

export function ConnectWhatsappBanner({ isConnected = false }: ConnectWhatsappBannerProps) {
  if (isConnected) return null;

  return (
    <Alert variant="destructive" className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 mt-0.5" />
        <div>
          <AlertTitle className="text-base font-semibold">WhatsApp Cloud API Not Connected</AlertTitle>
          <AlertDescription className="text-sm opacity-90">
            Connect your WhatsApp Business account to start sending messages and automating workflows.
          </AlertDescription>
        </div>
      </div>
      <Link
        href="/settings?tab=whatsapp"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
      >
        Connect WhatsApp Cloud API
      </Link>
    </Alert>
  );
}
