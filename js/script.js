// ============================================
// Cambará Madeireira — interações da landing page
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  // Aguarda a tentativa de carregar os banners do CMS antes de inicializar o slider.
  await (window.CAMBARA_BANNERS_READY || Promise.resolve());
  // Ano automático no rodapé
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Menu mobile
  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");

  menuToggle?.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  });

  // Fecha o menu ao clicar em um link
  document.querySelectorAll(".menu a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });

  // Header com sombra ao rolar
  const header = document.getElementById("header");
  const updateHeader = () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Banner rotativo
  const slides = [...document.querySelectorAll(".slide")];
  const dots = [...document.querySelectorAll(".dot")];
  const prev = document.getElementById("prevSlide");
  const next = document.getElementById("nextSlide");

  let current = 0;
  let timer;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === current);
    });
    if (slides[current] && window.CAMBARA_TRACK_IMPRESSION) {
      window.CAMBARA_TRACK_IMPRESSION(slides[current]);
    }

    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === current);
    });
  }

  function startSlider() {
    clearInterval(timer);
    timer = setInterval(() => showSlide(current + 1), 6000);
  }

  prev?.addEventListener("click", () => {
    showSlide(current - 1);
    startSlider();
  });

  next?.addEventListener("click", () => {
    showSlide(current + 1);
    startSlider();
  });

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      showSlide(Number(dot.dataset.slide));
      startSlider();
    });
  });

  // Pausa o autoplay quando o mouse está sobre o banner
  const hero = document.querySelector(".hero");
  hero?.addEventListener("mouseenter", () => clearInterval(timer));
  hero?.addEventListener("mouseleave", startSlider);

  // Suporte básico a swipe no celular
  let touchStartX = 0;
  let touchEndX = 0;

  hero?.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
    clearInterval(timer);
  }, { passive: true });

  hero?.addEventListener("touchend", e => {
    touchEndX = e.changedTouches[0].screenX;
    const distance = touchEndX - touchStartX;

    if (Math.abs(distance) > 50) {
      showSlide(distance < 0 ? current + 1 : current - 1);
    }
    startSlider();
  }, { passive: true });

  startSlider();
  if (slides[current] && window.CAMBARA_TRACK_IMPRESSION) {
    window.CAMBARA_TRACK_IMPRESSION(slides[current]);
  }

  // Categorias: preenche uma mensagem de WhatsApp específica
  const whatsappBase = "https://wa.me/5595999999999?text=";

  document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;
      const message = `Olá! Gostaria de fazer um orçamento de materiais de ${category} na Cambará.`;
      card.href = whatsappBase + encodeURIComponent(message);
      card.target = "_blank";
      card.rel = "noopener";
    });
  });
});
