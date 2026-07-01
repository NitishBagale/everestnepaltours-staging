import {
  CompactEncrypt,
  CompactSign,
  compactDecrypt,
  compactVerify,
} from "jose";
import { createPrivateKey, createPublicKey, randomUUID } from "crypto";

const HBL_PAYMENT_ENDPOINT = "https://core.paco.2c2p.com/api/1.0/Payment/prePaymentUi";

const defaultSecurity = {
  merchantId: "9103335451",
  encryptionKeyId: "19f84b5655f04e25a99b09f1ee2fac78",
  accessToken: "741653d4d7f1451c9e82a1ec32a6670a",
  tokenType: "JWT",
  jwsAlgorithm: "PS256",
  jweAlgorithm: "RSA-OAEP",
  jweEncryptionAlgorithm: "A128CBC-HS256",
  merchantSigningPrivateKey:
    "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",
  pacoEncryptionPublicKey:
    "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA6ZLups2K0iYEMxQqgASX8gY6tWhNVCp08YuDgjCsOVrGVgUHD0dh0TWFNJ7Lq2Jp0SOsGgi54+hrjwPOL2CCZxw8pKUlL57UksoD9oWUrK/KkSvEAwPU4cZqzxIXyhBcZb8O96iN4WQJILkRTg+DXLkML6qisO496fPGIs+vCoc87toucy5O9fRfaYSjcqjreyi8JDkvVJM/BeNtOEM2a0b/lcWa67RH+tN97H25k+Qez7QthLru6oBfWBgD6iIwhV+ICqLWHmp6fQ+DHQk/o+OO3yFiY9OAvMiy8MOTinvkBlFwYgYNznG3/w0Xh8U5vtudUXPDNUO6ddf4y99+6LlWDiKgJn/Th93YUg+gFH4LUJHyPrSY2JuC+Q8kksp2xyiZDTHGzi96kturwrqCui6TytCHcU4UB0VRMR+M7VRl3S2YPhcxv5U8Fh2PITqydZE5vv1Va06qhegjOlSZnEUl2xKPm5k/u+UHvUP/oq04fQLTlYqyA3JYDCe4z5Ea2SOgjeVl+qTatWYzmkUXyCONLZ4UaRrgbYCp0nCPHoTFgRQdChu8ezDbnYY9IW7cT/s2fEi5N7X1XrQttiEP4rbn0y0qVYYjN86+elfhtYGHidZTUSUS5RSTHqOkj59p5LIGwFF9iTXzCjfUqq8clnfOk76qSLY1+Kj+SMMe6Z8CAwEAAQ==",
  pacoSigningPublicKey:
    "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAr0XW6QacR8GilY4nZrJZW40wnFeYu7h9aXUSqxCP6djurCWZmLqnrsYWP7/HR8WOulYPHTVpfqJesTOdVqPgY6p10H811oRbJG9jvsG8j8kn/Bk8b2wZ9qelNqdNJMDbR5WUyaytaDWW6QdI4+clqjFfwCOw76noDSe+R4pDSzgMiyCk5R4m2ECT1fv/4Axz2bvLN+DRTg5DPPIMLWpA87lgjxeaDlGyJqZCbkJozW7JX0AJVc0X7YR9kzbiTi3LVOInSKY+VHT8yCARIdvXtKc6+IWSbVQqgpNIBB8GN0OvU8xedjPNCMGZnnMtgd7XLTf/okyadbdNLAqQLTbDs/5HnIVx8FyfgiOS/zsim5ivi3ljVAW3T3ePGjkY0q1DMzr5iJ4m/WTL2d1TArlfHyQhkSpFpQPOO+pJyVQqttHJo99vMirQogdSx4lIu//aod0yJyJLpjCeiqb2Fz3Qk0AZ4S78QKeeGsxTRchTP6Wsb6okaZd+cFi6z8qbP0z/Y3xRZO7vOLB/whkqS+pMVKBQ42YzgQPRzbXXmgCkf1nCqgrD9bnIB5ovdRGfDXW86GKY8XwGVjb4BoMvql+HsbonKHAO+eGfQulpB5YfQGQU3ZXdMdfCLAk8FuqemH4k7S7diLzVvRCuisHsEx6qJ4ewxzNCvW7OGVinTR9NSQUCAwEAAQ==",
  merchantDecryptionPrivateKey:
    "MIIJQQIBADANBgkqhkiG9w0BAQEFAASCCSswggknAgEAAoICAQCsWTxjuaTYpOGRmL7FANip6pcdbhetXTF7QOMcT8MQy7dv+1DgjmcfWZA0t9cjN0hrEDS0wlGMX9a7C9z3r+ZkapMaSrqjMmzgVdsg2LH3Fq2xK2ZfFkOmlMfm8hH8wEoti1h6M96jA2Ega/N9dfotDH/G+CDlp8OtJ7x5enE6TR0ELPaKyJeynlgXv2R+8B/wc8x+4Z3sDSxymMAiCW6aNs6UuO/VRfGrHrqZwa58dKDe9NUVMkYsxC6IQYMArqbq449lAD9nY7beHxqFyFMfivfw7lTtEI1Bge+pIwJqs9NxSeDDjxsShNM3brCaQQTK0oefVZmSFAFamkYWv3hnuyESJxRjmFEa91szpHt4eGARUlUDV1ivDSL+TRZWFQ/sR+C+ySUX9RzOKqDIIqMgMq+erYCX4cHGeGuTy/vrk71FW8MjsKlPWj8LrgRSJdb+3R/2sbbXqdKslTcV+6cCaaHk7yVR4cn1n3xbdnmNX/q3LzZsXMcrHxDRcDxemV8g9r3wlYylXKHyv6IQXK7JytCM/IsoWGkRUi256mkL99jPUbRTxemcPhJ8FacXMVtBBml9sGw53mGwarwRt27OdYqwRBZe6PZMZ79Awgm16iTjKJ9qQ0+ApRJRvjtfkidQeuzt3fgnqsxphSaTj8ku7F5+T5Kw6OqaObqv4B5jlwIDAQABAoICACsHVGZpcNiNwatCAU7Z+T3izbuRQuQLglENUCY/W6oT0kZo7jZCF0jiaXhf9ZxbLv9b2mzOnuF3A/tK6O4FwnWLjhJgWdxouHoBtWWr9DKGPPMgrLxMqLMsLgRgp1D9CQf55CsOTCVSsKsRiIboL3+TwUsBo+TyT44pf4qsoRw3KGlkeGEJ16XGlqPHKuXuOWsk3gdHeM/4MgKiVEWrKSvjRwwmZ+pNPhrE3z2H93InBArmAVT7aj2+9QcbpANFl3LJQYGr4CiF4p/uEAcajnYvkdtbBWTyXvHd6OHHVdEh+EYudakdT1r+QmVygzDfzrx8d1O2YVLxH61pGtqPDxYdXPPSU0HX8LECFfZg7gDgz4JzHZ1tXSA8zlqQTBFWp+fwmqziDtxy8lzk63xz5wwKQ8FPdT1uO6FmivZzFZjUqkDzKCJa2htrZj06/64mlBQTYRKTqYMfxb61pw34fmOLMOW8jDfnuosAE9fh4CO0WDhcWFgnoPwvao1e83D1j2AcYVK/PdVdovOpIxAkigOzS0FoG49SOh9CmxwFfMYEsfdpuSgWuIGzn4w/HwtFTQ5Jg+x1eYuMo1mQdfKjLxHxoRV/YFtHMUo8U/lNxNEZe8eB3BtE7DKd6ZwSIjxs7MqtkP51YvBmC9im21u5RkpoFIsOCawQWWq4PBfVDm6xAoIBAQDoWNIhIOQcKH26fhh6u4qexp6A58prrmXZmlH9HAuehuhcYtUvO1Uk0Ps74SVewhY6ns3R7AOKHyrJyUimfdRVGUjWGon5MRc924ZBQujc9oVWwOMgQesLNOziwB8Dvsb1kMtLwCC7iYISyp+sBoPFY2xE4dhxYhN5L3ANhZLRKxQEDBWjW//RycRCUChQVZNMfGecWE2XfokzgDCcARq+8bfe1ZAIEYZ7Pq7yQfurLfH2rAcm3PjagG6O0tVwzRBCqI2e5XYO1ky6oCpy0/OXiCcgQUx2MabZvfr2S9inSDUfcwiwCIwBYqllpQht5mtC6kyo9sW/5H1llzpV0DY9AoIBAQC95M0ZVdieAhw1ZqiWy+K6hTbSTUPDekJJbdWbkb/8Ce3Z3WR5N4uGDw6uJ+kegjGYcMOKJmLowD9WMnC6OQfYTHf6dGm7B5hPbm6n+iAutpCAcHG24W7GN+LA7OECKlIFgVSB2ddvn+Fv/H2mNn540/z1RYS+SQa+duGgyOJb9YDDe+PjARrFQv4ETWliZin8y8uz68SaJ28bKtnftrZGw+rszmbeaOXZ1rao/d53zxBP4qtuJdCsh6I9zNYe/Ukn2jtr3cmpNOkm6Bzif+hWeoxRaMTydNGIDE4V+R/617pot8JYcKDfQ0gbcBrQvtCUaSlRa7owGp+afGPXn7JjAoIBAFx7bjhthR6IJ3Nh2ZCQsZ59ZH3exT2TT0sMF/JthVp2TGrpk/2W2k8rN7Uf6uYKzxpKN5aFIOuLeFaVXeuXTjsJM2q1aZHcrmmaxZeYcGPzZCOh50XhtxLg4CFpY270MvFvztu5/81l8HZWXLP2a+DXsDLCyopnBWVJMorPTh8fzHnH7Zz2c58ndo0GpuVDCrx5ECy1IT1ZynbLYY3XCrRSNmPmEcyEXUkVLEGVbf027obG9pnLfupKELecyAR8OyqtOKG0qAdD2Yq3Ue4e22jHcvttwmeRX95vtkLu8a+0GCEKgry+yiuK/+5LgE1uV+dsp1Lh1tiItDkJttiNZekCggEACTbM7OnJdQFNNRoiHA8QlVRZcKLnItkP1lhKAR51Xlls/SFM+sTDNGIOqEyvdxeCKI9wLYfnTLvnVttjtOWHh+tN9w0nBDg+H7yQCf6NCTc6k8DhA6q0oVGc4xebY2uCR1obK6HSXkw3uCNcRXBnep1urMgOxNzuQtep4w9cTHIBKXsdd6paDjBN+w92iZvDdcy9uaE7DO/U6FCP+db3yT9AavUo8KnOXV+ZxWFsJgwaEoZBIzsagQSjzrPdv+syXYitUXKVkmxK0+R3YlYqg+e2X0ziIZGhiSRvtYk9EALfvK0N9RSh+bNeEFbENlTL8ieYJadAhY0FKY3XmmLZWQKCAQBsq0fVdqn6N8nw9BWlKCqZlzTMwt4ogo5cae8d8Humqh9KgAZffK9jxjBmMFYVGc0RM2eostsJqm/5l82DnQLhcTAOc51ZVuE40uqrP6JUboULWaTOUxzN6ZJzWFWOvv/VI4YKRy+vuo6124A296/FD82uGpBTAUx4ayPf56ta6znCiyMASR5TdQTu+XysWGuHs0yAZqCIwdYIx+whZZJqwNyNfcIPgcKDRp5WcMM7t6LXGFnD1SomoFV/33KqxPneevUy6cdph3HOwwMFha+gFUdmGT0rjt/OR/NQsgi6ZddUpXP/DQf62cAuGVfT7QXjBZ2QRl2MW//Anbftp88N",
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const wrapPem = (label, base64Body) => {
  const normalized = String(base64Body || "").replace(/\s+/g, "");
  const lines = normalized.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
};

const resolveSecurityData = () => ({
  merchantId: process.env.HBL_MERCHANT_ID || defaultSecurity.merchantId,
  encryptionKeyId:
    process.env.HBL_ENCRYPTION_KEY_ID || defaultSecurity.encryptionKeyId,
  accessToken: process.env.HBL_API_KEY || defaultSecurity.accessToken,
  tokenType: defaultSecurity.tokenType,
  jwsAlgorithm: defaultSecurity.jwsAlgorithm,
  jweAlgorithm: defaultSecurity.jweAlgorithm,
  jweEncryptionAlgorithm: defaultSecurity.jweEncryptionAlgorithm,
  merchantSigningPrivateKey:
    process.env.HBL_MERCHANT_SIGNING_PRIVATE_KEY ||
    defaultSecurity.merchantSigningPrivateKey,
  pacoEncryptionPublicKey:
    process.env.HBL_PACO_ENCRYPTION_PUBLIC_KEY ||
    defaultSecurity.pacoEncryptionPublicKey,
  pacoSigningPublicKey:
    process.env.HBL_PACO_SIGNING_PUBLIC_KEY ||
    defaultSecurity.pacoSigningPublicKey,
  merchantDecryptionPrivateKey:
    process.env.HBL_MERCHANT_DECRYPTION_PRIVATE_KEY ||
    defaultSecurity.merchantDecryptionPrivateKey,
});

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
