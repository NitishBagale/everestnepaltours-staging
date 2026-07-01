import { spawnSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import {
  HBL_BACKEND_PATH,
  HBL_CANCEL_PATH,
  HBL_FAIL_PATH,
  HBL_SUCCESS_PATH,
} from "@/lib/hblConfig";

const DEFAULT_PUBLIC_SITE_URL = "https://everestnepaltours.com";
const HBL_MERCHANT_ID = process.env.HBL_MERCHANT_ID || "9103335451";
const HBL_API_KEY =
  process.env.HBL_API_KEY || "741653d4d7f1451c9e82a1ec32a6670a";
const HBL_CURRENCY = process.env.HBL_CURRENCY || "USD";
const HBL_THREE_D_SECURE = process.env.HBL_THREE_D_SECURE || "Y";
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

const isResolvableBinary = (candidate) => {
  if (candidate.includes("/")) {
    return existsSync(candidate);
  }

  const lookup = spawnSync("which", [candidate], { stdio: "ignore" });
  return lookup.status === 0;
};

const resolvePhpBinary = () => {
  const candidates = [
    process.env.HBL_PHP_BINARY,
    "/usr/bin/php83",
    "php83",
    "/opt/homebrew/opt/php@8.2/bin/php",
    "/opt/homebrew/bin/php",
    "php",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (isResolvableBinary(candidate)) {
      return candidate;
    }
  }

  return "php";
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
    parsePublicOrigin(process.env.SITE_URL) ||
    parsePublicOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    parsePublicOrigin(forwardedOrigin) ||
    requestOrigin ||
    DEFAULT_PUBLIC_SITE_URL;
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
  const paymentRequestDir = path.join(process.cwd(), "hbl");

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

  const phpCode = `
    error_reporting(E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_RECOVERABLE_ERROR);
    ini_set('display_errors', '1');
    chdir(${JSON.stringify(paymentRequestDir)});
    require 'vendor/autoload.php';
    require 'src/api/Payment.php';
    $payment = new Payment();
    $response = $payment->ExecuteFormJose(
      getenv('HBL_MERCHANT_ID') ?: '',
      getenv('HBL_API_KEY') ?: '',
      getenv('HBL_CURRENCY') ?: 'USD',
      getenv('HBL_AMOUNT') ?: '1',
      getenv('HBL_THREE_D') ?: 'Y',
      getenv('HBL_SUCCESS_URL') ?: '',
      getenv('HBL_FAIL_URL') ?: '',
      getenv('HBL_CANCEL_URL') ?: '',
      getenv('HBL_BACKEND_URL') ?: ''
    );
    $payload = json_decode($response, true);
    $url = $payload['response']['Data']['paymentPage']['paymentPageURL'] ?? null;
    if (!$url) {
      fwrite(STDERR, "Missing paymentPageURL\\n");
      exit(1);
    }
    echo $url;
  `;

  const phpResult = spawnSync(resolvePhpBinary(), ["-r", phpCode], {
    cwd: paymentRequestDir,
    env: {
      ...process.env,
      HBL_MERCHANT_ID,
      HBL_API_KEY,
      HBL_CURRENCY,
      HBL_AMOUNT: amountText,
      HBL_THREE_D: HBL_THREE_D_SECURE,
      HBL_SUCCESS_URL: successUrl,
      HBL_FAIL_URL: failUrl,
      HBL_CANCEL_URL: cancelUrl,
      HBL_BACKEND_URL: backendUrl,
    },
    encoding: "utf8",
  });

  if (phpResult.status !== 0 || !phpResult.stdout.trim()) {
    const stderr = phpResult.stderr?.toString().trim();
    const stdout = phpResult.stdout?.toString().trim();
    const errorMessage = phpResult.error?.message?.trim();
    const diagnosticDetails = [
      errorMessage ? `spawn error: ${errorMessage}` : null,
      typeof phpResult.status === "number"
        ? `exit status: ${phpResult.status}`
        : null,
      stderr ? `stderr: ${stderr}` : null,
      stdout ? `stdout: ${stdout}` : null,
      `php binary: ${resolvePhpBinary()}`,
      `working dir: ${paymentRequestDir}`,
    ]
      .filter(Boolean)
      .join(" | ");

    console.error("HBL PHP payment spawn failure details:", diagnosticDetails);

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to initialize the HBL payment request. Please check PHP/HBL configuration.",
      },
      { status: 502 }
    );
  }

  const destination = new URL(phpResult.stdout.trim());
  destination.searchParams.set("bookingRef", bookingRef);
  destination.searchParams.set("amount", amountText);

  return NextResponse.json({
    success: true,
    paymentPageURL: destination.toString(),
  });
}
