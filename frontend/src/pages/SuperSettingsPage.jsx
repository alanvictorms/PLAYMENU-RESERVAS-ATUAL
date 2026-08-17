import { useEffect, useState } from "react";
import { AdminHeader, Alert } from "../components/AdminLayout";
import { api } from "../services/api";

const Field = ({ label, name, type = "text", defaultValue = "", children, ...props }) => <div className="form-group"><label>{label}</label>{children || <input className="form-control" name={name} type={type} defaultValue={defaultValue ?? ""} {...props} />}</div>;

export default function SuperSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [notice, setNotice] = useState({});
  const [saving, setSaving] = useState("");

  const load = () => api.get("/superadmin/settings")
    .then((response) => setSettings(response.data))
    .catch((error) => setNotice({ error: error.response?.data?.detail || "Não foi possível carregar as configurações." }));

  useEffect(() => { load(); }, []);

  const submit = async (event, section) => {
    event.preventDefault();
    setSaving(section);
    setNotice({});
    try {
      await api.post("/superadmin/settings", Object.fromEntries(new FormData(event.currentTarget)));
      setNotice({ message: section === "ai" ? "Configuração de IA salva." : section === "asaas" ? "Configuração do Asaas salva." : section === "evolution" ? "Configuração da Evolution API salva." : "Configuração de e-mail salva." });
      load();
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível salvar as configurações." });
    } finally {
      setSaving("");
    }
  };

  if (!settings) return <><AdminHeader title="Configurações" /><div className="empty-state"><p>Carregando configurações...</p></div></>;

  return <>
    <AdminHeader title="Configurações" />
    {notice.message && <Alert>{notice.message}</Alert>}
    {notice.error && <Alert type="error">{notice.error}</Alert>}

    <div className="card" style={{ marginBottom: 27 }}>
      <div className="card-header">
        <div><h3>Inteligência artificial para cardápios</h3><p>Esta configuração é usada na importação de PDF e imagens pelos restaurantes.</p></div>
        <span className={`badge ${settings.ai_api_key_configured ? "badge-green" : "badge-orange"}`}>{settings.ai_api_key_configured ? "Chave configurada" : "Configuração pendente"}</span>
      </div>
      <div className="card-body">
        <form onSubmit={(event) => submit(event, "ai")}>
          <div className="grid-2">
            <Field label="Provedor">
              <select className="form-control" name="ai_provider" defaultValue={settings.ai_provider || "openai_responses"}>
                <option value="openai_responses">OpenAI Responses (PDF e imagem)</option>
                <option value="openai_compatible">API compatível com Chat Completions (imagem)</option>
              </select>
            </Field>
            <Field label="Modelo" name="ai_model" defaultValue={settings.ai_model || "gpt-5.6-luna"} placeholder="Ex.: gpt-5.6-luna" required />
            <Field label="URL da API" name="ai_api_url" type="url" defaultValue={settings.ai_api_url} placeholder="Vazio usa a URL oficial do OpenAI Responses" />
            <Field label="Tempo por requisição (segundos)" name="ai_timeout_seconds" type="number" min="20" max="90" defaultValue={settings.ai_timeout_seconds || 60} />
            <Field label={settings.ai_api_key_configured ? "Nova chave da API (deixe vazio para manter)" : "Chave da API"} name="ai_api_key" type="password" defaultValue="" autoComplete="new-password" required={!settings.ai_api_key_configured} />
          </div>
          <div className="ai-settings-note"><i className="fas fa-shield-halved" /><span>A chave não é enviada novamente ao navegador depois de salva. Para cardápios, recomendamos gpt-5.6-luna e 60 segundos; análises longas continuam em segundo plano.</span></div>
          <button className="btn btn-primary" disabled={saving === "ai"}>{saving === "ai" ? "Salvando..." : "Salvar configuração de IA"}</button>
        </form>
      </div>
    </div>

    <div className="card" style={{ marginBottom: 27 }}>
      <div className="card-header">
        <div><h3>Integração Asaas</h3><p>Credenciais usadas para gerar cobranças de assinatura, vídeos avulsos e receber o webhook de pagamento.</p></div>
        <span className={`badge ${settings.asaas_api_key_configured ? "badge-green" : "badge-orange"}`}>{settings.asaas_api_key_configured ? "Chave configurada" : "Configuração pendente"}</span>
      </div>
      <div className="card-body">
        <form onSubmit={(event) => submit(event, "asaas")}>
          <div className="grid-2">
            <Field label="URL base da API" name="asaas_base_url" type="url" defaultValue={settings.asaas_base_url || "https://api.asaas.com/v3"} placeholder="https://api.asaas.com/v3" />
            <Field label={settings.asaas_api_key_configured ? "Nova chave de API (deixe vazio para manter)" : "Chave de API"} name="asaas_api_key" type="password" defaultValue="" autoComplete="new-password" required={!settings.asaas_api_key_configured} />
            <Field label={settings.asaas_webhook_secret_configured ? "Novo segredo do webhook (deixe vazio para manter)" : "Segredo do webhook (opcional)"} name="asaas_webhook_secret" type="password" defaultValue="" autoComplete="new-password" />
          </div>
          <div className="ai-settings-note"><i className="fas fa-shield-halved" /><span>As chaves não são reenviadas ao navegador depois de salvas. Cadastre em Asaas &gt; Integrações o endpoint <code>/api/webhooks/asaas</code> com este mesmo segredo no cabeçalho <code>asaas-access-token</code>.</span></div>
          <button className="btn btn-primary" disabled={saving === "asaas"}>{saving === "asaas" ? "Salvando..." : "Salvar configuração do Asaas"}</button>
        </form>
      </div>
    </div>

    <div className="card" style={{ marginBottom: 27 }}>
      <div className="card-header">
        <div><h3>Evolution API · WhatsApp</h3><p>Credenciais globais usadas para criar uma instância isolada para cada restaurante.</p></div>
        <span className={`badge ${settings.evolution_api_key_configured ? "badge-green" : "badge-orange"}`}>{settings.evolution_api_key_configured ? "Chave configurada" : "Configuração pendente"}</span>
      </div>
      <div className="card-body">
        <form onSubmit={(event) => submit(event, "evolution")}>
          <div className="grid-2">
            <Field label="URL base da Evolution API" name="evolution_api_url" type="url" defaultValue={settings.evolution_api_url} placeholder="https://evolution.seudominio.com" required />
            <Field label={settings.evolution_api_key_configured ? "Nova chave global (deixe vazio para manter)" : "Chave global da API"} name="evolution_api_key" type="password" defaultValue="" autoComplete="new-password" required={!settings.evolution_api_key_configured} />
          </div>
          <div className="ai-settings-note"><i className="fas fa-shield-halved" /><span>A chave fica somente no servidor. Ao conectar, o PlayMenu cria uma instância WHATSAPP-BAILEYS para o restaurante e acompanha QR Code e status por webhook e consulta de estado.</span></div>
          <button className="btn btn-primary" disabled={saving === "evolution"}>{saving === "evolution" ? "Salvando..." : "Salvar Evolution API"}</button>
        </form>
      </div>
    </div>

    <div className="card">
      <div className="card-header"><h3>SMTP global</h3></div>
      <div className="card-body">
        <form onSubmit={(event) => submit(event, "smtp")}>
          <div className="grid-2">
            <Field label="Servidor SMTP" name="smtp_host" defaultValue={settings.smtp_host} />
            <Field label="Porta" name="smtp_port" type="number" defaultValue={settings.smtp_port || 465} />
            <Field label="Segurança">
              <select className="form-control" name="smtp_secure" defaultValue={settings.smtp_secure || "ssl"}>
                <option value="ssl">SSL</option><option value="tls">TLS / STARTTLS</option><option value="none">Sem criptografia</option>
              </select>
            </Field>
            <Field label="Usuário SMTP" name="smtp_user" defaultValue={settings.smtp_user} />
            <Field label="Senha SMTP" name="smtp_pass" type="password" defaultValue={settings.smtp_pass} />
            <Field label="E-mail remetente" name="smtp_from" type="email" defaultValue={settings.smtp_from} />
            <Field label="Nome remetente" name="smtp_from_name" defaultValue={settings.smtp_from_name || "PlayMenu"} />
          </div>
          <button className="btn btn-primary" disabled={saving === "smtp"}>{saving === "smtp" ? "Salvando..." : "Salvar SMTP"}</button>
        </form>
      </div>
    </div>
  </>;
}
