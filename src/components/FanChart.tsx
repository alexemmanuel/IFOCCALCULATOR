import React, { useState, useId } from 'react';
import { PercentilePoint, CurrencyCode } from '../types';
import { formatCurrencyCompact, formatCurrency, formatMultiplier } from '../utils/financialEngine';
import { CURRENCY_CONFIGS } from '../data/historicalData';

interface FanChartProps {
  percentiles: PercentilePoint[];
  samplePaths?: number[][];
  initialCapital: number;
  goodProfitThreshold: number;
  failureThreshold: number;
  showSamplePaths?: boolean;
  nominalInflationRate?: number;
  isNominal?: boolean;
  currency?: CurrencyCode;
  liveRates?: Record<CurrencyCode, number>;
  enableStressTest?: boolean;
}

export const FanChart: React.FC<FanChartProps> = ({
  percentiles,
  samplePaths = [],
  initialCapital,
  goodProfitThreshold,
  failureThreshold,
  showSamplePaths = true,
  nominalInflationRate = 0,
  isNominal = false,
  currency = 'USD',
  liveRates,
  enableStressTest = false
}) => {
  const rateToUsd = liveRates?.[currency] ?? CURRENCY_CONFIGS[currency]?.rateToUsd ?? 1.0;
  const [useLogScale, setUseLogScale] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const filterId = useId();

  if (!percentiles || percentiles.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center border border-slate-800 bg-slate-900/40 rounded-xl text-slate-500 text-sm">
        No simulation data available
      </div>
    );
  }

  // Adjust for nominal if requested: value * (1 + inflation)^t
  const adjustedPercentiles = percentiles.map(pt => {
    const factor = isNominal ? Math.pow(1 + nominalInflationRate, pt.year) : 1;
    return {
      year: pt.year,
      p5: pt.p5 * factor,
      p25: pt.p25 * factor,
      p50: pt.p50 * factor,
      p75: pt.p75 * factor,
      p95: pt.p95 * factor,
      mean: pt.mean * factor
    };
  });

  const numYears = adjustedPercentiles.length - 1;

  // Compute maximum and minimum values for scaling
  let maxVal = Math.max(...adjustedPercentiles.map(p => p.p95), goodProfitThreshold * 1.2);
  let minVal = Math.max(1, Math.min(...adjustedPercentiles.map(p => Math.max(1, p.p5)), failureThreshold * 0.8));

  // Minimum floor for log scale
  const logMin = Math.log10(Math.max(100, minVal * 0.8));
  const logMax = Math.log10(Math.max(1000, maxVal * 1.15));

  const width = 800;
  const height = 400;
  const padding = { top: 30, right: 35, bottom: 45, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const getX = (year: number) => padding.left + (year / numYears) * chartWidth;

  const getY = (val: number) => {
    const safeVal = Math.max(1, val);
    if (useLogScale) {
      const logVal = Math.log10(safeVal);
      const normalized = (logVal - logMin) / (logMax - logMin);
      return padding.top + chartHeight - Math.max(0, Math.min(1, normalized)) * chartHeight;
    } else {
      const normalized = (safeVal - minVal) / (maxVal - minVal || 1);
      return padding.top + chartHeight - Math.max(0, Math.min(1, normalized)) * chartHeight;
    }
  };

  // Build SVG path strings for bands
  // Area 5th to 95th
  let area95Path = `M ${getX(0)} ${getY(adjustedPercentiles[0].p95)}`;
  for (let i = 1; i < adjustedPercentiles.length; i++) {
    area95Path += ` L ${getX(adjustedPercentiles[i].year)} ${getY(adjustedPercentiles[i].p95)}`;
  }
  for (let i = adjustedPercentiles.length - 1; i >= 0; i--) {
    area95Path += ` L ${getX(adjustedPercentiles[i].year)} ${getY(adjustedPercentiles[i].p5)}`;
  }
  area95Path += ' Z';

  // Area 25th to 75th
  let area75Path = `M ${getX(0)} ${getY(adjustedPercentiles[0].p75)}`;
  for (let i = 1; i < adjustedPercentiles.length; i++) {
    area75Path += ` L ${getX(adjustedPercentiles[i].year)} ${getY(adjustedPercentiles[i].p75)}`;
  }
  for (let i = adjustedPercentiles.length - 1; i >= 0; i--) {
    area75Path += ` L ${getX(adjustedPercentiles[i].year)} ${getY(adjustedPercentiles[i].p25)}`;
  }
  area75Path += ' Z';

  // Median line
  let medianPath = `M ${getX(0)} ${getY(adjustedPercentiles[0].p50)}`;
  for (let i = 1; i < adjustedPercentiles.length; i++) {
    medianPath += ` L ${getX(adjustedPercentiles[i].year)} ${getY(adjustedPercentiles[i].p50)}`;
  }

  // Y-axis ticks
  const yTicks: number[] = [];
  if (useLogScale) {
    const startExp = Math.floor(logMin);
    const endExp = Math.ceil(logMax);
    for (let exp = startExp; exp <= endExp; exp++) {
      const val = Math.pow(10, exp);
      if (val >= minVal * 0.7 && val <= maxVal * 1.3) {
        yTicks.push(val);
      }
    }
  } else {
    const step = (maxVal - minVal) / 5;
    for (let i = 0; i <= 5; i++) {
      yTicks.push(minVal + i * step);
    }
  }

  // X-axis ticks (5 to 8 ticks)
  const xTicks: number[] = [];
  const xTickStep = Math.max(1, Math.round(numYears / 6));
  for (let yr = 0; yr <= numYears; yr += xTickStep) {
    xTicks.push(yr);
  }
  if (xTicks[xTicks.length - 1] !== numYears) {
    xTicks.push(numYears);
  }

  const activePoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < adjustedPercentiles.length
    ? adjustedPercentiles[hoverIndex]
    : adjustedPercentiles[adjustedPercentiles.length - 1];

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-cyan-500/20 border border-cyan-400/40 inline-block" />
            <span>90% Range (5th–95th)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-indigo-500/30 border border-indigo-400/50 inline-block" />
            <span>50% Core (25th–75th)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-emerald-400 inline-block" />
            <span className="font-medium text-emerald-300">50th Median</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Scale toggle */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setUseLogScale(true)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                useLogScale ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log Scale (Recommended)
            </button>
            <button
              onClick={() => setUseLogScale(false)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                !useLogScale ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linear
            </button>
          </div>
        </div>
      </div>

      {/* SVG Fan Chart Canvas */}
      <div id="fan-chart-container" className="relative w-full aspect-[2/1] min-h-[300px] max-h-[460px] select-none overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const svgX = relX * width;
            if (svgX >= padding.left && svgX <= padding.left + chartWidth) {
              const yearFraction = (svgX - padding.left) / chartWidth;
              const approxYear = Math.round(yearFraction * numYears);
              setHoverIndex(Math.max(0, Math.min(numYears, approxYear)));
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`${filterId}-outerBand`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id={`${filterId}-innerBand`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.10" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#334155"
                  strokeOpacity="0.4"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="end"
                  className="font-mono tabular-nums"
                >
                  {formatCurrencyCompact(tick, currency)}
                </text>
              </g>
            );
          })}

          {xTicks.map((yr, i) => {
            const x = getX(yr);
            return (
              <g key={`x-${i}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartHeight}
                  stroke="#334155"
                  strokeOpacity="0.3"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={padding.top + chartHeight + 20}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="middle"
                  className="font-mono tabular-nums"
                >
                  Y{yr}
                </text>
              </g>
            );
          })}

          {/* Stress Test Window Shading for Years 1–3 */}
          {enableStressTest && (
            <g>
              <rect
                x={getX(0)}
                y={padding.top}
                width={Math.max(1, getX(Math.min(3, numYears)) - getX(0))}
                height={chartHeight}
                fill="#f43f5e"
                fillOpacity="0.10"
                stroke="#f43f5e"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
              />
              <text
                x={getX(1.5)}
                y={padding.top + 18}
                fill="#fda4af"
                fontSize="10"
                textAnchor="middle"
                className="font-mono font-semibold"
              >
                Stress Test (Y1–Y3: -37% Shift)
              </text>
            </g>
          )}

          {/* Threshold reference lines */}
          {goodProfitThreshold && (
            <line
              x1={padding.left}
              y1={getY(goodProfitThreshold)}
              x2={padding.left + chartWidth}
              y2={getY(goodProfitThreshold)}
              stroke="#10b981"
              strokeOpacity="0.5"
              strokeDasharray="4 4"
            />
          )}
          {failureThreshold && (
            <line
              x1={padding.left}
              y1={getY(failureThreshold)}
              x2={padding.left + chartWidth}
              y2={getY(failureThreshold)}
              stroke="#f43f5e"
              strokeOpacity="0.5"
              strokeDasharray="4 4"
            />
          )}

          {/* Starting Capital Floor Line */}
          <line
            x1={padding.left}
            y1={getY(initialCapital)}
            x2={padding.left + chartWidth}
            y2={getY(initialCapital)}
            stroke="#64748b"
            strokeOpacity="0.6"
            strokeWidth="1.2"
          />

          {/* 5th - 95th Percentile Area */}
          <path d={area95Path} fill={`url(#${filterId}-outerBand)`} />

          {/* 25th - 75th Percentile Area */}
          <path d={area75Path} fill={`url(#${filterId}-innerBand)`} />

          {/* Stochastic Sample Paths (Ghost paths) */}
          {showSamplePaths && samplePaths.map((path, idx) => {
            let pathD = `M ${getX(0)} ${getY(path[0] * (isNominal ? 1 : 1))}`;
            for (let yr = 1; yr <= numYears && yr < path.length; yr++) {
              const nominalFactor = isNominal ? Math.pow(1 + nominalInflationRate, yr) : 1;
              pathD += ` L ${getX(yr)} ${getY(path[yr] * nominalFactor)}`;
            }
            return (
              <path
                key={`sample-${idx}`}
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.75"
                strokeOpacity="0.22"
              />
            );
          })}

          {/* 50th Percentile (Median) Line */}
          <path
            d={medianPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Crosshair */}
          {activePoint && (
            <g>
              <line
                x1={getX(activePoint.year)}
                y1={padding.top}
                x2={getX(activePoint.year)}
                y2={padding.top + chartHeight}
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                strokeOpacity="0.7"
              />
              <circle
                cx={getX(activePoint.year)}
                cy={getY(activePoint.p50)}
                r="4.5"
                fill="#10b981"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <circle
                cx={getX(activePoint.year)}
                cy={getY(activePoint.p95)}
                r="3"
                fill="#06b6d4"
              />
              <circle
                cx={getX(activePoint.year)}
                cy={getY(activePoint.p5)}
                r="3"
                fill="#06b6d4"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Active Inspector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-800 text-xs">
        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Inspection Horizon</span>
          <span className="text-slate-100 font-semibold font-mono tabular-nums text-sm">
            Year {activePoint.year}
          </span>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-400 block text-[11px]">5th Percentile (Downside)</span>
          <span className="text-amber-400 font-semibold font-mono tabular-nums text-sm">
            {formatCurrency(activePoint.p5, 0, currency)}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            {formatMultiplier(activePoint.p5 / initialCapital)}
          </span>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-400 block text-[11px]">25th Percentile</span>
          <span className="text-slate-200 font-semibold font-mono tabular-nums text-sm">
            {formatCurrency(activePoint.p25, 0, currency)}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            {formatMultiplier(activePoint.p25 / initialCapital)}
          </span>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg border border-emerald-500/20 bg-emerald-950/10">
          <span className="text-emerald-400 block text-[11px]">50th Median Expected</span>
          <span className="text-emerald-300 font-bold font-mono tabular-nums text-sm">
            {formatCurrency(activePoint.p50, 0, currency)}
          </span>
          {currency !== 'USD' && (
            <span className="text-[10px] text-emerald-400 font-mono block">
              ≈ ${formatCurrencyCompact(activePoint.p50 / rateToUsd, 'USD')} USD
            </span>
          )}
          <span className="text-[10px] text-emerald-500 block font-mono">
            {formatMultiplier(activePoint.p50 / initialCapital)}
          </span>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-400 block text-[11px]">75th Percentile</span>
          <span className="text-slate-200 font-semibold font-mono tabular-nums text-sm">
            {formatCurrency(activePoint.p75, 0, currency)}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            {formatMultiplier(activePoint.p75 / initialCapital)}
          </span>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-400 block text-[11px]">95th Percentile (Upside)</span>
          <span className="text-cyan-400 font-semibold font-mono tabular-nums text-sm">
            {formatCurrency(activePoint.p95, 0, currency)}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            {formatMultiplier(activePoint.p95 / initialCapital)}
          </span>
        </div>
      </div>
    </div>
  );
};
