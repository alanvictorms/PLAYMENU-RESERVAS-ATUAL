import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminHeader, Alert } from "../components/AdminLayout";
import { api, mediaUrl, money } from "../services/api";

const DETAIL_TABS = [["produtos", "Produtos"], ["categorias", "Categorias"], ["dados", "Dados"], ["plano", "Plano & Pagamentos"]];

const emptyProgress = { percent: 0, status: "idle", error: "" };
const formatPrice = (cents) => (Number(cents || 0) / 100).toFixed(2).replace(".", ",");
const parsePrice = (value) => Math.round(Number(String(value || "0").replace(/\./g, "").replace(",", ".")) * 100);
const asJson = (value) => JSON.stringify(Array.isArray(value) ? value : [], null, 2);

export default function SuperRestaurantDetailPage() {
  const [params] = useSearchParams();
  const id = Number(params.get("id") || 0);
  const [data, setData] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [files, setFiles] = useState({});
  const [progress, setProgress] = useState({});
  const [overall, setOverall] = useState({ active: false, done: 0, total: 0 });
  const [openId, setOpenId] = useState(null);
  const [tabs, setTabs] = useState({});
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState({});
  const [activeTab, setActiveTab] = useState("produtos");

  const load = async () => {
    try {
      const response = await api.get(`/superadmin/restaurants/${id}`);
      setData(response.data);
      setDrafts(Object.fromEntries(response.data.products.map((product) => [product.id, {
        ...product,
        price: formatPrice(product.price_cents),
        sizes: Array.isArray(product.sizes) ? product.sizes : [],
        option_groups: Array.isArray(product.option_groups) ? product.option_groups : [],
        standalone_options: Array.isArray(product.standalone_options) ? product.standalone_options : [],
        promotion: product.promotion || {},
      }])));
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível carregar o restaurante." });
    }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const products = useMemo(() => (data?.products || []).filter((product) => {
    if (filter === "with" && !product.video_file) return false;
    if (filter === "without" && product.video_file) return false;
    if (category !== "all" && String(product.category_id || "") !== category) return false;
    return !search || product.title.toLowerCase().includes(search.toLowerCase());
  }), [data, filter, category, search]);

  const update = (productId, field, value) => setDrafts((current) => ({ ...current, [productId]: { ...current[productId], [field]: value } }));
  const updatePromotion = (productId, field, value) => setDrafts((current) => ({ ...current, [productId]: { ...current[productId], promotion: { ...current[productId].promotion, [field]: value } } }));
  const chooseFile = (productId, type, file) => setFiles((current) => ({ ...current, [productId]: { ...(current[productId] || {}), [type]: file || null } }));

  const saveProduct = async (productId, batch = false) => {
    const product = drafts[productId];
    const selectedFiles = files[productId] || {};
    try {
      setProgress((current) => ({ ...current, [productId]: { percent: 0, status: "uploading", error: "" } }));
      const form = new FormData();
      form.set("title", product.title || "");
      form.set("description", product.description || "");
      form.set("category_id", product.category_id || "");
      form.set("price_cents", String(parsePrice(product.price)));
      form.set("sort_order", String(product.sort_order || 0));
      form.set("allergens", product.allergens || "");
      form.set("is_active", Boolean(product.is_active));
      form.set("ar_enabled", Boolean(product.ar_enabled));
      form.set("remove_video", Boolean(product.remove_video));
      form.set("sizes", asJson(product.sizes));
      form.set("option_groups", asJson(product.option_groups));
      form.set("standalone_options", asJson(product.standalone_options));
      form.set("promotion_active", Boolean(product.promotion?.active));
      form.set("promotion_type", product.promotion?.type || "");
      form.set("promotion_value", String(product.promotion?.value || 0));
      form.set("promotion_condition", product.promotion?.condition || "");
      form.set("promotion_label", product.promotion?.label || "");
      form.set("promotion_start", product.promotion?.start_date || "");
      form.set("promotion_end", product.promotion?.end_date || "");
      if (selectedFiles.thumb) form.set("thumb_image", selectedFiles.thumb);
      if (selectedFiles.video) form.set("video_file", selectedFiles.video);
      if (selectedFiles.model) form.set("ar_model_file", selectedFiles.model);
      await api.post(`/superadmin/restaurants/${id}/products/${productId}`, form, {
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.min(99, Math.round((event.loaded * 100) / event.total));
          setProgress((current) => ({ ...current, [productId]: { percent, status: "uploading", error: "" } }));
        },
      });
      setProgress((current) => ({ ...current, [productId]: { percent: 100, status: "success", error: "" } }));
      setFiles((current) => ({ ...current, [productId]: {} }));
      if (!batch) {
        setNotice({ message: `Produto “${product.title}” salvo com sucesso.` });
        await load();
      }
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Falha ao salvar produto.";
      setProgress((current) => ({ ...current, [productId]: { ...(current[productId] || emptyProgress), status: "error", error: message } }));
      if (!batch) setNotice({ error: message });
      return false;
    }
  };

  const activate = async () => {
    if (!window.confirm(`Aprovar e ativar "${data.restaurant.name}"? O cardápio passa a ficar público imediatamente.`)) return;
    try {
      await api.post("/superadmin/restaurants", { action: "activate", id });
      setNotice({ message: "Restaurante aprovado e ativado." });
      await load();
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível ativar o restaurante." });
    }
  };

  const uploadQueue = async () => {
    const queue = Object.entries(files).filter(([, value]) => value?.video).map(([productId]) => Number(productId));
    if (!queue.length) return;
    setNotice({});
    setOverall({ active: true, done: 0, total: queue.length });
    let succeeded = 0;
    for (const productId of queue) {
      if (await saveProduct(productId, true)) succeeded += 1;
      setOverall((current) => ({ ...current, done: current.done + 1 }));
    }
    setOverall({ active: false, done: queue.length, total: queue.length });
    setNotice(succeeded === queue.length ? { message: `${succeeded} vídeo(s) enviado(s) com sucesso.` } : { error: `${succeeded} de ${queue.length} vídeo(s) foram enviados. Revise os itens marcados em vermelho.` });
    await load();
  };

  if (!data) return <><AdminHeader title="Detalhes do restaurante" />{notice.error ? <Alert type="error">{notice.error}</Alert> : <div className="empty-state"><p>Carregando restaurante...</p></div>}</>;
  const restaurant = data.restaurant;
  const queuedVideos = Object.values(files).filter((value) => value?.video).length;
  const overallPercent = overall.total ? Math.round((overall.done / overall.total) * 100) : 0;

  return <><AdminHeader title={restaurant.name} />{notice.message && <Alert>{notice.message}</Alert>}{notice.error && <Alert type="error">{notice.error}</Alert>}
    <div className="request-page-actions"><Link className="btn btn-sm btn-outline" to="/superadmin/restaurantes"><i className="fas fa-arrow-left" />Voltar</Link><a className="btn btn-sm btn-outline" href={`/${encodeURIComponent(restaurant.slug)}`} target="_blank" rel="noreferrer"><i className="fas fa-arrow-up-right-from-square" />Ver cardápio público</a></div>
    {restaurant.status === "pending" && <section className="restaurant-approve-bar"><div><strong>Cadastro aguardando aprovação</strong><span>Ao aprovar, a conta é ativada e o cardápio fica público em playmenu.app/{restaurant.slug}.</span></div><button className="btn btn-success" type="button" onClick={activate} data-testid="approve-restaurant-btn"><i className="fas fa-circle-check" />Aprovar e ativar</button></section>}
    <section className="restaurant-detail-hero"><div><span className="badge badge-purple">{restaurant.is_model ? "RESTAURANTE MODELO" : "RESTAURANTE"}</span><h2>{restaurant.name}</h2><p>{restaurant.email} · /{restaurant.slug}</p></div><div className="restaurant-detail-stats"><span><strong>{data.stats.products}</strong> produtos</span><span className="has-video"><strong>{data.stats.with_video}</strong> com vídeo</span><span className="no-video"><strong>{data.stats.without_video}</strong> sem vídeo</span></div></section>
    {restaurant.is_model && queuedVideos > 0 && <section className="upload-queue-bar"><div><strong>{overall.active ? "Enviando vídeos em sequência" : `${queuedVideos} vídeo(s) pronto(s) para enviar`}</strong><span>{overall.active ? `${overall.done} de ${overall.total} concluído(s)` : "Os arquivos serão enviados um por vez para manter a estabilidade."}</span></div>{overall.active ? <div className="admin-progress"><i style={{ width: `${overallPercent}%` }} /></div> : <button className="btn btn-primary" type="button" onClick={uploadQueue}><i className="fas fa-cloud-arrow-up" />Salvar vídeos selecionados</button>}</section>}

    <nav className="detail-tabs">{DETAIL_TABS.map(([value, label]) => <button type="button" key={value} className={activeTab === value ? "is-active" : ""} onClick={() => setActiveTab(value)}>{label}</button>)}</nav>

    {activeTab === "produtos" && <>
      <div className="restaurant-product-filters"><div className="action-row">{[["all", "Todos"], ["with", "Com vídeo"], ["without", "Sem vídeo"]].map(([value, label]) => <button key={value} className={`btn btn-sm ${filter === value ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter(value)}>{label}</button>)}</div><select className="form-control" value={category} onChange={(event) => setCategory(event.target.value)} data-testid="detail-category-filter" aria-label="Filtrar por categoria"><option value="all">Todas as categorias</option>{data.categories.map((item) => <option value={String(item.id)} key={item.id}>{item.name}</option>)}<option value="">Sem categoria</option></select><input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto..." /></div>
      <p className="restaurant-filter-count">{products.length} de {data.products.length} produto(s).</p>
      <section className="restaurant-products-accordion">{products.map((source) => { const product = drafts[source.id] || source; const itemFiles = files[source.id] || {}; const itemProgress = progress[source.id] || emptyProgress; const productTab = tabs[source.id] || "media"; const isOpen = openId === source.id; return <article className={`restaurant-product-item ${isOpen ? "is-open" : ""}`} key={source.id}>
        <button className="restaurant-product-summary" type="button" onClick={() => setOpenId(isOpen ? null : source.id)}>{source.thumb_image ? <img src={mediaUrl(source.thumb_image)} alt="" /> : <span className="product-thumb-empty"><i className="fas fa-image" /></span>}<span className="restaurant-product-summary__copy"><strong>{source.title}</strong><small>{source.category_name} · {money(source.price_cents)}</small></span><span className="product-video-markers">{itemFiles.video && <span className="file-ready"><i className="fas fa-circle-check" />Vídeo selecionado</span>}{!itemFiles.video && itemProgress.status === "success" && <span className="file-ready"><i className="fas fa-circle-check" />Enviado</span>}<span className={`badge ${source.video_file ? "badge-green" : "badge-gray"}`}>{source.video_file ? "Com vídeo" : "Sem vídeo"}</span></span><i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} /></button>
        {isOpen && <div className="restaurant-product-editor"><nav className="product-editor-tabs">{[["media", "Foto e vídeo"], ["data", "Dados"], ["variants", "Variações"], ["promotion", "Promoção"]].map(([value, label]) => <button type="button" key={value} className={productTab === value ? "is-active" : ""} onClick={() => setTabs((current) => ({ ...current, [source.id]: value }))}>{label}</button>)}</nav>
          {productTab === "media" && <div className="product-editor-panel media-panel"><div className="current-product-media">{source.thumb_image ? <img src={mediaUrl(source.thumb_image)} alt={source.title} /> : <div className="media-empty">Sem foto</div>}{source.video_file && <video src={mediaUrl(source.video_file)} controls />}</div><div className="media-upload-fields"><FormFieldLocal label="Nova foto"><input className="form-control" type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(event) => chooseFile(source.id, "thumb", event.target.files[0])} /></FormFieldLocal>{restaurant.is_model ? <FormFieldLocal label="Novo vídeo"><input className="form-control" type="file" accept=".mp4,.mov,.m4v,.webm" onChange={(event) => chooseFile(source.id, "video", event.target.files[0])} />{itemFiles.video && <small className="selected-file"><i className="fas fa-circle-check" />{itemFiles.video.name}</small>}</FormFieldLocal> : <div className="model-only-note"><i className="fas fa-lock" />Upload direto disponível somente quando o restaurante está marcado como modelo.</div>}<FormFieldLocal label="Modelo 3D"><input className="form-control" type="file" accept=".glb,.gltf" onChange={(event) => chooseFile(source.id, "model", event.target.files[0])} /></FormFieldLocal>{source.video_file && <label className="admin-check"><input type="checkbox" checked={Boolean(product.remove_video)} onChange={(event) => update(source.id, "remove_video", event.target.checked)} />Desvincular vídeo atual</label>}</div></div>}
          {productTab === "data" && <div className="product-editor-panel"><div className="grid-2"><FormFieldLocal label="Nome"><input className="form-control" value={product.title || ""} onChange={(event) => update(source.id, "title", event.target.value)} /></FormFieldLocal><FormFieldLocal label="Categoria"><select className="form-control" value={product.category_id || ""} onChange={(event) => update(source.id, "category_id", event.target.value)}><option value="">Sem categoria</option>{data.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></FormFieldLocal><FormFieldLocal label="Preço (R$)"><input className="form-control" value={product.price || ""} onChange={(event) => update(source.id, "price", event.target.value)} /></FormFieldLocal><FormFieldLocal label="Ordem"><input className="form-control" type="number" value={product.sort_order || 0} onChange={(event) => update(source.id, "sort_order", Number(event.target.value))} /></FormFieldLocal></div><FormFieldLocal label="Descrição"><textarea className="form-control" value={product.description || ""} onChange={(event) => update(source.id, "description", event.target.value)} /></FormFieldLocal><FormFieldLocal label="Alergênicos (separados por vírgula)"><input className="form-control" value={product.allergens || ""} onChange={(event) => update(source.id, "allergens", event.target.value)} /></FormFieldLocal><div className="action-row"><label className="admin-check"><input type="checkbox" checked={Boolean(product.is_active)} onChange={(event) => update(source.id, "is_active", event.target.checked)} />Produto ativo</label><label className="admin-check"><input type="checkbox" checked={Boolean(product.ar_enabled)} onChange={(event) => update(source.id, "ar_enabled", event.target.checked)} />Realidade aumentada</label></div></div>}
          {productTab === "variants" && <VariantsEditor product={product} onChange={(field, value) => update(source.id, field, value)} />}
          {productTab === "promotion" && <div className="product-editor-panel"><label className="admin-check"><input type="checkbox" checked={Boolean(product.promotion?.active)} onChange={(event) => updatePromotion(source.id, "active", event.target.checked)} />Promoção ativa</label><div className="grid-2"><FormFieldLocal label="Tipo"><select className="form-control" value={product.promotion?.type || "percentage"} onChange={(event) => updatePromotion(source.id, "type", event.target.value)}><option value="percentage">Porcentagem</option><option value="fixed">Valor fixo</option></select></FormFieldLocal><FormFieldLocal label="Valor"><input className="form-control" type="number" step="0.01" value={product.promotion?.value || 0} onChange={(event) => updatePromotion(source.id, "value", Number(event.target.value))} /></FormFieldLocal><FormFieldLocal label="Selo"><input className="form-control" value={product.promotion?.label || ""} onChange={(event) => updatePromotion(source.id, "label", event.target.value)} /></FormFieldLocal><FormFieldLocal label="Condição"><input className="form-control" value={product.promotion?.condition || ""} onChange={(event) => updatePromotion(source.id, "condition", event.target.value)} /></FormFieldLocal><FormFieldLocal label="Início"><input className="form-control" type="date" value={product.promotion?.start_date || ""} onChange={(event) => updatePromotion(source.id, "start_date", event.target.value)} /></FormFieldLocal><FormFieldLocal label="Fim"><input className="form-control" type="date" value={product.promotion?.end_date || ""} onChange={(event) => updatePromotion(source.id, "end_date", event.target.value)} /></FormFieldLocal></div></div>}
          {itemProgress.status !== "idle" && <div className={`product-save-progress is-${itemProgress.status}`}><div><strong>{itemProgress.status === "uploading" ? "Enviando produto..." : itemProgress.status === "success" ? "Produto salvo" : "Falha no envio"}</strong><span>{itemProgress.percent}%</span></div><div className="admin-progress"><i style={{ width: `${itemProgress.percent}%` }} /></div>{itemProgress.error && <small>{itemProgress.error}</small>}</div>}
          <footer className="product-editor-footer"><button className="btn btn-primary" type="button" disabled={itemProgress.status === "uploading" || overall.active} onClick={() => saveProduct(source.id)}><i className="fas fa-floppy-disk" />Salvar produto</button></footer>
        </div>}
      </article>; })}{!products.length && <div className="empty-state"><p>Nenhum produto encontrado neste filtro.</p></div>}</section>
    </>}

    {activeTab === "categorias" && <CategoriesTab restaurantId={id} categories={data.categories} onChanged={load} />}
    {activeTab === "dados" && <ProfileTab restaurant={restaurant} onSaved={load} />}
    {activeTab === "plano" && <PlanPaymentsTab restaurantId={id} restaurant={restaurant} onChanged={load} />}
  </>;
}

const FormFieldLocal = ({ label, children }) => <div className="form-group"><label>{label}</label>{children}</div>;

const CategoriesTab = ({ restaurantId, categories, onChanged }) => {
  const [edit, setEdit] = useState(null);
  const [notice, setNotice] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    if (edit) body.id = edit.id;
    try {
      await api.post(`/superadmin/restaurants/${restaurantId}/categories`, body);
      setNotice({ message: edit ? "Categoria atualizada." : "Categoria criada." });
      setEdit(null);
      form.reset();
      await onChanged();
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível salvar a categoria." });
    }
  };

  const action = async (categoryId, act) => {
    try {
      await api.patch(`/superadmin/restaurants/${restaurantId}/categories/${categoryId}/${act}`);
      await onChanged();
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível atualizar a categoria." });
    }
  };

  return <>
    {notice.message && <Alert>{notice.message}</Alert>}
    {notice.error && <Alert type="error">{notice.error}</Alert>}
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-header"><h3>{edit ? "Editar categoria" : "Nova categoria"}</h3></div>
      <div className="card-body">
        <form key={edit?.id || "new"} onSubmit={submit}>
          <div className="grid-2">
            <FormFieldLocal label="Nome"><input className="form-control" name="name" defaultValue={edit?.name} required /></FormFieldLocal>
            <FormFieldLocal label="Ordem"><input className="form-control" name="sort_order" type="number" defaultValue={edit?.sort_order || 0} /></FormFieldLocal>
          </div>
          <div className="action-row">
            <button className="btn btn-primary">{edit ? "Salvar" : "Adicionar categoria"}</button>
            {edit && <button type="button" className="btn btn-outline" onClick={() => setEdit(null)}>Cancelar</button>}
          </div>
        </form>
      </div>
    </div>
    <div className="card">
      <div className="card-header"><h3>Categorias</h3><span className="badge badge-blue">{categories.length}</span></div>
      <div className="card-body">
        {!categories.length ? <div className="empty-state"><p>Nenhuma categoria cadastrada.</p></div> : (
          <div className="table-wrap">
            <table className="dash-table">
              <thead><tr><th>Nome</th><th>Ordem</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {categories.map((c) => <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.sort_order}</td>
                  <td><span className={`badge ${c.is_active ? "badge-green" : "badge-gray"}`}>{c.is_active ? "Ativa" : "Inativa"}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="btn btn-sm btn-outline" type="button" onClick={() => setEdit(c)} title="Editar"><i className="fas fa-pen" /></button>
                      <button className="btn btn-sm btn-outline" type="button" onClick={() => action(c.id, "toggle")} title={c.is_active ? "Desativar" : "Ativar"}><i className="fas fa-power-off" /></button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => window.confirm(`Excluir a categoria "${c.name}"?`) && action(c.id, "delete")} title="Excluir"><i className="fas fa-trash" /></button>
                    </div>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </>;
};

const RESTAURANT_PROFILE_FIELDS = [
  ["name", "Nome"], ["email", "E-mail"], ["phone", "Telefone"], ["cpf_cnpj", "CPF/CNPJ"],
];

const ProfileTab = ({ restaurant, onSaved }) => {
  const [notice, setNotice] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const body = { action: "update_profile", id: restaurant.id, ...Object.fromEntries(new FormData(event.currentTarget)) };
    try {
      await api.post("/superadmin/restaurants", body);
      setNotice({ message: "Dados do restaurante atualizados." });
      await onSaved();
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível salvar os dados." });
    }
  };

  return <div className="card">
    <div className="card-header"><h3>Dados do restaurante</h3></div>
    <div className="card-body">
      {notice.message && <Alert>{notice.message}</Alert>}
      {notice.error && <Alert type="error">{notice.error}</Alert>}
      <form onSubmit={submit} key={restaurant.id}>
        <div className="grid-2">
          {RESTAURANT_PROFILE_FIELDS.map(([name, label]) => <FormFieldLocal key={name} label={label}><input className="form-control" name={name} type={name === "email" ? "email" : "text"} defaultValue={restaurant[name] || ""} required={name === "name" || name === "email"} /></FormFieldLocal>)}
        </div>
        <FormFieldLocal label="Endereço (linha completa)"><input className="form-control" name="address" defaultValue={restaurant.address || ""} /></FormFieldLocal>
        <div className="grid-3">
          <FormFieldLocal label="CEP"><input className="form-control" name="cep" defaultValue={restaurant.cep || ""} /></FormFieldLocal>
          <FormFieldLocal label="Rua"><input className="form-control" name="street" defaultValue={restaurant.street || ""} /></FormFieldLocal>
          <FormFieldLocal label="Número"><input className="form-control" name="number" defaultValue={restaurant.number || ""} /></FormFieldLocal>
        </div>
        <div className="grid-3">
          <FormFieldLocal label="Complemento"><input className="form-control" name="complement" defaultValue={restaurant.complement || ""} /></FormFieldLocal>
          <FormFieldLocal label="Bairro"><input className="form-control" name="district" defaultValue={restaurant.district || ""} /></FormFieldLocal>
          <FormFieldLocal label="Cidade"><input className="form-control" name="city" defaultValue={restaurant.city || ""} /></FormFieldLocal>
        </div>
        <FormFieldLocal label="Estado (UF)"><input className="form-control" name="state" maxLength={2} defaultValue={restaurant.state || ""} style={{ maxWidth: 120 }} /></FormFieldLocal>
        <div className="action-row"><button className="btn btn-primary">Salvar dados</button></div>
      </form>
    </div>
  </div>;
};

const PAYMENT_KIND_LABEL = { adesao: "Adesão", mensalidade: "Mensalidade" };
const PAYMENT_STATUS_TONE = { paid: "badge-green", pending: "badge-orange", cancelled: "badge-gray" };

const PlanPaymentsTab = ({ restaurantId, restaurant, onChanged }) => {
  const [plans, setPlans] = useState(null);
  const [payments, setPayments] = useState(null);
  const [notice, setNotice] = useState({});

  useEffect(() => {
    api.get("/superadmin/plans").then((response) => setPlans(response.data)).catch(() => setPlans([]));
    api.get(`/superadmin/restaurants/${restaurantId}/payments`).then((response) => setPayments(response.data)).catch(() => setPayments([]));
  }, [restaurantId]);

  const assign = async (planId) => {
    try {
      await api.post("/superadmin/restaurants", { action: "assign_plan", id: restaurantId, plan_id: planId });
      setNotice({ message: "Plano atribuído com sucesso." });
      await onChanged();
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível atribuir o plano." });
    }
  };

  return <>
    {notice.message && <Alert>{notice.message}</Alert>}
    {notice.error && <Alert type="error">{notice.error}</Alert>}
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-header"><h3>Plano</h3><span style={{ fontSize: 11, color: "var(--muted)" }}>Atribuição administrativa — não gera cobrança no Asaas.</span></div>
      <div className="card-body">
        {!plans ? <div className="empty-state"><p>Carregando planos...</p></div> : !plans.length ? <div className="empty-state"><p>Nenhum plano cadastrado.</p></div> : (
          <div className="plan-pick-grid">
            {plans.map((p) => <div key={p.id} className={`plan-pick-card ${restaurant.plan_id === p.id ? "is-current" : ""}`}>
              <h4>{p.name}</h4>
              <strong>{money(p.price_cents)}</strong>
              <small>{p.periodicity_days} dias{p.description ? ` · ${p.description}` : ""}</small>
              {restaurant.plan_id === p.id ? <span className="badge badge-green">Plano atual</span> : <button className="btn btn-sm btn-primary" type="button" onClick={() => assign(p.id)}>Atribuir</button>}
            </div>)}
          </div>
        )}
      </div>
    </div>
    <div className="card">
      <div className="card-header"><h3>Histórico de pagamentos</h3>{payments && <span className="badge badge-blue">{payments.length}</span>}</div>
      <div className="card-body">
        {!payments ? <div className="empty-state"><p>Carregando pagamentos...</p></div> : !payments.length ? <div className="empty-state"><p>Nenhum pagamento registrado para este restaurante.</p></div> : (
          <div className="table-wrap">
            <table className="dash-table">
              <thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Forma</th><th>Status</th></tr></thead>
              <tbody>
                {payments.map((p) => <tr key={p.id}>
                  <td>{p.created_at}</td>
                  <td>{PAYMENT_KIND_LABEL[p.kind] || p.kind}</td>
                  <td>{money(p.value_cents)}</td>
                  <td>{p.billing_type}</td>
                  <td><span className={`badge ${PAYMENT_STATUS_TONE[p.status] || "badge-gray"}`}>{p.status}</span></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </>;
};
const VariantsEditor = ({ product, onChange }) => {
  const sizes = product.sizes || [];
  const groups = product.option_groups || [];
  const standalone = product.standalone_options || [];
  const patchSize = (index, field, value) => onChange("sizes", sizes.map((item, current) => current === index ? { ...item, [field]: value } : item));
  const patchGroup = (groupIndex, value) => onChange("option_groups", groups.map((group, current) => current === groupIndex ? value : group));
  return <div className="product-editor-panel variant-admin-editor">
    <section><header><div><strong>Tamanhos</strong><small>Ex.: pequeno, médio e grande.</small></div><button className="btn btn-sm btn-outline" type="button" onClick={() => onChange("sizes", [...sizes, { name: "", price_cents: 0 }])}>Adicionar tamanho</button></header>{sizes.map((item, index) => <div className="variant-admin-row" key={index}><input className="form-control" value={item.name || ""} placeholder="Nome" onChange={(event) => patchSize(index, "name", event.target.value)} /><input className="form-control" type="number" value={item.price_cents || 0} placeholder="Preço em centavos" onChange={(event) => patchSize(index, "price_cents", Number(event.target.value))} /><button className="btn btn-sm btn-danger" type="button" onClick={() => onChange("sizes", sizes.filter((_, current) => current !== index))}><i className="fas fa-trash" /></button></div>)}</section>
    <section><header><div><strong>Grupos de opções</strong><small>Ex.: sabores, bordas e acompanhamentos.</small></div><button className="btn btn-sm btn-outline" type="button" onClick={() => onChange("option_groups", [...groups, { name: "", options: [] }])}>Adicionar grupo</button></header>{groups.map((group, groupIndex) => <div className="variant-admin-group" key={groupIndex}><div className="variant-admin-row"><input className="form-control" value={group.name || ""} placeholder="Nome do grupo" onChange={(event) => patchGroup(groupIndex, { ...group, name: event.target.value })} /><button className="btn btn-sm btn-outline" type="button" onClick={() => patchGroup(groupIndex, { ...group, options: [...(group.options || []), { name: "", price_cents: 0 }] })}>Adicionar opção</button><button className="btn btn-sm btn-danger" type="button" onClick={() => onChange("option_groups", groups.filter((_, current) => current !== groupIndex))}><i className="fas fa-trash" /></button></div>{(group.options || []).map((option, optionIndex) => <div className="variant-admin-row is-option" key={optionIndex}><input className="form-control" value={option.name || ""} placeholder="Opção" onChange={(event) => patchGroup(groupIndex, { ...group, options: group.options.map((item, current) => current === optionIndex ? { ...item, name: event.target.value } : item) })} /><input className="form-control" type="number" value={option.price_cents || 0} placeholder="Preço em centavos" onChange={(event) => patchGroup(groupIndex, { ...group, options: group.options.map((item, current) => current === optionIndex ? { ...item, price_cents: Number(event.target.value) } : item) })} /><button className="btn btn-sm btn-danger" type="button" onClick={() => patchGroup(groupIndex, { ...group, options: group.options.filter((_, current) => current !== optionIndex) })}><i className="fas fa-times" /></button></div>)}</div>)}</section>
    <section><header><div><strong>Opções avulsas</strong><small>Adicionais que não pertencem a um grupo.</small></div><button className="btn btn-sm btn-outline" type="button" onClick={() => onChange("standalone_options", [...standalone, { name: "", price_cents: 0 }])}>Adicionar opção</button></header>{standalone.map((item, index) => <div className="variant-admin-row" key={index}><input className="form-control" value={item.name || ""} placeholder="Nome" onChange={(event) => onChange("standalone_options", standalone.map((option, current) => current === index ? { ...option, name: event.target.value } : option))} /><input className="form-control" type="number" value={item.price_cents || 0} placeholder="Preço em centavos" onChange={(event) => onChange("standalone_options", standalone.map((option, current) => current === index ? { ...option, price_cents: Number(event.target.value) } : option))} /><button className="btn btn-sm btn-danger" type="button" onClick={() => onChange("standalone_options", standalone.filter((_, current) => current !== index))}><i className="fas fa-trash" /></button></div>)}</section>
  </div>;
};
