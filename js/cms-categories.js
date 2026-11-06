// Cambará CMS — categorias gerenciadas pelo painel.
window.CAMBARA_CATEGORIES_READY = (async () => {
  try {
    if (!window.CAMBARA_SUPABASE_URL || !window.CAMBARA_SUPABASE_ANON_KEY || !window.supabase?.createClient) return;
    const client=window.supabase.createClient(window.CAMBARA_SUPABASE_URL,window.CAMBARA_SUPABASE_ANON_KEY);
    const {data,error}=await client.from("categories").select("name,slug,description,image_url,icon,position").eq("active",true).order("position",{ascending:true});
    if(error || !data?.length) { if(error) console.warn("Cambará CMS: categorias não carregadas.",error.message); return; }
    const grid=document.querySelector(".category-grid");
    if(!grid) return;
    const fragment=document.createDocumentFragment();
    data.forEach(category=>{
      const card=document.createElement("a");
      card.className="category-card";
      card.href="#contato";
      card.dataset.category=category.name;
      if(category.image_url) {
        const image=document.createElement("img");
        image.className="category-photo";
        image.src=category.image_url;
        image.alt=category.name;
        image.loading="lazy";
        card.append(image);
      } else {
        const iconBox=document.createElement("div");
        iconBox.className="category-icon";
        const icon=document.createElement("i");
        icon.className=category.icon || "fa-solid fa-layer-group";
        iconBox.append(icon);
        card.append(iconBox);
      }
      const title=document.createElement("h3"); title.textContent=category.name; card.append(title);
      const description=document.createElement("p"); description.textContent=category.description || ""; card.append(description);
      const action=document.createElement("span"); action.textContent="Solicitar orçamento ";
      const arrow=document.createElement("i"); arrow.className="fa-solid fa-arrow-right"; action.append(arrow); card.append(action);
      fragment.append(card);
    });
    grid.replaceChildren(fragment);
  } catch(error) { console.warn("Cambará CMS: mantendo categorias locais.",error); }
})();