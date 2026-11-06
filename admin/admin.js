(() => {
  const $ = (id) => document.getElementById(id);
  const hasConfig = () => window.CAMBARA_SUPABASE_URL && window.CAMBARA_SUPABASE_ANON_KEY;
  let client = null;
  let currentImageUrl = "";

  function setMessage(id, message) { $(id).textContent = message || ""; }
  function showDashboard(isLoggedIn) {
    $("loginView").hidden = isLoggedIn;
    $("dashboardView").hidden = !isLoggedIn;
  }
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[char]));
  }
  function resetForm() {
    $("bannerForm").reset();
    $("bannerId").value = "";
    $("position").value = "1";
    $("campaignLabel").value = "";
    $("startsAt").value = "";
    $("endsAt").value = "";
    $("active").checked = true;
    $("imageFile").value = "";
    $("imagePreview").innerHTML = "";
    currentImageUrl = "";
    $("formTitle").textContent = "Novo banner";
    $("bannerFormPanel").hidden = true;
    setMessage("formMessage", "");
  }
  async function uploadImage(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const path = "banners/" + crypto.randomUUID() + "." + ext;
    const { error } = await client.storage.from("site-images").upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = client.storage.from("site-images").getPublicUrl(path);
    return data.publicUrl;
  }
  async function loadBanners() {
    $("bannerList").innerHTML = '<p class="muted">Carregando...</p>';
    const { data, error } = await client.from("banners").select("*").order("position", { ascending: true });
    if (error) {
      $("bannerList").innerHTML = "";
      setMessage("dashboardMessage", "Não foi possível carregar os banners: " + error.message);
      return;
    }
    if (!data.length) {
      $("bannerList").innerHTML = '<p class="muted">Nenhum banner cadastrado. Clique em “Novo banner” para começar.</p>';
      return;
    }
    $("bannerList").innerHTML = data.map(item => `
      <article class="banner-item">
        <img src="${escapeHtml(item.image_url)}" alt="">
        <div><h3>${escapeHtml(item.title)}</h3><p>Posição: ${item.position} · ${escapeHtml(item.campaign_label || item.eyebrow || "Sem campanha")}</p><span class="status ${item.active ? "" : "off"}">${item.active ? "Ativo" : "Inativo"}</span><p>Período: ${item.starts_at ? new Date(item.starts_at).toLocaleString("pt-BR") : "Sem início"} até ${item.ends_at ? new Date(item.ends_at).toLocaleString("pt-BR") : "Sem término"}</p></div>
        <div class="item-actions">
          <button class="secondary" data-edit="${item.id}">Editar</button>
          <button class="secondary" data-toggle="${item.id}" data-active="${item.active}">${item.active ? "Desativar" : "Ativar"}</button>
          <button class="secondary" data-delete="${item.id}">Excluir</button>
        </div>
      </article>`).join("");
  }
  async function editBanner(id) {
    const { data, error } = await client.from("banners").select("*").eq("id", id).single();
    if (error) return setMessage("dashboardMessage", error.message);
    $("bannerId").value = data.id;
    $("title").value = data.title || "";
    $("subtitle").value = data.subtitle || "";
    $("eyebrow").value = data.eyebrow || "";
    $("buttonText").value = data.button_text || "";
    $("buttonUrl").value = data.button_url || "";
    $("position").value = data.position || 1;
    $("campaignLabel").value = data.campaign_label || "";
    const toLocalInput = value => value ? new Date(value).toISOString().slice(0,16) : "";
    $("startsAt").value = toLocalInput(data.starts_at);
    $("endsAt").value = toLocalInput(data.ends_at);
    $("active").checked = !!data.active;
    currentImageUrl = data.image_url || "";
    $("imagePreview").innerHTML = currentImageUrl ? `<img src="${escapeHtml(currentImageUrl)}" alt="Imagem atual do banner">` : "";
    $("formTitle").textContent = "Editar banner";
    $("bannerFormPanel").hidden = false;
    $("bannerFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function saveBanner(event) {
    event.preventDefault();
    setMessage("formMessage", "Salvando...");
    try {
      const file = $("imageFile").files[0];
      let imageUrl = currentImageUrl;
      if (file) imageUrl = await uploadImage(file);
      if (!imageUrl) throw new Error("Selecione uma imagem para o banner.");
      const startValue = $("startsAt").value;
      const endValue = $("endsAt").value;
      if (startValue && endValue && new Date(endValue) <= new Date(startValue)) {
        throw new Error("A data de término precisa ser posterior à data de início.");
      }
      const payload = {
        campaign_label: $("campaignLabel").value.trim() || null,
        starts_at: startValue ? new Date(startValue).toISOString() : null,
        ends_at: endValue ? new Date(endValue).toISOString() : null,
        title: $("title").value.trim(),
        subtitle: $("subtitle").value.trim(),
        eyebrow: $("eyebrow").value.trim(),
        button_text: $("buttonText").value.trim(),
        button_url: $("buttonUrl").value.trim(),
        image_url: imageUrl,
        position: Number($("position").value),
        active: $("active").checked,
        updated_at: new Date().toISOString()
      };
      const id = $("bannerId").value;
      const query = id
        ? client.from("banners").update(payload).eq("id", id)
        : client.from("banners").insert(payload);
      const { error } = await query;
      if (error) throw error;
      resetForm();
      setMessage("dashboardMessage", "Banner salvo com sucesso.");
      await loadBanners();
    } catch (error) { setMessage("formMessage", error.message || "Erro ao salvar banner."); }
  }
  async function handleListClick(event) {
    const editId = event.target.dataset.edit;
    const toggleId = event.target.dataset.toggle;
    const deleteId = event.target.dataset.delete;
    if (editId) return editBanner(editId);
    if (toggleId) {
      const active = event.target.dataset.active === "true";
      const { error } = await client.from("banners").update({ active: !active, updated_at: new Date().toISOString() }).eq("id", toggleId);
      if (error) setMessage("dashboardMessage", error.message);
      else await loadBanners();
    }
    if (deleteId && confirm("Tem certeza de que deseja excluir este banner?")) {
      const { error } = await client.from("banners").delete().eq("id", deleteId);
      if (error) setMessage("dashboardMessage", error.message);
      else { setMessage("dashboardMessage", "Banner excluído."); await loadBanners(); }
    }
  }
  async function init() {
    if (!hasConfig()) {
      setMessage("loginMessage", "Configure a URL e a chave pública do Supabase no arquivo admin/config.js para ativar o painel.");
      $("loginForm").querySelector("button").disabled = true;
      return;
    }
    if (!window.supabase?.createClient) {
      setMessage("loginMessage", "Não foi possível carregar a biblioteca do Supabase. Verifique sua conexão.");
      return;
    }
    client = window.supabase.createClient(window.CAMBARA_SUPABASE_URL, window.CAMBARA_SUPABASE_ANON_KEY);
    const { data } = await client.auth.getSession();
    if (data.session) { showDashboard(true); await loadBanners(); }
  }
  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!client) return;
    setMessage("loginMessage", "Entrando...");
    const { error } = await client.auth.signInWithPassword({ email: $("email").value, password: $("password").value });
    if (error) return setMessage("loginMessage", error.message);
    showDashboard(true); setMessage("loginMessage", ""); await loadBanners();
  });
  $("logoutButton").addEventListener("click", async () => { await client.auth.signOut(); showDashboard(false); });
  $("newBannerButton").addEventListener("click", () => { resetForm(); $("bannerFormPanel").hidden = false; });
  $("cancelEditButton").addEventListener("click", resetForm);
  $("cancelFormButton").addEventListener("click", resetForm);
  $("bannerForm").addEventListener("submit", saveBanner);
  $("bannerList").addEventListener("click", handleListClick);
  $("refreshButton").addEventListener("click", loadBanners);
  $("imageFile").addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) $("imagePreview").innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Prévia da imagem selecionada">`;
  });
  init();
})();