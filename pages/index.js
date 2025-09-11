import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp(name + "=([^;]+)"));
      return match ? match[1] : null;
    };

    const fbp = getCookie("_fbp");
    const fbc = getCookie("_fbc");

    if (!fbp) {
      console.warn("⚠️ Cookie _fbp não encontrado. Evento não enviado.");
      return;
    }

    const payload = {
      event: "PageView",
      fbp,
      ...(fbc ? { fbc } : {}),
      event_source_url: window.location.href,
      client_user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language,
      timezone_offset: new Date().getTimezoneOffset(),
    };

    fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        try {
          const data = await res.json();
          console.log("✅ Evento PageView enviado:", data);
        } catch (e) {
          console.warn("⚠️ Resposta da API não é JSON:", await res.text());
        }
      })
      .catch((err) => console.error("❌ Erro ao enviar evento:", err));
  }, []);

  return <h1>🚀 Projeto Monarca rodando com API de Conversões!</h1>;
}
