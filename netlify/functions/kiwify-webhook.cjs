const fetch = require("node-fetch");
const crypto = require("crypto");

const KIWIFY_TOKEN = process.env.KIWIFY_TOKEN;
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.NEXT_PUBLIC_FB_TEST_CODE;

function hashSHA256(value) {
  return crypto.createHash("sha256").update(value.toString().trim().toLowerCase()).digest("hex");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

  const tokenHeader = event.headers["authorization"] || event.headers["Authorization"];
  const tokenRecebido = tokenHeader?.split(" ")[1] || event.queryStringParameters?.token;
  if (tokenRecebido !== KIWIFY_TOKEN) return { statusCode: 403, body: "Token inválido" };

  let bodyData;
  try {
    bodyData = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Corpo inválido" };
  }

  const { email, phone, valor, moeda = "BRL", produtos = [], id } = bodyData;

  const contents = produtos.map(p => ({
    id: p.id || p.nome,
    quantity: p.quantidade || 1,
    item_price: p.preco || 0
  }));

  const eventData = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: "https://seudominio.com",
        action_source: "website",
        event_id: id,
        user_data: {
          ...(email ? { em: hashSHA256(email) } : {}),
          ...(phone ? { ph: hashSHA256(phone) } : {})
        },
        custom_data: {
          currency: moeda,
          value: valor,
          contents,
          content_type: "product"
        }
      }
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {})
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData)
    });

    const result = await res.json();
    console.log("Evento enviado:", result);
  } catch (err) {
    console.error("Erro:", err);
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
