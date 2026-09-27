import React from 'react';
import { BookOpen, ShieldAlert, Cpu, AlertTriangle, BarChart3, CheckCircle2 } from 'lucide-react';

export const MethodologyTab: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span>Analytical Design & Explicit Uncertainty Methodology</span>
        </h2>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          Full System Specification v1.0 Architectural Reference:
          The system intentionally never presents a single point forecast as a prediction; every output is accompanied by probability distributions, percentile bands, sensitivity matrices, and transparent statements of residual uncertainty.
        </p>
      </div>

      {/* The 4 Layers of Uncertainty (Section 5) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>The Four Layers of Uncertainty (Specification Section 5)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Layer 1: Parameter Uncertainty */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-mono text-[11px]">
                1
              </span>
              <span>5.1 Parameter Uncertainty</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Expected return and volatility are themselves historical estimates subject to standard errors.
              Over 50–100 year horizons, a difference of just 1.0% to 1.5% in geometric return produces an order-of-magnitude difference in terminal wealth. The UI provides one-click 2D sensitivity matrices re-evaluating the full simulation under alternative parameters (4%, 5%, 6.5%, 7.5% real return × 15%, 19%, 22% volatility).
            </p>
          </div>

          {/* Layer 2: Model Risk */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center font-mono text-[11px]">
                2
              </span>
              <span>5.2 Model Risk & Innovations</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Standard log-normal (geometric Brownian motion) assumes constant Gaussian distributions without fat tails or sudden crashes.
              To address this, our engine supports Student-t innovations (df=5) and Poisson jump-diffusion processes with rare severe crash shocks (e.g. -25% drops with 3% annual probability). Comparing the 5th–95th percentile spread quantifies model risk.
            </p>
          </div>

          {/* Layer 3: Secondary Economic Factors */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center font-mono text-[11px]">
                3
              </span>
              <span>5.3 Secondary Economic Factors</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Real markets are influenced by cyclical starting valuations (high Shiller CAPE historically lowers subsequent 10-year real returns by ~1% p.a.), persistent inflation regimes that destroy purchasing power, sequence-of-returns risk during cash extractions, and structural breaks in geopolitical or productivity trends.
            </p>
          </div>

          {/* Layer 4: Sampling & Horizon Limitations */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-500/40 flex items-center justify-center font-mono text-[11px]">
                4
              </span>
              <span>5.4 Sampling & Epistemic Collapse Beyond 80 Years</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              In 200 years of recorded equity history, there are fewer than three non-overlapping 80-year periods.
              Consequently, statistical confidence intervals break down for multi-generational and multi-century horizons. The application explicitly flags all 80+ year horizons as “exploratory / educational” and widens confidence bands to reflect epistemic uncertainty.
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Formulations & Definitions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>Core Analytical Formulations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono">
            <span className="text-cyan-400 font-bold block mb-1">Geometric vs. Arithmetic Return</span>
            <div className="text-slate-300 text-[11px] leading-relaxed">
              μ<sub>a</sub> ≈ μ<sub>g</sub> + ½ σ²
            </div>
            <p className="text-[11px] font-sans text-slate-400 mt-2">
              For US Equities with μ<sub>g</sub> = 6.5% and σ = 19%, the arithmetic annual mean is approximately 8.3%.
              Our Monte Carlo simulation precisely calibrates drift such that median compounding reproduces geometric return μ<sub>g</sub> without volatility drag distortion.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono">
            <span className="text-amber-400 font-bold block mb-1">Withdrawal Opportunity Cost Metrics</span>
            <div className="text-slate-300 text-[11px] leading-relaxed">
              Lost Gains = max(0, W<sub>without</sub> - (W<sub>with</sub> + Σ Cash))
              <br />
              Avoided Losses = max(0, (W<sub>with</sub> + Σ Cash) - W<sub>without</sub>)
            </div>
            <p className="text-[11px] font-sans text-slate-400 mt-2">
              Provides symmetric evaluation of profit-taking: rewards downside protection during bear markets while penalizing sacrificed compounding during bull runs.
            </p>
          </div>
        </div>
      </div>

      {/* Required Regulatory Disclaimers (Section 11) */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h3 className="font-bold text-sm text-slate-100">
            Section 11 Mandatory Analytical Disclaimers
          </h3>
        </div>
        <ul className="space-y-2 text-slate-300 leading-relaxed list-disc list-inside">
          <li>
            <strong>Past performance is not a guarantee of future results.</strong> The model is a mathematical illustration under stated parametric assumptions, not an empirical prediction.
          </li>
          <li>
            <strong>Conditional Probability:</strong> All probabilities and percentile bands are conditional on the chosen expected return, volatility and distributional form. Changing inputs shifts outputs, particularly at long horizons.
          </li>
          <li>
            <strong>Sparse Sample Horizon:</strong> Beyond 50–80 years, the historical sample becomes too sparse to support high-confidence statistical inference; multi-century results are exploratory.
          </li>
          <li>
            <strong>Exogenous Factors:</strong> Valuation, geopolitical shocks, inflation regime shifts, technological disruption, and policy changes can produce outcomes outside even wide simulated bands.
          </li>
          <li>
            <strong>No Licensed Advice:</strong> The application does not constitute financial, investment, tax, or legal advice. Users must consult licensed professionals before making capital allocation decisions.
          </li>
        </ul>
      </div>
    </div>
  );
};
