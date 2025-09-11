// testPayloadFinal.js
import fetch from "node-fetch";

// Substitua pelos cookies reais de fbp e fbc, se tiver
const fbp = "fb.2.1757537928027.901085001888091063";
const fbc = "fb.1.1757537928027.1234567890"; // pode ser null se não tiver

// Payload do evento PageView para testar
const payload = {
  event: "PageView",
  fbp,
  ...(fbc ? { fbc } : {}),
  event_source_url: "https://gorgeous-syrniki-8951fb.netlify.app/",
  client_user_agent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
  screen_width: 1920,
  screen_height: 1080,
  language: "pt-BR",
  timezone_offset: -180,
  test_event_code: "TEST63000" // 🔹 Test Events Meta
};

async function enviarEventoTeste() {
  try {
    const response = await fetch(
      "https://nextjs-boilerplate-phi-rouge-wdj2lsryyo.vercel.app/api/eventos", // URL da sua API Vercel
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawResponse: text };
    }

    console.log("✅ Evento de teste enviado:", data);
  } catch (err) {
    console.error("❌ Erro ao enviar evento:", err);
  }
}

enviarEventoTeste();
