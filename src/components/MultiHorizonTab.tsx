import React, { useMemo } from 'react';
import { HORIZON_BANDS } from '../data/historicalData';
import { SimulationParameters, CurrencyCode } from '../types';
import { runMonteCarloSimulation, formatCurrencyCompact, formatPercent, formatMultiplier } from '../utils/financialEngine';
import { Layers, AlertTriangle, ArrowUpRight, Compass, ShieldCheck } from 'lucide-react';

interface MultiHorizonTabProps {
  baseParams: SimulationParameters;
  onSelectHorizon: (years: number) => void;
  currency?: CurrencyCode;
}

export const MultiHorizonTab: React.FC<MultiHorizonTabProps> = ({
  baseParams,
  onSelectHorizon,
  currency = 'USD'
}) => {
  // Pre-calculate metrics for each of the 8 standard horizon bands
  const horizonEvaluations = useMemo(() => {
    return HORIZON_BANDS.map(band => {
      const sim = runMonteCarloSimulation({
        ...baseParams,
        horizonYears: band.typicalYears,
        numPaths: 2500, // fast calibrated sample for comparative overview
        seed: 1000 + band.typicalYears
      });

      return {
        band,
        sim,
        medianMultiple: sim.terminalWealthMedian / baseParams.initialCapital,
        p5Multiple: sim.terminalWealthP5 / baseParams.initialCapital,
        p95Multiple: sim.terminalWealthP95 / baseParams.initialCapital,
        probProfits: sim.probGoodProfits,
        probFail: sim.probFailure,
        stability: sim.stabilityPercentage
      };
    });
  }, [baseParams]);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400" />
          <span>Multi-Horizon Stability Assessment (3 to 200+ Years)</span>
        </h2>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-4xl">
          Specification Section 3 (Pages 2–3): Evaluates investment outcomes across 8 standardized horizon brackets.
          As time horizon extends from retirement accumulation to multi-generational foundation transfer, dominant risk drivers shift from short-term sequence risk to parameter and epistemic uncertainty.
        </p>
      </div>

      {/* Horizon Bands Grid Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">Horizon Band</th>
                <th className="py-3 px-3 font-semibold">Typical Use Case</th>
                <th className="py-3 px-3 font-semibold text-center">Median Multiple</th>
                <th className="py-3 px-3 font-semibold text-center">90% Range (5th–95th)</th>
                <th className="py-3 px-3 font-semibold text-center">P(Good Profit)</th>
                <th className="py-3 px-3 font-semibold text-center">P(Failure)</th>
                <th className="py-3 px-3 font-semibold text-center">Stability</th>
                <th className="py-3 px-4 font-semibold">Dominant Risk Drivers</th>
                <th className="py-3 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {horizonEvaluations.map(({ band, sim, medianMultiple, p5Multiple, p95Multiple, probProfits, probFail, stability }) => {
                const isExploratory = band.isExploratory;

                return (
                  <tr
                    key={band.id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isExploratory ? 'bg-amber-950/5' : ''
                    }`}
                  >
                    {/* Horizon Name & Years */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                        <span>{band.rangeLabel}</span>
                        {isExploratory && (
                          <span
                            title="Beyond 80 years: Exploratory / Educational. Historical sample collapses."
                            className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1 py-0.2 rounded font-sans"
                          >
                            Exploratory
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Model: {band.typicalYears} years
                      </div>
                    </td>

                    {/* Use Case */}
                    <td className="py-3.5 px-3 max-w-[200px] text-slate-300 font-sans text-xs">
                      {band.typicalUseCase}
                    </td>

                    {/* Median Multiple & Wealth */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-bold text-cyan-300 text-sm">
                        {formatMultiplier(medianMultiple)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatCurrencyCompact(sim.terminalWealthMedian, currency)}
                      </div>
                    </td>

                    {/* 5th to 95th Spread */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="text-slate-200 text-xs">
                        {formatMultiplier(p5Multiple)} → {formatMultiplier(p95Multiple)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatCurrencyCompact(sim.terminalWealthP5, currency)} to {formatCurrencyCompact(sim.terminalWealthP95, currency)}
                      </div>
                    </td>

                    {/* Probability of Good Profit */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-emerald-400">
                        {formatPercent(probProfits, 1)}
                      </span>
                    </td>

                    {/* Probability of Failure */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-bold ${probFail > 0.10 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {formatPercent(probFail, 1)}
                      </span>
                    </td>

                    {/* Stability Metric */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-slate-200">
                        {formatPercent(stability, 0)}
                      </span>
                    </td>

                    {/* Dominant Risk Driver */}
                    <td className="py-3.5 px-4 font-sans text-xs text-slate-300 max-w-[220px]">
                      {band.dominantRiskDrivers}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onSelectHorizon(band.typicalYears)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-md transition-colors"
                        title="Simulate this horizon in Forecaster"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Callout on Long-Run Uncertainty */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Epistemic Uncertainty and Compounding Reality (Specification Section 5.4)</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Standard financial software routinely generates misleading 100-year compound projections by multiplying constant mean returns.
          In reality, historical sample sizes collapse beyond 50–80 years. Over multi-century scales, parameter uncertainty (whether true long-run real return is 5.0% or 6.5%) dominates all other variables, shifting terminal wealth by factors of 10x to 100x. The explicit uncertainty framework surfaces this widening cone of outcomes directly.
        </p>
      </div>
    </div>
  );
};
