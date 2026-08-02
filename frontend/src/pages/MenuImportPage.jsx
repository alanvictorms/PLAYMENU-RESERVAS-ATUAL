import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageContent, PageHeader } from "../components/RestaurantLayout";
import { api } from "../services/api";

const ALLERGENS = [
  ["gluten", "Glúten"], ["dairy", "Leite / lactose"], ["eggs", "Ovos"], ["soy", "Soja"],
  ["nuts", "Castanhas / amendoim"], ["shellfish", "Crustáceos / moluscos"], ["fish", "Peixes"],
  ["celery", "Aipo / salsão"], ["mustard", "Mostarda"], ["sesame", "Gergelim"],
];

const priceText = (cents) => (Number(cents || 0) / 100).toFixed(2).replace(".", ",");
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const waitForResult = async (initial) => {
  let result = initial;
  const deadline = Date.now() + (10 * 60 * 1000);
  while (result.status === "pending" && Date.now() < deadline) {
    await wait(2500);
    const progress = await api.get(`/restaurant/menu-import/analyze/${result.job_id}`);
    result = progress.data;
  }
  if (result.status === "pending") {
    throw new Error("A operação ainda está em andamento. Aguarde alguns instantes e tente novamente.");
  }
  return result;
};
const priceCents = (value) => {
  const normalized = String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.max(0, Math.round(number * 100)) : 0;
};

const Notice = ({ notice }) => {
  if (!notice?.message && !notice?.error) return null;
  return <div className={`ui-alert ${notice.error ? "ui-alert--danger" : "ui-alert--success"}`} role={notice.error ? "alert" : "status"}>
    <i className={`fas ${notice.error ? "fa-circle-exclamation" : "fa-circle-check"}`} />
    <div><strong>{notice.title || (notice.error ? "Não foi possível concluir" : "Importação concluída")}</strong><p>{notice.error || notice.message}</p></div>
  </div>;
};

