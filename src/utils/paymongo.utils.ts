const PAYMONGO_BASE = "https://api.paymongo.com/v1";

const authHeader = () => {
  const key = process.env.PAYMONGO_SECRET_KEY!;
  return `Basic ${Buffer.from(key + ":").toString("base64")}`;
};

// ── PayMongo response shapes ──────────────────────────────────────────────────

interface PayMongoError {
  detail: string;
}

interface PayMongoIntentResponse {
  errors?: PayMongoError[];
  data: {
    id: string;
    attributes: {
      client_key: string;
      status: string;
    };
  };
}

interface PayMongoMethodResponse {
  errors?: PayMongoError[];
  data: {
    id: string;
  };
}

interface PayMongoAttachResponse {
  errors?: PayMongoError[];
  data: {
    attributes: {
      status: string;
      next_action?: {
        // "consume_qr" for qrph | "redirect" for gcash/card
        type: string;
        // gcash/card redirect
        redirect?: {
          url: string;
        };
        // qrph: QR image is a base64 data URI at next_action.code.image_url
        code?: {
          id: string;
          image_url: string; // "data:image/png;base64,..."
        };
      };
    };
  };
}

// ── 1. Create Payment Intent ──────────────────────────────────────────────────

export const createPaymentIntent = async (amountInPesos: number) => {
  const res = await fetch(`${PAYMONGO_BASE}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amountInPesos * 100), // centavos
          currency: "PHP",
          payment_method_allowed: ["qrph"],
          capture_type: "automatic",
        },
      },
    }),
  });

  const data = (await res.json()) as PayMongoIntentResponse;

  if (data.errors) {
    throw new Error(
      data.errors[0]?.detail ?? "PayMongo: failed to create intent",
    );
  }

  return {
    intentId: data.data.id,
    clientKey: data.data.attributes.client_key,
  };
};

// ── 2. Create QR PH Payment Method + Attach ──────────────────────────────────

export const attachGCashToIntent = async (
  intentId: string,
  clientKey: string,
  email: string,
  name: string,
  returnUrl: string,
) => {
  // Step A — create payment method (type: "qrph")
  const methodRes = await fetch(`${PAYMONGO_BASE}/payment_methods`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          type: "qrph",
          billing: { name, email },
        },
      },
    }),
  });

  const methodData = (await methodRes.json()) as PayMongoMethodResponse;

  if (methodData.errors) {
    throw new Error(
      methodData.errors[0]?.detail ??
        "PayMongo: failed to create payment method",
    );
  }

  const paymentMethodId = methodData.data.id;

  // Step B — attach to intent
  const attachRes = await fetch(
    `${PAYMONGO_BASE}/payment_intents/${intentId}/attach`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey,
            return_url: returnUrl,
          },
        },
      }),
    },
  );

  const attachData = (await attachRes.json()) as PayMongoAttachResponse;

  if (attachData.errors) {
    throw new Error(
      attachData.errors[0]?.detail ??
        "PayMongo: failed to attach payment method",
    );
  }

  const nextAction = attachData.data.attributes.next_action;

  return {
    status: attachData.data.attributes.status,
    // gcash/card: next_action.redirect.url
    redirectUrl: nextAction?.redirect?.url ?? null,
    // qrph: next_action.code.image_url (base64 data URI — pass directly to <img src>)
    qrCodeUrl: nextAction?.code?.image_url ?? null,
  };
};

// ── 3. Get Payment Intent Status ──────────────────────────────────────────────

export const getPaymentIntentStatus = async (intentId: string) => {
  const res = await fetch(`${PAYMONGO_BASE}/payment_intents/${intentId}`, {
    headers: { Authorization: authHeader() },
  });

  const data = (await res.json()) as PayMongoIntentResponse;

  if (data.errors) {
    throw new Error(
      data.errors[0]?.detail ?? "PayMongo: failed to fetch intent status",
    );
  }

  // possible: awaiting_payment_method | awaiting_next_action | processing | succeeded | payment_intent.payment_failed
  return data.data.attributes.status;
};
