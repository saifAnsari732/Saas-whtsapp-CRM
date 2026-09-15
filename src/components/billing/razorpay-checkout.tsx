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
    if (isLoaded && orderId) {
      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // convert to paise
        currency: currency,
        name: "WhatsApp CRM",
        description: "Payment",
        order_id: orderId,
        handler: function (response: any) {
          onSuccess(
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: function () {
            onClose();
          },
        },
        theme: {
          color: "#0f172a", // primary color
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error(response.error);
        onClose();
      });

      rzp.open();
    }
  }, [isLoaded, orderId, amount, currency, onSuccess, onClose, keyId]);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setIsLoaded(true)}
      />
    </>
  );
}
