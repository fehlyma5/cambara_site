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
    $("displayText").checked = true;
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
        <div><h3>${escapeHtml(item.title)}</h3><p>Posição: ${item.position} · ${escapeHtml(item.campaign_label || item.eyebrow || "Sem campanha")}</p><span class="status ${!item.active || (item.starts_at && new Date(item.starts_at) > new Date()) || (item.ends_at && new Date(item.ends_at) < new Date()) ? "off" : ""}">${!item.active ? "Desativado" : item.starts_at && new Date(item.starts_at) > new Date() ? "Agendado" : item.ends_at && new Date(item.ends_at) < new Date() ? "Encerrado" : "Publicado"}</span><p>Período: ${item.starts_at ? new Date(item.starts_at).toLocaleString("pt-BR") : "Sem início"} até ${item.ends_at ? new Date(item.ends_at).toLocaleString("pt-BR") : "Sem término"}</p></div>
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
    const toLocalInput = value => {
      if (!value) return "";
      const date = new Date(value);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0,16);
    };
    $("startsAt").value = toLocalInput(data.starts_at);
    $("endsAt").value = toLocalInput(data.ends_at);
    $("active").checked = !!data.active;
    $("displayText").checked = data.display_text !== false;
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
        display_text: $("displayText").checked,
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

  let currentCategoryImageUrl = "";
  function resetCategoryForm() {
    $("categoryForm").reset();
    $("categoryId").value = "";
    $("categoryPosition").value = "6";
    $("categoryActive").checked = true;
    $("categoryImage").value = "";
    $("categoryImagePreview").innerHTML = "";
    currentCategoryImageUrl = "";
    $("categoryFormTitle").textContent = "Nova categoria";
    $("categoryFormPanel").hidden = true;
    setMessage("categoryFormMessage", "");
  }
  async function loadCategories() {
    $("categoryList").innerHTML = '<p class="muted">Carregando...</p>';
    const { data, error } = await client.from("categories").select("*").order("position", {ascending:true});
    if (error) {
      $("categoryList").innerHTML = "";
      setMessage("dashboardMessage", "Não foi possível carregar categorias: " + error.message);
      return;
    }
    if (!data.length) {
      $("categoryList").innerHTML = '<p class="muted">Nenhuma categoria cadastrada.</p>';
      return;
    }
    $("categoryList").innerHTML = data.map(item => `
      <article class="banner-item">
        ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="">` : '<div class="category-placeholder">Sem imagem</div>'}
        <div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description || "")}</p><span class="status ${item.active ? "" : "off"}">${item.active ? "Visível" : "Oculta"}</span><p>Posição: ${item.position}</p></div>
        <div class="item-actions">
          <button class="secondary" data-category-edit="${item.id}">Editar</button>
          <button class="secondary" data-category-toggle="${item.id}" data-active="${item.active}">${item.active ? "Ocultar" : "Mostrar"}</button>
          <button class="secondary" data-category-delete="${item.id}">Excluir</button>
        </div>
      </article>`).join("");
  }
  async function editCategory(id) {
    const {data,error}=await client.from("categories").select("*").eq("id",id).single();
    if(error) return setMessage("dashboardMessage",error.message);
    $("categoryId").value=data.id;
    $("categoryName").value=data.name || "";
    $("categorySlug").value=data.slug || "";
    $("categoryDescription").value=data.description || "";
    $("categoryIcon").value=data.icon || "";
    $("categoryPosition").value=data.position || 1;
    $("categoryActive").checked=!!data.active;
    currentCategoryImageUrl=data.image_url || "";
    $("categoryImagePreview").innerHTML=currentCategoryImageUrl ? `<img src="${escapeHtml(currentCategoryImageUrl)}" alt="Imagem atual">` : "";
    $("categoryFormTitle").textContent="Editar categoria";
    $("categoryFormPanel").hidden=false;
    $("categoryFormPanel").scrollIntoView({behavior:"smooth",block:"start"});
  }
  async function saveCategory(event) {
    event.preventDefault();
    setMessage("categoryFormMessage","Salvando categoria...");
    try {
      const file=$("categoryImage").files[0];
      let imageUrl=currentCategoryImageUrl;
      if(file) {
        const ext=file.name.split(".").pop().toLowerCase();
        const path="categories/"+crypto.randomUUID()+"."+ext;
        const {error:uploadError}=await client.storage.from("site-images").upload(path,file,{upsert:false,contentType:file.type});
        if(uploadError) throw uploadError;
        imageUrl=client.storage.from("site-images").getPublicUrl(path).data.publicUrl;
      }
      const slug=$("categorySlug").value.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
        .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
      if(!slug) throw new Error("Informe um identificador válido para a categoria.");
      const payload={
        name:$("categoryName").value.trim(),
        slug,
        description:$("categoryDescription").value.trim(),
        icon:$("categoryIcon").value.trim() || "fa-solid fa-layer-group",
        image_url:imageUrl || null,
        position:Number($("categoryPosition").value),
        active:$("categoryActive").checked,
        updated_at:new Date().toISOString()
      };
      const id=$("categoryId").value;
      const query=id ? client.from("categories").update(payload).eq("id",id) : client.from("categories").insert(payload);
      const {error}=await query;
      if(error) throw error;
      resetCategoryForm();
      setMessage("dashboardMessage","Categoria salva com sucesso.");
      await loadCategories();
    } catch(error) { setMessage("categoryFormMessage",error.message || "Erro ao salvar categoria."); }
  }
  async function handleCategoryClick(event) {
    const editId=event.target.dataset.categoryEdit;
    const toggleId=event.target.dataset.categoryToggle;
    const deleteId=event.target.dataset.categoryDelete;
    if(editId) return editCategory(editId);
    if(toggleId) {
      const active=event.target.dataset.active==="true";
      const {error}=await client.from("categories").update({active:!active,updated_at:new Date().toISOString()}).eq("id",toggleId);
      if(error) setMessage("dashboardMessage",error.message); else await loadCategories();
    }
    if(deleteId && confirm("Excluir esta categoria? Esta ação não pode ser desfeita.")) {
      const {error}=await client.from("categories").delete().eq("id",deleteId);
      if(error) setMessage("dashboardMessage",error.message);
      else {setMessage("dashboardMessage","Categoria excluída.");await loadCategories();}
    }
  }

  async function loadSettings() {
    const {data,error}=await client.from("site_settings").select("*").eq("id",1).maybeSingle();
    if(error) return setMessage("settingsMessage","Não foi possível carregar configurações: "+error.message);
    if(!data) return;
    $("settingsWhatsapp").value=data.whatsapp_phone || "";
    $("settingsWhatsappMessage").value=data.whatsapp_message || "";
    $("settingsYoutube").value=data.youtube_url || "";
    $("settingsInstagram").value=data.instagram_url || "";
    $("settingsFacebook").value=data.facebook_url || "";
    $("settingsTiktok").value=data.tiktok_url || "";
    $("settingsAboutTitle").value=data.about_title || "";
    $("settingsAboutText").value=data.about_text || "";
    $("settingsAboutExtra").value=data.about_extra || "";
  }
  async function saveSettings(event) {
    event.preventDefault();
    setMessage("settingsMessage","Salvando configurações...");
    const payload={
      id:1,
      whatsapp_phone:$("settingsWhatsapp").value.replace(/\D/g,""),
      whatsapp_message:$("settingsWhatsappMessage").value.trim(),
      youtube_url:$("settingsYoutube").value.trim(),
      instagram_url:$("settingsInstagram").value.trim(),
      facebook_url:$("settingsFacebook").value.trim(),
      tiktok_url:$("settingsTiktok").value.trim(),
      about_title:$("settingsAboutTitle").value.trim(),
      about_text:$("settingsAboutText").value.trim(),
      about_extra:$("settingsAboutExtra").value.trim(),
      updated_at:new Date().toISOString()
    };
    if(payload.whatsapp_phone && !/^\d{10,15}$/.test(payload.whatsapp_phone)) return setMessage("settingsMessage","Informe o WhatsApp com código do país e DDD, somente números.");
    for(const field of ["youtube_url","instagram_url","facebook_url","tiktok_url"]) {
      if(payload[field] && !/^https?:\/\//i.test(payload[field])) return setMessage("settingsMessage","Os links das redes sociais precisam começar com https:// ou http://.");
    }
    const {error}=await client.from("site_settings").upsert(payload,{onConflict:"id"});
    setMessage("settingsMessage",error ? "Erro ao salvar: "+error.message : "Configurações salvas com sucesso.");
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
    if (data.session) { showDashboard(true); await loadBanners(); await loadCategories(); await loadSettings(); }
  }
  $("settingsForm").addEventListener("submit", saveSettings);
  $("newCategoryButton").addEventListener("click", () => { resetCategoryForm(); $("categoryFormPanel").hidden=false; });
  $("cancelCategoryButton").addEventListener("click", resetCategoryForm);
  $("categoryForm").addEventListener("submit", saveCategory);
  $("categoryList").addEventListener("click", handleCategoryClick);
  $("categoryName").addEventListener("input", () => {
    if (!$("categoryId").value) $("categorySlug").value=$("categoryName").value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  });
  $("categoryImage").addEventListener("change", event => {
    const file=event.target.files[0];
    if(file) $("categoryImagePreview").innerHTML=`<img src="${URL.createObjectURL(file)}" alt="Prévia da imagem">`;
  });
  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!client) return;
    setMessage("loginMessage", "Entrando...");
    const { error } = await client.auth.signInWithPassword({ email: $("email").value, password: $("password").value });
    if (error) return setMessage("loginMessage", error.message);
    showDashboard(true); setMessage("loginMessage", ""); await loadBanners(); await loadCategories(); await loadSettings();
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