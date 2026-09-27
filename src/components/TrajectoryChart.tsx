import React, { useState } from 'react';
import { WithdrawalPathDataPoint, CurrencyCode } from '../types';
import { formatCurrency, formatCurrencyCompact, formatPercent, formatMultiplier } from '../utils/financialEngine';

interface TrajectoryChartProps {
  timeSeries: WithdrawalPathDataPoint[];
  initialCapital: number;
  highlightInterval?: { startYear: number; endYear: number };
  currency?: CurrencyCode;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({
  timeSeries,
  initialCapital,
  highlightInterval,
  currency = 'USD'
}) => {
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center border border-slate-800 bg-slate-900/40 rounded-xl text-slate-500 text-sm">
        No trajectory data available
      </div>
    );
  }

  const numYears = timeSeries.length - 1;

  // Max value across both series and cumulative cash
  const allValues = timeSeries.flatMap(d => [d.valueWithoutWithdrawal, d.valueWithWithdrawal + d.cumulativeWithdrawn, d.valueWithWithdrawal]);
  const maxVal = Math.max(...allValues, initialCapital * 1.1);
  const minVal = 0;

  const width = 800;
  const height = 380;
  const padding = { top: 25, right: 35, bottom: 45, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (year: number) => padding.left + (year / (numYears || 1)) * chartWidth;
  const getY = (val: number) => {
    const normalized = (Math.max(0, val) - minVal) / (maxVal - minVal || 1);
    return padding.top + chartHeight - normalized * chartHeight;
  };

  // Paths
  let withoutPath = `M ${getX(0)} ${getY(timeSeries[0].valueWithoutWithdrawal)}`;
  let withPath = `M ${getX(0)} ${getY(timeSeries[0].valueWithWithdrawal)}`;
  let cashPath = `M ${getX(0)} ${getY(timeSeries[0].cumulativeWithdrawn)}`;

  for (let i = 1; i < timeSeries.length; i++) {
    withoutPath += ` L ${getX(timeSeries[i].year)} ${getY(timeSeries[i].valueWithoutWithdrawal)}`;
    withPath += ` L ${getX(timeSeries[i].year)} ${getY(timeSeries[i].valueWithWithdrawal)}`;
    cashPath += ` L ${getX(timeSeries[i].year)} ${getY(timeSeries[i].cumulativeWithdrawn)}`;
  }

  // Y-axis ticks
  const yTicks: number[] = [];
  const yStep = maxVal / 5;
  for (let i = 0; i <= 5; i++) {
    yTicks.push(i * yStep);
  }

  // X-axis ticks
  const xTicks: number[] = [];
  const xTickStep = Math.max(1, Math.round(numYears / 6));
  for (let yr = 0; yr <= numYears; yr += xTickStep) {
    xTicks.push(yr);
  }
  if (xTicks[xTicks.length - 1] !== numYears) {
    xTicks.push(numYears);
  }

  const activePoint = hoverYear !== null && hoverYear >= 0 && hoverYear < timeSeries.length
    ? timeSeries[hoverYear]
    : timeSeries[timeSeries.length - 1];

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-cyan-400 inline-block rounded-xs" />
            <span className="font-medium text-cyan-300">Counterfactual (No Withdrawals)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-amber-400 inline-block rounded-xs" />
            <span className="font-medium text-amber-300">Actual (With Withdrawals)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-emerald-400 inline-block" />
            <span className="text-emerald-400">Cumulative Cash Extracted</span>
          </div>
        </div>

        {highlightInterval && (
          <div className="text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
            Selected Interval: Year {highlightInterval.startYear} → Year {highlightInterval.endYear}
          </div>
        )}
      </div>

      <div className="relative w-full aspect-[2/1] min-h-[280px] max-h-[420px] select-none">
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
              setHoverYear(Math.max(0, Math.min(numYears, approxYear)));
            }
          }}
          onMouseLeave={() => setHoverYear(null)}
        >
          {/* Highlight Interval Shading */}
          {highlightInterval && (
            <rect
              x={getX(highlightInterval.startYear)}
              y={padding.top}
              width={Math.max(1, getX(highlightInterval.endYear) - getX(highlightInterval.startYear))}
              height={chartHeight}
              fill="#06b6d4"
              fillOpacity="0.08"
              stroke="#06b6d4"
              strokeOpacity="0.3"
              strokeDasharray="3 3"
            />
          )}

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
                  strokeOpacity="0.35"
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
                  strokeOpacity="0.25"
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

          {/* Lines */}
          <path
            d={cashPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          <path
            d={withoutPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <path
            d={withPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Hover indicator */}
          {activePoint && (
            <g>
              <line
                x1={getX(activePoint.year)}
                y1={padding.top}
                x2={getX(activePoint.year)}
                y2={padding.top + chartHeight}
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                strokeOpacity="0.6"
              />
              <circle
                cx={getX(activePoint.year)}
                cy={getY(activePoint.valueWithoutWithdrawal)}
                r="4"
                fill="#06b6d4"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(activePoint.year)}
                cy={getY(activePoint.valueWithWithdrawal)}
                r="4"
                fill="#f59e0b"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Trajectory Inspector bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
        <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Timeline Position</span>
          <span className="text-slate-100 font-bold font-mono text-sm">
            Year {activePoint.year}
          </span>
          <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
            Real Return: {formatPercent(activePoint.realReturn)}
          </span>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded-lg border border-cyan-500/20 bg-cyan-950/10">
          <span className="text-cyan-400 block text-[11px]">Counterfactual (No Cash-Outs)</span>
          <span className="text-cyan-200 font-bold font-mono text-sm">
            {formatCurrency(activePoint.valueWithoutWithdrawal, 0, currency)}
          </span>
          <span className="text-[11px] text-cyan-400/80 block font-mono mt-0.5">
            {formatMultiplier(activePoint.valueWithoutWithdrawal / initialCapital)} of starting
          </span>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded-lg border border-amber-500/20 bg-amber-950/10">
          <span className="text-amber-400 block text-[11px]">Actual (With Withdrawals)</span>
          <span className="text-amber-200 font-bold font-mono text-sm">
            {formatCurrency(activePoint.valueWithWithdrawal, 0, currency)}
          </span>
          <span className="text-[11px] text-amber-400/80 block font-mono mt-0.5">
            Cash Out: {formatCurrency(activePoint.cumulativeWithdrawn, 0, currency)}
          </span>
        </div>
        <div className={`p-2.5 rounded-lg border ${
          activePoint.deltaFromCounterfactual >= 0
            ? 'border-rose-500/30 bg-rose-950/20 text-rose-300'
            : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
        }`}>
          <span className="block text-[11px] opacity-80">
            {activePoint.deltaFromCounterfactual >= 0 ? 'Lost Compounding Gains' : 'Avoided Market Losses'}
          </span>
          <span className="font-bold font-mono text-sm block">
            {formatCurrency(Math.abs(activePoint.deltaFromCounterfactual), 0, currency)}
          </span>
          <span className="text-[10px] block opacity-75 mt-0.5">
            {activePoint.deltaFromCounterfactual >= 0 ? 'Sacrificed growth' : 'Capital preserved'}
          </span>
        </div>
      </div>
    </div>
  );
};
