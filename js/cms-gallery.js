// Cambará CMS — galeria pública de fotos e depoimentos em vídeo.
window.CAMBARA_GALLERY_READY = (async () => {
  try {
    if (!window.CAMBARA_SUPABASE_URL || !window.CAMBARA_SUPABASE_ANON_KEY || !window.supabase?.createClient) return;
    const client=window.supabase.createClient(window.CAMBARA_SUPABASE_URL,window.CAMBARA_SUPABASE_ANON_KEY);
    const {data,error}=await client.from("gallery_photos").select("title,caption,image_url,media_type,position").eq("active",true).order("position",{ascending:true});
    if(error) { console.warn("Cambará CMS: galeria não carregada.",error.message); return; }
    const grid=document.getElementById("galleryGrid");
    if(!grid || !data?.length) return;
    const fragment=document.createDocumentFragment();
    data.forEach(item=>{
      const figure=document.createElement("figure");
      figure.className="gallery-card"+(item.media_type==="video" ? " gallery-video-card" : "");
      if(item.media_type==="video") {
        const video=document.createElement("video");
        video.src=item.image_url; video.controls=true; video.playsInline=true; video.preload="metadata";
        video.setAttribute("aria-label",item.title || "Depoimento em vídeo da Cambará"); figure.append(video);
      } else {
        const image=document.createElement("img");
        image.src=item.image_url; image.alt=item.title || "Foto da Cambará"; image.loading="lazy"; figure.append(image);
      }
      const caption=document.createElement("figcaption");
      const title=document.createElement("strong"); title.textContent=item.title || ""; caption.append(title);
      if(item.caption) { const p=document.createElement("p"); p.textContent=item.caption; caption.append(p); }
      figure.append(caption); fragment.append(figure);
    });
    grid.replaceChildren(fragment);
  } catch(error) { console.warn("Cambará CMS: mantendo galeria vazia.",error); }
})();