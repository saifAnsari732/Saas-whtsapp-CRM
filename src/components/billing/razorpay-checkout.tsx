"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  currency: string;
  onSuccess: (paymentId: string, signature: string) => void;
  onClose: () => void;
  keyId: string;
}

export function RazorpayCheckout({
  orderId,
  amount,
  currency,
  onSuccess,
  onClose,
  keyId,
}: RazorpayCheckoutProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && orderId) {
      const activeKey = keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      const options = {
        key: activeKey,
        amount: Math.round(amount * 100), // convert to paise
        currency: currency || "INR",
        name: "ChatFlyr",
        description: "WhatsApp CRM Subscription & Messaging",
        order_id: orderId,
        handler: function (response: any) {
          if (response.razorpay_payment_id && response.razorpay_signature) {
            onSuccess(
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          } else {
            console.error("Incomplete response from Razorpay checkout", response);
            onClose();
          }
        },
        modal: {
          ondismiss: function () {
            onClose();
          },
        },
        theme: {
          color: "#075E54",
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          console.error("Razorpay payment failed:", response.error);
          onClose();
        });
        rzp.open();
      } catch (err) {
        console.error("Error opening Razorpay checkout modal:", err);
        onClose();
      }
    }
  }, [isLoaded, orderId, amount, currency, onSuccess, onClose, keyId]);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsLoaded(true)}
      />
    </>
  );
}
