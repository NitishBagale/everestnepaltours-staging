import {
  CompactEncrypt,
  CompactSign,
  compactDecrypt,
  compactVerify,
} from "jose";
import { createPrivateKey, createPublicKey, randomUUID } from "crypto";
import { HBL_CONFIG, HBL_PAYMENT_ENDPOINT } from "@/lib/hblConfig";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const wrapPem = (label, base64Body) => {
  const normalized = String(base64Body || "").replace(/\s+/g, "");
  const lines = normalized.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
};

const resolveSecurityData = () => HBL_CONFIG;

const getSigningPrivateKey = (security) =>
  createPrivateKey(wrapPem("RSA PRIVATE KEY", security.merchantSigningPrivateKey));

const getDecryptingPrivateKey = (security) =>
  createPrivateKey(
    wrapPem("RSA PRIVATE KEY", security.merchantDecryptionPrivateKey)
  );

const getEncryptingPublicKey = (security) =>
  createPublicKey(wrapPem("PUBLIC KEY", security.pacoEncryptionPublicKey));

const getVerificationPublicKey = (security) =>
  createPublicKey(wrapPem("PUBLIC KEY", security.pacoSigningPublicKey));

const toAmountText = (amount) =>
  String(Math.round(Number(amount || 0) * 100)).padStart(12, "0");

const validateJoseClaims = (claims, accessToken) => {
  const now = Math.floor(Date.now() / 1000);

  if (claims?.iss !== "PacoIssuer") {
    throw new Error("Invalid HBL response issuer.");
  }

  if (claims?.aud !== accessToken) {
    throw new Error("Invalid HBL response audience.");
  }

  if (typeof claims?.nbf === "number" && claims.nbf > now) {
    throw new Error("HBL response token is not active yet.");
  }

  if (typeof claims?.exp === "number" && claims.exp <= now) {
    throw new Error("HBL response token has expired.");
  }
};

export const createHblJosePayload = ({
  merchantId,
  apiKey,
  currency,
  amount,
  threeDSecure,
  successUrl,
  failUrl,
  cancelUrl,
  backendUrl,
}) => {
  const now = new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const orderNo = String(Date.now());
  const numericAmount = Number(amount);

  return {
    request: {
      apiRequest: {
        requestMessageID: randomUUID(),
        requestDateTime: now.toISOString(),
        language: "en-US",
      },
      officeId: merchantId,
      orderNo,
      productDescription: `desc for '${orderNo}'`,
      paymentType: "CC",
      paymentCategory: "ECOM",
      storeCardDetails: {
        storeCardFlag: "N",
        storedCardUniqueID: "{{guid}}",
      },
      installmentPaymentDetails: {
        ippFlag: "N",
        installmentPeriod: 0,
        interestType: null,
      },
      mcpFlag: "N",
      request3dsFlag: threeDSecure,
      transactionAmount: {
        amountText: toAmountText(numericAmount),
        currencyCode: currency,
        decimalPlaces: 2,
        amount: numericAmount,
      },
      notificationURLs: {
        confirmationURL: successUrl,
        failedURL: failUrl,
        cancellationURL: cancelUrl,
        backendURL: backendUrl,
      },
      deviceDetails: {
        browserIp: "1.0.0.1",
        browser: "Postman Browser",
        browserUserAgent: "PostmanRuntime/7.26.8 - not from header",
        mobileDeviceFlag: "N",
      },
      purchaseItems: [
        {
          purchaseItemType: "ticket",
          referenceNo: "2322460376026",
          purchaseItemDescription: "Bundled insurance",
          purchaseItemPrice: {
            amountText: "000000000100",
            currencyCode: "NPR",
            decimalPlaces: 2,
            amount: 1,
          },
          subMerchantID: "string",
          passengerSeqNo: 1,
        },
      ],
      customFieldList: [
        {
          fieldName: "TestField",
          fieldValue: "This is test",
        },
      ],
    },
    iss: apiKey,
    aud: "PacoAudience",
    CompanyApiKey: apiKey,
    iat: nowSeconds,
    nbf: nowSeconds,
    exp: nowSeconds + 60 * 60,
  };
};

export const createHblPaymentPageUrl = async ({
  merchantId,
  apiKey,
  currency,
  amount,
  threeDSecure,
  successUrl,
  failUrl,
  cancelUrl,
  backendUrl,
}) => {
  const security = resolveSecurityData();
  const payload = createHblJosePayload({
    merchantId,
    apiKey,
    currency,
    amount,
    threeDSecure,
    successUrl,
    failUrl,
    cancelUrl,
    backendUrl,
  });

  const signingKey = getSigningPrivateKey(security);
  const encryptingKey = getEncryptingPublicKey(security);

  const jws = await new CompactSign(encoder.encode(JSON.stringify(payload)))
    .setProtectedHeader({
      alg: security.jwsAlgorithm,
      typ: security.tokenType,
    })
    .sign(signingKey);

  const jwe = await new CompactEncrypt(encoder.encode(jws))
    .setProtectedHeader({
      alg: security.jweAlgorithm,
      enc: security.jweEncryptionAlgorithm,
      kid: security.encryptionKeyId,
      typ: security.tokenType,
    })
    .encrypt(encryptingKey);

  const response = await fetch(HBL_PAYMENT_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/jose",
      CompanyApiKey: apiKey,
      "Content-Type": "application/jose; charset=utf-8",
    },
    body: jwe,
  });

  const token = await response.text();
  if (!response.ok || !token.trim()) {
    throw new Error(
      `HBL prePaymentUi failed with status ${response.status}. ${token.trim()}`
    );
  }

  const decryptingKey = getDecryptingPrivateKey(security);
  const verificationKey = getVerificationPublicKey(security);
  const { plaintext } = await compactDecrypt(token, decryptingKey);
  const nestedJws = decoder.decode(plaintext);
  const { payload: verifiedPayload } = await compactVerify(
    nestedJws,
    verificationKey
  );
  const parsed = JSON.parse(decoder.decode(verifiedPayload));

  validateJoseClaims(parsed, apiKey);

  const paymentPageUrl =
    parsed?.response?.Data?.paymentPage?.paymentPageURL || "";
  if (!paymentPageUrl) {
    throw new Error("Missing paymentPageURL in HBL response.");
  }

  return paymentPageUrl;
};
