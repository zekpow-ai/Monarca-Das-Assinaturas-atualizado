// pages/api/eventos.js
import crypto from "crypto";

// ⚠️ Usamos fetch nativo do Node.js 18+ (Vercel já suporta)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const {
    event,
    fbc,
    fbp,
    event_source_url,
    client_user_agent,
    screen_width,
    screen_height,
    language,
    timezone_offset,
    test_event_code,
  } = req.body;

  if (!event || !fbp) {
    return res.status(400).json({ error: "Evento ou FBP não informado" });
  }

  const PIXEL_ID = "2239369116525127";
  const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN; // ⚠️ Puxa do ambiente seguro da Vercel

  const client_ip_address =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  const event_id = crypto.randomUUID();

  const payload = {
    data: [
      {
        event_name: event,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: event_source_url || null,
        event_id,
        user_data: {
          fbp,
          ...(fbc ? { fbc } : {}),
          client_ip_address,
          client_user_agent: client_user_agent || req.headers["user-agent"],
        },
        custom_data: {
          referrer: req.headers.referer || null,
          screen_width: screen_width || null,
          screen_height: screen_height || null,
          language: language || null,
          timezone_offset: timezone_offset || null,
        },
        ...(test_event_code ? { test_event_code } : {}),
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
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

    return res.status(200).json(data);
  } catch (err) {
    console.error("Erro ao enviar evento:", err);
    return res.status(500).json({ error: "Erro ao enviar evento" });
  }
}
