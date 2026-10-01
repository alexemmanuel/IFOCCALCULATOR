import React from 'react';
import { Download, ShieldAlert, AlertTriangle, Sparkles, RefreshCw, Sun, Moon, Calculator, Globe, FileDown, Loader2, ChevronDown } from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCY_CONFIGS } from '../data/historicalData';

interface HeaderProps {
  activeTab: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology';
  setActiveTab: (tab: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology') => void;
  isNominal: boolean;
  setIsNominal: (val: boolean) => void;
  inflationRate: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  liveRates?: Record<CurrencyCode, number>;
  lastRatesUpdated?: string;
  isLoadingRates?: boolean;
  onRefreshLiveRates?: () => void;
  enableFxOverlay: boolean;
  onToggleFxOverlay: () => void;
  onOpenDisclaimers: () => void;
  onExportData: () => void;
  onDownloadReport: () => void;
  isGeneratingPdf?: boolean;
  onResetDefaults: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isNominal,
  setIsNominal,
  inflationRate,
  theme,
  onToggleTheme,
  currency,
  onCurrencyChange,
  liveRates,
  lastRatesUpdated = 'Live FX Feed',
  isLoadingRates = false,
  onRefreshLiveRates,
  enableFxOverlay,
  onToggleFxOverlay,
  onOpenDisclaimers,
  onExportData,
  onDownloadReport,
  isGeneratingPdf = false,
  onResetDefaults
}) => {
  const currentCurr = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['USD'];
  const activeRate = liveRates?.[currency] ?? currentCurr.rateToUsd;

  const renderCurrencySelect = (idPrefix: string) => {
    const isMobile = idPrefix === 'mobile';
    const displayLabel = currentCurr.displayShort || `${currentCurr.code} (${currentCurr.symbol})`;

    return (
      <div
        className={`relative flex items-center justify-between gap-1.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 px-2.5 py-1.5 rounded-lg text-xs shrink-0 shadow-xs ${
          isMobile ? 'w-[150px] min-w-[150px]' : 'w-[160px] min-w-[160px]'
        }`}
        title={`Select Reporting Currency (Current: ${displayLabel})`}
      >
        {/* Visible Display Layer: Edge-to-edge aligned with navbar icon */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 pointer-events-none">
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate font-mono font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs">
            {displayLabel}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />

        {/* Full-bleed Native Select: Exact same line and edges as navbar pill, no shift, scrollbar enabled */}
        <select
          id={`${idPrefix}-currency`}
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          title="Select Reporting Currency"
        >
          <optgroup label="Global Reserves" className="bg-slate-900 text-amber-400 font-bold" style={{ color: '#fbbf24', backgroundColor: '#0f172a' }}>
            <option value="USD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>USD ($)</option>
            <option value="EUR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>EUR (€)</option>
            <option value="GBP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>GBP (£)</option>
            <option value="JPY" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>JPY (¥)</option>
            <option value="CNY" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CNY (¥)</option>
            <option value="CHF" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CHF (Fr)</option>
            <option value="CAD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CAD (CA$)</option>
            <option value="AUD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>AUD (A$)</option>
          </optgroup>

          <optgroup label="North America" className="bg-slate-900 text-amber-400 font-bold" style={{ color: '#fbbf24', backgroundColor: '#0f172a' }}>
            <option value="USD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>USD ($)</option>
            <option value="CAD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CAD (CA$)</option>
            <option value="MXN" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>MXN (Mex$)</option>
            <option value="GTQ" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>GTQ (Q)</option>
            <option value="CRC" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CRC (₡)</option>
            <option value="JMD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>JMD (J$)</option>
            <option value="BZD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BZD (BZ$)</option>
            <option value="HNL" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>HNL (L)</option>
            <option value="NIO" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>NIO (C$)</option>
            <option value="DOP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>DOP (RD$)</option>
            <option value="HTG" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>HTG (G)</option>
            <option value="TTD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>TTD (TT$)</option>
            <option value="BSD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BSD (B$)</option>
            <option value="BBD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BBD (Bds$)</option>
            <option value="XCD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>XCD (EC$)</option>
            <option value="KYD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>KYD (CI$)</option>
            <option value="BMD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BMD (BD$)</option>
            <option value="AWG" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>AWG (Afl.)</option>
            <option value="ANG" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>ANG (NAƒ)</option>
            <option value="PAB" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>PAB (B/.)</option>
            <option value="CUP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CUP (₱)</option>
          </optgroup>

          <optgroup label="South America" className="bg-slate-900 text-amber-400 font-bold" style={{ color: '#fbbf24', backgroundColor: '#0f172a' }}>
            <option value="BRL" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BRA (R$)</option>
            <option value="ARS" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>ARS ($)</option>
            <option value="CLP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CLP (CLP$)</option>
            <option value="COP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>COP (COL$)</option>
            <option value="PEN" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>PEN (S/)</option>
            <option value="UYU" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>UYU ($U)</option>
            <option value="BOB" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BOB (Bs)</option>
            <option value="PYG" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>PYG (₲)</option>
            <option value="GYD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>GYD (G$)</option>
            <option value="SRD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>SRD ($)</option>
            <option value="VES" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>VES (Bs)</option>
            <option value="USD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>USD ($)</option>
          </optgroup>

          <optgroup label="Europe" className="bg-slate-900 text-amber-400 font-bold" style={{ color: '#fbbf24', backgroundColor: '#0f172a' }}>
            <option value="EUR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>EUR (€)</option>
            <option value="GBP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>GBP (£)</option>
            <option value="CHF" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CHF (Fr)</option>
            <option value="SEK" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>SEK (kr)</option>
            <option value="NOK" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>NOK (kr)</option>
            <option value="DKK" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>DKK (kr)</option>
            <option value="PLN" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>PLN (zł)</option>
            <option value="CZK" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CZK (Kč)</option>
            <option value="HUF" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>HUF (Ft)</option>
            <option value="RON" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>RON (lei)</option>
            <option value="TRY" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>TRY (₺)</option>
            <option value="ISK" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>ISK (kr)</option>
            <option value="RSD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>RSD (din.)</option>
            <option value="BGN" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BGN (лв)</option>
          </optgroup>

          <optgroup label="Asia" className="bg-slate-900 text-amber-400 font-bold" style={{ color: '#fbbf24', backgroundColor: '#0f172a' }}>
            <option value="CNY" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>CNY (¥)</option>
            <option value="JPY" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>JPY (¥)</option>
            <option value="INR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>INR (₹)</option>
            <option value="SGD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>SGD (S$)</option>
            <option value="KRW" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>KRW (₩)</option>
            <option value="HKD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>HKD (HK$)</option>
            <option value="TWD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>TWD (NT$)</option>
            <option value="AED" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>AED (د.إ)</option>
            <option value="SAR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>SAR (﷼)</option>
            <option value="QAR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>QAR (QR)</option>
            <option value="KWD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>KWD (KD)</option>
            <option value="BHD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BHD (BD)</option>
            <option value="OMR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>OMR (OMR)</option>
            <option value="IDR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>IDR (Rp)</option>
            <option value="MYR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>MYR (RM)</option>
            <option value="THB" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>THB (฿)</option>
            <option value="PHP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>PHP (₱)</option>
            <option value="VND" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>VND (₫)</option>
            <option value="PKR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>PKR (Rs)</option>
            <option value="BDT" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BDT (৳)</option>
            <option value="ILS" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>ILS (₪)</option>
          </optgroup>

          <optgroup label="Africa" className="bg-slate-900 text-amber-400 font-bold" style={{ color: '#fbbf24', backgroundColor: '#0f172a' }}>
            <option value="NGN" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>NGN (₦)</option>
            <option value="ZAR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>ZAR (R)</option>
            <option value="KES" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>KES (KSh)</option>
            <option value="EGP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>EGP (E£)</option>
            <option value="GHS" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>GHS (GH₵)</option>
            <option value="MAD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>MAD (DH)</option>
            <option value="TND" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>TND (DT)</option>
            <option value="DZD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>DZD (DA)</option>
            <option value="UGX" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>UGX (USh)</option>
            <option value="TZS" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>TZS (TSh)</option>
            <option value="RWF" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>RWF (FRw)</option>
            <option value="ETB" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>ETB (Br)</option>
            <option value="XOF" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>XOF (CFA)</option>
            <option value="XAF" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>XAF (FCFA)</option>
            <option value="MUR" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>MUR (Rs)</option>
            <option value="BWP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>BWP (P)</option>
            <option value="NAD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>NAD (N$)</option>
            <option value="ZMW" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>ZMW (ZK)</option>
            <option value="MZN" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>MZN (MT)</option>
            <option value="AOA" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>AOA (Kz)</option>
          </optgroup>

          <optgroup label="Oceania" className="bg-slate-900 text-amber-400 font-bold" style={{ color: '#fbbf24', backgroundColor: '#0f172a' }}>
            <option value="AUD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>AUD (A$)</option>
            <option value="NZD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>NZD (NZ$)</option>
            <option value="FJD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>FJD (FJ$)</option>
            <option value="PGK" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>PGK (K)</option>
            <option value="SBD" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>SBD (SI$)</option>
            <option value="TOP" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>TOP (T$)</option>
            <option value="WST" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>WST (WS$)</option>
            <option value="VUV" className="bg-slate-900 text-slate-100 font-normal" style={{ color: '#f1f5f9', backgroundColor: '#0f172a' }}>VUV (VT)</option>
          </optgroup>
        </select>
      </div>
    );
  };

  const renderNominalToggle = () => (
    <div className="flex items-center bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 p-0.5 rounded-lg text-xs shrink-0">
      <button
        onClick={() => setIsNominal(false)}
        className={`px-2 py-1 rounded-md font-medium transition-colors ${
          !isNominal
            ? 'bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 border border-cyan-500/30'
            : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
        }`}
        title="Real returns (inflation-adjusted purchasing power)"
      >
        Real
      </button>
      <button
        onClick={() => setIsNominal(true)}
        className={`px-2 py-1 rounded-md font-medium transition-colors ${
          isNominal
            ? 'bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 border border-cyan-500/30'
            : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
        }`}
        title={`Nominal returns compounded with ${(inflationRate * 100).toFixed(1)}% annual inflation`}
      >
        Nominal
      </button>
    </div>
  );

  const renderPdfButton = (showText = true) => (
    <button
      onClick={onDownloadReport}
      disabled={isGeneratingPdf}
      className={`p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs shrink-0 ${
        isGeneratingPdf
          ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-600/50 cursor-wait'
          : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 dark:text-cyan-300 light:text-cyan-800 border border-cyan-500/40 active:scale-95'
      }`}
      title="Download executive PDF summary document"
    >
      {isGeneratingPdf ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
      ) : (
        <FileDown className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-400 light:text-cyan-600 shrink-0" />
      )}
      {showText && <span className="font-semibold">PDF</span>}
    </button>
  );

  const renderExportButton = () => (
    <button
      onClick={onExportData}
      className="p-1.5 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center shrink-0"
      title="Export raw JSON simulation data"
    >
      <Download className="w-4 h-4 text-slate-400 shrink-0" />
    </button>
  );

  const renderThemeButton = () => (
    <button
      onClick={onToggleTheme}
      className="p-1.5 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 rounded-lg transition-colors flex items-center shrink-0"
      title={`Switch to ${theme === 'dark' ? 'Institutional Light' : 'Executive Dark'} Theme`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <Moon className="w-4 h-4 text-cyan-600 shrink-0" />
      )}
    </button>
  );

  const renderDisclaimerButton = () => (
    <button
      onClick={onOpenDisclaimers}
      className="p-1.5 text-amber-400 dark:text-amber-400 light:text-amber-600 bg-amber-950/30 dark:bg-amber-950/30 light:bg-amber-100/90 hover:bg-amber-900/40 border border-amber-800/50 dark:border-amber-800/50 light:border-amber-300 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs active:scale-95 shrink-0"
      title="Limitations & Required Analytical Disclaimers"
      aria-label="Limitations & Required Analytical Disclaimers"
    >
      <AlertTriangle className="w-4 h-4 text-amber-400 dark:text-amber-400 light:text-amber-600 shrink-0" />
    </button>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-950/90 dark:bg-slate-950/90 light:bg-white/90 backdrop-blur-md transition-colors">
      <div className="w-full pl-3 sm:pl-4 lg:pl-6 pr-2.5 sm:pr-3.5 lg:pr-4 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Zone 1: Single Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-900/30 shrink-0">
            Ω
          </div>
          <div className="truncate">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900 truncate">
              Investment Forecaster
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 hidden xl:flex">
              <span>Monte Carlo</span>
              <span aria-hidden="true">·</span>
              <span>Live FX Engine</span>
              <span aria-hidden="true">·</span>
              <span>Multi-Horizon</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 p-1 rounded-lg border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-2.5 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'forecast'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            Forecast
          </button>
          <button
            onClick={() => setActiveTab('withdrawal')}
            className={`px-2.5 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'withdrawal'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Withdrawals</span>
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-2.5 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'investments'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
            <span>Investments</span>
          </button>
          <button
            onClick={() => setActiveTab('horizons')}
            className={`px-2.5 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'horizons'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            Horizons
          </button>
          <button
            onClick={() => setActiveTab('historical')}
            className={`px-2.5 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'historical'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            Historical
          </button>
          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-2.5 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'methodology'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            Methodology
          </button>
        </nav>

        {/* Zone 3: Actions & Controls for Desktop (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-1.5 sm:gap-2 shrink-0">
          {renderCurrencySelect('desktop')}
          {renderNominalToggle()}
          {renderPdfButton(true)}
          {renderExportButton()}
          {renderThemeButton()}
          {renderDisclaimerButton()}
        </div>

        {/* Top Bar Controls for Mobile (< lg) placed beside Investment Forecaster */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          {renderPdfButton(false)}
          {renderExportButton()}
          {renderThemeButton()}
          {renderDisclaimerButton()}
        </div>
      </div>

      {/* Mobile Nav Tabs Bar (Horizontally swipeable on mobile & tablet, stops at Real or Nominal) */}
      <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 overflow-x-auto scroll-smooth text-xs">
        {/* Navigation Tabs */}
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'forecast'
              ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold shadow-xs'
              : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
          }`}
        >
          Forecast
        </button>
        <button
          onClick={() => setActiveTab('withdrawal')}
          className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
            activeTab === 'withdrawal'
              ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold shadow-xs'
              : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Withdrawals</span>
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
            activeTab === 'investments'
              ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold shadow-xs'
              : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse shrink-0" />
          <span>Investments</span>
        </button>
        <button
          onClick={() => setActiveTab('horizons')}
          className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'horizons'
              ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold shadow-xs'
              : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
          }`}
        >
          Horizons
        </button>
        <button
          onClick={() => setActiveTab('historical')}
          className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'historical'
              ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold shadow-xs'
              : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
          }`}
        >
          Historical
        </button>
        <button
          onClick={() => setActiveTab('methodology')}
          className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'methodology'
              ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold shadow-xs'
              : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
          }`}
        >
          Methodology
        </button>

        {/* Subtle Visual Divider separating Navigation Tabs from Actions */}
        <div className="h-5 w-px bg-slate-700/60 dark:bg-slate-700/60 light:bg-slate-300 mx-1 shrink-0" aria-hidden="true" />

        {/* Currency & Real/Nominal Controls — stops at Real or Nominal */}
        {renderCurrencySelect('mobile')}
        {renderNominalToggle()}

        {/* Small space separating the last navbar icon from the edge */}
        <div className="w-2.5 shrink-0" aria-hidden="true" />
      </div>
    </header>
  );
};
