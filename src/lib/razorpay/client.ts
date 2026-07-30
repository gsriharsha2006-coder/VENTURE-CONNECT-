import crypto from "crypto";

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET required");
  }
  return { keyId, keySecret };
}

export async function razorpayRequest(path: string, body: Record<string, unknown>) {
  const { keyId, keySecret } = getRazorpayCredentials();
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.description || `Razorpay error ${res.status}`);
  }
  return data;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const { keySecret } = getRazorpayCredentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return signaturesMatch(expected, signature);
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
  return signaturesMatch(expected, signature);
}

function signaturesMatch(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function createRazorpayCustomer(email: string, name: string) {
  return razorpayRequest("/customers", { email, name, fail_existing: "0" });
}

export async function createSubscription(planId: string, customerId: string, totalCount = 12) {
  return razorpayRequest("/subscriptions", {
    plan_id: planId,
    customer_id: customerId,
    total_count: totalCount,
    customer_notify: 1
  });
}
