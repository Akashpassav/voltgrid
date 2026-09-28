import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, receipt, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be greater than 0." },
        { status: 400 },
      );
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_VoltGridDemoKey";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "VoltGridSecretDemoTestKey123";

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    // If using simulated/demo keys during local dev without active Razorpay account:
    if (key_id.includes("VoltGridDemoKey") || !process.env.RAZORPAY_KEY_SECRET) {
      const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: key_id,
        isTestDemo: true,
      });
    }

    try {
      const rzp = new Razorpay({
        key_id,
        key_secret,
      });

      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt || `rec_${Date.now()}`,
        notes: notes || { platform: "VoltGrid EV Charging" },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: key_id,
      });
    } catch (rzpErr) {
      console.warn("Razorpay API call returned error, falling back to simulated test order:", rzpErr);
      const mockOrderId = `order_test_${Date.now()}`;
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: key_id,
        isTestDemo: true,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create Razorpay order";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