export default function MenuImportPage() {
  const [draft, setDraft] = useState(null);
  const [notice, setNotice] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState("");
  const [activate, setActivate] = useState(true);
  const selectedCount = useMemo(() => draft?.items?.filter((item) => item.selected).length || 0, [draft]);
  const missingDescriptionIndexes = useMemo(
    () => draft?.items?.reduce((indexes, item, index) => {
      if (item.selected && !String(item.description || "").trim()) indexes.push(index);
      return indexes;
    }, []) || [],
    [draft],
  );

  const analyze = async (event) => {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("menu_file");
    if (!file?.name) {
      setNotice({ error: "Selecione um PDF ou uma imagem do cardápio." });
      return;
    }
    setAnalyzing(true);
    setNotice({});
    try {
      const form = new FormData();
      form.set("menu_file", file);
      const response = await api.post("/restaurant/menu-import/analyze", form);
      const result = await waitForResult(response.data);
      setDraft({
        ...result,
        items: result.items.map((item) => ({ ...item, price_input: priceText(item.price_cents) })),
      });
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || error.message || "Não foi possível analisar o arquivo." });
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItem = (index, values) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item),
    }));
  };

  const toggleAllergen = (index, allergen) => {
    const item = draft.items[index];
    const allergens = item.allergens.includes(allergen)
      ? item.allergens.filter((value) => value !== allergen)
      : [...item.allergens, allergen];
    updateItem(index, { allergens });
  };

  const generateDescriptions = async (indexes, scope) => {
    const items = indexes
      .map((index) => ({ index, ...draft.items[index] }))
      .filter((item) => String(item.title || "").trim())
      .map(({ index, title, category, description, allergens }) => ({
        index, title, category, description, allergens,
      }));
    if (!items.length) {
      setNotice({ error: "Não há produtos válidos para gerar descrição." });
      return;
    }
    setGenerating(scope);
    setNotice({});
    try {
      const response = await api.post("/restaurant/menu-import/descriptions", { items });
      const result = await waitForResult(response.data);
      const generated = new Map(result.descriptions.map((item) => [Number(item.index), item.description]));
      setDraft((current) => ({
        ...current,
        items: current.items.map((item, index) => (
          generated.has(index) ? { ...item, description: generated.get(index) } : item
        )),
      }));
      setNotice({
        title: "Descrições geradas",
        message: `${generated.size} descrição(ões) foram preenchidas. Revise o texto antes de cadastrar.`,
      });
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || error.message || "Não foi possível gerar as descrições." });
    } finally {
      setGenerating("");
    }
  };

  const confirm = async () => {
    setSaving(true);
    setNotice({});
    try {
      const items = draft.items.map(({ price_input, ...item }) => ({
        ...item,
        price_cents: priceCents(price_input),
      }));
      const response = await api.post("/restaurant/menu-import/confirm", { items, activate });
      setNotice({
        message: `${response.data.products_created} produto(s) e ${response.data.categories_created} nova(s) categoria(s) foram cadastrados. Fotos e vídeos ficaram em branco para inclusão manual.`,
      });
      setDraft(null);
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível cadastrar os produtos." });
    } finally {
      setSaving(false);
    }
  };

  return <>
    <PageHeader title="Importar cardápio com IA" description="Transforme um PDF ou uma foto do seu cardápio em produtos prontos para revisão." section="Cardápio" />
    <PageContent>
      <Notice notice={notice} />
      {!draft ? <div className="ui-layout-grid ui-layout-grid--sidebar">
        <section className="ui-surface ui-menu-import-intro">
          <span className="ui-eyebrow">Cadastro assistido</span>
          <h2>Envie o cardápio e economize o trabalho de digitação.</h2>
          <p>A IA reconhece categorias, nomes, descrições, preços e possíveis alergênicos. Nada é publicado antes da sua revisão.</p>
          <ol className="ui-numbered-steps">
            <li><span>1</span><div><strong>Envie o arquivo</strong><small>PDF, PNG, JPG ou WEBP com até 20 MB.</small></div></li>
            <li><span>2</span><div><strong>Revise o reconhecimento</strong><small>Edite qualquer informação e desmarque itens indesejados.</small></div></li>
            <li><span>3</span><div><strong>Confirme o cadastro</strong><small>As fotos e os vídeos permanecem vazios para inclusão manual.</small></div></li>
          </ol>
        </section>
        <aside className="ui-surface ui-surface--accent">
          <form className="ui-stack" onSubmit={analyze} encType="multipart/form-data">
            <div className="ui-upload-drop-admin">
              <i className="fas fa-file-arrow-up" />
              <strong>Arquivo do cardápio</strong>
              <span>Prefira imagens nítidas ou o PDF original.</span>
              <input type="file" name="menu_file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" />
            </div>
            <button className="ui-btn ui-btn--primary" disabled={analyzing}>
              {analyzing ? <><i className="fas fa-spinner fa-spin" /> Analisando cardápio...</> : <><i className="fas fa-wand-magic-sparkles" /> Analisar com IA</>}
            </button>
          </form>
        </aside>
      </div> : <div className="ui-stack ui-stack--lg">
        <section className="ui-surface">
          <div className="ui-section-heading ui-import-review-heading">
            <div><span className="ui-eyebrow">Prévia da importação</span><h2>Revise antes de cadastrar</h2><p>{draft.filename} · {draft.items.length} item(ns) reconhecido(s) · {selectedCount} selecionado(s)</p></div>
            <div className="ui-inline-actions">
              <button
                type="button"
                className="ui-btn ui-btn--primary ui-btn--sm"
                disabled={!missingDescriptionIndexes.length || Boolean(generating)}
                onClick={() => generateDescriptions(missingDescriptionIndexes, "all")}
              >
                <i className={`fas ${generating === "all" ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} />
                {generating === "all" ? "Gerando..." : `Gerar descrições ausentes (${missingDescriptionIndexes.length})`}
              </button>
              <button type="button" className="ui-btn ui-btn--outline ui-btn--sm" onClick={() => setDraft(null)}>Trocar arquivo</button>
            </div>
          </div>
          <div className="ui-alert ui-alert--warning">
            <i className="fas fa-triangle-exclamation" />
            <div><strong>Revisão obrigatória</strong><p>A IA pode interpretar preços e alergênicos incorretamente. Confirme as informações com a ficha técnica de cada produto.</p></div>
          </div>
          {draft.warnings?.length > 0 && <div className="ui-import-warnings"><strong>Pontos sinalizados pela IA</strong><ul>{draft.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
        </section>

        <section className="ui-import-review-list">
          {draft.items.map((item, index) => <article className={`ui-surface ui-import-product ${item.selected ? "" : "is-disabled"}`} key={`${item.title}-${index}`}>
            <header className="ui-import-product__header">
              <label className="ui-check"><input type="checkbox" checked={item.selected} onChange={(event) => updateItem(index, { selected: event.target.checked })} /><span>Incluir produto</span></label>
              <div className="ui-import-product__actions">
                {item.needs_review && <span className="ui-badge ui-badge--warning">Revisar</span>}
                <button
                  type="button"
                  className="ui-btn ui-btn--ghost ui-btn--xs"
                  disabled={Boolean(generating)}
                  onClick={() => generateDescriptions([index], `item-${index}`)}
                >
                  <i className={`fas ${generating === `item-${index}` ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} />
                  {generating === `item-${index}` ? "Gerando..." : item.description ? "Regerar descrição" : "Gerar descrição"}
                </button>
              </div>
            </header>
            <div className="ui-import-product__fields">
              <div className="ui-field"><label>Nome</label><input value={item.title} onChange={(event) => updateItem(index, { title: event.target.value })} /></div>
              <div className="ui-field"><label>Categoria</label><input value={item.category} onChange={(event) => updateItem(index, { category: event.target.value })} /></div>
              <div className="ui-field"><label>Preço (R$)</label><input inputMode="decimal" value={item.price_input} onChange={(event) => updateItem(index, { price_input: event.target.value })} /></div>
            </div>
            <div className="ui-field ui-import-product__description"><label>Descrição</label><textarea rows="2" value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} /></div>
            <div className="ui-import-allergens">
              <strong>Alergênicos sugeridos</strong>
              <div>{ALLERGENS.map(([key, label]) => <label key={key} className={item.allergens.includes(key) ? "is-selected" : ""}><input type="checkbox" checked={item.allergens.includes(key)} onChange={() => toggleAllergen(index, key)} />{label}</label>)}</div>
            </div>
          </article>)}
        </section>

        <section className="ui-sticky-actions ui-import-confirm">
          <label className="ui-check"><input type="checkbox" checked={activate} onChange={(event) => setActivate(event.target.checked)} /><span>Deixar os produtos ativos após o cadastro</span></label>
          <div className="ui-inline-actions">
            <Link to="/admin/produtos" className="ui-btn ui-btn--ghost">Cancelar</Link>
            <button className="ui-btn ui-btn--primary" disabled={!selectedCount || saving} onClick={confirm}>
              {saving ? "Cadastrando..." : `Cadastrar ${selectedCount} produto(s)`}
            </button>
          </div>
        </section>
      </div>}
    </PageContent>
  </>;
}
