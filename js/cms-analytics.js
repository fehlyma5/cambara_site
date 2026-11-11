// Cambará — métricas anônimas de campanhas.
(() => {
  if (!window.CAMBARA_SUPABASE_URL || !window.CAMBARA_SUPABASE_ANON_KEY || !window.supabase?.createClient) return;
  const db=window.supabase.createClient(window.CAMBARA_SUPABASE_URL,window.CAMBARA_SUPABASE_ANON_KEY);
  const seen=new Set();
  let timer=null;
  let visible=false;

  async function record(eventType, slide=null, label=null) {
    const payload={
      event_type:eventType,
      banner_id:slide?.dataset?.bannerId || null,
      campaign_label:label || slide?.dataset?.campaignLabel || null,
      page_path:location.pathname
    };
    const {error}=await db.from("campaign_events").insert(payload);
    if(error) console.warn("Cambará métricas:",error.message);
  }

  function trackActive() {
    clearTimeout(timer);
    if(!visible || document.visibilityState!=="visible") return;
    const slide=document.querySelector(".slide.active");
    const id=slide?.dataset?.bannerId;
    if(!id || seen.has(id)) return;
    timer=setTimeout(()=>{
      if(!visible || document.visibilityState!=="visible" || !slide.classList.contains("active")) return;
      seen.add(id);
      record("impression",slide);
    },1000);
  }

  const hero=document.querySelector(".hero");
  if(hero && "IntersectionObserver" in window) {
    const observer=new IntersectionObserver(entries=>{
      visible=entries.some(entry=>entry.isIntersecting && entry.intersectionRatio>=0.5);
      trackActive();
    },{threshold:[0,0.5,1]});
    observer.observe(hero);
  } else visible=true;

  const slides=document.querySelector(".slides");
  if(slides) new MutationObserver(trackActive).observe(slides,{subtree:true,attributes:true,attributeFilter:["class"]});
  document.addEventListener("visibilitychange",trackActive);
  window.addEventListener("load",trackActive);

  document.addEventListener("click",event=>{
    const category=event.target.closest(".category-card");
    if(category) {
      record("whatsapp_click",null,"Categoria: "+(category.dataset.category || "não identificada"));
      return;
    }
    const link=event.target.closest("a");
    if(!link) return;
    let url;
    try { url=new URL(link.href,location.href); } catch { return; }
    const slide=link.closest(".slide");
    if(slide && link.classList.contains("slide-click-overlay")) {
      record("banner_click",slide);
      const isWhatsApp=url.hostname==="wa.me" || url.hostname.endsWith(".whatsapp.com");
      if(isWhatsApp) record("whatsapp_click",slide,"WhatsApp — "+(slide.dataset.campaignLabel || "banner"));
      return;
    }
    const isWhatsApp=url.hostname==="wa.me" || url.hostname.endsWith(".whatsapp.com");
    if(isWhatsApp) {
      record("whatsapp_click",slide,slide ? null : "WhatsApp do site");
      return;
    }
    if(slide) record("banner_click",slide);
  },true);
  trackActive();
})();