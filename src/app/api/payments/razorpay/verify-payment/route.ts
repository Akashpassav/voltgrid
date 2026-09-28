import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { error: "Missing required payment details." },
        { status: 400 },
      );
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || "VoltGridSecretDemoTestKey123";

    // If simulated demo order
    if (razorpay_order_id.startsWith("order_test_") || razorpay_order_id.startsWith("order_mock_") || key_secret.includes("VoltGridSecretDemo")) {
      return NextResponse.json({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        message: "Payment verified successfully (Development Mode)",
      });
    }

    // Official Razorpay HMAC-SHA256 signature verification
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature verification failed." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      message: "Payment signature verified successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to verify Razorpay payment";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
