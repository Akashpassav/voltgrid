"use client";

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayInstance;

type WindowWithRazorpay = typeof window & {
  Razorpay?: RazorpayConstructor;
};

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    const rzpWindow = window as WindowWithRazorpay;
    if (rzpWindow.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Could not load external Razorpay checkout.js script; fallback demo mode enabled.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Triggers Razorpay Checkout modal with fallback simulation for dev keys
 */
export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): Promise<void> {
  const loaded = await loadRazorpayScript();
  const rzpWindow = typeof window !== "undefined" ? (window as WindowWithRazorpay) : null;

  if (loaded && rzpWindow?.Razorpay && !options.key.includes("VoltGridDemoKey")) {
    const rzp = new rzpWindow.Razorpay(options);
    rzp.open();
  } else {
    // Elegant fallback simulation popup for development mode
    const simulatedPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const simulatedSignature = `sig_${Date.now()}_hash`;

    const confirmed = window.confirm(
      `⚡ [VoltGrid Razorpay Checkout — Test Mode]\n\nPay ₹${(options.amount / 100).toFixed(
        2,
      )} for ${options.description}?\n\nClick OK to simulate successful payment, or Cancel to abort.`,
    );

    if (confirmed) {
      options.handler({
        razorpay_payment_id: simulatedPaymentId,
        razorpay_order_id: options.order_id,
        razorpay_signature: simulatedSignature,
      });
    } else if (options.modal?.ondismiss) {
      options.modal.ondismiss();
    }
  }
}
