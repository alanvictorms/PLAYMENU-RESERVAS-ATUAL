import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageCropField from "../components/ImageCropField";
import { useAuth } from "../context/AuthContext";
import { useLegacyStyles } from "../hooks/useLegacyStyles";
import { api, mediaUrl } from "../services/api";

const INITIAL_SETTINGS = {
  store_name: "",
  instagram: "",
  whatsapp: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

const STEP_LABELS = ["Nome", "Logo", "Capa", "Endereço", "Contato", "Revisão"];

const STEP_TITLES = [
  "Como sua loja se chama?",
  "Adicione sua logo",
  "Escolha uma imagem de capa",
  "Onde fica o estabelecimento?",
  "Como seus clientes entram em contato?",
  "Tudo pronto para começar",
];

const STEP_ICONS = [
  "fa-store",
  "fa-image",
  "fa-panorama",
  "fa-location-dot",
  "fa-comments",
  "fa-circle-check",
];

const CONTACT_TYPES = [
  { value: "site", label: "Site", icon: "fa-solid fa-globe" },
  { value: "ifood", label: "iFood", icon: "fa-solid fa-utensils" },
  { value: "facebook", label: "Facebook", icon: "fa-brands fa-facebook" },
  { value: "x", label: "X.com", icon: "fa-brands fa-x-twitter" },
  { value: "telefone", label: "Telefone", icon: "fa-solid fa-phone" },
  { value: "email", label: "E-mail", icon: "fa-solid fa-envelope" },
  { value: "manual", label: "Outro", icon: "fa-solid fa-link" },
];

const TOTAL_STEPS = 6;

const formatCep = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

const formatPhone = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

function useObjectUrl(file) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }

    const next = URL.createObjectURL(file);
    setUrl(next);

    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}

