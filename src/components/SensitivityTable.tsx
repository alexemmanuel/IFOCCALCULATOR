import React from 'react';
import { SensitivityMatrix, CurrencyCode } from '../types';
import { formatCurrencyCompact, formatPercent, formatMultiplier } from '../utils/financialEngine';

interface SensitivityTableProps {
  matrix: SensitivityMatrix;
  currentReturn: number;
  currentVolatility: number;
  onApplyParameters: (expReturn: number, vol: number) => void;
  currency?: CurrencyCode;
}

export const SensitivityTable: React.FC<SensitivityTableProps> = ({
  matrix,
  currentReturn,
  currentVolatility,
  onApplyParameters,
  currency = 'USD'
}) => {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Parameter Sensitivity Analysis (Return vs. Volatility)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Specification Section 5.1: Differences in terminal wealth multiples exceed an order of magnitude at long horizons from 1–2% return shifts.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Click any cell to test that scenario
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2.5 px-3 font-medium">Real Return \ Volatility</th>
              {matrix.volatilities.map((v, i) => (
                <th key={i} className="py-2.5 px-3 font-medium text-center">
                  {formatPercent(v, 0)} Volatility
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
            {matrix.matrix.map((row, rIdx) => {
              const rVal = matrix.returns[rIdx];
              return (
                <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {formatPercent(rVal, 1)} p.a.
                  </td>
                  {row.map((cell, vIdx) => {
                    const isSelected =
                      Math.abs(cell.expectedReturn - currentReturn) < 0.001 &&
                      Math.abs(cell.volatility - currentVolatility) < 0.001;

                    return (
                      <td key={vIdx} className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => onApplyParameters(cell.expectedReturn, cell.volatility)}
                          className={`w-full p-2.5 rounded-lg border text-left flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                              : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                          }`}
                        >
                          <span className="text-slate-100 font-bold text-xs sm:text-sm">
                            {formatMultiplier(cell.medianMultiple)}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            {formatCurrencyCompact(cell.medianTerminalWealth, currency)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                            <span className="text-emerald-400">
                              {formatPercent(cell.probGoodProfits, 0)} win
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-rose-400">
                              {formatPercent(cell.probFailure, 0)} fail
                            </span>
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
