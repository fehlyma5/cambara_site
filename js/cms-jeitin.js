// Jeitin Cambará: carrossel de vídeos independentes da galeria de fotos e depoimentos.
(() => {
  const strip = document.getElementById("jeitinGrid");
  const dialog = document.getElementById("jeitinDialog");
  if (!strip || !dialog) return;
  const prev = document.getElementById("jeitinPrev");
  const next = document.getElementById("jeitinNext");
  const player = document.getElementById("jeitinPlayer");
  const caption = document.getElementById("jeitinDialogTitle");
  const close = document.getElementById("jeitinClose");
  let items = [];
  const updateArrows = () => {
    const max = strip.scrollWidth - strip.clientWidth;
    prev.hidden = next.hidden = max < 8;
    prev.disabled = strip.scrollLeft < 5;
    next.disabled = strip.scrollLeft >= max - 5;
  };
  const move = direction => {
    const card = strip.querySelector(".jeitin-card");
    strip.scrollBy({left: direction * (card?.offsetWidth || 280) + direction * 18, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
  };
  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  strip.addEventListener("scroll", updateArrows, {passive:true});
  window.addEventListener("resize", updateArrows);
  function hidePlayer() {
    player.pause();
    player.removeAttribute("src");
    player.load();
  }
  function openVideo(item) {
    player.src = item.video_url;
    player.load();
    caption.textContent = item.title + (item.caption ? " — " + item.caption : "");
    dialog.showModal();
  }
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", hidePlayer);
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  strip.addEventListener("click", event => {
    const button = event.target.closest("[data-jeitin-index]");
    if (button) openVideo(items[Number(button.dataset.jeitinIndex)]);
  });
  function render() {
    const fragment = document.createDocumentFragment();
    items.forEach((item,index) => {
      const article = document.createElement("article");
      article.className = "jeitin-card";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "jeitin-card__play";
      button.dataset.jeitinIndex = String(index);
      button.setAttribute("aria-label", "Assistir Jeitin Cambará: " + item.title);
      const video = document.createElement("video");
      video.src = item.video_url;
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");
      video.tabIndex = -1;
      const play = document.createElement("span");
      play.className = "jeitin-card__play-icon";
      play.textContent = "▶";
      play.setAttribute("aria-hidden", "true");
      button.append(video,play);
      const text = document.createElement("div");
      text.className = "jeitin-card__text";
      const h = document.createElement("h3"); h.textContent = item.title;
      text.append(h);
      if(item.caption){ const p = document.createElement("p"); p.textContent = item.caption; text.append(p); }
      article.append(button,text);
      fragment.append(article);
    });
    strip.replaceChildren(fragment);
    if(!items.length) {
      const empty = document.createElement("p");
      empty.className = "gallery-empty";
      empty.textContent = "Em breve, dicas do Jeitin Cambará!";
      strip.append(empty);
    }
    requestAnimationFrame(updateArrows);
  }
  async function load() {
    if(!window.supabase?.createClient || !window.CAMBARA_SUPABASE_URL || !window.CAMBARA_SUPABASE_ANON_KEY) return;
    const client=window.supabase.createClient(window.CAMBARA_SUPABASE_URL,window.CAMBARA_SUPABASE_ANON_KEY);
    const {data,error}=await client.from("jeitin_videos").select("title,caption,video_url,position").eq("active",true).order("position",{ascending:true});
    if(error){ console.warn("Jeitin Cambará: configure a tabela jeitin_videos.",error.message); return; }
    items=data || []; render();
  }
  load().catch(err => console.warn("Jeitin Cambará:",err));
  updateArrows();
})();
