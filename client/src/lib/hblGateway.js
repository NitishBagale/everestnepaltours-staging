"use client";

import { HBL_PAYMENT_REQUEST_PATH } from "@/lib/hblConfig";

export const requestHblPaymentPage = async ({ amount, bookingRef }) => {
  const formData = new FormData();
  formData.append("input_amount", String(amount));
  formData.append("bookingRef", String(bookingRef));

  const response = await fetch(HBL_PAYMENT_REQUEST_PATH, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.success || !payload?.paymentPageURL) {
    throw new Error(
      payload?.message ||
        "Failed to initialize the HBL payment request."
    );
  }

  return payload.paymentPageURL;
};
