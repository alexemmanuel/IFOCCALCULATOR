import React from 'react';
import { TOP_INVESTMENTS, TopInvestment, US_GDP_BILLIONS } from '../data/topInvestments';
import { formatPercent, formatMultiplier } from '../utils/financialEngine';
import { TrendingUp, TrendingDown, Flame, BarChart2 } from 'lucide-react';

interface MarqueeTickerProps {
  onSelectInvestment: (inv: TopInvestment) => void;
}

export const MarqueeTicker: React.FC<MarqueeTickerProps> = ({ onSelectInvestment }) => {
  // Duplicate array to create a seamless infinite scrolling loop
  const tickerItems = [...TOP_INVESTMENTS, ...TOP_INVESTMENTS];

  return (
    <div className="w-full bg-slate-950/95 border-b border-slate-800/80 overflow-hidden relative select-none">
      {/* Left side subtle label indicator */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent pr-8 pointer-events-none">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
          <Flame className="w-3 h-3 text-cyan-400" />
          <span>Leading Assets · % GDP</span>
        </span>
      </div>

      {/* Right side fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />

      {/* Marquee Track */}
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] py-2 pl-36">
        {tickerItems.map((item, index) => {
          const isGainer = item.currentYearReturn >= 0;
          const isSevereLoss = item.currentYearReturn < -0.15 || item.maxDrawdown < -0.50;

          return (
            <button
              key={`${item.id}-${index}`}
              onClick={() => onSelectInvestment(item)}
              className="flex items-center gap-2.5 mx-3.5 px-3 py-1 rounded-md bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all text-xs shrink-0 cursor-pointer group"
              title={`Click to inspect ${item.name} and simulate future path`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {item.ticker}
                </span>
                <span className="text-slate-400 text-[11px] max-w-[110px] truncate hidden sm:inline">
                  {item.name}
                </span>
              </div>

              {/* Market Cap & % of GDP */}
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <span className="text-slate-300 font-semibold">
                  ${(item.marketCapBillions >= 1000 ? item.marketCapBillions / 1000 : item.marketCapBillions).toFixed(1)}
                  {item.marketCapBillions >= 1000 ? 'T' : 'B'}
                </span>
                <span className="text-cyan-400/90 text-[10px]">
                  ({item.percentUsGdp.toFixed(1)}% GDP)
                </span>
              </div>

              {/* Return / Drawdown badge */}
              <div
                className={`flex items-center gap-0.5 px-1.5 py-0.2 rounded font-mono text-[11px] font-semibold ${
                  isGainer
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                    : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                }`}
              >
                {isGainer ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5" />
                )}
                <span>
                  {item.currentYearReturn >= 0 ? '+' : ''}
                  {(item.currentYearReturn * 100).toFixed(1)}%
                </span>
              </div>

              {/* Drawdown / Loss stat */}
              {isSevereLoss && (
                <span className="text-[10px] font-mono text-rose-300/80 bg-rose-950/40 border border-rose-900/40 px-1 rounded">
                  DD: {(item.maxDrawdown * 100).toFixed(0)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
