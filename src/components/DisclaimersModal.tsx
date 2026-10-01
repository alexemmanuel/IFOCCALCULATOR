import React, { useEffect } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface DisclaimersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimersModal: React.FC<DisclaimersModalProps> = ({ isOpen, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimers-modal-title"
    >
      <div
        className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[88vh] my-auto transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2.5 text-amber-400 dark:text-amber-400 light:text-amber-600">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 dark:text-amber-400 light:text-amber-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h2
                id="disclaimers-modal-title"
                className="text-base sm:text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900"
              >
                Limitations & Required Analytical Disclaimers
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                System Specification Section 11 Compliance
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 dark:hover:text-slate-100 light:hover:text-slate-900 p-1.5 rounded-lg transition-colors hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 cursor-pointer"
            aria-label="Close Disclaimers Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
          <p className="font-medium text-slate-200 dark:text-slate-200 light:text-slate-800">
            Per System Specification Section 11, every numerical output, chart, and export is governed by the following mathematical and regulatory boundaries:
          </p>

          <div className="bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-50 p-4 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-700 text-xs shrink-0 font-bold bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-100 px-1.5 py-0.5 rounded">1.</span>
              <p>
                <strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Mathematical Illustration, Not a Prediction:</strong> Past performance is not a guarantee of future returns. Every output is a synthetic illustration derived from user-specified parametric assumptions and distributional geometries.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-700 text-xs shrink-0 font-bold bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-100 px-1.5 py-0.5 rounded">2.</span>
              <p>
                <strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Input Sensitivity at Multi-Decade Horizons:</strong> All probabilities and percentile bands are strictly conditional on the chosen expected geometric return, annual volatility, and innovation model. Altering inputs by even 100 basis points produces order-of-magnitude divergences at 50–200 year horizons.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-700 text-xs shrink-0 font-bold bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-100 px-1.5 py-0.5 rounded">3.</span>
              <p>
                <strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Epistemic Limitations Beyond 50–80 Years:</strong> Empirical capital markets have fewer than 2 to 3 non-overlapping 80-year blocks in modern history. Projections beyond 80 years are exploratory illustrations of compounding mathematics, and confidence intervals are widened accordingly.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-700 text-xs shrink-0 font-bold bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-100 px-1.5 py-0.5 rounded">4.</span>
              <p>
                <strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Secondary Economic Factors & Structural Breaks:</strong> Starting valuations (CAPE drag), prolonged stagflationary regimes, geopolitical fractures, systemic technological disruptions, and tax/regulatory changes can produce outcomes entirely outside simulated bands.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-700 text-xs shrink-0 font-bold bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-100 px-1.5 py-0.5 rounded">5.</span>
              <p>
                <strong className="text-slate-100 dark:text-slate-100 light:text-slate-900">Not Licensed Financial Advice:</strong> This application serves strictly educational and analytical decision-support purposes. It does not constitute investment advice, legal counsel, or individualized tax optimization. Consult licensed fiduciaries before taking financial actions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3.5 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
            Press Esc or tap outside to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I Understand & Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
