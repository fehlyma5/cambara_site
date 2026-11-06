// Cambará CMS — categorias gerenciadas pelo painel.
window.CAMBARA_CATEGORIES_READY = (async () => {
  try {
    if (!window.CAMBARA_SUPABASE_URL || !window.CAMBARA_SUPABASE_ANON_KEY || !window.supabase?.createClient) return;
    const client=window.supabase.createClient(window.CAMBARA_SUPABASE_URL,window.CAMBARA_SUPABASE_ANON_KEY);
    const {data,error}=await client.from("categories").select("name,slug,description,image_url,icon,position").eq("active",true).order("position",{ascending:true});
    if(error || !data?.length) { if(error) console.warn("Cambará CMS: categorias não carregadas.",error.message); return; }
    const grid=document.querySelector(".category-grid");
    if(!grid) return;
    const track=document.createElement("div");
    track.className="category-track";
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
    track.append(fragment);
    // Duplica os cards para criar um loop visual contínuo sem interromper a navegação por toque.
    const cloneCards=Array.from(track.children).map(card=>{
      const clone=card.cloneNode(true);
      clone.setAttribute("aria-hidden","true");
      clone.querySelectorAll("a,button,[tabindex]").forEach(el=>el.setAttribute("tabindex","-1"));
      return clone;
    });
    cloneCards.forEach(card=>track.append(card));
    grid.replaceChildren(track);
    grid.classList.add("category-marquee");
    grid.addEventListener("focusin",()=>grid.classList.add("is-paused"));
    grid.addEventListener("focusout",event=>{if(!grid.contains(event.relatedTarget))grid.classList.remove("is-paused");});
  } catch(error) { console.warn("Cambará CMS: mantendo categorias locais.",error); }
})();