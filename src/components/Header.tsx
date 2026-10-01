import React from 'react';
import { Download, ShieldAlert, AlertTriangle, Sparkles, RefreshCw, Sun, Moon, Calculator, Globe, FileDown, Loader2 } from 'lucide-react';
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
  const ngnRate = liveRates?.['NGN'] ?? 1327.24;

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

        {/* Zone 2: Navigation Links */}
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

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Real-Time Live Currency Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 px-2 sm:px-2.5 py-1 rounded-lg text-xs">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              className="bg-transparent text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono font-bold focus:outline-hidden cursor-pointer text-xs"
              title="Select Base Reporting Currency — figures auto-scale by real-time market rate differences"
            >
              <optgroup label="Global Reserves" className="bg-slate-900 text-slate-100">
                <option value="USD">USD ($ · Base)</option>
                <option value="EUR">EUR (€ · 1$ = €{(liveRates?.['EUR'] ?? 0.88).toFixed(2)})</option>
                <option value="GBP">GBP (£ · 1$ = £{(liveRates?.['GBP'] ?? 0.76).toFixed(2)})</option>
                <option value="CAD">CAD (CA$ · 1$ = CA${(liveRates?.['CAD'] ?? 1.42).toFixed(2)})</option>
                <option value="AUD">AUD (A$ · 1$ = A${(liveRates?.['AUD'] ?? 1.55).toFixed(2)})</option>
                <option value="JPY">JPY (¥ · 1$ = ¥{Math.round(liveRates?.['JPY'] ?? 154)})</option>
              </optgroup>
              <optgroup label="African Currencies" className="bg-slate-900 text-slate-100">
                <option value="NGN">NGN (₦ · 1$ = ₦{Math.round(ngnRate).toLocaleString()})</option>
                <option value="ZAR">ZAR (R · 1$ = R{(liveRates?.['ZAR'] ?? 16.4).toFixed(1)})</option>
                <option value="KES">KES (KSh · 1$ = KSh{Math.round(liveRates?.['KES'] ?? 130)})</option>
                <option value="EGP">EGP (E£ · 1$ = E£{(liveRates?.['EGP'] ?? 48.7).toFixed(1)})</option>
                <option value="GHS">GHS (GH₵ · 1$ = GH₵{(liveRates?.['GHS'] ?? 15.6).toFixed(1)})</option>
                <option value="MAD">MAD (DH · 1$ = DH{(liveRates?.['MAD'] ?? 9.8).toFixed(1)})</option>
                <option value="TND">TND (DT · 1$ = DT{(liveRates?.['TND'] ?? 3.1).toFixed(1)})</option>
                <option value="XOF">XOF (CFA · 1$ = CFA{Math.round(liveRates?.['XOF'] ?? 605)})</option>
              </optgroup>
            </select>
          </div>

          {/* Real vs Nominal Toggle */}
          <div className="hidden sm:flex items-center bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 p-0.5 rounded-lg text-xs">
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

          {/* Theme Switcher Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 rounded-lg transition-colors flex items-center"
            title={`Switch to ${theme === 'dark' ? 'Institutional Light' : 'Executive Dark'} Theme`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-600" />
            )}
          </button>

          {/* Download Executive PDF Summary Report */}
          <button
            onClick={onDownloadReport}
            disabled={isGeneratingPdf}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs ${
              isGeneratingPdf
                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-600/50 cursor-wait'
                : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 dark:text-cyan-300 light:text-cyan-800 border border-cyan-500/40 active:scale-95'
            }`}
            title="Download executive PDF summary document"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <FileDown className="w-4 h-4 text-cyan-400 dark:text-cyan-400 light:text-cyan-600" />
            )}
            <span className="hidden md:inline font-semibold">PDF</span>
          </button>

          {/* Export Raw Data */}
          <button
            onClick={onExportData}
            className="p-1.5 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center"
            title="Export raw JSON simulation data"
          >
            <Download className="w-4 h-4 text-slate-400" />
          </button>

          {/* Disclaimer Button: Just the yellow warning icon, no text attached */}
          <button
            onClick={onOpenDisclaimers}
            className="p-1.5 text-amber-400 dark:text-amber-400 light:text-amber-600 bg-amber-950/30 dark:bg-amber-950/30 light:bg-amber-100/90 hover:bg-amber-900/40 border border-amber-800/50 dark:border-amber-800/50 light:border-amber-300 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs active:scale-95 shrink-0"
            title="Limitations & Required Analytical Disclaimers"
            aria-label="Limitations & Required Analytical Disclaimers"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 dark:text-amber-400 light:text-amber-600 shrink-0" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Tabs Bar (Scrollable for small screens) */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-3 py-1 font-medium rounded-md whitespace-nowrap ${
            activeTab === 'forecast' ? 'bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold' : 'text-slate-400 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          Forecast
        </button>
        <button
          onClick={() => setActiveTab('withdrawal')}
          className={`px-3 py-1 font-medium rounded-md whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'withdrawal' ? 'bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold' : 'text-slate-400 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          <span>Calculator (Tab 2)</span>
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`px-3 py-1 font-medium rounded-md whitespace-nowrap ${
            activeTab === 'investments' ? 'bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold' : 'text-slate-400 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          Top Investments
        </button>
        <button
          onClick={() => setActiveTab('horizons')}
          className={`px-3 py-1 font-medium rounded-md whitespace-nowrap ${
            activeTab === 'horizons' ? 'bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700' : 'text-slate-400 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          Horizons
        </button>
        <button
          onClick={() => setActiveTab('historical')}
          className={`px-3 py-1 font-medium rounded-md whitespace-nowrap ${
            activeTab === 'historical' ? 'bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700' : 'text-slate-400 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          Historical Cycles
        </button>
        <button
          onClick={() => setActiveTab('methodology')}
          className={`px-3 py-1 font-medium rounded-md whitespace-nowrap ${
            activeTab === 'methodology' ? 'bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700' : 'text-slate-400 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          Methodology
        </button>
      </div>
    </header>
  );
};
