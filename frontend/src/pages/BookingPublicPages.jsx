import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API, api } from "../services/api";

const STATUS = {
  confirmed: "Reserva confirmada",
  scheduled: "Reserva agendada",
  attendance_confirmed: "Presença confirmada",
  cancelled: "Reserva cancelada",
  completed: "Atendimento concluído",
  no_show: "Não compareceu",
};

const PublicShell = ({ children }) => <main className="booking-status-page"><div className="booking-status-card"><div className="booking-status-brand"><img src="/public/assets/images/logopm.png" alt="PlayMenu" /><span>PlayMenu</span></div>{children}</div></main>;

export function ReservationStatusPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const load = useCallback(() => api.get(`/public/reservations/${token}`).then((response) => setData(response.data)).catch((requestError) => setError(requestError.response?.data?.detail || "Reserva não encontrada.")), [token]);
  useEffect(() => { load(); }, [load]);
  const action = async (value) => {
    setSaving(value); setError("");
    try { await api.patch(`/public/reservations/${token}/${value}`); await load(); }
    catch (requestError) { setError(requestError.response?.data?.detail || "Não foi possível atualizar a reserva."); }
    finally { setSaving(""); }
  };
  if (error && !data) return <PublicShell><div className="booking-status-empty"><i className="fas fa-circle-exclamation" /><h1>{error}</h1></div></PublicShell>;
  if (!data) return <PublicShell><div className="booking-status-empty"><p>Carregando reserva…</p></div></PublicShell>;
  const { reservation: row, restaurant, establishment } = data;
  const active = ["confirmed", "scheduled", "attendance_confirmed"].includes(row.status);
  return <PublicShell>
    <div className={`booking-status-icon ${active ? "is-success" : "is-muted"}`}><i className={`fas ${active ? "fa-calendar-check" : "fa-calendar-xmark"}`} /></div>
    <span className="booking-status-eyebrow">{STATUS[row.status] || row.status}</span>
    <h1>{restaurant.name}</h1>
    <p className="booking-status-subtitle">Olá, {row.customer_name}. Estes são os detalhes da sua reserva.</p>
    {error && <div className="booking-status-error">{error}</div>}
    <div className="booking-status-details"><div><span>Data</span><strong>{String(row.local_date).split("-").reverse().join("/")}</strong></div><div><span>Horário</span><strong>{row.local_time}</strong></div><div><span>Pessoas</span><strong>{row.party_size}</strong></div><div><span>Local</span><strong>{establishment?.name || restaurant.name}</strong></div></div>
    {active && <div className="booking-status-actions"><button onClick={() => action("confirm")} disabled={saving || row.status === "attendance_confirmed"}><i className="fas fa-check" />{row.status === "attendance_confirmed" ? "Presença confirmada" : "Confirmar presença"}</button><button className="is-danger" onClick={() => action("cancel")} disabled={saving}><i className="fas fa-xmark" />Cancelar reserva</button></div>}
    <a className="booking-status-maps" href={row.maps_url} target="_blank" rel="noreferrer"><i className="fas fa-location-arrow" /> Abrir rota no Google Maps</a>
    <Link className="booking-status-menu" to={`/${restaurant.slug}`}>Ver cardápio</Link>
  </PublicShell>;
}

export function WaitlistStatusPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [alerts, setAlerts] = useState(false);
  const previousStatus = useRef("");
  const audioContext = useRef(null);

  const soundAlert = useCallback(() => {
    if (!alerts || !audioContext.current) return;
    const context = audioContext.current;
    [0, 0.22, 0.44].forEach((delay, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = index === 1 ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.18);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(context.currentTime + delay); oscillator.stop(context.currentTime + delay + 0.2);
    });
    navigator.vibrate?.([250, 120, 250, 120, 400]);
  }, [alerts]);

  const applyUpdate = useCallback((payload) => {
    const nextStatus = payload?.entry?.status;
    if (nextStatus === "called" && previousStatus.current && previousStatus.current !== "called") soundAlert();
    previousStatus.current = nextStatus || previousStatus.current;
    setData((current) => ({ ...(current || {}), ...payload, restaurant: payload.restaurant || current?.restaurant }));
  }, [soundAlert]);

  useEffect(() => {
    api.get(`/public/waitlist/${token}`).then((response) => { previousStatus.current = response.data.entry.status; setData(response.data); }).catch((requestError) => setError(requestError.response?.data?.detail || "Fila não encontrada."));
  }, [token]);

  useEffect(() => {
    const stream = new EventSource(`${API}/public/waitlist/${encodeURIComponent(token)}/events`);
    stream.addEventListener("update", (event) => { try { applyUpdate(JSON.parse(event.data)); } catch { /* evento inválido */ } });
    stream.onerror = () => {};
    const fallback = setInterval(() => api.get(`/public/waitlist/${token}`).then((response) => applyUpdate(response.data)).catch(() => {}), 10000);
    return () => { stream.close(); clearInterval(fallback); };
  }, [applyUpdate, token]);

  const enableAlerts = async () => {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) { audioContext.current = audioContext.current || new Context(); await audioContext.current.resume(); }
    setAlerts(true);
  };
  if (error && !data) return <PublicShell><div className="booking-status-empty"><i className="fas fa-circle-exclamation" /><h1>{error}</h1></div></PublicShell>;
  if (!data) return <PublicShell><div className="booking-status-empty"><p>Consultando sua posição…</p></div></PublicShell>;
  const { entry, restaurant } = data;
  const called = entry.status === "called";
  const waiting = entry.status === "waiting";
  return <PublicShell>
    <div className={`booking-queue-pulse ${called ? "is-called" : ""}`}><span>{waiting ? entry.position : called ? <i className="fas fa-bell" /> : <i className="fas fa-check" />}</span></div>
    <span className="booking-status-eyebrow">{called ? "SUA MESA ESTÁ PRONTA" : waiting ? "FILA DE ESPERA" : "ATENDIMENTO ATUALIZADO"}</span>
    <h1>{called ? `É a sua vez, ${entry.customer_name}!` : restaurant?.name}</h1>
    <p className="booking-status-subtitle">{called ? "Dirija-se à recepção agora. A equipe está esperando por você." : waiting ? `Olá, ${entry.customer_name}. Esta página atualiza automaticamente.` : entry.status === "seated" ? "Você já foi direcionado à mesa. Bom apetite!" : "Sua participação na fila foi encerrada."}</p>
    {waiting && <div className="booking-queue-stats"><div><strong>{entry.position}ª</strong><span>posição na fila</span></div><div><strong>~{entry.estimated_minutes} min</strong><span>tempo estimado</span></div></div>}
    {called && <div className="booking-called-alert"><i className="fas fa-bell" /><strong>Mesa liberada</strong><span>Apresente esta tela na recepção.</span></div>}
    {!alerts && (waiting || called) && <button className="booking-enable-alert" onClick={enableAlerts}><i className="fas fa-volume-high" /> Ativar alerta sonoro</button>}
    {alerts && <div className="booking-alert-on"><i className="fas fa-volume-high" /> Alerta sonoro ativado</div>}
    <small className="booking-live"><i /> Atualização em tempo real</small>
    <Link className="booking-status-menu" to={`/${restaurant?.slug || ""}`}>Ver cardápio</Link>
  </PublicShell>;
}
