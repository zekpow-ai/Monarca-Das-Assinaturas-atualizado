const fetch = require("node-fetch");
const crypto = require("crypto");

const KIWIFY_SECRET = process.env.KIWIFY_SECRET; // chave configurada no painel do Kiwify
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.NEXT_PUBLIC_FB_TEST_CODE;

function hashSHA256(value) {
  return crypto
    .createHash("sha256")
    .update(value.toString().trim().toLowerCase())
    .digest("hex");
}

function validateSignature(signature, order) {
  const payload = JSON.stringify(order);
  const expected = crypto
    .createHmac("sha1", KIWIFY_SECRET)
    .update(payload)
    .digest("hex");
  return signature === expected;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  let bodyData;
  try {
    bodyData = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Corpo inválido" };
  }

  const { signature, order } = bodyData;
  if (!signature || !order) {
    return { statusCode: 400, body: "Payload inválido" };
  }

  // 🔐 Validação de assinatura
  if (!validateSignature(signature, order)) {
    return { statusCode: 403, body: "Assinatura inválida" };
  }

  // --- Pegando dados do pedido ---
  const customer = order.Customer || {};
  const commissions = order.Commissions || {};
  const product = order.Product || {};

  const email = customer.email;
  const phone = customer.mobile;
  const valor = (commissions.charge_amount || 0) / 100; // vem em centavos
  const moeda = commissions.product_base_price_currency || "BRL";
  const id = order.order_id;

  const contents = [
    {
      id: product.product_id,
      quantity: 1,
      item_price: valor,
    },
  ];

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
    console.log("Evento enviado pro FB:", result);
  } catch (err) {
    console.error("Erro ao enviar pro FB:", err);
  }

  // ⚠️ Sempre responder 200, mesmo que dê erro
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
