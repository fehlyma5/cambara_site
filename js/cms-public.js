// Cambará CMS — carrega os banners publicados no Supabase.
// Se o CMS estiver indisponível ou ainda não houver banners ativos, mantém os slides locais.
window.CAMBARA_BANNERS_READY = (async () => {
  try {
    if (!window.CAMBARA_SUPABASE_URL || !window.CAMBARA_SUPABASE_ANON_KEY || !window.supabase?.createClient) return;
    const client = window.supabase.createClient(
      window.CAMBARA_SUPABASE_URL,
      window.CAMBARA_SUPABASE_ANON_KEY
    );
    const { data, error } = await client
      .from("banners")
      .select("title, subtitle, eyebrow, button_text, button_url, image_url, mobile_image_url, position, campaign_label, id, starts_at, ends_at, display_text")
      .eq("active", true)
      .or("starts_at.is.null,starts_at.lte." + new Date().toISOString())
      .or("ends_at.is.null,ends_at.gte." + new Date().toISOString())
      .order("position", { ascending: true });

    if (error || !data?.length) {
      if (error) console.warn("Cambará CMS: não foi possível carregar banners.", error.message);
      return;
    }

    const hero = document.querySelector(".hero");
    const slidesContainer = hero?.querySelector(".slides");
    const dotsContainer = document.getElementById("sliderDots");
    if (!slidesContainer || !dotsContainer) return;

    const validBanners = data.filter(item => {
      try {
        const image = new URL(item.image_url);
        return ["https:", "http:"].includes(image.protocol) && item.title;
      } catch { return false; }
    });
    if (!validBanners.length) return;

    const escapeText = value => String(value ?? "");
    slidesContainer.replaceChildren();
    dotsContainer.replaceChildren();

    validBanners.forEach((banner, index) => {
      const slide = document.createElement("article");
      slide.className = index === 0 ? "slide active" : "slide";
      slide.dataset.bannerId = banner.id || "";
      slide.dataset.campaignLabel = banner.campaign_label || banner.title || "";

      const background = document.createElement("div");
      background.className = "slide-bg";
      const desktopLayer = "url(" + JSON.stringify(banner.image_url) + ")";
      const mobileLayer = "url(" + JSON.stringify(banner.mobile_image_url || banner.image_url) + ")";
      const overlay = banner.display_text === false
        ? ""
        : "linear-gradient(90deg, rgba(17,12,8,.82), rgba(17,12,8,.30)), ";
      background.style.setProperty("--banner-desktop-image", overlay + desktopLayer);
      background.style.setProperty("--banner-mobile-image", overlay + mobileLayer);

      const content = document.createElement("div");
      content.className = "container hero-content";
      if (banner.display_text === false) {
        content.hidden = true;
      }

      if (banner.display_text !== false && banner.eyebrow) {
        const eyebrow = document.createElement("span");
        eyebrow.className = "eyebrow";
        eyebrow.textContent = escapeText(banner.eyebrow);
        content.append(eyebrow);
      }

      if (banner.display_text !== false) {
        const title = document.createElement("h1");
        title.textContent = escapeText(banner.title);
        content.append(title);
      }

      if (banner.display_text !== false && banner.subtitle) {
        const subtitle = document.createElement("p");
        subtitle.textContent = escapeText(banner.subtitle);
        content.append(subtitle);
      }

      if (banner.display_text !== false && banner.button_text && banner.button_url) {
        try {
          const url = new URL(banner.button_url);
          if (["https:", "http:"].includes(url.protocol)) {
            const actions = document.createElement("div");
            actions.className = "hero-actions";
            const button = document.createElement("a");
            button.className = "btn btn-primary";
            button.href = url.href;
            button.textContent = escapeText(banner.button_text);
            if (url.hostname !== location.hostname) {
              button.target = "_blank";
              button.rel = "noopener noreferrer";
            }
            actions.append(button);
            content.append(actions);
          }
        } catch { /* Link inválido: não exibe o botão. */ }
      }

      slide.append(background, content);
      slidesContainer.append(slide);

      const dot = document.createElement("button");
      dot.className = index === 0 ? "dot active" : "dot";
      dot.dataset.slide = String(index);
      dot.setAttribute("aria-label", "Banner " + (index + 1));
      dotsContainer.append(dot);
    });
  } catch (error) {
    console.warn("Cambará CMS: mantendo banners locais.", error);
  }
})();