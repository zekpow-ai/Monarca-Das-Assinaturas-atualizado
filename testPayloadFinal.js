// testPayloadFinal.js
import fetch from "node-fetch";
import crypto from "crypto";

// Função para gerar hash SHA256 para dados pessoais
const hashSHA256 = (value) =>
  crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

// Dados simulados de teste
const payload = {
  event: "PageView",
  fbp: "fb.2.1757537928027.901085001888091063",
  fbc: "fb.1.1757537928027.1234567890", // simula clique
  client_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
  event_source_url: "https://gorgeous-syrniki-8951fb.netlify.app/",
  screen_width: 1920,
  screen_height: 1080,
  language: "pt-BR",
  timezone_offset: -180,
  email: "teste@dominio.com",
  phone: "5511999999999",
  first_name: "Usuario",
  last_name: "Teste",
  external_id: "IDexterno123",
  fb_login_id: "FBlogin123",
  test_event_code: "TEST63000",
};

async function enviarEventoTeste() {
  try {
    const response = await fetch("http://localhost:3000/api/eventos", { // ou sua URL Vercel
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

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
