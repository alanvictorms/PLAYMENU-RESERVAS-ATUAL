import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLegacyStyles } from "../hooks/useLegacyStyles";
import { LegacyIcon } from "./LegacyIcon";

const menus = {
  superadmin: [["fa-chart-pie", "Dashboard", "/superadmin"], ["fa-store", "Restaurantes", "/superadmin/restaurantes"], ["fa-users", "Agentes", "/superadmin/agentes"], ["fa-video", "Solicitações", "/superadmin/solicitacoes"], ["fa-list-check", "Planos", "/superadmin/planos"], ["fa-folder-open", "Material de Apoio", "/superadmin/materiais"], ["fa-qrcode", "Modelos de QR Code", "/superadmin/modelos-qr"], ["fa-percent", "Regras Comissão", "/superadmin/regras-comissao"], ["fa-money-bill-transfer", "Saques", "/superadmin/saques"], ["fa-gear", "Configurações", "/superadmin/configuracoes"]],
  gerente: [["fa-chart-pie", "Dashboard", "/gerente"], ["fa-user-tie", "Representantes", "/gerente/representantes"], ["fa-store", "Restaurantes", "/gerente/restaurantes"], ["fa-map-location-dot", "Mapa", "/gerente/mapa"], ["fa-folder-open", "Material de Apoio", "/gerente/materiais"], ["fa-coins", "Comissões", "/gerente/comissoes"], ["fa-money-bill-transfer", "Saque", "/gerente/saque"]],
  representante: [["fa-chart-pie", "Dashboard", "/representante"], ["fa-store", "Meus Restaurantes", "/representante/restaurantes"], ["fa-map-location-dot", "Mapa", "/representante/mapa"], ["fa-folder-open", "Material de Apoio", "/representante/materiais"], ["fa-coins", "Comissões", "/representante/comissoes"], ["fa-money-bill-transfer", "Saque", "/representante/saque"]],
};

const THEME_KEY = "playmenu_admin_theme";

/**
 * Tema claro/escuro do painel administrativo. A escolha vale só para o Super Admin
 * (é a folha dashboard-v2.css que define os tokens de cor de cada tema) e fica salva
 * no navegador, então o painel reabre sempre como o usuário deixou.
 */
export const useAdminTheme = (enabled) => {
  const [theme, setTheme] = useState(() => (typeof localStorage === "undefined" ? "light" : localStorage.getItem(THEME_KEY) || "light"));
  useEffect(() => {
    if (!enabled) return undefined;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    return () => { delete document.documentElement.dataset.theme; };
  }, [theme, enabled]);
  return [theme, () => setTheme((current) => (current === "dark" ? "light" : "dark"))];
};

const AccountMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);
  const label = user?.role === "superadmin" ? "Super Admin" : user?.role;
  return <div className="admin-account" onClick={(e) => e.stopPropagation()}>
    <button type="button" className="profile-btn" onClick={() => setOpen(!open)} title={user?.email}>
      <span className="profile-avatar">{(user?.name || user?.email || "?").trim().charAt(0).toUpperCase()}</span>
      <span className="profile-copy"><strong>{user?.name || user?.email}</strong><span>{label}</span></span>
      <LegacyIcon name="fa-chevron-down" />
    </button>
    {open && <div className="admin-account__panel">
      <strong>{user?.name || "Conta"}</strong>
      <small>{user?.email}</small>
      <button type="button" onClick={() => { setOpen(false); navigate("/superadmin/configuracoes"); }}><LegacyIcon name="fa-gear" />Configurações</button>
      <button type="button" onClick={() => { logout(); navigate("/login"); }}><LegacyIcon name="fa-right-from-bracket" />Sair</button>
    </div>}
  </div>;
};

const SuperAdminShell = ({ items }) => {
  const [theme, toggleTheme] = useAdminTheme(true);
  return <div className="admin-shell">
    <header className="admin-top">
      <NavLink className="admin-brand" to="/superadmin" end><img src="/public/assets/images/logopm.png" alt="PlayMenu" /><span>PlayMenu</span></NavLink>
      <nav className="admin-nav" aria-label="Navegação do Super Admin">{items.map(([icon, label, url]) => <NavLink key={url} to={url} end className={({ isActive }) => `admin-nav__item ${isActive ? "active" : ""}`} title={label}><LegacyIcon name={icon} /><span>{label}</span></NavLink>)}</nav>
      <div className="admin-tools">
        <button type="button" className="admin-circle" onClick={toggleTheme} title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"} aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}><LegacyIcon name={theme === "dark" ? "fa-sun" : "fa-moon"} /></button>
        <AccountMenu />
      </div>
    </header>
    <main className="admin-main"><Outlet /></main>
  </div>;
};

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  useLegacyStyles(isSuperAdmin ? "/public/assets/css/dashboard-v2.css" : "/public/assets/css/dashboard.css", isSuperAdmin ? "admin-v2-page" : "legacy-dashboard-page");
  const navigate = useNavigate(); const [open, setOpen] = useState(false); const items = menus[user?.role] || [];
  if (isSuperAdmin) return <SuperAdminShell items={items} />;
  return <div className="dashboard">
    <button className="mobile-toggle" onClick={() => setOpen(!open)}><LegacyIcon name="fa-bars" /></button>
    <aside className={`sidebar ${open ? "open" : ""}`}><div className="brand"><img src="/public/assets/images/logopm.png" width="40" height="40" alt="PlayMenu" /><div className="brand-text">PlayMenu</div></div><nav className="menu">{items.map(([icon, label, url]) => <NavLink key={url} end className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`} to={url}><LegacyIcon name={icon} />{label}</NavLink>)}</nav><div className="sidebar-footer"><button className="menu-item" onClick={() => { logout(); navigate("/login"); }}><LegacyIcon name="fa-right-from-bracket" />Sair</button></div></aside>
    <div className={`overlay ${open ? "active" : ""}`} onClick={() => setOpen(false)} />
    <main className="content"><Outlet /></main>
  </div>;
};

export const AdminHeader = ({ title, children }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const label = user?.role === "superadmin" ? "Super Admin" : user?.role;
  // No Super Admin a conta e o tema vivem na barra superior, então aqui fica só o título.
  if (isSuperAdmin) return <div className="topbar"><h1>{title}</h1>{children && <div className="topbar-actions">{children}</div>}</div>;
  return <div className="topbar"><h1>{title}</h1><div className="profile"><div><strong>{user?.name || user?.email}</strong><span>{label}</span></div></div></div>;
};

export const Alert = ({ type = "success", children }) => <div className={`alert alert-${type === "error" ? "error" : "success"}`} role={type === "error" ? "alert" : "status"}>{children}</div>;
