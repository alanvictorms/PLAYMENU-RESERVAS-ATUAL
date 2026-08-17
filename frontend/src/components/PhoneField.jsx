const COUNTRY_CODES = [
  ["55", "🇧🇷 Brasil (+55)"], ["1", "🇺🇸 EUA/Canadá (+1)"], ["54", "🇦🇷 Argentina (+54)"],
  ["591", "🇧🇴 Bolívia (+591)"], ["56", "🇨🇱 Chile (+56)"], ["57", "🇨🇴 Colômbia (+57)"],
  ["593", "🇪🇨 Equador (+593)"], ["595", "🇵🇾 Paraguai (+595)"], ["51", "🇵🇪 Peru (+51)"],
  ["598", "🇺🇾 Uruguai (+598)"], ["58", "🇻🇪 Venezuela (+58)"], ["351", "🇵🇹 Portugal (+351)"],
  ["34", "🇪🇸 Espanha (+34)"], ["33", "🇫🇷 França (+33)"], ["39", "🇮🇹 Itália (+39)"],
  ["44", "🇬🇧 Reino Unido (+44)"], ["49", "🇩🇪 Alemanha (+49)"], ["41", "🇨🇭 Suíça (+41)"],
  ["353", "🇮🇪 Irlanda (+353)"], ["31", "🇳🇱 Países Baixos (+31)"], ["32", "🇧🇪 Bélgica (+32)"],
  ["81", "🇯🇵 Japão (+81)"], ["86", "🇨🇳 China (+86)"], ["82", "🇰🇷 Coreia do Sul (+82)"],
  ["61", "🇦🇺 Austrália (+61)"], ["64", "🇳🇿 Nova Zelândia (+64)"], ["27", "🇿🇦 África do Sul (+27)"],
  ["244", "🇦🇴 Angola (+244)"], ["258", "🇲🇿 Moçambique (+258)"], ["238", "🇨🇻 Cabo Verde (+238)"],
  ["52", "🇲🇽 México (+52)"], ["506", "🇨🇷 Costa Rica (+506)"], ["507", "🇵🇦 Panamá (+507)"],
  ["971", "🇦🇪 Emirados Árabes (+971)"], ["972", "🇮🇱 Israel (+972)"], ["91", "🇮🇳 Índia (+91)"],
];

export const PhoneField = ({ countryCode = "55", phone = "", onCountryCode, onPhone, className = "", dark = false }) => (
  <div className={`booking-phone-field ${dark ? "is-dark" : ""} ${className}`.trim()}>
    <select aria-label="Código do país" value={countryCode} onChange={(event) => onCountryCode(event.target.value)}>
      {COUNTRY_CODES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
    </select>
    <input
      aria-label="Número do WhatsApp"
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="(11) 99999-9999"
      value={phone}
      onChange={(event) => onPhone(event.target.value)}
      required
    />
  </div>
);

export default PhoneField;
