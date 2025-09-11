import fetch from "node-fetch";

// Substitua pelo fbp e fbc reais que você tenha em cookies do navegador
const fbp = "fb.2.1757537928027.901085001888091063";
const fbc = "fb.1.1757537928027.1234567890"; // pode ser null se não tiver

const payload = {
  event: "PageView",
  fbp,
  ...(fbc ? { fbc } : {}),
  event_source_url: "https://gorgeous-syrniki-8951fb.netlify.app/",
  client_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
  screen_width: 1920,
  screen_height: 1080,
  language: "pt-BR",
  timezone_offset: -180,
  test_event_code: "TEST63000"
};

async function enviarEventoTeste() {
  try {
    const res = await fetch(
      "https://nextjs-boilerplate-phi-rouge-wdj2lsryyo.vercel.app/api/eventos",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const text = await res.text();
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
