// Cambará CMS — exibe depoimentos em vídeo; fotos históricas ficam arquivadas no CMS.
window.CAMBARA_GALLERY_READY = (async () => {
  try {
    if (!window.CAMBARA_SUPABASE_URL || !window.CAMBARA_SUPABASE_ANON_KEY || !window.supabase?.createClient) return;
    const client = window.supabase.createClient(window.CAMBARA_SUPABASE_URL, window.CAMBARA_SUPABASE_ANON_KEY);
    const { data, error } = await client.from("gallery_photos").select("title,caption,image_url,media_type,position").eq("active", true).order("position", { ascending: true });
    if (error) { console.warn("Cambará CMS: galeria não carregada.", error.message); return; }
    const videoGrid = document.getElementById("galleryGrid");
    if (!videoGrid) return;
    const videos = (data || []).filter(item => item.media_type === "video");
    const makeCaption = item => {
      const caption = document.createElement("figcaption");
      const title = document.createElement("strong"); title.textContent = item.title || ""; caption.append(title);
      if (item.caption) { const p = document.createElement("p"); p.textContent = item.caption; caption.append(p); }
      return caption;
    };
    const videoFragment = document.createDocumentFragment();
    videos.forEach(item => {
      const figure = document.createElement("figure"); figure.className = "testimonial-card";
      const tv = document.createElement("div"); tv.className = "testimonial-tv";
      const screen = document.createElement("div"); screen.className = "testimonial-tv-screen";
      const video = document.createElement("video");
      video.src = item.image_url; video.controls = true; video.playsInline = true; video.preload = "metadata";
      video.setAttribute("aria-label", item.title || "Depoimento em vídeo da Cambará");
      screen.append(video); tv.append(screen);
      const brand = document.createElement("span"); brand.className = "testimonial-tv-brand"; brand.textContent = "CAMBARÁ";
      tv.append(brand);
      figure.append(tv, makeCaption(item)); videoFragment.append(figure);
    });
    videoGrid.replaceChildren(videoFragment);
    if (!videos.length) videoGrid.innerHTML = '<p class="gallery-empty">Em breve, novos depoimentos de clientes.</p>';
  } catch (error) { console.warn("Cambará CMS: mantendo galerias padrão.", error); }
})();