import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Sliders, Info } from 'lucide-react';
import { formatPercent } from '../utils/financialEngine';

interface StabilityGaugeProps {
  stabilityPercentage: number; // 0 to 1
  stabilityFloorPct: number;   // e.g. 0.40 (40%)
  stabilityStartYear: number;  // e.g. 5
  numPaths: number;
  horizonYears: number;
  onUpdateStabilityParams: (floorPct: number, startYear: number) => void;
}

export const StabilityGauge: React.FC<StabilityGaugeProps> = ({
  stabilityPercentage,
  stabilityFloorPct,
  stabilityStartYear,
  numPaths,
  horizonYears,
  onUpdateStabilityParams
}) => {
  const percentage = Math.min(100, Math.max(0, stabilityPercentage * 100));

  // Determine status tier and colors
  let statusTier = 'High Capital Stability';
  let badgeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
  let arcColor = '#10b981'; // emerald-500
  let description = 'Overwhelming majority of paths preserve starting capital and resist catastrophic peak drawdowns.';

  if (percentage < 60) {
    statusTier = 'Fragile / High Downside Vulnerability';
    badgeColor = 'text-rose-400 bg-rose-950/40 border-rose-500/30';
    arcColor = '#f43f5e'; // rose-500
    description = 'High proportion of simulation paths suffer drawdowns below the rolling floor or finish below initial capital.';
  } else if (percentage < 80) {
    statusTier = 'Moderate Drawdown Exposure';
    badgeColor = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
    arcColor = '#f59e0b'; // amber-500
    description = 'Acceptable multi-decade path resilience, with occasional cyclical stress breaching the rolling floor.';
  }

  // Semi-circle gauge geometry (radius = 70, stroke = 12)
  const radius = 68;
  const circumference = Math.PI * radius; // 180 degrees arc
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-100">
        <div className="flex items-center gap-2">
          {percentage >= 75 ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 uppercase tracking-wider">
              Path Stability Floor Gauge
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500">
              Specification Section 4 & 10 Rolling Drawdown Metric
            </span>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${badgeColor}`}>
          {statusTier}
        </div>
      </div>

      {/* Visual Radial Semi-Circle Gauge + Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Semi-Circle SVG Radial Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-48 h-28 flex items-end justify-center select-none">
            <svg viewBox="0 0 160 90" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background semi-circle track */}
              <path
                d="M 12 80 A 68 68 0 0 1 148 80"
                fill="none"
                stroke="#1e293b"
                strokeWidth="11"
                strokeLinecap="round"
              />

              {/* Foreground animated value arc */}
              <path
                d="M 12 80 A 68 68 0 0 1 148 80"
                fill="none"
                stroke={arcColor}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Central Score Display */}
            <div className="absolute bottom-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 dark:text-slate-100 light:text-slate-900 tabular-nums">
                {percentage.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono uppercase tracking-wider">
                Paths Resilient
              </span>
            </div>
          </div>

          {/* Min / Max Labels */}
          <div className="w-44 flex justify-between text-[10px] font-mono text-slate-500 pt-1">
            <span>0% (Fragile)</span>
            <span>100% (Robust)</span>
          </div>
        </div>

        {/* Real-time Parameter Tuners & Details */}
        <div className="md:col-span-7 space-y-3">
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
            <strong>{formatPercent(stabilityPercentage, 1)}</strong> of the {numPaths.toLocaleString()} simulated paths maintain wealth above initial capital and never experience a drop greater than <strong>{(stabilityFloorPct * 100).toFixed(0)}%</strong> below their previous peak after Year {stabilityStartYear}.
          </p>

          {/* Linear Progress Bar for Secondary Confirmation */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">Simulation Stability Level</span>
              <span className="font-bold text-slate-200">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: arcColor
                }}
              />
            </div>
          </div>

          {/* Interactive Parameters Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800/60">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Drawdown Floor Limit</span>
                <span className="font-mono font-bold text-amber-400">
                  ≤ {(stabilityFloorPct * 100).toFixed(0)}% drop
                </span>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.65"
                step="0.05"
                value={stabilityFloorPct}
                onChange={(e) =>
                  onUpdateStabilityParams(parseFloat(e.target.value), stabilityStartYear)
                }
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Max peak-to-trough drop allowed
              </span>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Evaluation Starts</span>
                <span className="font-mono font-bold text-cyan-400">
                  Year {stabilityStartYear}+
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={Math.min(25, Math.max(2, horizonYears - 1))}
                step="1"
                value={stabilityStartYear}
                onChange={(e) =>
                  onUpdateStabilityParams(stabilityFloorPct, parseInt(e.target.value))
                }
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Grace period before rule applies
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
