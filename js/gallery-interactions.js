/* Controles públicos das fotos: mantém o carregamento do Supabase no cms-gallery.js */
(() => {
  const strip = document.getElementById("galleryPhotosGrid");
  const dialog = document.getElementById("cambaraPhotoLightbox");
  const prev = document.getElementById("cambaraGalleryPrev");
  const next = document.getElementById("cambaraGalleryNext");
  if (!strip || !dialog || !prev || !next || typeof dialog.showModal !== "function") return;

  const imageView = document.getElementById("cambaraLightboxImage");
  const captionView = document.getElementById("cambaraLightboxCaption");
  const counterView = document.getElementById("cambaraLightboxCounter");
  const close = document.getElementById("cambaraLightboxClose");
  const prevPhoto = document.getElementById("cambaraLightboxPrev");
  const nextPhoto = document.getElementById("cambaraLightboxNext");
  if (!imageView || !captionView || !counterView || !close || !prevPhoto || !nextPhoto) return;

  const photos = () => [...strip.querySelectorAll(".gallery-card img")];
  let index = 0;
  let touchX = null;

  function updateArrows() {
    const max = strip.scrollWidth - strip.clientWidth;
    const hasOverflow = max > 8;
    prev.hidden = next.hidden = !hasOverflow;
    prev.disabled = !hasOverflow || strip.scrollLeft <= 4;
    next.disabled = !hasOverflow || strip.scrollLeft >= max - 4;
  }

  function moveStrip(direction) {
    const card = strip.querySelector(".gallery-card");
    const distance = card ? card.getBoundingClientRect().width + 18 : strip.clientWidth * .8;
    strip.scrollBy({ left: direction * distance, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function showPhoto(nextIndex) {
    const list = photos();
    if (!list.length) return;
    index = (nextIndex + list.length) % list.length;
    const selected = list[index];
    const figure = selected.closest("figure");
    const title = figure?.querySelector("figcaption strong")?.textContent?.trim() || selected.alt || "Foto institucional";
    const description = figure?.querySelector("figcaption p")?.textContent?.trim();
    imageView.src = selected.currentSrc || selected.src;
    imageView.alt = selected.alt || title;
    captionView.textContent = description ? title + " — " + description : title;
    counterView.textContent = (index + 1) + " / " + list.length;
    prevPhoto.hidden = nextPhoto.hidden = list.length < 2;
  }

  function openPhoto(img) {
    const idx = photos().indexOf(img);
    if (idx < 0) return;
    showPhoto(idx);
    if (!dialog.open) dialog.showModal();
  }

  prev.addEventListener("click", () => moveStrip(-1));
  next.addEventListener("click", () => moveStrip(1));
  strip.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);

  function enhanceImages() {
    photos().forEach(img => {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Ampliar foto: " + (img.alt || "foto institucional"));
    });
    updateArrows();
  }
  new MutationObserver(enhanceImages).observe(strip, { childList: true });
  enhanceImages();

  strip.addEventListener("click", event => {
    const img = event.target.closest(".gallery-card img");
    if (img && strip.contains(img)) openPhoto(img);
  });
  strip.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches(".gallery-card img")) {
      event.preventDefault();
      openPhoto(event.target);
    }
  });

  close.addEventListener("click", () => dialog.close());
  prevPhoto.addEventListener("click", () => showPhoto(index - 1));
  nextPhoto.addEventListener("click", () => showPhoto(index + 1));
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") { event.preventDefault(); showPhoto(index - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); showPhoto(index + 1); }
  });
  dialog.addEventListener("touchstart", event => { touchX = event.changedTouches[0]?.screenX ?? null; }, { passive: true });
  dialog.addEventListener("touchend", event => {
    if (touchX === null) return;
    const difference = event.changedTouches[0].screenX - touchX;
    touchX = null;
    if (Math.abs(difference) > 55) showPhoto(index + (difference < 0 ? 1 : -1));
  }, { passive: true });
  dialog.addEventListener("close", () => { imageView.removeAttribute("src"); });
})();
