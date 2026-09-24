"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CoexistenceConnectionPromptProps {
  onDismiss?: () => void;
}

export function CoexistenceConnectionPrompt({
  onDismiss,
}: CoexistenceConnectionPromptProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [coexistanceStatus, setCoexistanceStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if dismissed in session
    const isDismissed = sessionStorage.getItem("coexistence_prompt_dismissed");
    if (isDismissed === "true") {
      setIsOpen(false);
      setLoading(false);
      return;
    }

    // Fetch coexistence connection status
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/whatsapp/coexistence/status", { method: "POST" });
        const data = await res.json();
        const status = data.state || data.status || "disconnected";
        setCoexistanceStatus(status);
      } catch (err) {
        console.error("Failed to fetch coexistence status:", err);
        setCoexistanceStatus("disconnected");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("coexistence_prompt_dismissed", "true");
    onDismiss?.();
  };

  const isConnected = coexistanceStatus === "connected" || coexistanceStatus === "open" || coexistanceStatus === "PAIRED";

  // Only show top banner if coexistence is not connected and prompt is open
  if (loading || isConnected || !isOpen) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-foreground shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <span>Coexistence Phone QR Engine Optional</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect your active WhatsApp phone via QR scanner to enable live mobile chat sync and phone broadcasts alongside Meta Cloud API.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Link href="/dashboard/coexistence">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl px-4 py-2">
              <Smartphone className="mr-1.5 h-3.5 w-3.5" />
              Connect QR
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss} 
            className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
