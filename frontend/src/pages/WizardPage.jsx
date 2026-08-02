import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useLegacyStyles } from "../hooks/useLegacyStyles";

const INITIAL_SETTINGS = {
  store_name: "",
  instagram: "",
  whatsapp: "",
  address: "",
  latitude: "",
  longitude: "",
};

const STEP_LABELS = [
  "Nome",
  "Logo",
  "Capa",
  "Endereço",
  "Contato",
  "Revisão",
];

const STEP_TITLES = [
  "Como sua loja se chama?",
  "Adicione sua logo",
  "Escolha uma imagem de capa",
  "Onde fica o estabelecimento?",
  "Como seus clientes entram em contato?",
  "Tudo pronto para começar",
];

export default function WizardPage() {
  useLegacyStyles(
    "/public/assets/css/playmenu-ui.css",
    "ui-kit-page restaurant-admin-page ui-wizard-page",
  );

  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [files, setFiles] = useState({
    logo_image: null,
    cover_image: null,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    api.get("/restaurant/settings")
      .then(({ data }) => {
        if (!mounted) return;

        setSettings((current) => ({
          ...current,
          ...data,
          latitude: data.latitude ?? "",
          longitude: data.longitude ?? "",
          address: data.address ?? "",
          instagram: data.instagram ?? "",
          whatsapp: data.whatsapp ?? "",
        }));
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
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) setError("");
  };

  const selectFile = (field, file, maxSizeMb) => {
    if (!file) {
      setFiles((current) => ({
        ...current,
        [field]: null,
      }));
      return;
    }

    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setError(`O arquivo deve ter no máximo ${maxSizeMb} MB.`);
      return;
    }

    setFiles((current) => ({
      ...current,
      [field]: file,
    }));

    setError("");
  };

  const nextStep = () => {
    setError("");

    if (step === 0 && !settings.store_name.trim()) {
      setError("Informe o nome do estabelecimento.");
      return;
    }

    setStep((current) => Math.min(current + 1, 5));
  };

  const previousStep = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const getApiError = (requestError) => {
    const detail = requestError.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(" ");
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

    // Estes campos são adicionados mesmo que seus inputs não estejam
    // mais renderizados na etapa de revisão.
    formData.append("store_name", settings.store_name.trim());
    formData.append("instagram", settings.instagram?.trim() || "");
    formData.append("whatsapp", settings.whatsapp?.trim() || "");
    formData.append("address", settings.address?.trim() || "");
    formData.append("latitude", String(settings.latitude ?? "").trim());
    formData.append("longitude", String(settings.longitude ?? "").trim());

    if (files.logo_image) {
      formData.append("logo_image", files.logo_image);
    }

    if (files.cover_image) {
      formData.append("cover_image", files.cover_image);
    }

    try {
      setSaving(true);
      setError("");

      await api.post("/restaurant/wizard", formData);

      navigate("/admin", { replace: true });
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
            <label htmlFor="wizard-store-name">
              Nome do estabelecimento
            </label>

            <input
              id="wizard-store-name"
              name="store_name"
              value={settings.store_name}
              onChange={(event) =>
                updateSetting("store_name", event.target.value)
              }
              autoComplete="organization"
              required
            />
          </div>
        );

      case 1:
        return (
          <label className="ui-upload-zone">
            <input
              type="file"
              name="logo_image"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(event) =>
                selectFile("logo_image", event.target.files?.[0], 2)
              }
            />

            <strong>
              {files.logo_image
                ? files.logo_image.name
                : "Selecione ou arraste sua logo"}
            </strong>

            <span>PNG, JPG ou WebP de até 2 MB.</span>
          </label>
        );

      case 2:
        return (
          <label className="ui-upload-zone">
            <input
              type="file"
              name="cover_image"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(event) =>
                selectFile("cover_image", event.target.files?.[0], 5)
              }
            />

            <strong>
              {files.cover_image
                ? files.cover_image.name
                : "Selecione ou arraste a imagem de capa"}
            </strong>

            <span>PNG, JPG ou WebP de até 5 MB.</span>
          </label>
        );

      case 3:
        return (
          <div className="ui-stack">
            <div className="ui-field">
              <label htmlFor="wizard-address">Endereço</label>

              <input
                id="wizard-address"
                name="address"
                value={settings.address}
                onChange={(event) =>
                  updateSetting("address", event.target.value)
                }
                autoComplete="street-address"
              />
            </div>

            <div className="ui-form-grid ui-form-grid--2">
              <div className="ui-field">
                <label htmlFor="wizard-latitude">Latitude</label>

                <input
                  id="wizard-latitude"
                  name="latitude"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="-90"
                  max="90"
                  value={settings.latitude}
                  onChange={(event) =>
                    updateSetting("latitude", event.target.value)
                  }
                />
              </div>

              <div className="ui-field">
                <label htmlFor="wizard-longitude">Longitude</label>

                <input
                  id="wizard-longitude"
                  name="longitude"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="-180"
                  max="180"
                  value={settings.longitude}
                  onChange={(event) =>
                    updateSetting("longitude", event.target.value)
                  }
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="ui-form-grid ui-form-grid--2">
            <div className="ui-field">
              <label htmlFor="wizard-instagram">Instagram</label>

              <input
                id="wizard-instagram"
                name="instagram"
                value={settings.instagram}
                onChange={(event) =>
                  updateSetting("instagram", event.target.value)
                }
                placeholder="@seurestaurante"
              />
            </div>

            <div className="ui-field">
              <label htmlFor="wizard-whatsapp">WhatsApp</label>

              <input
                id="wizard-whatsapp"
                name="whatsapp"
                type="tel"
                value={settings.whatsapp}
                onChange={(event) =>
                  updateSetting("whatsapp", event.target.value)
                }
                placeholder="(85) 99999-9999"
                autoComplete="tel"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="ui-preview-card-admin">
            <div className="ui-preview-card-admin__info">
              <div className="ui-preview-card-admin__logo">
                <span>
                  {files.logo_image ? files.logo_image.name : "Logo"}
                </span>
              </div>

              <div className="ui-preview-card-admin__name">
                {settings.store_name || "Sua Loja"}
              </div>

              <div className="ui-preview-card-admin__social">
                {settings.instagram && (
                  <i className="fab fa-instagram" aria-hidden="true" />
                )}

                {settings.whatsapp && (
                  <i className="fab fa-whatsapp" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="ui-wizard-shell">
      <header className="ui-wizard-topbar">
        <div className="ui-wizard-brand">
          <img
            src="/public/assets/images/logopm.png"
            alt="PlayMenu"
          />
          <strong>PlayMenu</strong>
        </div>

        <span className="ui-badge ui-badge--accent">
          Configuração inicial
        </span>
      </header>

      <section className="ui-wizard-card">
        <header className="ui-wizard-header">
          <span className="ui-eyebrow">Primeiros passos</span>

          <h1>Prepare seu restaurante para o PlayMenu</h1>

          <p>
            Complete as seis etapas para organizar identidade,
            localização, contato e apresentação final.
          </p>
        </header>

        <div
          className="ui-wizard-progress"
          style={{
            "--wizard-progress": `${((step + 1) / 6) * 100}%`,
          }}
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

        <form
          className="ui-wizard-form"
          onSubmit={submit}
          encType="multipart/form-data"
        >
          {error && (
            <div
              className="ui-alert ui-alert--danger"
              role="alert"
            >
              {error}
            </div>
          )}

          <section className="ui-wizard-panel active">
            <div className="ui-wizard-step-head">
              <span className="ui-wizard-step-icon">
                <i className="fas fa-store" aria-hidden="true" />
              </span>

              <div>
                <span className="ui-eyebrow">
                  Etapa {step + 1} de 6
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

              {step < 5 ? (
                <button
                  type="button"
                  className="ui-btn ui-btn--primary"
                  onClick={nextStep}
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="submit"
                  className="ui-btn ui-btn--primary ui-btn--lg"
                  disabled={saving}
                >
                  {saving
                    ? "Salvando..."
                    : "Salvar e acessar painel"}
                </button>
              )}
            </div>
          </section>
        </form>
      </section>
    </main> 
  ); 
}