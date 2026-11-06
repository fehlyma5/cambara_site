// Cambará CMS — aplica configurações públicas de contato e apresentação.
window.CAMBARA_SETTINGS_READY = (async () => {
  try {
    if (!window.CAMBARA_SUPABASE_URL || !window.CAMBARA_SUPABASE_ANON_KEY || !window.supabase?.createClient) return;
    const client=window.supabase.createClient(window.CAMBARA_SUPABASE_URL,window.CAMBARA_SUPABASE_ANON_KEY);
    const {data,error}=await client.from("site_settings").select("*").eq("id",1).maybeSingle();
    if(error || !data) { if(error) console.warn("Cambará CMS: configurações não carregadas.",error.message); return; }

    const phone=String(data.whatsapp_phone || "").replace(/\D/g,"");
    const defaultMessage=data.whatsapp_message || "Olá! Vim pelo site da Cambará e quero fazer um orçamento.";
    window.CAMBARA_WHATSAPP_PHONE=phone;
    window.CAMBARA_WHATSAPP_MESSAGE=defaultMessage;
    window.CAMBARA_WHATSAPP_URL=(text=defaultMessage)=>"https://wa.me/"+phone+"?text="+encodeURIComponent(text);
    const message=encodeURIComponent(defaultMessage);
    if(phone) {
      document.querySelectorAll('a[href*="wa.me/"]').forEach(link=>{
        link.href="https://wa.me/"+phone+"?text="+message;
      });
    }

    const socialMap={youtube:"youtube_url",instagram:"instagram_url",facebook:"facebook_url",tiktok:"tiktok_url"};
    Object.entries(socialMap).forEach(([network,key])=>{
      const link=document.querySelector('.socials a[aria-label="'+network.charAt(0).toUpperCase()+network.slice(1)+'"]');
      if(link && data[key]) {
        try { const url=new URL(data[key]); if(["https:","http:"].includes(url.protocol)) link.href=url.href; } catch {}
      }
    });

    const about=document.querySelector(".about-content");
    if(about) {
      const heading=about.querySelector("h2");
      const paragraphs=about.querySelectorAll(":scope > p");
      if(heading && data.about_title) heading.textContent=data.about_title;
      if(paragraphs[0] && data.about_text) paragraphs[0].textContent=data.about_text;
      if(paragraphs[1] && data.about_extra) paragraphs[1].textContent=data.about_extra;
    }
  } catch(error) { console.warn("Cambará CMS: mantendo conteúdo institucional local.",error); }
})();