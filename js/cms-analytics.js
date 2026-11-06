// Cambará CMS — métricas simples, sem cookies ou identificação pessoal.
(() => {
  let client = null;
  try {
    if (window.CAMBARA_SUPABASE_URL && window.CAMBARA_SUPABASE_ANON_KEY && window.supabase?.createClient) {
      client = window.supabase.createClient(window.CAMBARA_SUPABASE_URL, window.CAMBARA_SUPABASE_ANON_KEY);
    }
  } catch (error) { console.warn("Cambará métricas: cliente indisponível.", error); }

  const recordedImpressions = new Set();
  const pendingTimers = new Map();

  async function record(type, slide = null) {
    if (!client) return;
    const payload = {
      event_type: type,
      banner_id: slide?.dataset?.bannerId || null,
      campaign_label: slide?.dataset?.campaignLabel || null,
      page_path: window.location.pathname
    };
    try {
      const { error } = await client.from("campaign_events").insert(payload);
      if (error) console.warn("Cambará métricas: evento não registrado.", error.message);
    } catch (error) { console.warn("Cambará métricas: falha ao registrar evento.", error); }
  }

  window.CAMBARA_TRACK_IMPRESSION = (slide) => {
    const id = slide?.dataset?.bannerId;
    if (!id || recordedImpressions.has(id) || pendingTimers.has(id)) return;
    const timer = window.setTimeout(() => {
      pendingTimers.delete(id);
      if (!slide.classList.contains("active") || document.visibilityState !== "visible") return;
      recordedImpressions.add(id);
      record("impression", slide);
    }, 1000);
    pendingTimers.set(id, timer);
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    let destination;
    try { destination = new URL(link.href, window.location.href); } catch { return; }
    const isWhatsapp = destination.hostname === "wa.me" || destination.hostname.endsWith(".whatsapp.com");
    if (isWhatsapp) {
      record("whatsapp_click", link.closest(".slide"));
      return;
    }
    const slide = link.closest(".slide");
    if (slide && link.closest(".hero-content")) record("banner_click", slide);
  }, true);
})();