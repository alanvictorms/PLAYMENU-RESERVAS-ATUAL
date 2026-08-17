import { useCallback, useEffect, useState } from "react";
import { PageContent, PageHeader } from "../components/RestaurantLayout";
import PhoneField from "../components/PhoneField";
import { api } from "../services/api";

const today = () => {
  const date = new Date(); date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const dateTime = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const STATUS = {
  scheduled: ["Agendada", "warning"], confirmed: ["Confirmada", "success"], attendance_confirmed: ["Presença confirmada", "success"],
  cancelled: ["Cancelada", "danger"], completed: ["Concluída", "neutral"], no_show: ["Não compareceu", "danger"],
  waiting: ["Aguardando", "warning"], called: ["Chamado", "success"], seated: ["Na mesa", "neutral"],
};
const DAYS = [[0, "Seg"], [1, "Ter"], [2, "Qua"], [3, "Qui"], [4, "Sex"], [5, "Sáb"], [6, "Dom"]];

const Notice = ({ notice }) => <>{notice.message && <div className="ui-alert ui-alert--success"><i className="fas fa-circle-check" /><div><strong>Concluído</strong><p>{notice.message}</p></div></div>}{notice.error && <div className="ui-alert ui-alert--danger"><i className="fas fa-circle-exclamation" /><div><strong>Não foi possível concluir</strong><p>{notice.error}</p></div></div>}</>;
const Status = ({ value }) => { const [label, tone] = STATUS[value] || [value, "neutral"]; return <span className={`booking-status is-${tone}`}><i />{label}</span>; };

export default function ReservationsPage() {
  const [tab, setTab] = useState("overview");
  const [notice, setNotice] = useState({});
  const [dashboard, setDashboard] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [reservationDate, setReservationDate] = useState(today());
  const [reservationStatus, setReservationStatus] = useState("all");
  const [waitlist, setWaitlist] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settingsPayload, setSettingsPayload] = useState(null);
  const [settings, setSettings] = useState(null);
  const [whatsapp, setWhatsapp] = useState(null);
  const [busy, setBusy] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [queueForm, setQueueForm] = useState({ customer_name: "", country_code: "55", phone: "", party_size: 2, notes: "" });

  const reportError = (error, fallback = "Não foi possível carregar os dados.") => setNotice({ error: error.response?.data?.detail || fallback });
  const loadDashboard = useCallback(() => api.get("/restaurant/booking-dashboard").then(({ data }) => setDashboard(data)).catch(reportError), []);
  const loadReservations = useCallback(() => api.get("/restaurant/reservations", { params: { date: reservationDate, status: reservationStatus } }).then(({ data }) => setReservations(data)).catch(reportError), [reservationDate, reservationStatus]);
  const loadWaitlist = useCallback(() => api.get("/restaurant/waitlist").then(({ data }) => setWaitlist(data)).catch(reportError), []);
  const loadCustomers = useCallback(() => api.get("/restaurant/booking-customers", { params: { q: customerQuery } }).then(({ data }) => setCustomers(data)).catch(reportError), [customerQuery]);
  const loadSettings = useCallback(() => api.get("/restaurant/reservation-settings").then(({ data }) => { setSettingsPayload(data); setSettings(data.settings); }).catch(reportError), []);
  const loadWhatsapp = useCallback(() => api.get("/restaurant/whatsapp").then(({ data }) => setWhatsapp(data)).catch(reportError), []);

  useEffect(() => { loadDashboard(); loadSettings(); loadWhatsapp(); }, [loadDashboard, loadSettings, loadWhatsapp]);
  useEffect(() => { if (tab === "reservations") loadReservations(); }, [tab, loadReservations]);
  useEffect(() => { if (tab === "customers") loadCustomers(); }, [tab, loadCustomers]);
  useEffect(() => {
    if (tab !== "waitlist") return undefined;
    loadWaitlist(); const timer = setInterval(loadWaitlist, 5000); return () => clearInterval(timer);
  }, [tab, loadWaitlist]);
  useEffect(() => {
    if (tab !== "whatsapp" && whatsapp?.instance?.connection_status !== "connecting") return undefined;
    const timer = setInterval(loadWhatsapp, 3000); return () => clearInterval(timer);
  }, [tab, whatsapp?.instance?.connection_status, loadWhatsapp]);

  const reservationAction = async (id, action) => {
    setBusy(`${id}-${action}`); setNotice({});
    try { await api.patch(`/restaurant/reservations/${id}/${action}`); setNotice({ message: "Reserva atualizada." }); await Promise.all([loadReservations(), loadDashboard()]); }
    catch (error) { reportError(error, "Não foi possível atualizar a reserva."); }
    finally { setBusy(""); }
  };
  const queueSubmit = async (event) => {
    event.preventDefault(); setBusy("queue-add"); setNotice({});
    try { await api.post("/restaurant/waitlist", { ...queueForm, party_size: Number(queueForm.party_size) }); setQueueForm({ customer_name: "", country_code: "55", phone: "", party_size: 2, notes: "" }); setNotice({ message: "Cliente adicionado à fila e notificação encaminhada." }); await Promise.all([loadWaitlist(), loadDashboard()]); }
    catch (error) { reportError(error, "Não foi possível adicionar à fila."); }
    finally { setBusy(""); }
  };
  const queueAction = async (id, action) => {
    if (action === "cancel" && !window.confirm("Remover este cliente da fila?")) return;
    setBusy(`${id}-${action}`); setNotice({});
    try { await api.patch(`/restaurant/waitlist/${id}/${action}`); setNotice({ message: action === "call" ? "Cliente chamado por WhatsApp." : "Fila atualizada." }); await Promise.all([loadWaitlist(), loadDashboard()]); }
    catch (error) { reportError(error, "Não foi possível atualizar a fila."); }
    finally { setBusy(""); }
  };
  const saveSettings = async (event) => {
    event.preventDefault(); setBusy("settings"); setNotice({});
    try { const { data } = await api.post("/restaurant/reservation-settings", settings); setSettings(data.settings); setNotice({ message: "Configurações de reservas salvas." }); loadDashboard(); }
    catch (error) { reportError(error, "Não foi possível salvar as configurações."); }
    finally { setBusy(""); }
  };
  const connectWhatsapp = async () => {
    setBusy("whatsapp"); setNotice({});
    try { await api.post("/restaurant/whatsapp/connect"); setNotice({ message: "Instância preparada. Escaneie o QR Code." }); await loadWhatsapp(); }
    catch (error) { reportError(error, "Não foi possível conectar o WhatsApp."); }
    finally { setBusy(""); }
  };
  const disconnectWhatsapp = async () => {
    if (!window.confirm("Desconectar este WhatsApp? As notificações ficarão pausadas.")) return;
    setBusy("whatsapp");
    try { await api.post("/restaurant/whatsapp/disconnect"); setNotice({ message: "WhatsApp desconectado." }); await loadWhatsapp(); }
    catch (error) { reportError(error, "Não foi possível desconectar."); }
    finally { setBusy(""); }
  };

  const tabs = [["overview", "fa-chart-pie", "Visão geral"], ["reservations", "fa-calendar-check", "Reservas"], ["waitlist", "fa-users-line", "Fila de espera"], ["customers", "fa-address-book", "Clientes"], ["settings", "fa-sliders", "Configuração"], ["whatsapp", "fa-brands fa-whatsapp", "WhatsApp"]];

  return <><PageHeader title="Reservas e fila" description="Organize mesas, acompanhe clientes e automatize os avisos pelo WhatsApp." /><PageContent>
    <div className="booking-tabs" role="tablist">{tabs.map(([value, icon, label]) => <button key={value} className={tab === value ? "is-active" : ""} onClick={() => { setTab(value); setNotice({}); }}><i className={icon.startsWith("fa-brands") ? icon : `fas ${icon}`} />{label}</button>)}</div>
    <Notice notice={notice} />

    {tab === "overview" && <div className="booking-panel-stack">
      <section className="booking-metric-grid">{[["fa-calendar-day", dashboard?.reservations_today || 0, "Reservas hoje"], ["fa-calendar-check", dashboard?.reservations_upcoming || 0, "Próximas reservas"], ["fa-users-line", dashboard?.waitlist_active || 0, "Na fila agora"], ["fa-address-book", dashboard?.customers || 0, "Clientes salvos"]].map(([icon, value, label]) => <article key={label}><i className={`fas ${icon}`} /><strong>{value}</strong><span>{label}</span></article>)}</section>
      <div className="ui-layout-grid ui-layout-grid--sidebar"><section className="ui-surface"><header className="ui-surface__header"><div><span className="ui-eyebrow">Operação do dia</span><h2>Central de atendimento</h2><p>Acompanhe as reservas marcadas e mantenha a fila avançando.</p></div></header><div className="booking-quick-actions"><button className="ui-btn ui-btn--primary" onClick={() => setTab("reservations")}><i className="fas fa-calendar-check" /> Ver reservas</button><button className="ui-btn ui-btn--secondary" onClick={() => setTab("waitlist")}><i className="fas fa-users-line" /> Abrir fila</button></div></section><aside className="ui-surface ui-surface--accent"><header className="ui-surface__header"><div><span className="ui-eyebrow">Automações</span><h2>Status do módulo</h2></div></header><div className="booking-health"><span><i className={dashboard?.reservation_enabled ? "is-on" : ""} />Reservas {dashboard?.reservation_enabled ? "ativadas" : "desativadas"}</span><span><i className={dashboard?.whatsapp_status === "connected" ? "is-on" : ""} />WhatsApp {dashboard?.whatsapp_status === "connected" ? "conectado" : "desconectado"}</span></div><button className="ui-btn ui-btn--outline" onClick={() => setTab(dashboard?.reservation_enabled ? "whatsapp" : "settings")}>Revisar configuração</button></aside></div>
    </div>}

    {tab === "reservations" && <section className="ui-table-card booking-table-card"><div className="ui-table-toolbar"><div className="ui-table-toolbar__title"><span className="ui-eyebrow">Agenda</span><h3>Reservas</h3><p>{reservations.length} registro(s) no período</p></div><div className="ui-table-toolbar__actions"><label className="booking-inline-filter"><span>Data</span><input type="date" value={reservationDate} onChange={(event) => setReservationDate(event.target.value)} /></label><label className="booking-inline-filter"><span>Status</span><select value={reservationStatus} onChange={(event) => setReservationStatus(event.target.value)}><option value="all">Todos</option><option value="confirmed">Confirmadas</option><option value="attendance_confirmed">Presença confirmada</option><option value="cancelled">Canceladas</option><option value="completed">Concluídas</option><option value="no_show">Não compareceu</option></select></label></div></div><div className="ui-table-shell"><table className="ui-table restaurant-table"><thead><tr><th>Cliente</th><th>Horário</th><th>Pessoas</th><th>WhatsApp</th><th>Status</th><th>Ações</th></tr></thead><tbody>{reservations.map((row) => <tr key={row.id}><td data-label="Cliente"><strong>{row.customer_name}</strong>{row.establishment_name && <small>{row.establishment_name}</small>}</td><td data-label="Horário">{dateTime(row.starts_at)}</td><td data-label="Pessoas">{row.party_size}</td><td data-label="WhatsApp">+{row.phone_e164}</td><td data-label="Status"><Status value={row.status} /></td><td data-label="Ações"><div className="ui-table-actions-admin">{["confirmed", "scheduled"].includes(row.status) && <button className="ui-btn ui-btn--sm ui-btn--secondary" onClick={() => reservationAction(row.id, "confirm")} disabled={busy}>Confirmar</button>}{["confirmed", "scheduled", "attendance_confirmed"].includes(row.status) && <><button className="ui-btn ui-btn--sm ui-btn--primary" onClick={() => reservationAction(row.id, "complete")} disabled={busy}>Concluir</button><button className="ui-btn ui-btn--sm ui-btn--danger" onClick={() => reservationAction(row.id, "cancel")} disabled={busy}>Cancelar</button></>}</div></td></tr>)}{!reservations.length && <tr className="ui-table-empty"><td colSpan="6"><div className="ui-empty-state"><i className="fas fa-calendar" /><h3>Nenhuma reserva encontrada</h3><p>Altere a data ou o filtro de status.</p></div></td></tr>}</tbody></table></div></section>}

    {tab === "waitlist" && <div className="ui-layout-grid ui-layout-grid--wide-sidebar booking-queue-layout"><aside className="ui-surface ui-surface--accent"><header className="ui-surface__header"><div><span className="ui-eyebrow">Cadastro presencial</span><h2>Adicionar à fila</h2><p>O cliente receberá o link de acompanhamento pelo WhatsApp.</p></div></header><form className="ui-stack" onSubmit={queueSubmit}><div className="ui-field"><label>Nome do cliente</label><input value={queueForm.customer_name} onChange={(event) => setQueueForm({ ...queueForm, customer_name: event.target.value })} required /></div><div className="ui-field"><label>WhatsApp</label><PhoneField countryCode={queueForm.country_code} phone={queueForm.phone} onCountryCode={(country_code) => setQueueForm({ ...queueForm, country_code })} onPhone={(phone) => setQueueForm({ ...queueForm, phone })} /></div><div className="ui-field"><label>Pessoas</label><input type="number" min="1" max="30" value={queueForm.party_size} onChange={(event) => setQueueForm({ ...queueForm, party_size: event.target.value })} /></div><div className="ui-field"><label>Observações</label><textarea value={queueForm.notes} onChange={(event) => setQueueForm({ ...queueForm, notes: event.target.value })} /></div><button className="ui-btn ui-btn--primary" disabled={busy === "queue-add"}>{busy === "queue-add" ? "Adicionando…" : "Adicionar e notificar"}</button></form></aside><section className="ui-surface"><header className="ui-surface__header booking-queue-head"><div><span className="ui-eyebrow">Em tempo real</span><h2>Fila atual</h2><p>{waitlist.length} cliente(s) aguardando</p></div><button className="ui-btn ui-btn--secondary ui-btn--sm" onClick={loadWaitlist}><i className="fas fa-rotate" /> Atualizar</button></header><div className="booking-queue-list">{waitlist.map((row) => <article key={row.id} className={row.status === "called" ? "is-called" : ""}><span className="booking-position">{row.status === "called" ? <i className="fas fa-bell" /> : row.position}</span><div className="booking-queue-copy"><strong>{row.customer_name}</strong><span>{row.party_size} pessoa(s) · +{row.phone_e164}</span><small>{row.status === "called" ? "Cliente chamado — aguardando na recepção" : `Estimativa: ${row.estimated_minutes} min`}</small></div><div className="booking-queue-actions">{row.status === "waiting" && <button className="ui-btn ui-btn--sm ui-btn--primary" onClick={() => queueAction(row.id, "call")} disabled={busy}><i className="fas fa-bell" /> Chamar</button>}<button className="ui-btn ui-btn--sm ui-btn--secondary" onClick={() => queueAction(row.id, "seat")} disabled={busy}>Sentou</button><button className="ui-btn ui-btn--sm ui-btn--danger ui-btn--icon" title="Remover da fila" onClick={() => queueAction(row.id, "cancel")} disabled={busy}><i className="fas fa-xmark" /></button></div></article>)}{!waitlist.length && <div className="ui-empty-state"><i className="fas fa-users-line" /><h3>A fila está vazia</h3><p>Adicione o próximo cliente pelo formulário.</p></div>}</div></section></div>}

    {tab === "customers" && <section className="ui-table-card booking-table-card"><div className="ui-table-toolbar"><div className="ui-table-toolbar__title"><span className="ui-eyebrow">Relacionamento</span><h3>Clientes salvos</h3><p>{customers.length} contato(s)</p></div><div className="ui-table-toolbar__actions"><label className="booking-inline-filter"><span>Buscar</span><input placeholder="Nome ou WhatsApp" value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} /></label></div></div><div className="ui-table-shell"><table className="ui-table restaurant-table"><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Reservas</th><th>Entradas na fila</th><th>Último contato</th></tr></thead><tbody>{customers.map((row) => <tr key={row.id}><td data-label="Cliente"><strong>{row.name}</strong></td><td data-label="WhatsApp">+{row.phone_e164}</td><td data-label="Reservas">{row.reservation_count || 0}</td><td data-label="Fila">{row.waitlist_count || 0}</td><td data-label="Último contato">{dateTime(row.last_seen_at)}</td></tr>)}{!customers.length && <tr className="ui-table-empty"><td colSpan="5"><div className="ui-empty-state"><i className="fas fa-address-book" /><h3>Nenhum cliente encontrado</h3></div></td></tr>}</tbody></table></div></section>}

    {tab === "settings" && settings && <form className="booking-settings-grid" onSubmit={saveSettings}><section className="ui-surface booking-settings-main"><header className="ui-surface__header"><div><span className="ui-eyebrow">Disponibilidade pública</span><h2>Agenda de reservas</h2><p>Defina quando e quantas reservas poderão ser feitas pelo cardápio.</p></div><label className="booking-toggle"><input type="checkbox" checked={!!settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })} /><span /><strong>{settings.enabled ? "Ativada" : "Desativada"}</strong></label></header><div className="booking-form-grid"><div className="ui-field"><label>Primeiro horário</label><input type="time" value={settings.opening_time} onChange={(event) => setSettings({ ...settings, opening_time: event.target.value })} required /></div><div className="ui-field"><label>Último horário</label><input type="time" value={settings.closing_time} onChange={(event) => setSettings({ ...settings, closing_time: event.target.value })} required /></div><div className="ui-field"><label>Intervalo entre horários</label><select value={settings.slot_interval_minutes} onChange={(event) => setSettings({ ...settings, slot_interval_minutes: Number(event.target.value) })}><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">1 hora</option></select></div><div className="ui-field"><label>Reservas por horário</label><input type="number" min="1" max="100" value={settings.max_reservations_per_slot} onChange={(event) => setSettings({ ...settings, max_reservations_per_slot: Number(event.target.value) })} /></div><div className="ui-field"><label>Antecedência mínima (min)</label><input type="number" min="0" value={settings.min_advance_minutes} onChange={(event) => setSettings({ ...settings, min_advance_minutes: Number(event.target.value) })} /></div><div className="ui-field"><label>Agenda aberta por (dias)</label><input type="number" min="1" max="365" value={settings.advance_days} onChange={(event) => setSettings({ ...settings, advance_days: Number(event.target.value) })} /></div><div className="ui-field"><label>Lembrete antes (min)</label><input type="number" min="5" max="1440" value={settings.reminder_minutes} onChange={(event) => setSettings({ ...settings, reminder_minutes: Number(event.target.value) })} /></div><div className="ui-field"><label>Estimativa inicial da fila</label><input type="number" min="3" max="240" value={settings.waitlist_avg_minutes} onChange={(event) => setSettings({ ...settings, waitlist_avg_minutes: Number(event.target.value) })} /></div></div><fieldset className="booking-days"><legend>Dias de funcionamento</legend>{DAYS.map(([day, label]) => <label key={day}><input type="checkbox" checked={settings.days_open.includes(day)} onChange={(event) => setSettings({ ...settings, days_open: event.target.checked ? [...settings.days_open, day].sort() : settings.days_open.filter((value) => value !== day) })} /><span>{label}</span></label>)}</fieldset><button className="ui-btn ui-btn--primary" disabled={busy === "settings"}>{busy === "settings" ? "Salvando…" : "Salvar agenda"}</button></section><aside className="ui-surface ui-surface--accent"><header className="ui-surface__header"><div><span className="ui-eyebrow">Como funciona</span><h2>Botão no cardápio</h2></div></header><div className="booking-settings-help"><i className="fas fa-calendar-check" /><p>Quando a agenda estiver ativada, o cliente verá “Fazer reserva” no cardápio público.</p><i className="fas fa-clock" /><p>Horários lotados são bloqueados automaticamente conforme o limite configurado.</p><i className="fab fa-whatsapp" /><p>Confirmações e lembretes dependem do WhatsApp conectado.</p></div>{settingsPayload?.establishments?.length > 0 && <small>{settingsPayload.establishments.length} unidade(s) ativa(s) poderão ser escolhidas pelo cliente.</small>}</aside></form>}

    {tab === "whatsapp" && <div className="ui-layout-grid ui-layout-grid--sidebar booking-whatsapp-grid"><section className="ui-surface"><header className="ui-surface__header"><div><span className="ui-eyebrow">Evolution API</span><h2>WhatsApp do restaurante</h2><p>Este número enviará confirmações, lembretes e alertas da fila.</p></div><Status value={whatsapp?.instance?.connection_status === "connected" ? "attendance_confirmed" : whatsapp?.instance?.connection_status === "connecting" ? "waiting" : "cancelled"} /></header>{!whatsapp?.configured ? <div className="ui-empty-state"><i className="fab fa-whatsapp" /><h3>Integração ainda não configurada</h3><p>Peça ao administrador da plataforma para cadastrar a URL e a chave da Evolution API.</p></div> : whatsapp?.instance?.connection_status === "connected" ? <div className="booking-whatsapp-connected"><span><i className="fab fa-whatsapp" /></span><h3>WhatsApp conectado</h3><p>As notificações automáticas estão ativas.</p><small>Instância: {whatsapp.instance.instance_name}</small><button className="ui-btn ui-btn--danger" onClick={disconnectWhatsapp} disabled={busy === "whatsapp"}>Desconectar</button></div> : <div className="booking-whatsapp-connect">{whatsapp?.instance?.qr_code ? <><div className="booking-qr"><img src={whatsapp.instance.qr_code} alt="QR Code para conectar o WhatsApp" /></div><h3>Escaneie o QR Code</h3><ol><li>Abra o WhatsApp no celular</li><li>Toque em Aparelhos conectados</li><li>Escolha Conectar um aparelho</li></ol></> : <><div className="booking-whatsapp-placeholder"><i className="fab fa-whatsapp" /></div><h3>Conecte um número</h3><p>A instância será criada automaticamente e o QR Code aparecerá aqui.</p></>}<button className="ui-btn ui-btn--primary" onClick={connectWhatsapp} disabled={busy === "whatsapp"}>{busy === "whatsapp" ? "Preparando…" : whatsapp?.instance ? "Gerar novo QR Code" : "Conectar WhatsApp"}</button>{whatsapp?.instance?.last_error && <div className="booking-integration-error">{whatsapp.instance.last_error}</div>}</div>}</section><aside className="ui-surface ui-surface--accent"><header className="ui-surface__header"><div><span className="ui-eyebrow">Mensagens automáticas</span><h2>O que será enviado</h2></div></header><ul className="booking-message-list"><li><i className="fas fa-check" /><span><strong>Reserva realizada</strong>Detalhes e rota no Maps</span></li><li><i className="fas fa-clock" /><span><strong>Lembrete</strong>Confirmação antes do horário</span></li><li><i className="fas fa-users-line" /><span><strong>Entrada na fila</strong>Link de posição em tempo real</span></li><li><i className="fas fa-bell" /><span><strong>Mesa pronta</strong>Alerta quando chegar a vez</span></li></ul></aside></div>}
  </PageContent></>;
}
