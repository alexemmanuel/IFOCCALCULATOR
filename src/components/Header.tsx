import React from 'react';
import { Download, ShieldAlert, Sparkles, RefreshCw, Sun, Moon, Calculator, Globe } from 'lucide-react';
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
  enableFxOverlay: boolean;
  onToggleFxOverlay: () => void;
  onOpenDisclaimers: () => void;
  onExportData: () => void;
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
  enableFxOverlay,
  onToggleFxOverlay,
  onOpenDisclaimers,
  onExportData,
  onResetDefaults
}) => {
  const currentCurr = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS['USD'];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-950/90 dark:bg-slate-950/90 light:bg-white/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-900/30">
            Ω
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900 whitespace-nowrap">
              Investment Forecasting & Opportunity Cost Calculator
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 hidden sm:flex">
              <span>Monte Carlo</span>
              <span aria-hidden="true">·</span>
              <span>Explicit Uncertainty</span>
              <span aria-hidden="true">·</span>
              <span>Global & Africa Tiers</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 p-1 rounded-lg border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'forecast'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            Monte Carlo Forecast
          </button>
          <button
            onClick={() => setActiveTab('withdrawal')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'withdrawal'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-300/90 dark:text-amber-300/90 light:text-amber-700">Withdrawal Calculator (Tab 2)</span>
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'investments'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
            <span>Top Investments</span>
          </button>
          <button
            onClick={() => setActiveTab('horizons')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'horizons'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            Horizon Stability
          </button>
          <button
            onClick={() => setActiveTab('historical')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'historical'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            Historical Cycles
          </button>
          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'methodology'
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-300 dark:text-cyan-300 light:text-cyan-700 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            Methodology
          </button>
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Currency Selector (USD | African | Global) */}
          <div className="flex items-center gap-1 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 px-2 py-1 rounded-lg text-xs">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              className="bg-transparent text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono font-bold focus:outline-hidden cursor-pointer text-xs"
              title="Select Base Reporting Currency"
            >
              <optgroup label="Global Reserves" className="bg-slate-900 text-slate-100">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
              </optgroup>
              <optgroup label="African Currencies" className="bg-slate-900 text-slate-100">
                <option value="ZAR">ZAR (R · South Africa)</option>
                <option value="NGN">NGN (₦ · Nigeria)</option>
                <option value="KES">KES (KSh · Kenya)</option>
                <option value="EGP">EGP (E£ · Egypt)</option>
                <option value="GHS">GHS (GH₵ · Ghana)</option>
                <option value="MAD">MAD (DH · Morocco)</option>
                <option value="TND">TND (DT · Tunisia)</option>
                <option value="XOF">XOF (CFA · West Africa)</option>
              </optgroup>
            </select>
          </div>

          {/* Real vs Nominal Toggle */}
          <div className="hidden sm:flex items-center bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setIsNominal(false)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
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
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                isNominal
                  ? 'bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 border border-cyan-500/30'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
              }`}
              title={`Nominal returns compounded with ${(inflationRate * 100).toFixed(1)}% annual inflation`}
            >
              Nominal
            </button>
          </div>

          {/* Theme Switcher Toggle (Executive Dark vs. Institutional Light) */}
          <button
            onClick={onToggleTheme}
            className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            title={`Switch to ${theme === 'dark' ? 'Institutional Light' : 'Executive Dark'} Theme`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden xl:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-600" />
                <span className="hidden xl:inline">Dark</span>
              </>
            )}
          </button>

          <button
            onClick={onExportData}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            title="Export full data and summary"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">Export</span>
          </button>

          <button
            onClick={onOpenDisclaimers}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-amber-300/90 dark:text-amber-300/90 light:text-amber-700 bg-amber-950/20 dark:bg-amber-950/20 light:bg-amber-50 border border-amber-800/40 dark:border-amber-800/40 light:border-amber-200 hover:bg-amber-950/40 rounded-lg transition-colors flex items-center gap-1.5"
            title="View analytical limitations and required disclaimers"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400 dark:text-amber-400 light:text-amber-600" />
            <span className="hidden sm:inline">Disclaimers</span>
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
