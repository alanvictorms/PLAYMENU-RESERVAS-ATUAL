import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLegacyStyles } from "../hooks/useLegacyStyles";
import { api } from "../services/api";

const CSS_PATH = "/public/assets/css/playmenu-ui.css";
const LOGO_PATH = "/public/assets/images/logopm.png";

const LOGIN_VIDEOS = [
  "/public/assets/videos-login/1.mp4",
  "/public/assets/videos-login/7.mp4",
  "/public/assets/videos-login/6.mp4",
  "/public/assets/videos-login/5.mp4",
  "/public/assets/videos-login/2.mp4",
  "/public/assets/videos-login/3.mp4",
  "/public/assets/videos-login/4.mp4",
];

const selectStyle = {
  width: "100%",
  background: "var(--row)",
  border: "1.5px solid transparent",
  borderRadius: "var(--radius-sm)",
  padding: "15px 16px",
  color: "#fff",
  fontFamily: "inherit",
  fontSize: "15px",
  outline: "none",
};

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ hidden = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
      {hidden && <path d="M4 4l16 16" />}
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function Logo() {
  return (
    <span className="sidebar__logo">
      <img src={LOGO_PATH} alt="PlayMenu" />
    </span>
  );
}

function AuthAlert({ type = "error", children }) {
  if (!children) return null;

  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      style={{
        marginTop: 18,
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${isError ? "rgba(255, 122, 99, 0.45)" : "rgba(74, 222, 128, 0.35)"}`,
        background: isError ? "rgba(255, 122, 99, 0.1)" : "rgba(74, 222, 128, 0.1)",
        color: isError ? "#ff9a88" : "#86efac",
        fontSize: 14,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}

function TextInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  minLength,
  inputMode,
  disabled = false,
  icon = null,
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field__input">
        {icon}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          inputMode={inputMode}
          disabled={disabled}
          style={!icon ? { paddingLeft: 16 } : undefined}
        />
      </div>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Mínimo de 6 caracteres",
  autoComplete = "current-password",
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field__input">
        <LockIcon />
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          minLength="6"
          style={{ paddingRight: 48 }}
        />
        <button
          type="button"
          className="toggle-pass"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          <EyeIcon hidden={visible} />
        </button>
      </div>
    </div>
  );
}

const PASSWORD_RULES = [
  { id: "length", label: "8 caracteres ou mais", test: (value) => value.length >= 8 },
  { id: "case", label: "Letras maiúsculas e minúsculas", test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { id: "number", label: "Pelo menos um número", test: (value) => /\d/.test(value) },
  { id: "symbol", label: "Pelo menos um símbolo", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

const STRENGTH_LEVELS = [
  { label: "Muito fraca", color: "#ff7a63" },
  { label: "Fraca", color: "#ffa04b" },
  { label: "Boa", color: "#ffc043" },
  { label: "Forte", color: "#4ade80" },
];

export function passwordStrength(password) {
  const value = password || "";
  const passed = PASSWORD_RULES.filter((rule) => rule.test(value));
  const score = value ? Math.max(1, passed.length) : 0;

  return {
    score,
    passed: passed.map((rule) => rule.id),
    ...(score ? STRENGTH_LEVELS[score - 1] : { label: "", color: "" }),
  };
}

function PasswordStrength({ value }) {
  const { score, passed, label, color } = passwordStrength(value);

  if (!value) return null;

  return (
    <div className="pw-strength">
      <div className="pw-strength__bars" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="pw-strength__bar"
            style={index < score ? { background: color } : undefined}
          />
        ))}
      </div>

      <p className="pw-strength__label" role="status">
        Força da senha: <strong style={{ color }}>{label}</strong>
      </p>

      <ul className="pw-strength__rules">
        {PASSWORD_RULES.map((rule) => (
          <li
            key={rule.id}
            className={passed.includes(rule.id) ? "is-done" : ""}
          >
            <span aria-hidden="true">{passed.includes(rule.id) ? "✓" : "•"}</span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoginVisual() {
  const [activeVideo, setActiveVideo] = useState(0);
  const videoRefs = useRef([]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === activeVideo) {
        video.currentTime = 0;
        const playPromise = video.play();
        playPromise?.catch(() => undefined);
      } else {
        video.pause();
      }
    });

    return () => {
      videoRefs.current.forEach((video) => video?.pause());
    };
  }, [activeVideo]);

  return (
    <section className="auth-card__visual" aria-hidden="true">
      <div className="auth-card__video-bg">
        {LOGIN_VIDEOS.map((src, index) => (
          <video
            key={src}
            ref={(element) => {
              videoRefs.current[index] = element;
            }}
            className={`auth-card__video${index === activeVideo ? " is-active" : ""}`}
            src={src}
            muted
            playsInline
            preload={index === 0 ? "auto" : "metadata"}
            onEnded={() => setActiveVideo((index + 1) % LOGIN_VIDEOS.length)}
          />
        ))}
      </div>

      <div className="auth-card__video-overlay" />

      <h2 className="auth-card__headline">
        No PlayMenu, seu cliente não precisa imaginar o sabor, ele vê, deseja e escolhe.
      </h2>
    </section>
  );
}

function Shell({
  title,
  subtitle,
  children,
  showVisual = false,
  backTo,
  backLabel = "Voltar para o login",
  onBack,
}) {
  useLegacyStyles(CSS_PATH, "ui-kit-page playmenu-auth-page");

  useEffect(() => {
    document.title = `PlayMenu — ${title}`;
  }, [title]);

  return (
    <main className="auth-page">
      <div className={`auth-card${showVisual ? "" : " auth-card--single"}`}>
        {showVisual && <LoginVisual />}

        <section className="auth-card__form">
          {onBack ? (
            <button type="button" className="auth-back-link" onClick={onBack}>
              <BackIcon />
              {backLabel}
            </button>
          ) : backTo ? (
            <Link to={backTo} className="auth-back-link">
              <BackIcon />
              {backLabel}
            </Link>
          ) : null}

          <Logo />
          <h1 className="auth-card__title">{title}</h1>
          <p className="auth-card__subtitle">{subtitle}</p>
          {children}
        </section>
      </div>
    </main>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const data = await login(form.email, form.password);
      navigate(data.redirect);
    } catch (err) {
      setError(err.response?.data?.detail || "Credenciais inválidas.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title="Bem-vindo de volta!"
      subtitle="Informe seus dados para acessar o dashboard."
      showVisual
    >
      <AuthAlert>{error}</AuthAlert>

      <form onSubmit={submit}>
        <TextInput
          id="email"
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(email) => setForm((current) => ({ ...current, email }))}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
          icon={<MailIcon />}
        />

        <PasswordInput
          id="password"
          label="Senha"
          value={form.password}
          onChange={(password) => setForm((current) => ({ ...current, password }))}
        />

        <div className="auth-row">
          <label>
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(event) =>
                setForm((current) => ({ ...current, remember: event.target.checked }))
              }
            />
            Lembrar de mim
          </label>

          <Link to="/recuperar-senha">Esqueceu a senha?</Link>
        </div>

        <button type="submit" className="auth-submit" disabled={busy}>
          {busy ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="auth-footer">
        <Link to="/">Voltar para a página inicial</Link>
      </p>
    </Shell>
  );
}

const formatPhone = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export function RegisterPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Quando o tipo já vem na URL (ex.: /cadastro?tipo=restaurante) o seletor
  // de tipo de conta fica oculto e o valor é fixado pelo link de origem.
  const typeFromUrl = params.get("tipo");
  const [form, setForm] = useState(() => ({
    tipo: typeFromUrl || "restaurante",
    ref: params.get("ref") ? Number(params.get("ref")) : null,
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    pix_key: "",
  }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("As senhas não conferem.");
      return;
    }

    setBusy(true);

    try {
      const { confirm_password, ...payload } = form;
      await api.post("/auth/register", {
        ...payload,
        phone: payload.phone.replace(/\D/g, ""),
      });

      // Entra automaticamente na conta recém-criada e segue direto para o
      // onboarding, sem passar pela tela de login.
      const session = await login(form.email, form.password);
      navigate(session.redirect || "/admin/configuracao-inicial", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Não foi possível cadastrar.");
      setBusy(false);
    }
  };

  return (
    <Shell
      title="Crie sua conta"
      subtitle="Preencha seus dados para começar a usar o PlayMenu."
      backTo="/login"
    >
      <AuthAlert>{error}</AuthAlert>

      <form onSubmit={submit}>
        {!typeFromUrl && (
          <div className="field">
            <label htmlFor="tipo">Tipo de conta</label>
            <select
              id="tipo"
              value={form.tipo}
              onChange={(event) =>
                setForm((current) => ({ ...current, tipo: event.target.value }))
              }
              style={selectStyle}
            >
              <option value="restaurante">Restaurante</option>
              <option value="representante">Representante</option>
            </select>
          </div>
        )}

        <TextInput
          id="name"
          label="Nome do responsável"
          value={form.name}
          onChange={(name) => setForm((current) => ({ ...current, name }))}
          placeholder="Como podemos te chamar?"
          autoComplete="name"
          required
        />

        <TextInput
          id="phone"
          label="Telefone"
          type="tel"
          value={form.phone}
          onChange={(phone) =>
            setForm((current) => ({ ...current, phone: formatPhone(phone) }))
          }
          placeholder="(85) 99999-9999"
          autoComplete="tel"
          inputMode="tel"
          required
        />

        <TextInput
          id="register-email"
          label="E-mail de login"
          type="email"
          value={form.email}
          onChange={(email) => setForm((current) => ({ ...current, email }))}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
          icon={<MailIcon />}
        />

        <PasswordInput
          id="register-password"
          label="Senha de login"
          value={form.password}
          onChange={(password) => setForm((current) => ({ ...current, password }))}
          autoComplete="new-password"
        />

        <PasswordStrength value={form.password} />

        <PasswordInput
          id="register-confirm-password"
          label="Confirmar senha"
          value={form.confirm_password}
          onChange={(confirm_password) =>
            setForm((current) => ({ ...current, confirm_password }))
          }
          placeholder="Repita a senha"
          autoComplete="new-password"
        />

        {form.confirm_password && form.password !== form.confirm_password && (
          <p className="pw-mismatch">As senhas não conferem.</p>
        )}

        {form.tipo === "representante" && (
          <TextInput
            id="pix-key"
            label="Chave PIX"
            value={form.pix_key}
            onChange={(pix_key) => setForm((current) => ({ ...current, pix_key }))}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
          />
        )}

        <button type="submit" className="auth-submit" disabled={busy}>
          {busy ? "Criando cadastro..." : "Criar cadastro"}
        </button>
      </form>

      <p className="auth-footer">
        Já tem uma conta? <Link to="/login">Fazer login</Link>
      </p>
    </Shell>
  );
}

export function ForgotPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    code: "",
    password: "",
    confirm_password: "",
  });
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const codeRefs = useRef([]);

  useEffect(() => {
    if (step === 2) {
      requestAnimationFrame(() => codeRefs.current[0]?.focus());
    }
  }, [step]);

  const requestCode = async () => {
    await api.post("/auth/forgot/request", { email: form.email });
    setMessage("Código enviado. Confira seu e-mail.");
  };

  const submitEmail = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await requestCode();
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Não foi possível enviar o código.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = (event) => {
    event.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(form.code)) {
      setError("Informe o código completo de 6 dígitos.");
      return;
    }

    setStep(3);
  };

  const submitNewPassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    if (form.password !== form.confirm_password) {
      setBusy(false);
      setError("As senhas não conferem.");
      return;
    }

    try {
      await api.post("/auth/forgot/reset", form);
      setMessage("Senha alterada com sucesso.");
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.detail || "Não foi possível alterar a senha.");
    } finally {
      setBusy(false);
    }
  };

  const updateCodeDigit = (index, rawValue) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const nextDigits = [...codeDigits];
    nextDigits[index] = digit;

    setCodeDigits(nextDigits);
    setForm((current) => ({ ...current, code: nextDigits.join("") }));

    if (digit && index < nextDigits.length - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < codeDigits.length - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (event) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (!pastedDigits) return;

    const nextDigits = Array.from({ length: 6 }, (_, index) => pastedDigits[index] || "");
    setCodeDigits(nextDigits);
    setForm((current) => ({ ...current, code: nextDigits.join("") }));
    codeRefs.current[Math.min(pastedDigits.length, 6) - 1]?.focus();
  };

  const resendCode = async () => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await requestCode();
    } catch (err) {
      setError(err.response?.data?.detail || "Não foi possível reenviar o código.");
    } finally {
      setBusy(false);
    }
  };

  if (step === 1) {
    return (
      <Shell
        title="Esqueceu a senha?"
        subtitle="Informe seu e-mail cadastrado para receber um código de verificação."
        backTo="/login"
      >
        <AuthAlert>{error}</AuthAlert>

        <form onSubmit={submitEmail}>
          <TextInput
            id="recover-email"
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(email) => setForm((current) => ({ ...current, email }))}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            required
            icon={<MailIcon />}
          />

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "Enviando..." : "Enviar código"}
          </button>
        </form>

        <p className="auth-footer">
          Lembrou a senha? <Link to="/login">Fazer login</Link>
        </p>
      </Shell>
    );
  }

  if (step === 2) {
    return (
      <Shell
        title="Verifique seu e-mail"
        subtitle={`Enviamos um código de 6 dígitos para ${form.email}. Insira-o abaixo para continuar.`}
        onBack={() => {
          setError("");
          setMessage("");
          setStep(1);
        }}
        backLabel="Voltar"
      >
        <AuthAlert type="success">{message}</AuthAlert>
        <AuthAlert>{error}</AuthAlert>

        <form onSubmit={submitCode}>
          <div className="code-inputs" onPaste={handleCodePaste}>
            {codeDigits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  codeRefs.current[index] = element;
                }}
                type="text"
                className="code-input"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`Dígito ${index + 1} do código`}
                value={digit}
                onChange={(event) => updateCodeDigit(index, event.target.value)}
                onKeyDown={(event) => handleCodeKeyDown(index, event)}
              />
            ))}
          </div>

          <button type="submit" className="auth-submit">
            Confirmar código
          </button>
        </form>

        <p className="auth-footer">
          Não recebeu o código?{" "}
          <button
            type="button"
            onClick={resendCode}
            disabled={busy}
            style={{ color: "var(--orange-soft)", fontWeight: 700 }}
          >
            {busy ? "Reenviando..." : "Reenviar"}
          </button>
        </p>
      </Shell>
    );
  }

  if (step === 3) {
    return (
      <Shell
        title="Crie uma nova senha"
        subtitle="Sua identidade foi confirmada. Defina uma nova senha para acessar sua conta."
        onBack={() => {
          setError("");
          setStep(2);
        }}
        backLabel="Voltar"
      >
        <AuthAlert>{error}</AuthAlert>

        <form onSubmit={submitNewPassword}>
          <PasswordInput
            id="new-password"
            label="Nova senha"
            value={form.password}
            onChange={(password) => setForm((current) => ({ ...current, password }))}
            autoComplete="new-password"
          />

          <PasswordInput
            id="confirm-password"
            label="Confirmar nova senha"
            value={form.confirm_password}
            onChange={(confirm_password) =>
              setForm((current) => ({ ...current, confirm_password }))
            }
            placeholder="Repita a nova senha"
            autoComplete="new-password"
          />

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <p className="auth-footer">
          Lembrou a senha? <Link to="/login">Fazer login</Link>
        </p>
      </Shell>
    );
  }

  return (
    <Shell
      title="Senha alterada!"
      subtitle="Sua senha foi atualizada com sucesso. Você já pode acessar sua conta."
    >
      <AuthAlert type="success">{message}</AuthAlert>

      <Link
        to="/login"
        className="auth-submit"
        style={{ display: "block", textAlign: "center", textDecoration: "none" }}
      >
        Entrar com a nova senha
      </Link>
    </Shell>
  );
}

export function VerifyPage() {
  const [params] = useSearchParams();
  const verificationType = params.get("type");
  const token = params.get("token");
  const [state, setState] = useState({
    status: "loading",
    message: "Confirmando seu e-mail...",
  });

  useEffect(() => {
    let active = true;

    const confirmEmail = async () => {
      if (!verificationType || !token) {
        setState({ status: "error", message: "Link de confirmação inválido." });
        return;
      }

      try {
        await api.get("/auth/verification/confirm", {
          params: { type: verificationType, token },
        });

        if (active) {
          setState({ status: "success", message: "E-mail confirmado com sucesso." });
        }
      } catch (err) {
        if (active) {
          setState({
            status: "error",
            message: err.response?.data?.detail || "Link inválido ou expirado.",
          });
        }
      }
    };

    confirmEmail();

    return () => {
      active = false;
    };
  }, [verificationType, token]);

  return (
    <Shell
      title={state.status === "success" ? "E-mail confirmado!" : "Validação de e-mail"}
      subtitle="Confirmação de segurança da sua conta PlayMenu."
    >
      <AuthAlert type={state.status === "error" ? "error" : "success"}>
        {state.message}
      </AuthAlert>

      {state.status !== "loading" && (
        <Link
          to="/login"
          className="auth-submit"
          style={{ display: "block", textAlign: "center", textDecoration: "none" }}
        >
          Ir para o login
        </Link>
      )}
    </Shell>
  );
}
