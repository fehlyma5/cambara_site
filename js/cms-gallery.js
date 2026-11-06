// Cambará CMS — galeria pública de fotos institucionais.
window.CAMBARA_GALLERY_READY = (async () => {
  try {
    if (!window.CAMBARA_SUPABASE_URL || !window.CAMBARA_SUPABASE_ANON_KEY || !window.supabase?.createClient) return;
    const client=window.supabase.createClient(window.CAMBARA_SUPABASE_URL,window.CAMBARA_SUPABASE_ANON_KEY);
    const {data,error}=await client.from("gallery_photos").select("title,caption,image_url,position").eq("active",true).order("position",{ascending:true});
    if(error) { console.warn("Cambará CMS: galeria não carregada.",error.message); return; }
    const grid=document.getElementById("galleryGrid");
    if(!grid || !data?.length) return;
    const fragment=document.createDocumentFragment();
    data.forEach(photo=>{
      const figure=document.createElement("figure");
      figure.className="gallery-card";
      const image=document.createElement("img");
      image.src=photo.image_url;
      image.alt=photo.title || "Foto da Cambará";
      image.loading="lazy";
      figure.append(image);
      const caption=document.createElement("figcaption");
      const title=document.createElement("strong");
      title.textContent=photo.title || "";
      caption.append(title);
      if(photo.caption) { const p=document.createElement("p"); p.textContent=photo.caption; caption.append(p); }
      figure.append(caption);
      fragment.append(figure);
    });
    grid.replaceChildren(fragment);
  } catch(error) { console.warn("Cambará CMS: mantendo galeria vazia.",error); }
})();