export default function WizardPage() {
  useLegacyStyles(
    "/public/assets/css/playmenu-ui.css",
    "ui-kit-page restaurant-admin-page ui-wizard-page",
  );

  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [contacts, setContacts] = useState([]);
  const [savedImages, setSavedImages] = useState({ logo_image: null, cover_image: null });
  const [files, setFiles] = useState({ logo_image: null, cover_image: null });
  const [cepStatus, setCepStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);

  const logoPreview =
    useObjectUrl(files.logo_image) ||
    (savedImages.logo_image ? mediaUrl(savedImages.logo_image) : null);
  const coverPreview =
    useObjectUrl(files.cover_image) ||
    (savedImages.cover_image ? mediaUrl(savedImages.cover_image) : null);

  useEffect(() => {
    let mounted = true;

    api.get("/restaurant/settings")
      .then(({ data }) => {
        if (!mounted) return;

        setSettings((current) => ({
          ...current,
          store_name: data.store_name ?? current.store_name,
          instagram: data.instagram ?? "",
          whatsapp: formatPhone(data.whatsapp ?? ""),
        }));

        setContacts(Array.isArray(data.social_links) ? data.social_links : []);
        setSavedImages({
          logo_image: data.logo_image || null,
          cover_image: data.cover_image || null,
        });
      })
      .catch(() => {
        if (mounted) {
          setError("Não foi possível carregar as configurações.");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const updateSetting = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  };

  const selectImage = (field, file) => {
    setFiles((current) => ({ ...current, [field]: file }));
    if (file) setError("");
  };

  const lookupCep = async (rawCep) => {
    const digits = String(rawCep || "").replace(/\D/g, "");

    if (digits.length !== 8) {
      setCepStatus("");
      return;
    }

    setCepStatus("loading");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepStatus("notfound");
        return;
      }

      setSettings((current) => ({
        ...current,
        street: data.logradouro || current.street,
        district: data.bairro || current.district,
        city: data.localidade || current.city,
        state: data.uf || current.state,
      }));

      setCepStatus("found");
    } catch {
      setCepStatus("error");
    }
  };

  const updateContact = (index, patch) => {
    setContacts((current) =>
      current.map((item, position) => (position === index ? { ...item, ...patch } : item)),
    );
  };

  const addContact = () => {
    setContacts((current) => [
      ...current,
      { type: "site", name: "", url: "", icon: "fa-solid fa-globe" },
    ]);
  };

  const removeContact = (index) => {
    setContacts((current) => current.filter((_, position) => position !== index));
  };

  const nextStep = () => {
    setError("");

    if (step === 0 && !settings.store_name.trim()) {
      setError("Informe o nome do estabelecimento.");
      return;
    }

    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  };

  const previousStep = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const getApiError = (requestError) => {
    const detail = requestError.response?.data?.detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      return detail.map((item) => item?.msg).filter(Boolean).join(" ");
    }

    return "Não foi possível salvar as configurações.";
  };

  const submit = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!settings.store_name.trim()) {
      setStep(0);
      setError("Informe o nome do estabelecimento.");
      return;
    }

    const formData = new FormData();

    formData.append("store_name", settings.store_name.trim());
    formData.append("instagram", settings.instagram?.trim() || "");
    formData.append("whatsapp", settings.whatsapp?.trim() || "");
    formData.append(
      "social_links",
      JSON.stringify(
        contacts
          .filter((contact) => contact.url?.trim())
          .map((contact) => ({
            ...contact,
            icon:
              contact.icon ||
              CONTACT_TYPES.find((item) => item.value === contact.type)?.icon ||
              "fa-solid fa-link",
          })),
      ),
    );

    ["cep", "street", "number", "complement", "district", "city", "state"].forEach((field) => {
      formData.append(field, String(settings[field] ?? "").trim());
    });

    if (files.logo_image) formData.append("logo_image", files.logo_image);
    if (files.cover_image) formData.append("cover_image", files.cover_image);

    try {
      setSaving(true);
      setError("");

      const { data } = await api.post("/restaurant/wizard", formData);

      setDone({ emailSent: Boolean(data?.verification_email_sent) });
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="ui-field">
            <label htmlFor="wizard-store-name">Nome do estabelecimento</label>

            <input
              id="wizard-store-name"
              name="store_name"
              value={settings.store_name}
              onChange={(event) => updateSetting("store_name", event.target.value)}
              placeholder="Ex.: Buteco do Baiano"
              autoComplete="organization"
              required
            />
          </div>
        );

      case 1:
        return (
          <ImageCropField
            id="wizard-logo"
            aspect={1}
            outputWidth={600}
            maxSizeMb={2}
            rounded
            hint="PNG, JPG ou WebP de até 2 MB. Formato quadrado."
            currentImage={savedImages.logo_image ? mediaUrl(savedImages.logo_image) : null}
            file={files.logo_image}
            onChange={(file) => selectImage("logo_image", file)}
            onError={setError}
          />
        );

      case 2:
        return (
          <ImageCropField
            id="wizard-cover"
            aspect={16 / 9}
            outputWidth={1600}
            maxSizeMb={5}
            hint="PNG, JPG ou WebP de até 5 MB. Formato panorâmico (16:9)."
            currentImage={savedImages.cover_image ? mediaUrl(savedImages.cover_image) : null}
            file={files.cover_image}
            onChange={(file) => selectImage("cover_image", file)}
            onError={setError}
          />
        );

      case 3:
        return (
          <div className="ui-stack">
            <div className="ui-field ui-field--cep">
              <label htmlFor="wizard-cep">CEP</label>

              <div className="ui-input-with-status">
                <input
                  id="wizard-cep"
                  name="cep"
                  value={settings.cep}
                  inputMode="numeric"
                  placeholder="00000-000"
                  autoComplete="postal-code"
                  onChange={(event) => {
                    const value = formatCep(event.target.value);
                    updateSetting("cep", value);
                    setCepStatus("");
                    if (value.replace(/\D/g, "").length === 8) lookupCep(value);
                  }}
                  onBlur={(event) => lookupCep(event.target.value)}
                />

                {cepStatus === "loading" && <span className="ui-input-status">Buscando...</span>}
                {cepStatus === "found" && (
                  <span className="ui-input-status is-ok">Endereço preenchido</span>
                )}
                {cepStatus === "notfound" && (
                  <span className="ui-input-status is-error">CEP não encontrado</span>
                )}
                {cepStatus === "error" && (
                  <span className="ui-input-status is-error">Falha na busca, preencha manualmente</span>
                )}
              </div>

              <small className="ui-field__hint">
                Informe o CEP e preenchemos o endereço automaticamente.
              </small>
            </div>

            <div className="ui-form-grid ui-form-grid--2">
              <div className="ui-field">
                <label htmlFor="wizard-street">Rua / Avenida</label>
                <input
                  id="wizard-street"
                  name="street"
                  value={settings.street}
                  onChange={(event) => updateSetting("street", event.target.value)}
                  autoComplete="street-address"
                />
              </div>

              <div className="ui-field">
                <label htmlFor="wizard-number">Número</label>
                <input
                  id="wizard-number"
                  name="number"
                  value={settings.number}
                  onChange={(event) => updateSetting("number", event.target.value)}
                  placeholder="123"
                />
              </div>

              <div className="ui-field">
                <label htmlFor="wizard-complement">Complemento</label>
                <input
                  id="wizard-complement"
                  name="complement"
                  value={settings.complement}
                  onChange={(event) => updateSetting("complement", event.target.value)}
                  placeholder="Sala, andar, ponto de referência"
                />
              </div>

              <div className="ui-field">
                <label htmlFor="wizard-district">Bairro</label>
                <input
                  id="wizard-district"
                  name="district"
                  value={settings.district}
                  onChange={(event) => updateSetting("district", event.target.value)}
                />
              </div>

              <div className="ui-field">
                <label htmlFor="wizard-city">Cidade</label>
                <input
                  id="wizard-city"
                  name="city"
                  value={settings.city}
                  onChange={(event) => updateSetting("city", event.target.value)}
                />
              </div>

              <div className="ui-field">
                <label htmlFor="wizard-state">Estado (UF)</label>
                <input
                  id="wizard-state"
                  name="state"
                  value={settings.state}
                  maxLength={2}
                  onChange={(event) => updateSetting("state", event.target.value.toUpperCase())}
                  placeholder="CE"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="ui-stack">
            <div className="ui-form-grid ui-form-grid--2">
              <div className="ui-field">
                <label htmlFor="wizard-whatsapp">WhatsApp</label>
                <input
                  id="wizard-whatsapp"
                  name="whatsapp"
                  type="tel"
                  value={settings.whatsapp}
                  onChange={(event) => updateSetting("whatsapp", formatPhone(event.target.value))}
                  placeholder="(85) 99999-9999"
                  autoComplete="tel"
                />
              </div>

              <div className="ui-field">
                <label htmlFor="wizard-instagram">Instagram</label>
                <input
                  id="wizard-instagram"
                  name="instagram"
                  value={settings.instagram}
                  onChange={(event) => updateSetting("instagram", event.target.value)}
                  placeholder="@seurestaurante"
                />
              </div>
            </div>

            <div className="ui-contact-rows">
              {contacts.map((contact, index) => (
                <div className="ui-contact-row" key={index}>
                  <select
                    value={contact.type || "manual"}
                    aria-label="Tipo do contato"
                    onChange={(event) => {
                      const type = event.target.value;
                      updateContact(index, {
                        type,
                        icon: CONTACT_TYPES.find((item) => item.value === type)?.icon,
                      });
                    }}
                  >
                    {CONTACT_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <input
                    value={contact.name || ""}
                    placeholder="Nome exibido"
                    aria-label="Nome do contato"
                    onChange={(event) => updateContact(index, { name: event.target.value })}
                  />

                  <input
                    value={contact.url || ""}
                    placeholder="https://..."
                    aria-label="Link ou informação"
                    onChange={(event) => updateContact(index, { url: event.target.value })}
                  />

                  <button
                    type="button"
                    className="ui-btn ui-btn--danger ui-btn--sm"
                    onClick={() => removeContact(index)}
                    aria-label="Remover contato"
                  >
                    <i className="fas fa-times" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="ui-btn ui-btn--outline ui-btn--sm"
              onClick={addContact}
            >
              <i className="fas fa-plus" style={{ marginRight: 6 }} aria-hidden="true" />
              Adicionar mais informações
            </button>
          </div>
        );

      case 5:
        return (
          <div className="ui-stack">
            <div className="ui-review-card">
              <div
                className="ui-review-card__cover"
                style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined}
              >
                <div className="ui-review-card__logo">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" />
                  ) : (
                    <i className="fas fa-store" aria-hidden="true" />
                  )}
                </div>
              </div>

              <div className="ui-review-card__body">
                <strong>{settings.store_name || "Sua Loja"}</strong>

                <dl className="ui-info-grid-admin">
                  <div className="ui-info-item-admin">
                    <dt>Endereço</dt>
                    <dd>
                      {[settings.street, settings.number, settings.district]
                        .filter(Boolean)
                        .join(", ") || "—"}
                      <br />
                      {[settings.city, settings.state].filter(Boolean).join(" - ") || ""}
                      {settings.cep ? ` · ${settings.cep}` : ""}
                    </dd>
                  </div>

                  <div className="ui-info-item-admin">
                    <dt>WhatsApp</dt>
                    <dd>{settings.whatsapp || "—"}</dd>
                  </div>

                  <div className="ui-info-item-admin">
                    <dt>Instagram</dt>
                    <dd>{settings.instagram || "—"}</dd>
                  </div>

                  <div className="ui-info-item-admin">
                    <dt>Outros contatos</dt>
                    <dd>{contacts.filter((contact) => contact.url?.trim()).length || 0} link(s)</dd>
                  </div>
                </dl>
              </div>
            </div>

            <p className="ui-wizard-note">
              Ao concluir, enviaremos um e-mail de confirmação de cadastro para{" "}
              <strong>{user?.email}</strong>.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  if (done) {
    return (
      <main className="ui-wizard-shell">
        <header className="ui-wizard-topbar">
          <div className="ui-wizard-brand">
            <img src="/public/assets/images/logopm.png" alt="PlayMenu" />
            <strong>PlayMenu</strong>
          </div>

          <span className="ui-badge ui-badge--success">Configuração concluída</span>
        </header>

        <section className="ui-wizard-card">
          <header className="ui-wizard-header">
            <span className="ui-eyebrow">Tudo certo</span>
            <h1>Seu restaurante está configurado</h1>
            <p>
              {done.emailSent
                ? `Enviamos um e-mail de confirmação de cadastro para ${user?.email}. Abra sua caixa de entrada e clique em "Confirmar cadastro".`
                : "Não conseguimos enviar o e-mail de confirmação agora. Você pode reenviá-lo pelo seu perfil a qualquer momento."}
            </p>
          </header>

          <div className="ui-wizard-actions">
            <button
              type="button"
              className="ui-btn ui-btn--primary ui-btn--lg"
              onClick={() => navigate("/admin", { replace: true })}
            >
              Acessar o painel
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="ui-wizard-shell">
      <header className="ui-wizard-topbar">
        <div className="ui-wizard-brand">
          <img src="/public/assets/images/logopm.png" alt="PlayMenu" />
          <strong>PlayMenu</strong>
        </div>

        <span className="ui-badge ui-badge--accent">Configuração inicial</span>
      </header>

      <section className="ui-wizard-card">
        <header className="ui-wizard-header">
          <span className="ui-eyebrow">Primeiros passos</span>

          <h1>Prepare seu restaurante para o PlayMenu</h1>

          <p>
            Complete as seis etapas para organizar identidade, localização,
            contato e apresentação final.
          </p>
        </header>

        <div
          className="ui-wizard-progress"
          style={{ "--wizard-progress": `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        >
          <div className="ui-progress">
            <span />
          </div>

          <ol className="ui-wizard-steps">
            {STEP_LABELS.map((label, index) => (
              <li
                key={label}
                className={[
                  "ui-wizard-step",
                  index === step ? "active" : "",
                  index < step ? "done" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span>{index + 1}</span>
                <small>{label}</small>
              </li>
            ))}
          </ol>
        </div>

        <form className="ui-wizard-form" onSubmit={submit} encType="multipart/form-data">
          {error && (
            <div className="ui-alert ui-alert--danger" role="alert">
              {error}
            </div>
          )}

          <section className="ui-wizard-panel active">
            <div className="ui-wizard-step-head">
              <span className="ui-wizard-step-icon">
                <i className={`fas ${STEP_ICONS[step]}`} aria-hidden="true" />
              </span>

              <div>
                <span className="ui-eyebrow">
                  Etapa {step + 1} de {TOTAL_STEPS}
                </span>

                <h2>{STEP_TITLES[step]}</h2>
              </div>
            </div>

            {renderStepContent()}

            <div className="ui-wizard-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="ui-btn ui-btn--outline"
                  onClick={previousStep}
                  disabled={saving}
                >
                  Voltar
                </button>
              )}

              {step < TOTAL_STEPS - 1 ? (
                <button type="button" className="ui-btn ui-btn--primary" onClick={nextStep}>
                  Próximo
                </button>
              ) : (
                <button
                  type="submit"
                  className="ui-btn ui-btn--primary ui-btn--lg"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Concluir cadastro"}
                </button>
              )}
            </div>
          </section>
        </form>
      </section>
    </main>
  );
}
