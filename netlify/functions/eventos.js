import crypto from "crypto";
import fetch from "node-fetch";

// 🔹 Função utilitária para normalizar + hashear
function hashData(value) {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.toString().trim().toLowerCase()).digest("hex");
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const PIXEL_ID = process.env.FB_PIXEL_ID;
    const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
    const TEST_EVENT_CODE = process.env.NEXT_PUBLIC_FB_TEST_CODE;

    const { event: eventName, fbp, fbc, event_id, event_source_url, client_user_agent, contents, currency, value, customer_data } = body;

    const client_ip_address = event.headers["x-forwarded-for"]?.split(",")[0] || null;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id || crypto.randomUUID(),
          action_source: "website",
          event_source_url,
          user_data: {
            ...(fbp ? { fbp } : {}),
            ...(fbc ? { fbc } : {}),
            ...(client_ip_address ? { client_ip_address } : {}),
            ...(client_user_agent ? { client_user_agent } : {}),
            ...(customer_data?.email ? { em: hashData(customer_data.email) } : {}),
            ...(customer_data?.phone ? { ph: hashData(customer_data.phone) } : {})
          },
          custom_data: {
            contents: contents || [],
            currency: currency || "BRL",
            value: value || 0
          }
        }
      ],
      ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {})
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: response.ok, fbResponse: text })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
