import { useEffect, useState } from "react";
import { AdminHeader, Alert } from "../components/AdminLayout";
import { api, mediaUrl } from "../services/api";

const EMPTY_TEMPLATE = {
  name: "",
  description: "",
  width: 1080,
  height: 1080,
  qr_x: 340,
  qr_y: 480,
  qr_size: 400,
  logo_x: 440,
  logo_y: 80,
  logo_size: 200,
  background_color: "#201827",
  accent_color: "#f4581c",
  is_active: 1,
};

const Field = ({ label, children }) => <div className="form-group"><label>{label}</label>{children}</div>;
const Input = ({ name, defaultValue, type = "text", required = false, ...props }) => <input className="form-control" name={name} type={type} defaultValue={defaultValue ?? ""} required={required} {...props} />;

export default function QrTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/superadmin/qr-templates")
    .then((response) => setTemplates(response.data))
    .catch((error) => setNotice({ error: error.response?.data?.detail || "Não foi possível carregar os modelos." }));

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice({});
    const form = new FormData(event.currentTarget);
    form.set("id", String(editing?.id || 0));
    form.set("is_active", form.has("is_active") ? "true" : "false");
    try {
      await api.post("/superadmin/qr-templates", form);
      setNotice({ message: editing ? "Modelo atualizado." : "Modelo cadastrado." });
      setEditing(null);
      event.currentTarget.reset();
      load();
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível salvar o modelo." });
    } finally {
      setSaving(false);
    }
  };

  const action = async (template, type) => {
    if (type === "delete" && !window.confirm(`Excluir o modelo “${template.name}”?`)) return;
    try {
      await api.patch(`/superadmin/qr-templates/${template.id}/${type}`);
      if (editing?.id === template.id) setEditing(null);
      load();
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível alterar o modelo." });
    }
  };

  const current = editing || EMPTY_TEMPLATE;
  return <>
    <AdminHeader title="Modelos de QR Code" />
    {notice.message && <Alert>{notice.message}</Alert>}
    {notice.error && <Alert type="error">{notice.error}</Alert>}
    <div className="card" style={{ marginBottom: 27 }}>
      <div className="card-header">
        <div><h3>{editing ? "Editar modelo" : "Novo modelo para impressão"}</h3><p>Defina o tamanho da arte e a posição exata do QR Code e do logo.</p></div>
      </div>
      <div className="card-body">
        <form key={editing?.id || "new"} onSubmit={submit} encType="multipart/form-data">
          <div className="grid-2">
            <Field label="Nome"><Input name="name" defaultValue={current.name} required /></Field>
            <Field label="Descrição"><Input name="description" defaultValue={current.description} /></Field>
            <Field label="Imagem-base do mockup"><Input name="template_file" type="file" accept=".png,.jpg,.jpeg,.webp" /></Field>
            <Field label="Status"><label className="qr-admin-check"><input name="is_active" type="checkbox" defaultChecked={Boolean(current.is_active)} /> Disponível para os restaurantes</label></Field>
          </div>

          <h4 className="qr-admin-section-title">Tamanho final da arte</h4>
          <div className="grid-3">
            <Field label="Largura (px)"><Input name="width" type="number" min="400" max="5000" defaultValue={current.width} required /></Field>
            <Field label="Altura (px)"><Input name="height" type="number" min="400" max="5000" defaultValue={current.height} required /></Field>
            <Field label="Cor de fundo (modelos internos)"><Input name="background_color" type="color" defaultValue={current.background_color || "#201827"} /></Field>
          </div>

          <h4 className="qr-admin-section-title">Área do QR Code</h4>
          <div className="grid-3">
            <Field label="Posição X"><Input name="qr_x" type="number" min="0" defaultValue={current.qr_x} required /></Field>
            <Field label="Posição Y"><Input name="qr_y" type="number" min="0" defaultValue={current.qr_y} required /></Field>
            <Field label="Tamanho"><Input name="qr_size" type="number" min="120" defaultValue={current.qr_size} required /></Field>
          </div>

          <h4 className="qr-admin-section-title">Área do logo</h4>
          <div className="grid-3">
            <Field label="Posição X"><Input name="logo_x" type="number" min="0" defaultValue={current.logo_x} required /></Field>
            <Field label="Posição Y"><Input name="logo_y" type="number" min="0" defaultValue={current.logo_y} required /></Field>
            <Field label="Tamanho"><Input name="logo_size" type="number" min="40" defaultValue={current.logo_size} required /></Field>
            <Field label="Cor de destaque (modelos internos)"><Input name="accent_color" type="color" defaultValue={current.accent_color || "#f4581c"} /></Field>
          </div>
          <p className="qr-admin-help">As posições começam no canto superior esquerdo. A imagem-base deve ter a mesma proporção da largura e altura configuradas.</p>
          <div className="action-row">
            <button className="btn btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar modelo"}</button>
            {editing && <button className="btn btn-outline" type="button" onClick={() => setEditing(null)}>Cancelar edição</button>}
          </div>
        </form>
      </div>
    </div>

    <div className="card">
      <div className="card-header"><h3>Modelos cadastrados</h3><span className="badge badge-blue">{templates.length}</span></div>
      <div className="card-body">
        <div className="qr-admin-template-grid">
          {templates.map((template) => <article className="qr-admin-template" key={template.id}>
            <div className="qr-admin-template__preview" style={{ background: template.template_file ? undefined : `linear-gradient(145deg, ${template.background_color}, #0c0910)` }}>
              {template.template_file ? <img src={mediaUrl(template.template_file)} alt="" /> : <i className="fas fa-qrcode" />}
              <span>{template.width} × {template.height}px</span>
            </div>
            <div className="qr-admin-template__body">
              <div><strong>{template.name}</strong><span className={`badge ${template.is_active ? "badge-green" : "badge-red"}`}>{template.is_active ? "Ativo" : "Inativo"}</span></div>
              <p>{template.description || "Sem descrição"}</p>
              <small>QR: {template.qr_x}, {template.qr_y}, {template.qr_size}px · Logo: {template.logo_x}, {template.logo_y}, {template.logo_size}px</small>
              <div className="action-row">
                <button className="btn btn-sm btn-outline" onClick={() => { setEditing(template); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</button>
                <button className="btn btn-sm btn-outline" onClick={() => action(template, "toggle")}>{template.is_active ? "Desativar" : "Ativar"}</button>
                <button className="btn btn-sm btn-danger" onClick={() => action(template, "delete")}>Excluir</button>
              </div>
            </div>
          </article>)}
        </div>
      </div>
    </div>
  </>;
}
