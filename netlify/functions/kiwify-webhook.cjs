const crypto = require("crypto");
const fetch = require("node-fetch");

const KIWIFY_SECRET = process.env.KIWIFY_SECRET;
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.NEXT_PUBLIC_FB_TEST_CODE;

// Função hash SHA256 para Meta Ads
function hashSHA256(value) {
  if (!value) return undefined;
  return crypto
    .createHash("sha256")
    .update(value.toString().trim().toLowerCase())
    .digest("hex");
}

// Validação da assinatura
function validateSignature(signature, order) {
  if (!signature) return true; // se não houver, passa
  try {
    const payload = JSON.stringify(order);
    const expected = crypto
      .createHmac("sha1", KIWIFY_SECRET)
      .update(payload)
      .digest("hex");

    console.log("Signature recebido:", signature);
    console.log("Signature esperado:", expected);

    return signature === expected;
  } catch (err) {
    console.error("Erro na validação da signature:", err);
    return false;
  }
}

exports.handler = async (event) => {
  console.log("=== Webhook Kiwify recebido ===");
  console.log("Headers:", event.headers);

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, error: "Método não permitido" }),
    };
  }

  let bodyData = {};
  try {
    bodyData =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    console.log("Body parseado:", bodyData);
  } catch (err) {
    console.error("Erro ao parsear JSON:", err);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, error: "Corpo inválido" }),
    };
  }

  // Se vier no formato { order, signature }
  const order = bodyData.order || bodyData;
  const signature =
    bodyData.signature ||
    event.headers["x-signature"] ||
    event.headers["X-Signature"];

  if (!order) {
    console.error("Payload inválido: falta order");
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, error: "Payload inválido" }),
    };
  }

  // Valida assinatura
  if (!validateSignature(signature, order)) {
    console.error("Assinatura inválida");
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, error: "Assinatura inválida" }),
    };
  }

  // Extrair dados
  const customer = order.Customer || {};
  const product = order.Product || {};
  const commissions = order.Commissions || {};

  const email = customer.email;
  const phone = customer.mobile;
  const valor = (commissions.charge_amount || 0) / 100;
  const moeda = commissions.product_base_price_currency || "BRL";
  const id = order.order_id;

  const contents = [
    {
      id: product.product_id,
      quantity: 1,
      item_price: valor,
    },
  ];

  // Montar evento para Facebook Pixel (CAPI)
  const eventData = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: "https://monarcadasassinaturas.com",
        action_source: "website",
        event_id: id,
        user_data: {
          ...(email ? { em: hashSHA256(email) } : {}),
          ...(phone ? { ph: hashSHA256(phone) } : {}),
        },
        custom_data: {
          currency: moeda,
          value: valor,
          contents,
          content_type: "product",
        },
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );
    const result = await res.json();
    console.log("Facebook Pixel resposta:", result);
  } catch (err) {
    console.error("Erro ao enviar para Facebook:", err);
  }

  console.log("Webhook processado com sucesso ✅");
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
