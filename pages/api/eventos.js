// pages/api/eventos.js
import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método não permitido" });

  const {
    event, // "PageView", "Purchase", etc.
    fbp,
    fbc,
    event_source_url,
    client_user_agent,
    currency,
    value,
    contents,
    event_id,
    test_event_code,
    email, // opcional, só se disponível
    phone, // opcional, só se disponível
    external_id, // opcional, só se disponível
  } = req.body;

  if (!event) {
    return res.status(400).json({ error: "Evento não informado" });
  }

  const PIXEL_ID = process.env.FB_PIXEL_ID;
  const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

  const client_ip_address =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  // Se o front não mandar, gera um fallback
  const final_event_id = event_id || "evt_" + Date.now();

  // 🔑 user_data básico (sempre presente)
  const user_data = {
    fbp: fbp || undefined,
    fbc: fbc || undefined,
    client_ip_address,
    client_user_agent: client_user_agent || req.headers["user-agent"],
  };

  // 👉 Se for evento de compra/checkout e tiver dados, adiciona
  if (["Purchase", "InitiateCheckout"].includes(event)) {
    if (email) {
      user_data.em = [crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex")];
    }
    if (phone) {
      // Normaliza removendo símbolos
      const cleanPhone = phone.replace(/\D/g, "");
      user_data.ph = [crypto.createHash("sha256").update(cleanPhone).digest("hex")];
    }
    if (external_id) {
      user_data.external_id = external_id;
    }
  }

  const payload = {
    data: [
      {
        event_name: event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: final_event_id,
        action_source: "website",
        event_source_url: event_source_url || null,
        user_data,
        ...(value && currency
          ? {
              custom_data: {
                currency,
                value,
                ...(contents ? { contents } : {}),
              },
            }
          : {}),
        ...(test_event_code ? { test_event_code } : {}),
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawResponse: text };
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error("❌ Erro ao enviar evento:", err);
    return res.status(500).json({ error: "Erro ao enviar evento" });
  }
}
