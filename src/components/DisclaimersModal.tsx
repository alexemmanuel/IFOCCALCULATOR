import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface DisclaimersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimersModal: React.FC<DisclaimersModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-bold text-slate-100">
              Limitations & Required Analytical Disclaimers
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <p className="font-medium text-slate-200">
            Per System Specification Section 11, every numerical output, chart, and export is governed by the following mathematical and regulatory boundaries:
          </p>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="font-mono text-cyan-400 text-xs shrink-0 font-bold">1.</span>
              <p>
                <strong className="text-slate-100">Mathematical Illustration, Not a Prediction:</strong> Past performance is not a guarantee of future returns. Every output is a synthetic illustration derived from user-specified parametric assumptions and distributional geometries.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-mono text-cyan-400 text-xs shrink-0 font-bold">2.</span>
              <p>
                <strong className="text-slate-100">Input Sensitivity at Multi-Decade Horizons:</strong> All probabilities and percentile bands are strictly conditional on the chosen expected geometric return, annual volatility, and innovation model. Altering inputs by even 100 basis points produces order-of-magnitude divergences at 50–200 year horizons.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-mono text-cyan-400 text-xs shrink-0 font-bold">3.</span>
              <p>
                <strong className="text-slate-100">Epistemic Limitations Beyond 50–80 Years:</strong> Empirical capital markets have fewer than 2 to 3 non-overlapping 80-year blocks in modern history. Projections beyond 80 years are exploratory illustrations of compounding mathematics, and confidence intervals are widened accordingly.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-mono text-cyan-400 text-xs shrink-0 font-bold">4.</span>
              <p>
                <strong className="text-slate-100">Secondary Economic Factors & Structural Breaks:</strong> Starting valuations (CAPE drag), prolonged stagflationary regimes, geopolitical fractures, systemic technological disruptions, and tax/regulatory changes can produce outcomes entirely outside simulated bands.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-mono text-cyan-400 text-xs shrink-0 font-bold">5.</span>
              <p>
                <strong className="text-slate-100">Not Licensed Financial Advice:</strong> This application serves strictly educational and analytical decision-support purposes. It does not constitute investment advice, legal counsel, or individualized tax optimization. Consult licensed fiduciaries before taking financial actions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I Understand & Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
