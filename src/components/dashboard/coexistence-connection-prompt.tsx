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
    // Fetch coexistence connection status
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/whatsapp/baileys/stats");
        const data = await res.json();
        setCoexistanceStatus(data.status || "disconnected");
      } catch (err) {
        console.error("Failed to fetch coexistence status:", err);
        setCoexistanceStatus("disconnected");
      } finally {
        setLoading(false);
      }
    };

//  
// 
//     
    fetchStatus();
    // Optionally poll for status changes
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss?.();
  };

  // Only show if coexistence is not connected
  if (loading || coexistanceStatus === "connected" || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center sm:p-0">
      <div className="relative w-full max-w-md transform rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl transition-all sm:w-96">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
          <AlertCircle className="h-6 w-6 text-purple-400" />
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-bold text-white">
            Coexistence Connection Required
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            This feature requires a Coexistence connection. Please connect your
            WhatsApp account through the Coexistence setup to access this
            functionality.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="flex-1 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            Dismiss
          </Button>
          <Link
            href="/dashboard/coexistence"
            className="flex-1"
            onClick={handleDismiss}
          >
            <Button className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 transition-all active:scale-95">
              <Smartphone className="mr-2 h-4 w-4" />
              Connect Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
