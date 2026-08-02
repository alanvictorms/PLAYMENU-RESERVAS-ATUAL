import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLegacyStyles } from "../hooks/useLegacyStyles";
import { LegacyIcon } from "./LegacyIcon";

const menus = {
  superadmin: [["fa-chart-pie", "Dashboard", "/superadmin"], ["fa-store", "Restaurantes", "/superadmin/restaurantes"], ["fa-users", "Agentes", "/superadmin/agentes"], ["fa-video", "Solicitações", "/superadmin/solicitacoes"], ["fa-list-check", "Planos", "/superadmin/planos"], ["fa-folder-open", "Material de Apoio", "/superadmin/materiais"], ["fa-qrcode", "Modelos de QR Code", "/superadmin/modelos-qr"], ["fa-percent", "Regras Comissão", "/superadmin/regras-comissao"], ["fa-money-bill-transfer", "Saques", "/superadmin/saques"], ["fa-gear", "Configurações", "/superadmin/configuracoes"]],
  gerente: [["fa-chart-pie", "Dashboard", "/gerente"], ["fa-user-tie", "Representantes", "/gerente/representantes"], ["fa-store", "Restaurantes", "/gerente/restaurantes"], ["fa-map-location-dot", "Mapa", "/gerente/mapa"], ["fa-folder-open", "Material de Apoio", "/gerente/materiais"], ["fa-coins", "Comissões", "/gerente/comissoes"], ["fa-money-bill-transfer", "Saque", "/gerente/saque"]],
  representante: [["fa-chart-pie", "Dashboard", "/representante"], ["fa-store", "Meus Restaurantes", "/representante/restaurantes"], ["fa-map-location-dot", "Mapa", "/representante/mapa"], ["fa-folder-open", "Material de Apoio", "/representante/materiais"], ["fa-coins", "Comissões", "/representante/comissoes"], ["fa-money-bill-transfer", "Saque", "/representante/saque"]],
};

export const AdminLayout = () => {
  useLegacyStyles("/public/assets/css/dashboard.css", "legacy-dashboard-page");
  const { user, logout } = useAuth(); const navigate = useNavigate(); const [open, setOpen] = useState(false); const items = menus[user?.role] || [];
  return <div className="dashboard">
    <button className="mobile-toggle" onClick={() => setOpen(!open)}><LegacyIcon name="fa-bars" /></button>
    <aside className={`sidebar ${open ? "open" : ""}`}><div className="brand"><img src="/public/assets/images/logopm.png" width="40" height="40" alt="PlayMenu" /><div className="brand-text">PlayMenu</div></div><nav className="menu">{items.map(([icon, label, url]) => <NavLink key={url} end className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`} to={url}><LegacyIcon name={icon} />{label}</NavLink>)}</nav><div className="sidebar-footer"><button className="menu-item" onClick={() => { logout(); navigate("/login"); }}><LegacyIcon name="fa-right-from-bracket" />Sair</button></div></aside>
    <div className={`overlay ${open ? "active" : ""}`} onClick={() => setOpen(false)} />
    <main className="content"><Outlet /></main>
  </div>;
};

export const AdminHeader = ({ title }) => { const { user } = useAuth(); return <div className="topbar"><h1>{title}</h1><div className="profile"><div><strong>{user?.name || user?.email}</strong><span>{user?.role === "superadmin" ? "Super Admin" : user?.role}</span></div></div></div>; };

export const Alert = ({ type = "success", children }) => <div className={`alert alert-${type === "error" ? "error" : "success"}`} role={type === "error" ? "alert" : "status"}>{children}</div>;
