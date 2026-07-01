import { NextResponse } from "next/server";
import {
  HBL_BACKEND_PATH,
  HBL_CANCEL_PATH,
  HBL_CONFIG,
  HBL_FAIL_PATH,
  HBL_PUBLIC_SITE_URL,
  HBL_SUCCESS_PATH,
} from "@/lib/hblConfig";
import { createHblPaymentPageUrl } from "@/lib/hblJose";

export const runtime = "nodejs";

const isDevelopment = process.env.NODE_ENV !== "production";

const parsePublicOrigin = (raw) => {
  const value = raw?.trim();
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "0.0.0.0"
    ) {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
};

const absoluteUrl = (request, target, params = {}) => {
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const forwardedOrigin =
    forwardedHost && forwardedProto
      ? `${forwardedProto}://${forwardedHost}`
      : undefined;
  const requestOrigin = isDevelopment
    ? request.nextUrl.origin
    : parsePublicOrigin(request.nextUrl.origin);
  const base =
    parsePublicOrigin(HBL_PUBLIC_SITE_URL) ||
    parsePublicOrigin(forwardedOrigin) ||
    requestOrigin ||
    HBL_PUBLIC_SITE_URL;
  const url = new URL(target, base);

  for (const [key, value] of Object.entries(params)) {
    if (String(value || "").trim()) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "HBL payment endpoint is active. Submit with POST to continue.",
  });
}

export async function POST(request) {
  const formData = await request.formData();
  const bookingRef = String(formData.get("bookingRef") || "").trim();
  const amountText = String(formData.get("input_amount") || "").trim();

  if (!bookingRef || !amountText) {
    return NextResponse.json(
      {
        success: false,
        message: "Missing booking reference or payment amount.",
      },
      { status: 400 }
    );
  }

  const successUrl = absoluteUrl(request, HBL_SUCCESS_PATH, {
    bookingRef,
    amount: amountText,
    payment: "success",
  });
  const failUrl = absoluteUrl(request, HBL_FAIL_PATH, {
    bookingRef,
    amount: amountText,
    payment: "failed",
  });
  const cancelUrl = absoluteUrl(request, HBL_CANCEL_PATH, {
    bookingRef,
    amount: amountText,
    payment: "cancel",
  });
  const backendUrl = absoluteUrl(request, HBL_BACKEND_PATH, {
    bookingRef,
  });

  try {
    const paymentPageUrl = await createHblPaymentPageUrl({
      merchantId: HBL_CONFIG.merchantId,
      apiKey: HBL_CONFIG.apiKey,
      currency: HBL_CONFIG.currency,
      amount: amountText,
      threeDSecure: HBL_CONFIG.threeDSecure,
      successUrl,
      failUrl,
      cancelUrl,
      backendUrl,
    });

    const destination = new URL(paymentPageUrl);
    destination.searchParams.set("bookingRef", bookingRef);
    destination.searchParams.set("amount", amountText);

    return NextResponse.json({
      success: true,
      paymentPageURL: destination.toString(),
    });
  } catch (error) {
    console.error("HBL payment initialization failed:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to initialize the HBL payment request. Please check HBL configuration.",
      },
      { status: 502 }
    );
  }
}
