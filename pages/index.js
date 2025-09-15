// pages/index.js
import { useEffect } from "react";

export default function Home() {
  // Função para ler cookies
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(name + "=([^;]+)"));
    return match ? match[1] : null;
  };

  // Função para enviar evento para API
  const sendEvent = (eventName, extraData = {}) => {
    const fbp = getCookie("_fbp");
    const fbc = getCookie("_fbc");

    const payload = {
      event: eventName,
      fbp: fbp || null,
      fbc: fbc || null,
      event_source_url: window.location.href,
      client_user_agent: navigator.userAgent,
      event_id: eventName + "_" + Date.now(),
      ...extraData,
    };

    fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => console.log(`✅ Evento ${eventName} enviado:`, data))
      .catch((err) => console.error(`❌ Erro ao enviar evento ${eventName}:`, err));
  };

  // Envia PageView ao carregar a página
  useEffect(() => {
    sendEvent("PageView");
  }, []);

  // Envia ViewContent ou Purchase opcional ao clicar no botão
  const handleClick = () => {
    // Exemplo: ViewContent (interesse no produto)
    sendEvent("ViewContent");

    // Se quiser simular uma compra de teste (sem dados reais), pode descomentar:
    /*
    sendEvent("Purchase", {
      currency: "BRL",
      value: 199.9,
      contents: [{ id: "produto_123", quantity: 1, item_price: 199.9 }],
    });
    */
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>🚀 Monarca + Conversions API</h1>
      <p>Abra o console do navegador para ver o log dos eventos.</p>

      <button
        onClick={handleClick}
        style={{
          marginTop: 20,
          padding: "12px 24px",
          background: "#06b6d4",
          border: "none",
          borderRadius: 8,
          color: "#fff",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Ver Produto / Ir para Checkout
      </button>
    </div>
  );
}
