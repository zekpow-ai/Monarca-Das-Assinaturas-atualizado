const crypto = require("crypto");
const fetch = require("node-fetch");

const KIWIFY_SECRET = process.env.KIWIFY_SECRET;
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.NEXT_PUBLIC_FB_TEST_CODE;

// Função para hash SHA256 de email/telefone
function hashSHA256(value) {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.toString().trim().toLowerCase()).digest("hex");
}

// Função para validar assinatura enviada pelo Kiwify
function validateSignature(signature, order) {
  const payload = JSON.stringify(order);
  const expected = crypto.createHmac("sha1", KIWIFY_SECRET).update(payload).digest("hex");
  console.log("===== VALIDAÇÃO DE ASSINATURA =====");
  console.log("Signature recebido: ", signature);
  console.log("Signature esperado: ", expected);
  console.log("===================================");
  return signature === expected;
}

exports.handler = async (event) => {
  console.log("=== Webhook recebido do Kiwify ===");
  console.log("Headers:", event.headers);
  console.log("Body:", event.body);

  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

  // ✅ Parse seguro do body, lidando com string ou objeto
  let bodyData = {};
  try {
    if (typeof event.body === "string") {
      bodyData = JSON.parse(event.body);
    } else {
      bodyData = event.body; // já é objeto
    }
  } catch (err) {
    console.error("Erro ao parsear JSON:", err);
    return { statusCode: 400, body: "Corpo inválido" };
  }

  // Pegando signature e order
  const signature = bodyData.signature || event.headers["x-signature"];
  const order = bodyData.order;

  if (!signature || !order) {
    console.error("Payload inválido: falta signature ou order");
    return { statusCode: 400, body: "Payload inválido" };
  }

  // 🔐 Validação de assinatura
  if (!validateSignature(signature, order)) {
    console.error("Assinatura inválida, rejeitando webhook");
    return { statusCode: 403, body: "Assinatura inválida" };
  }

  // Pegando dados do pedido
  const customer = order.Customer || {};
  const commissions = order.Commissions || {};
  const product = order.Product || {};

  const email = customer.email;
  const phone = customer.mobile;
  const valor = (commissions.charge_amount || 0) / 100; // converte centavos para reais
  const moeda = commissions.product_base_price_currency || "BRL";
  const id = order.order_id;

  console.log("Dados extraídos do pedido:");
  console.log({ email, phone, valor, moeda, product_id: product.product_id, order_id: id });

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
    console.log("Enviando evento para o Facebook Pixel...");
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );

    const result = await res.json();
    console.log("Resposta do Facebook Pixel:", result);
  } catch (err) {
    console.error("Erro ao enviar pro Facebook:", err);
  }

  console.log("Webhook processado com sucesso. Retornando 200 para o Kiwify.");
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
