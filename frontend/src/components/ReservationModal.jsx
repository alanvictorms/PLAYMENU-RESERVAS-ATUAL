import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PhoneField from "./PhoneField";

const today = () => {
  const value = new Date();
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 10);
};

export default function ReservationModal({ restaurantSlug, storeName, onClose }) {
  const [config, setConfig] = useState(null);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ customer_name: "", country_code: "55", phone: "", date: today(), time: "", party_size: 2, establishment_id: "", notes: "" });
  const [notice, setNotice] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const maxDate = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() + Number(config?.advance_days || 30));
    value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
    return value.toISOString().slice(0, 10);
  }, [config]);

  useEffect(() => {
    api.get("/public/reservations/config", { params: { r: restaurantSlug } })
      .then(({ data }) => {
        setConfig(data);
        if (data.establishments?.length === 1) setForm((current) => ({ ...current, establishment_id: String(data.establishments[0].id) }));
      })
      .catch((error) => setNotice({ error: error.response?.data?.detail || "Não foi possível carregar as reservas." }));
  }, [restaurantSlug]);

  useEffect(() => {
    if (!config?.enabled || !form.date) return;
    setSlots([]);
    setForm((current) => ({ ...current, time: "" }));
    api.get("/public/reservations/slots", { params: { r: restaurantSlug, date: form.date, establishment_id: form.establishment_id || 0 } })
      .then(({ data }) => setSlots(data.slots || []))
      .catch((error) => setNotice({ error: error.response?.data?.detail || "Não foi possível consultar os horários." }));
  }, [config?.enabled, form.date, form.establishment_id, restaurantSlug]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true); setNotice({});
    try {
      const { data } = await api.post("/public/reservations", {
        ...form,
        restaurant_slug: restaurantSlug,
        establishment_id: form.establishment_id ? Number(form.establishment_id) : null,
        party_size: Number(form.party_size),
      });
      setDone(data.reservation);
    } catch (error) {
      setNotice({ error: error.response?.data?.detail || "Não foi possível realizar a reserva." });
    } finally {
      setLoading(false);
    }
  };

  return <div className="booking-public-overlay" role="dialog" aria-modal="true" aria-label="Fazer reserva">
    <div className="booking-public-modal">
      <header><div><span>RESERVA ONLINE</span><h2>{done ? "Sua mesa está reservada" : `Reservar no ${storeName}`}</h2></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header>
      {done ? <div className="booking-success">
        <i className="fas fa-circle-check" />
        <h3>Reserva confirmada!</h3>
        <p>Enviaremos os detalhes e a rota pelo WhatsApp. Você também receberá um lembrete antes do horário.</p>
        <div><span>Data</span><strong>{String(done.local_date).split("-").reverse().join("/")}</strong><span>Horário</span><strong>{done.local_time}</strong><span>Pessoas</span><strong>{done.party_size}</strong></div>
        <a href={done.maps_url} target="_blank" rel="noreferrer"><i className="fas fa-location-arrow" /> Ver rota no Maps</a>
        <button type="button" onClick={onClose}>Voltar ao cardápio</button>
      </div> : <>
        {notice.error && <div className="booking-public-error">{notice.error}</div>}
        {!config ? <p className="booking-public-loading">Carregando horários…</p> : !config.enabled ? <p className="booking-public-loading">O restaurante não está recebendo reservas agora.</p> : <form onSubmit={submit}>
          <label>Seu nome<input value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} placeholder="Nome completo" required /></label>
          <label>WhatsApp</label>
          <PhoneField dark countryCode={form.country_code} phone={form.phone} onCountryCode={(country_code) => setForm({ ...form, country_code })} onPhone={(phone) => setForm({ ...form, phone })} />
          {config.establishments?.length > 1 && <label>Unidade<select value={form.establishment_id} onChange={(event) => setForm({ ...form, establishment_id: event.target.value })} required><option value="">Selecione</option>{config.establishments.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}
          <div className="booking-public-grid"><label>Data<input type="date" min={today()} max={maxDate} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label><label>Pessoas<input type="number" min="1" max="30" value={form.party_size} onChange={(event) => setForm({ ...form, party_size: event.target.value })} required /></label></div>
          <fieldset><legend>Escolha o horário</legend><div className="booking-slot-grid">{slots.map((slot) => <button type="button" key={slot.time} disabled={!slot.available} className={form.time === slot.time ? "is-selected" : ""} onClick={() => setForm({ ...form, time: slot.time })}>{slot.time}</button>)}</div>{!slots.length && <small>Nenhum horário disponível nesta data.</small>}</fieldset>
          <label>Observação <small>(opcional)</small><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Ex.: mesa acessível" /></label>
          <button className="booking-public-submit" disabled={loading || !form.time}>{loading ? "Confirmando…" : "Confirmar reserva"}</button>
          <small className="booking-public-consent">Ao reservar, você concorda em receber as confirmações desta reserva pelo WhatsApp.</small>
        </form>}
      </>}
    </div>
  </div>;
}
