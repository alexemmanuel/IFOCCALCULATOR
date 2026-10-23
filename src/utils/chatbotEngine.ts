/**
 * Institutional AI Financial Assistant & Quant Simulation Engine
 * Implements:
 * 1. Multi-path Decision Tree State Machine
 * 2. High-Precision Regex & Triggered Intent Matcher
 * 3. On-Demand Simulation Calculation Engine (Forecaster, Withdrawal, or Both up to 200 Years)
 * 4. Comprehensive Financial Methodology Knowledge Base
 * 5. Robust Fallback with optional Gemini API integration
 */

import {
  SimulationParameters,
  SimulationResult,
  AnalyzedCompany,
  CurrencyCode,
  AssetClassId,
  CashFlowEvent
} from '../types';
import {
  ChatMessage,
  DecisionTreeNode,
  BotActionPayload,
  BotSimulationSummary,
  QuickActionChip
} from '../types/chatbot';
import {
  TOP_INVESTMENTS,
  TopInvestment
} from '../data/topInvestments';
import {
  ASSET_CLASS_PRESETS,
  CURRENCY_CONFIGS,
  HISTORICAL_ANNUAL_RETURNS
} from '../data/historicalData';
import {
  runMonteCarloSimulation,
  calculateWithdrawalImpact,
  extractReturnsFromSimPath,
  formatCurrency,
  formatPercent,
  formatMultiplier,
  cleanRoundCurrency
} from './financialEngine';

export const formatMoney = (val: number, curr: CurrencyCode = 'USD'): string => formatCurrency(val, 0, curr);

// ==========================================
// 1. QUICK ACTION CHIPS FOR ONE-CLICK ENGAGEMENT
// ==========================================
export const DEFAULT_QUICK_ACTIONS: QuickActionChip[] = [
  {
    id: 'guide_tree',
    label: '🎯 Investment Decision Tree',
    promptText: 'Start investment decision tree',
    category: 'decision_tree'
  },
  {
    id: 'sim_both_50y',
    label: '⚖️ Simulate Both (50Y S&P 500)',
    promptText: 'Simulate both forecaster and withdrawal for S&P 500 for 50 years with $100,000',
    category: 'simulation'
  },
  {
    id: 'sim_dangote',
    label: '🌍 Simulate Dangote Cement (25Y)',
    promptText: 'Simulate Dangote Cement for 25 years with $100,000',
    category: 'simulation'
  },
  {
    id: 'swr_tree',
    label: '🛡️ Safe Withdrawal Stress-Test',
    promptText: 'Start retirement withdrawal decision tree',
    category: 'withdrawal'
  },
  {
    id: 'sim_apple_100y',
    label: '🍎 100-Year Apple Dynasty',
    promptText: 'Simulate Apple for 100 years with $250,000',
    category: 'simulation'
  },
  {
    id: 'stress_1929',
    label: '⚡ Test 1929 Great Crash',
    promptText: 'Stress test 1929 crash resilience',
    category: 'stress'
  },
  {
    id: 'century_horizon',
    label: '🏛️ 200-Year Century Horizon',
    promptText: 'How does the 200 year horizon model epistemic uncertainty?',
    category: 'info'
  }
];

// ==========================================
// 2. INTERACTIVE DECISION TREE STATE REPOSITORY
// ==========================================
export const DECISION_TREES: Record<string, DecisionTreeNode> = {
  // Tree 1: Investment Strategy Allocator
  'allocator_root': {
    id: 'allocator_root',
    treeId: 'allocator',
    title: '🎯 Investment Allocator: Horizon Selection',
    prompt: 'What is your primary investment time horizon? The app supports horizons from 1 to 200 years (including multi-century dynastic modeling).',
    notes: 'Longer horizons shift the dominant risk driver from sequence volatility to inflation, regime erosion, and epistemic drift.',
    options: [
      {
        label: 'Short (1 – 5 Years)',
        description: 'Capital preservation & liquidity priority. Sequence risk dominates.',
        nextNodeId: 'allocator_short'
      },
      {
        label: 'Medium (6 – 15 Years)',
        description: 'Wealth accumulation with business-cycle recovery buffer.',
        nextNodeId: 'allocator_risk_mid'
      },
      {
        label: 'Long (16 – 35 Years)',
        description: 'Classic retirement & compounding horizon. Real returns dominate.',
        nextNodeId: 'allocator_risk_long'
      },
      {
        label: 'Multi-Generational (36 – 75 Years)',
        description: 'Intergenerational wealth transfer. Volatility drag compounding.',
        nextNodeId: 'allocator_generational'
      },
      {
        label: 'Dynastic Century (76 – 200 Years)',
        description: 'Sovereign endowments & dynasty trusts. Epistemic widening applied.',
        nextNodeId: 'allocator_century'
      }
    ]
  },

  'allocator_short': {
    id: 'allocator_short',
    treeId: 'allocator',
    parentNodeId: 'allocator_root',
    title: '🎯 Short Horizon (1–5 Years): Capital Preservation',
    prompt: 'Over 1–5 years, equity drawdowns cannot reliably recover before liquidity is required. What is your risk appetite?',
    options: [
      {
        label: 'Zero Drawdown Risk (Treasury Bills / Cash Equivalents)',
        description: '1.5% real return, 2.5% volatility. Guaranteed capital preservation.',
        actionPayload: {
          type: 'SIMULATE_FORECAST',
          title: 'Simulate US Treasury Bills (5Y)',
          description: 'Loaded US Treasury Bills baseline with 5-year capital preservation horizon.',
          targetTab: 'forecast',
          params: {
            expectedRealReturn: 0.015,
            annualVolatility: 0.025,
            horizonYears: 5,
            modelType: 'lognormal'
          },
          company: {
            name: 'US Treasury Bills (Cash Equivalent)',
            ticker: 'BIL',
            type: 'benchmark',
            sector: 'Short-term Sovereign Debt',
            region: 'North America',
            tier: 'Developed',
            fiveYearCagr: 0.015,
            annualVolatility: 0.025
          }
        }
      },
      {
        label: 'Conservative Balanced (60/40 Equities & Bonds)',
        description: '4.5% real return, 10.5% volatility. Moderate growth with bond buffer.',
        actionPayload: {
          type: 'SIMULATE_FORECAST',
          title: 'Simulate Balanced 60/40 Portfolio (5Y)',
          description: 'Loaded Balanced 60/40 Portfolio with 5-year horizon.',
          targetTab: 'forecast',
          params: {
            expectedRealReturn: 0.045,
            annualVolatility: 0.105,
            horizonYears: 5,
            modelType: 'lognormal'
          },
          company: {
            name: 'Balanced 60/40 Portfolio',
            ticker: 'AOR',
            type: 'benchmark',
            sector: 'Global Multi-Asset Allocation',
            region: 'Global',
            tier: 'Developed',
            fiveYearCagr: 0.045,
            annualVolatility: 0.105
          }
        }
      }
    ]
  },

  'allocator_risk_mid': {
    id: 'allocator_risk_mid',
    treeId: 'allocator',
    parentNodeId: 'allocator_root',
    title: '🎯 Medium Horizon (6–15 Years): Asset Strategy',
    prompt: 'Over 6–15 years, market cycles have time to mean-revert. Which investment philosophy aligns with your goals?',
    options: [
      {
        label: 'Global Equities Benchmark (S&P 500 / All-World)',
        description: '6.5% real return, 19% volatility. Maximum compounding over full cycles.',
        actionPayload: {
          type: 'SIMULATE_FORECAST',
          title: 'Simulate S&P 500 US Equities (15Y)',
          description: 'Loaded S&P 500 benchmark for 15-year horizon.',
          targetTab: 'forecast',
          params: {
            expectedRealReturn: 0.065,
            annualVolatility: 0.19,
            horizonYears: 15,
            modelType: 'lognormal'
          },
          company: {
            name: 'S&P 500 Index (US Equities Baseline)',
            ticker: 'SPY',
            type: 'benchmark',
            sector: 'US Large Cap Equities Benchmark',
            country: 'United States',
            region: 'North America',
            tier: 'Developed',
            fiveYearCagr: 0.065,
            annualVolatility: 0.19
          }
        }
      },
      {
        label: 'African Champion Megacap (Dangote Cement / Naspers)',
        description: 'High real dividend yield & frontier expansion. Widened confidence bands applied.',
        actionPayload: {
          type: 'SIMULATE_FORECAST',
          title: 'Simulate Dangote Cement (15Y)',
          description: 'Loaded Dangote Cement Plc with Tier B epistemic confidence bands.',
          targetTab: 'forecast',
          params: {
            expectedRealReturn: 0.138,
            annualVolatility: 0.315,
            horizonYears: 15,
            widenedConfidenceBand: true,
            modelType: 'student_t'
          },
          company: {
            name: 'Dangote Cement Plc',
            ticker: 'DANGCEM',
            type: 'company',
            sector: 'Industrial Building Materials & Infrastructure',
            country: 'Nigeria',
            region: 'Africa',
            tier: 'Tier B',
            fiveYearCagr: 0.138,
            annualVolatility: 0.315
          }
        }
      }
    ]
  },

  'allocator_risk_long': {
    id: 'allocator_risk_long',
    treeId: 'allocator',
    parentNodeId: 'allocator_root',
    title: '🎯 Long Horizon (16–35 Years): Wealth Creation',
    prompt: 'Over 16–35 years, equities historically demonstrate a >95% probability of outpacing inflation and cash. How would you like to model this?',
    options: [
      {
        label: 'Forecaster Only: Pure Compounding Trajectory (30Y)',
        description: 'Evaluate median terminal wealth and 5th-95th percentile ranges.',
        actionPayload: {
          type: 'SIMULATE_FORECAST',
          title: 'Simulate S&P 500 (30Y Forecaster)',
          description: 'Running 30-year Monte Carlo simulation with 5,000 statistical paths.',
          targetTab: 'forecast',
          params: {
            expectedRealReturn: 0.065,
            annualVolatility: 0.19,
            horizonYears: 30,
            modelType: 'lognormal'
          }
        }
      },
      {
        label: 'Simulate BOTH Calculators (Forecaster + 4% Safe Withdrawal)',
        description: 'Simulate both 30Y wealth accumulation and retirement drawdown opportunity cost concurrently.',
        actionPayload: {
          type: 'SIMULATE_BOTH',
          title: 'Simulate Both Forecaster & Withdrawal (30Y)',
          description: 'Executing dual simulation across Monte Carlo Forecaster and Safe Withdrawal Engine.',
          targetTab: 'forecast',
          params: {
            expectedRealReturn: 0.065,
            annualVolatility: 0.19,
            horizonYears: 30
          },
          withdrawalRate: 0.04
        }
      }
    ]
  },

  'allocator_generational': {
    id: 'allocator_generational',
    treeId: 'allocator',
    parentNodeId: 'allocator_root',
    title: '🎯 Multi-Generational Horizon (36–75 Years)',
    prompt: 'Horizons exceeding 35 years cross family generations. Over 50 years, $100k at 6.5% real yields over $2.3M in purchasing power. Would you like to run a 50-year dual simulation?',
    options: [
      {
        label: 'Run 50-Year Dual Simulation (S&P 500 Baseline)',
        description: 'Evaluates 50Y terminal distribution and 3.5% generational endowment spending.',
        actionPayload: {
          type: 'SIMULATE_BOTH',
          title: 'Simulate Both Forecaster & Withdrawal (50Y)',
          description: 'Executing 50-year intergenerational simulation across both calculators.',
          targetTab: 'forecast',
          params: {
            expectedRealReturn: 0.065,
            annualVolatility: 0.19,
            horizonYears: 50
          },
          withdrawalRate: 0.035
        }
      },
      {
        label: 'Explore Multi-Horizon Comparison Tab',
        description: 'View the comparative matrix across 3Y, 5Y, 10Y, 20Y, 30Y, 50Y, 100Y, and 200Y.',
        actionPayload: {
          type: 'SWITCH_TAB',
          title: 'Open Multi-Horizon Comparison',
          description: 'Switching to Multi-Horizon Tab to inspect century horizon bands.',
          targetTab: 'horizons'
        }
      }
    ]
  },

  'allocator_century': {
    id: 'allocator_century',
    treeId: 'allocator',
    parentNodeId: 'allocator_root',
    title: '🏛️ Dynastic Century Horizon (76–200 Years)',
    prompt: 'At horizons up to 200 years, standard geometric Brownian motion understates epistemic drift. The app automatically activates epistemic volatility widening and regime uncertainty. How long should we simulate?',
    options: [
      {
        label: 'Simulate 100-Year Dynastic Horizon',
        description: 'Simulates 100 years of real compounding with epistemic confidence widening.',
        actionPayload: {
          type: 'SIMULATE_BOTH',
          title: 'Simulate 100-Year Dynastic Horizon',
          description: 'Running 100-year dual simulation with epistemic uncertainty adjustment.',
          targetTab: 'forecast',
          params: {
            expectedRealReturn: 0.065,
            annualVolatility: 0.19,
            horizonYears: 100,
            widenedConfidenceBand: true
          },
          withdrawalRate: 0.03
        }
      },
      {
        label: 'Simulate Full 200-Year Bi-Centennial Horizon',
        description: 'The maximum 200-year theoretical boundary of the IFOC system.',
        actionPayload: {
          type: 'SIMULATE_BOTH',
          title: 'Simulate 200-Year Bi-Centennial Horizon',
          description: 'Simulating 200 years of compounding and endowment withdrawals.',
          targetTab: 'forecast',
          params: {
            expectedRealReturn: 0.065,
            annualVolatility: 0.19,
            horizonYears: 200,
            widenedConfidenceBand: true
          },
          withdrawalRate: 0.025
        }
      }
    ]
  },

  // Tree 2: Retirement & Safe Withdrawal Analyzer
  'retirement_root': {
    id: 'retirement_root',
    treeId: 'retirement',
    title: '🛡️ Safe Withdrawal & Sequence Risk Analyzer',
    prompt: 'Let us test your retirement or cash-out strategy against 125+ years of historical market sequences. What initial capital are you testing?',
    options: [
      {
        label: '$250,000 (Emerging Nest Egg)',
        description: 'Test withdrawal feasibility on a starter retirement portfolio.',
        nextNodeId: 'retirement_swr_250k'
      },
      {
        label: '$1,000,000 (Standard Million-Dollar Nest Egg)',
        description: 'Benchmark portfolio for the classic Bengen 4% Trinity rule.',
        nextNodeId: 'retirement_swr_1m'
      },
      {
        label: '$5,000,000+ (High-Net-Worth / Family Office)',
        description: 'Multi-generational dynasty endowment testing.',
        nextNodeId: 'retirement_swr_5m'
      }
    ]
  },

  'retirement_swr_1m': {
    id: 'retirement_swr_1m',
    treeId: 'retirement',
    parentNodeId: 'retirement_root',
    title: '🛡️ $1,000,000 Portfolio: Choose Withdrawal Rate',
    prompt: 'What initial annual withdrawal rate would you like to evaluate?',
    options: [
      {
        label: '3.0% ($30,000/yr) — Ultra-Safe Perpetual',
        description: 'Historically near 100% survival across all 30–60 year rolling periods.',
        actionPayload: {
          type: 'SIMULATE_WITHDRAWAL',
          title: 'Test 3% Safe Withdrawal on $1,000,000',
          description: 'Configuring 3.0% perpetual withdrawal rate in the Withdrawal Calculator.',
          targetTab: 'withdrawal',
          params: { initialCapital: 1000000, horizonYears: 30 },
          withdrawalRate: 0.03
        }
      },
      {
        label: '4.0% ($40,000/yr) — Classic Trinity Study Rule',
        description: 'Standard 30-year retirement benchmark. Vulnerable to early sequence risk.',
        actionPayload: {
          type: 'SIMULATE_WITHDRAWAL',
          title: 'Test 4% Trinity Rule on $1,000,000',
          description: 'Evaluating 4.0% Bengen safe withdrawal rule with full opportunity cost analysis.',
          targetTab: 'withdrawal',
          params: { initialCapital: 1000000, horizonYears: 30 },
          withdrawalRate: 0.04
        }
      },
      {
        label: '5.5% ($55,000/yr) — Aggressive Drawdown',
        description: 'High risk of portfolio ruin if a major market crash occurs in first 5 years.',
        actionPayload: {
          type: 'SIMULATE_WITHDRAWAL',
          title: 'Test 5.5% Aggressive Drawdown on $1,000,000',
          description: 'Testing high-rate stress scenario in the Withdrawal Calculator.',
          targetTab: 'withdrawal',
          params: { initialCapital: 1000000, horizonYears: 30 },
          withdrawalRate: 0.055
        }
      }
    ]
  },

  'retirement_swr_250k': {
    id: 'retirement_swr_250k',
    treeId: 'retirement',
    parentNodeId: 'retirement_root',
    title: '🛡️ $250,000 Portfolio: Choose Withdrawal Rate',
    prompt: 'Select your withdrawal scenario for $250,000:',
    options: [
      {
        label: '4.0% ($10,000/year) — Balanced Rule',
        description: 'Classic Trinity study benchmark.',
        actionPayload: {
          type: 'SIMULATE_WITHDRAWAL',
          title: 'Test 4% Withdrawal on $250,000',
          description: 'Configuring $250k starting capital with 4% withdrawal rate.',
          targetTab: 'withdrawal',
          params: { initialCapital: 250000, horizonYears: 30 },
          withdrawalRate: 0.04
        }
      },
      {
        label: '5.0% ($12,500/year) — Higher Income',
        description: 'Requires higher equity growth to avoid depletion.',
        actionPayload: {
          type: 'SIMULATE_WITHDRAWAL',
          title: 'Test 5% Withdrawal on $250,000',
          description: 'Testing 5% withdrawal rate on $250k.',
          targetTab: 'withdrawal',
          params: { initialCapital: 250000, horizonYears: 30 },
          withdrawalRate: 0.05
        }
      }
    ]
  },

  'retirement_swr_5m': {
    id: 'retirement_swr_5m',
    treeId: 'retirement',
    parentNodeId: 'retirement_root',
    title: '🛡️ $5,000,000 Endowment: Choose Withdrawal Rate',
    prompt: 'Select your endowment spending policy:',
    options: [
      {
        label: '3.0% ($150,000/yr) — Perpetual Endowment Rule',
        description: 'Allows portfolio to compound across 50–100 years while funding operations.',
        actionPayload: {
          type: 'SIMULATE_BOTH',
          title: 'Simulate 3% Endowment Drawdown on $5M',
          description: 'Running dual 50-year endowment simulation on both Forecaster and Withdrawal.',
          targetTab: 'withdrawal',
          params: { initialCapital: 5000000, horizonYears: 50 },
          withdrawalRate: 0.03
        }
      },
      {
        label: '4.0% ($200,000/yr) — Standard Spending Policy',
        description: 'High distribution while preserving principal over 40+ years.',
        actionPayload: {
          type: 'SIMULATE_BOTH',
          title: 'Simulate 4% Spending Policy on $5M',
          description: 'Running dual 40-year simulation on $5,000,000 portfolio.',
          targetTab: 'withdrawal',
          params: { initialCapital: 5000000, horizonYears: 40 },
          withdrawalRate: 0.04
        }
      }
    ]
  },

  // Tree 3: Historical Crisis & Stress Testing
  'crisis_root': {
    id: 'crisis_root',
    treeId: 'crisis',
    title: '⚡ Historical Crisis Stress Testing',
    prompt: 'Which historic market crisis would you like to stress-test your portfolio against?',
    options: [
      {
        label: '1929 Great Crash (-86% peak-to-trough, 25yr real recovery)',
        description: 'The most severe sequence-of-returns shock in recorded modern history.',
        actionPayload: {
          type: 'TOGGLE_STRESS_TEST',
          title: 'Apply 1929 Great Crash Stress Overlay',
          description: 'Applying 1st-percentile catastrophic drawdown shift (-37% annual shock for early years).',
          targetTab: 'forecast',
          enableStressTest: true,
          params: {
            enableStressTest: true,
            stressTestYears: 3,
            stressTestBaselineShift: -0.370
          }
        }
      },
      {
        label: '2008 Great Financial Crisis (-57% drawdown, credit freeze)',
        description: 'Subprime mortgage systemic collapse and global banking crisis.',
        actionPayload: {
          type: 'TOGGLE_STRESS_TEST',
          title: 'Apply 2008 GFC Stress Overlay',
          description: 'Simulating severe market drawdown with fat-tailed Student-t volatility.',
          targetTab: 'forecast',
          enableStressTest: true,
          params: {
            enableStressTest: true,
            modelType: 'student_t',
            tDegreesOfFreedom: 4,
            stressTestYears: 2,
            stressTestBaselineShift: -0.365
          }
        }
      },
      {
        label: '1970s Stagflation & Oil Shocks (High inflation erosion)',
        description: 'Equities lost -43% in real purchasing power due to 12%+ CPI inflation.',
        actionPayload: {
          type: 'SIMULATE_FORECAST',
          title: 'Simulate 1970s Stagflation Regime',
          description: 'Setting 7.5% nominal inflation with valuation drag.',
          targetTab: 'forecast',
          params: {
            inflationRate: 0.075,
            valuationDragPct: -0.015,
            valuationDragYears: 10
          }
        }
      }
    ]
  }
};

// ==========================================
// 3. FINANCIAL KNOWLEDGE BASE ENTRIES
// ==========================================
interface KnowledgeItem {
  id: string;
  keywords: string[];
  title: string;
  answer: string;
  actionPayload?: BotActionPayload;
}

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'swr_explanation',
    keywords: ['swr', 'safe withdrawal', 'bengen', 'trinity', '4 percent', '4%', 'sequence of returns', 'sequence risk'],
    title: '🛡️ Safe Withdrawal Rate & Sequence Risk Explained',
    answer: `**The Safe Withdrawal Rate (SWR)** originates from William Bengen (1994) and the Trinity Study (1998). It measures the percentage of starting portfolio capital you can withdraw annually (adjusted for inflation) without running out of money across a retirement horizon.\n\n` +
      `• **The 4% Rule:** Historically survived 95%+ of rolling 30-year periods in US 50/50 and 60/40 portfolios.\n` +
      `• **Sequence of Returns Risk (SRR):** Experiencing severe market drawdowns (like 1929, 1973, or 2008) in the first 3–5 years of retirement forces you to sell assets at a loss, permanently crippling the portfolio's compounding base even if the market recovers later.\n` +
      `• **Horizons > 30 Years:** For 40 to 100-year horizons (FIRE or dynastic endowments), academic literature recommends reducing the withdrawal rate to **3.0% – 3.3%** to ensure perpetual longevity.`,
    actionPayload: {
      type: 'SWITCH_TAB',
      title: 'Inspect Safe Withdrawal Calculator',
      description: 'Switching to Withdrawal Tab to test live withdrawal scenarios.',
      targetTab: 'withdrawal'
    }
  },
  {
    id: 'century_horizon_explanation',
    keywords: ['200 year', '200 years', 'century', 'epistemic', 'widening', 'horizons', 'multi-century', 'dynasty'],
    title: '🏛️ Modeling Compounding up to 200 Years',
    answer: `**The 200-Year Horizon Architecture:**\n\n` +
      `Most financial tools limit forecasts to 30 or 40 years. The IFOC system supports continuous horizons from **1 to 200 years**.\n\n` +
      `• **Why 200 Years?** It models multi-generational family trusts, sovereign wealth funds, and university endowments.\n` +
      `• **Epistemic Volatility Widening:** Over 50–200 years, assuming a fixed constant return is mathematically flawed. Structural shifts, wars, technological leaps, and currency revaluations create epistemic drift. The app widens the confidence band by $0.007 \\times \\sqrt{(t - 70)/30}$ for $t \\ge 80$, ensuring realistic tail risks.\n` +
      `• **Compounding Power:** $100,000 invested at 6.5% real return for 100 years compounds to **$53.9 Million** in today's purchasing power!`,
    actionPayload: {
      type: 'SWITCH_TAB',
      title: 'View Multi-Horizon Matrix',
      description: 'Navigating to Multi-Horizon Tab to inspect century bands.',
      targetTab: 'horizons'
    }
  },
  {
    id: 'opportunity_cost_explanation',
    keywords: ['opportunity cost', 'lost gains', 'avoided losses', 'counterfactual', 'withdrawn money'],
    title: '📈 Opportunity Cost & Counterfactual Capital Analysis',
    answer: `**Opportunity Cost** in the IFOC system is computed via a rigorous **counterfactual baseline**:\n\n` +
      `$$\\Delta = \\text{Portfolio}_{\\text{stayed invested}} - (\\text{Portfolio}_{\\text{with withdrawals}} + \\text{Total Cash Extracted})$$\n\n` +
      `• **Lost Gains:** If the market rallies after capital is withdrawn, every dollar removed missed out on compounding growth.\n` +
      `• **Avoided Losses:** If capital was withdrawn right before a crash (e.g. October 1929 or October 2007), the extracted cash was spared the collapse, generating an avoided-loss surplus.\n` +
      `• **Opportunity Cost Multiple:** Demonstrates how many times larger your withdrawn capital would have become had it remained invested.`,
    actionPayload: {
      type: 'SWITCH_TAB',
      title: 'Open Opportunity Cost Calculator',
      description: 'View the live opportunity cost trajectory and lost gains waterfall.',
      targetTab: 'withdrawal'
    }
  },
  {
    id: 'fat_tails_explanation',
    keywords: ['fat tails', 'student t', 'jump diffusion', 'model type', 'distribution', 'lognormal', 'black swan'],
    title: '📊 Distribution Models: Heavy Tails & Jump Diffusion',
    answer: `Real asset returns do **not** follow a pure Gaussian bell curve. They exhibit fat tails and sudden discontinuous jumps:\n\n` +
      `1. **Log-Normal (GBM):** Classic geometric Brownian motion baseline. Efficient, but underestimates 4-sigma and 5-sigma market crashes.\n` +
      `2. **Student-t (Fat Tails):** Generates heavy tails with higher kurtosis ($\nu = 5$). Catches frequent sudden downturns like 1987 Black Monday or 2020 Covid flash crash.\n` +
      `3. **Jump-Diffusion (Merton):** Superimposes Poisson crash arrivals ($P = 3\\%$/year, $\\mu_{jump} = -25\\%$) over continuous Brownian motion.\n` +
      `4. **Mean-Reversion:** Simulates valuation gravity pulling asset prices back toward long-run equilibrium.`,
    actionPayload: {
      type: 'SWITCH_TAB',
      title: 'Inspect Methodology Tab',
      description: 'Review formal stochastic differential equations and statistical proof.',
      targetTab: 'methodology'
    }
  },
  {
    id: 'african_tiers_explanation',
    keywords: ['africa', 'tier a', 'tier b', 'tier c', 'frontier', 'jse', 'nigeria', 'kenya', 'south africa', 'dangote', 'naspers', 'safaricom'],
    title: '🌍 African & Emerging Markets Classification Tiers',
    answer: `The IFOC system categorizes African and frontier markets into **4 analytical confidence tiers** based on historical data depth:\n\n` +
      `• **Tier A (South Africa - JSE):** 120+ continuous years of verified returns dating back to 1900 (Dimson-Marsh-Staunton dataset). High statistical confidence.\n` +
      `• **Tier B (Major Markets):** Nigeria (NGX), Kenya (NSE), Egypt (EGX), Morocco (CSE). 25–40 years of market data. High growth & dividend yields with widened confidence bands.\n` +
      `• **Tier C (Sub-Saharan Frontier):** Ghana, WAEMU/BRVM (Ivory Coast/Senegal), Rwanda, Tanzania. 15–25 years of data; higher liquidity premiums.\n` +
      `• **Tier D (Frontier Blend):** Pan-African diversified synthetic indices.`,
    actionPayload: {
      type: 'SWITCH_TAB',
      title: 'Browse African Champions',
      description: 'Opening Top Investments directory filtered by African and global leaders.',
      targetTab: 'investments'
    }
  },
  {
    id: 'real_vs_nominal_explanation',
    keywords: ['real return', 'nominal return', 'inflation', 'purchasing power'],
    title: '💰 Real Purchasing Power vs Nominal Numbers',
    answer: `• **Real Return:** Measures actual purchasing power growth after subtracting inflation. This is the **institutional standard** because nominal millions mean nothing if prices inflate 10x.\n` +
      `• **Nominal Return:** Computed via the Fisher Equation: $(1 + r_{nom}) = (1 + r_{real})(1 + i)$.\n` +
      `• **Toggle in App:** You can flip the **Real / Nominal** toggle in the top bar anytime to switch all charts, percentiles, and tables in real time!`,
    actionPayload: {
      type: 'SWITCH_TAB',
      title: 'Go to Forecaster',
      description: 'Switching to Forecast Tab where you can toggle Real vs Nominal display.',
      targetTab: 'forecast'
    }
  }
];

// ==========================================
// 4. FIND COMPANY OR ASSET FROM QUERY
// ==========================================
export function findMatchingCompany(query: string): TopInvestment | null {
  const q = query.toLowerCase().trim();
  
  // Exact ticker matches first
  for (const inv of TOP_INVESTMENTS) {
    if (inv.ticker && q.includes(inv.ticker.toLowerCase())) {
      return inv;
    }
  }

  // Name matches
  for (const inv of TOP_INVESTMENTS) {
    const invName = inv.name.toLowerCase();
    if (q.includes(invName)) return inv;
    
    // Partial keywords for prominent companies
    const parts = invName.split(/[\s(/,]+/);
    for (const p of parts) {
      if (p.length >= 4 && q.includes(p)) {
        return inv;
      }
    }
  }

  // Common aliases
  if (q.includes('apple') || q.includes('aapl')) return TOP_INVESTMENTS.find(i => i.ticker === 'AAPL') || null;
  if (q.includes('microsoft') || q.includes('msft')) return TOP_INVESTMENTS.find(i => i.ticker === 'MSFT') || null;
  if (q.includes('nvidia') || q.includes('nvda')) return TOP_INVESTMENTS.find(i => i.ticker === 'NVDA') || null;
  if (q.includes('amazon') || q.includes('amzn')) return TOP_INVESTMENTS.find(i => i.ticker === 'AMZN') || null;
  if (q.includes('google') || q.includes('alphabet') || q.includes('goog')) return TOP_INVESTMENTS.find(i => i.ticker === 'GOOGL') || null;
  if (q.includes('berkshire') || q.includes('buffett') || q.includes('brk')) return TOP_INVESTMENTS.find(i => i.ticker === 'BRK.B') || null;
  if (q.includes('dangote') || q.includes('cement')) return TOP_INVESTMENTS.find(i => i.ticker === 'DANGCEM') || null;
  if (q.includes('naspers') || q.includes('prosus') || q.includes('npn')) return TOP_INVESTMENTS.find(i => i.ticker === 'NPN') || null;
  if (q.includes('mtn') || q.includes('telecom')) return TOP_INVESTMENTS.find(i => i.ticker === 'MTNN') || null;
  if (q.includes('safaricom') || q.includes('mpesa')) return TOP_INVESTMENTS.find(i => i.ticker === 'SCOM') || null;
  if (q.includes('standard bank') || q.includes('stanbic')) return TOP_INVESTMENTS.find(i => i.ticker === 'SBK') || null;
  if (q.includes('sonatel')) return TOP_INVESTMENTS.find(i => i.ticker === 'SNTS') || null;
  if (q.includes('cib') || q.includes('commercial international')) return TOP_INVESTMENTS.find(i => i.ticker === 'COMI') || null;
  if (q.includes('sp500') || q.includes('s&p') || q.includes('spy')) return TOP_INVESTMENTS.find(i => i.ticker === 'SPY') || null;

  return null;
}

// ==========================================
// 5. EXTRACT PARAMETERS (HORIZON, CAPITAL, RATE)
// ==========================================
function extractHorizon(query: string, currentHorizon: number): number {
  // e.g. "for 50 years", "horizon 100", "200y", "30yr", "over 25 yrs"
  const horizonMatch = query.match(/(\d{1,3})\s*(?:years?|yrs?|y\b)/i) ||
                       query.match(/horizon\s*(?:of\s*)?(\d{1,3})/i);
  if (horizonMatch) {
    const val = parseInt(horizonMatch[1], 10);
    if (!isNaN(val) && val >= 1 && val <= 200) {
      return val;
    }
  }
  return currentHorizon;
}

function extractCapital(query: string, currentCapital: number): number {
  // e.g. "$100k", "50,000", "$1m", "250000", "5 million", "1000000"
  const cleanQ = query.toLowerCase();
  
  // Millions match (e.g. $1.5m, 2 million)
  const millionMatch = cleanQ.match(/[\$€£]?\s*(\d+(?:\.\d+)?)\s*(?:m|million|millions)\b/);
  if (millionMatch) {
    return parseFloat(millionMatch[1]) * 1000000;
  }

  // Thousands match (e.g. $50k, 250k)
  const thousandMatch = cleanQ.match(/[\$€£]?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/);
  if (thousandMatch) {
    return parseFloat(thousandMatch[1]) * 1000;
  }

  // Raw number match with commas or $ (e.g. $100,000 or 100000)
  const rawMatch = cleanQ.match(/[\$€£]?\s*(\d{1,3}(?:,\d{3})+|\d{4,9})\b/);
  if (rawMatch) {
    const parsed = parseInt(rawMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(parsed) && parsed >= 10) {
      return parsed;
    }
  }

  return currentCapital;
}

function extractWithdrawalRate(query: string, defaultRate: number = 0.04): number {
  // e.g. "at 4%", "rate 3.5%", "withdrawal 5%"
  const rateMatch = query.match(/(\d+(?:\.\d+)?)\s*%/);
  if (rateMatch) {
    const parsed = parseFloat(rateMatch[1]);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 30) {
      return parsed / 100;
    }
  }
  return defaultRate;
}

function extractCurrency(query: string): CurrencyCode | null {
  const upper = query.toUpperCase();
  const knownCodes: CurrencyCode[] = [
    'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'CAD', 'AUD', 'NGN', 'ZAR',
    'KES', 'EGP', 'GHS', 'MAD', 'INR', 'SGD', 'BRL', 'MXN', 'AED', 'SAR'
  ];
  for (const c of knownCodes) {
    const regex = new RegExp(`\\b${c}\\b`, 'i');
    if (regex.test(query)) {
      return c;
    }
  }
  // Names
  if (/dollars?/i.test(query)) return 'USD';
  if (/euros?/i.test(query)) return 'EUR';
  if (/pounds?|sterling/i.test(query)) return 'GBP';
  if (/naira/i.test(query)) return 'NGN';
  if (/rand/i.test(query)) return 'ZAR';
  if (/shillings?|kes/i.test(query)) return 'KES';
  return null;
}

// ==========================================
// 6. SIMULATION SUMMARY COMPUTATION
// ==========================================
export function computeBotSimulation(
  calculatorType: 'forecast' | 'withdrawal' | 'both',
  params: SimulationParameters,
  company: AnalyzedCompany,
  withdrawalRate: number = 0.04
): BotSimulationSummary {
  // Run Monte Carlo forecaster
  const simRes = runMonteCarloSimulation(params);

  // Run Withdrawal Calculator
  const annualRealReturns = extractReturnsFromSimPath(simRes, 'median');
  const annualWithdrawal = params.initialCapital * withdrawalRate;
  const events: CashFlowEvent[] = [];
  for (let y = 1; y <= params.horizonYears; y++) {
    events.push({
      id: `bot_swr_${y}`,
      year: y,
      type: 'withdrawal',
      amount: annualWithdrawal,
      isPercentage: false,
      label: `Annual Withdrawal (${formatPercent(withdrawalRate)})`
    });
  }

  const withRes = calculateWithdrawalImpact(
    params.initialCapital,
    params.horizonYears,
    annualRealReturns,
    events,
    params.inflationRate
  );

  return {
    calculatorType,
    companyName: company.name,
    ticker: company.ticker,
    horizonYears: params.horizonYears,
    initialCapital: params.initialCapital,
    currency: params.currency || 'USD',
    expectedReturn: params.expectedRealReturn,
    annualVolatility: params.annualVolatility,
    medianTerminalWealth: simRes.terminalWealthMedian,
    p5TerminalWealth: simRes.terminalWealthP5,
    p95TerminalWealth: simRes.terminalWealthP95,
    medianCAGR: simRes.medianCAGR,
    probGoodProfits: simRes.probGoodProfits,
    probFailure: simRes.probFailure,
    withdrawalRate,
    annualWithdrawalAmount: annualWithdrawal,
    terminalPortfolio: withRes.terminalWithWithdrawal,
    totalWithdrawn: withRes.totalWithdrawn,
    netOpportunityCost: withRes.netOpportunityCost,
    opportunityCostMultiple: withRes.opportunityCostMultiple,
    portfolioSurvival: withRes.terminalWithWithdrawal > 0
  };
}

// ==========================================
// 7. CORE QUERY DISPATCHER & INTENT PROCESSOR
// ==========================================
export interface ProcessQueryResult {
  text: string;
  actionPayload?: BotActionPayload;
  simulationSummary?: BotSimulationSummary;
  decisionTreeNode?: DecisionTreeNode;
  quickActions?: QuickActionChip[];
}

export function processChatbotQuery(
  rawQuery: string,
  currentParams: SimulationParameters,
  currentCompany: AnalyzedCompany,
  activeTab: string
): ProcessQueryResult {
  const query = rawQuery.trim();
  const lowerQ = query.toLowerCase();

  // ----------------------------------------------------
  // Intent 0: Decision Tree Navigation Commands
  // ----------------------------------------------------
  if (
    lowerQ.includes('decision tree') ||
    lowerQ.includes('guide me') ||
    lowerQ.includes('start tree') ||
    lowerQ === 'tree' ||
    lowerQ === 'help me choose'
  ) {
    const rootNode = DECISION_TREES['allocator_root'];
    return {
      text: `Welcome to the **IFOC Guided Decision Tree Engine**!\n\nI will guide you step-by-step through optimal asset selection, horizon planning, and risk management across any time horizon from **1 to 200 years**. Select your horizon to begin:`,
      decisionTreeNode: rootNode,
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  if (
    lowerQ.includes('retirement tree') ||
    lowerQ.includes('withdrawal tree') ||
    lowerQ.includes('safe withdrawal tree')
  ) {
    const rootNode = DECISION_TREES['retirement_root'];
    return {
      text: `Starting the **Safe Retirement & Withdrawal Stress-Test Tree**.\n\nLet's evaluate your retirement sustainability against 125+ years of historical market sequences. Select your starting capital:`,
      decisionTreeNode: rootNode,
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  if (
    lowerQ.includes('crisis tree') ||
    lowerQ.includes('stress test tree')
  ) {
    const rootNode = DECISION_TREES['crisis_root'];
    return {
      text: `Starting the **Historical Market Crisis Resilience Tree**.\n\nSelect a historical shock to model its drawdown and recovery time on your portfolio:`,
      decisionTreeNode: rootNode,
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  // ----------------------------------------------------
  // Intent 1: Simulate BOTH Calculators Concurrently
  // ----------------------------------------------------
  const isBothRequest =
    lowerQ.includes('simulate both') ||
    lowerQ.includes('both calculators') ||
    lowerQ.includes('both forecast and withdrawal') ||
    lowerQ.includes('dual simulate') ||
    lowerQ.includes('dual simulation');

  if (isBothRequest) {
    const matchedCompany = findMatchingCompany(query) || currentCompany;
    const horizon = extractHorizon(query, currentParams.horizonYears);
    const capital = extractCapital(query, currentParams.initialCapital);
    const rate = extractWithdrawalRate(query, 0.04);
    const targetCurrency = extractCurrency(query) || currentParams.currency || 'USD';

    const updatedParams: SimulationParameters = {
      ...currentParams,
      initialCapital: capital,
      horizonYears: horizon,
      currency: targetCurrency,
      expectedRealReturn: matchedCompany.fiveYearCagr ?? currentParams.expectedRealReturn,
      annualVolatility: matchedCompany.annualVolatility ?? currentParams.annualVolatility,
      widenedConfidenceBand: matchedCompany.tier === 'Tier B' || matchedCompany.tier === 'Tier C' || horizon >= 80
    };

    const summary = computeBotSimulation('both', updatedParams, matchedCompany, rate);

    const text = `### ⚖️ Dual Simulation Executed: ${matchedCompany.name}\n\n` +
      `I have executed **both the Monte Carlo Wealth Forecaster and the Safe Withdrawal Calculator** concurrently over a **${horizon}-year horizon** with **${formatMoney(capital, targetCurrency)} starting capital**.\n\n` +
      `**1. Wealth Forecaster Results:**\n` +
      `• **Median Terminal Wealth:** **${formatMoney(summary.medianTerminalWealth || 0, targetCurrency)}** (${((summary.medianTerminalWealth || 0) / capital).toFixed(1)}x multiple)\n` +
      `• **5th – 95th Percentile Band:** ${formatMoney(summary.p5TerminalWealth || 0, targetCurrency)} to ${formatMoney(summary.p95TerminalWealth || 0, targetCurrency)}\n` +
      `• **Median Real CAGR:** ${formatPercent(summary.medianCAGR || 0)} p.a.\n` +
      `• **Prob. Doubling Capital:** ${formatPercent(summary.probGoodProfits || 0)}\n\n` +
      `**2. Safe Withdrawal Results (${formatPercent(rate)} Annual Spending = ${formatMoney(summary.annualWithdrawalAmount || 0, targetCurrency)}/yr):**\n` +
      `• **Total Capital Withdrawn:** ${formatMoney(summary.totalWithdrawn || 0, targetCurrency)}\n` +
      `• **Remaining Portfolio Balance:** **${formatMoney(summary.terminalPortfolio || 0, targetCurrency)}** (${summary.portfolioSurvival ? '✅ Portfolio Survived' : '⚠️ Depleted'})\n` +
      `• **Net Opportunity Cost:** ${formatMoney(summary.netOpportunityCost || 0, targetCurrency)} (compounding gains lost from extracted capital)\n` +
      `• **Opportunity Cost Multiple:** ${(summary.opportunityCostMultiple || 1).toFixed(2)}x\n\n` +
      `*Click the action buttons below to apply these parameters to the live app or switch tabs.*`;

    const actionPayload: BotActionPayload = {
      type: 'SIMULATE_BOTH',
      title: `Simulate Both: ${matchedCompany.name} (${horizon}Y)`,
      description: `Loaded ${matchedCompany.name} into both Forecaster and Withdrawal calculators.`,
      targetTab: 'forecast',
      params: updatedParams,
      company: matchedCompany,
      currency: targetCurrency,
      withdrawalRate: rate,
      horizonYears: horizon,
      initialCapital: capital
    };

    return {
      text,
      simulationSummary: summary,
      actionPayload,
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  // ----------------------------------------------------
  // Intent 2: Simulate Withdrawal Calculator Specifically
  // ----------------------------------------------------
  const isWithdrawalRequest =
    lowerQ.includes('withdrawal') ||
    lowerQ.includes('swr') ||
    lowerQ.includes('safe withdrawal rate') ||
    lowerQ.includes('retire with') ||
    lowerQ.includes('drawdown');

  if (isWithdrawalRequest && (lowerQ.includes('simulate') || lowerQ.includes('test') || lowerQ.includes('calculate') || lowerQ.includes('run') || /\d/.test(query))) {
    const matchedCompany = findMatchingCompany(query) || currentCompany;
    const horizon = extractHorizon(query, currentParams.horizonYears);
    const capital = extractCapital(query, currentParams.initialCapital);
    const rate = extractWithdrawalRate(query, 0.04);
    const targetCurrency = extractCurrency(query) || currentParams.currency || 'USD';

    const updatedParams: SimulationParameters = {
      ...currentParams,
      initialCapital: capital,
      horizonYears: horizon,
      currency: targetCurrency,
      expectedRealReturn: matchedCompany.fiveYearCagr ?? currentParams.expectedRealReturn,
      annualVolatility: matchedCompany.annualVolatility ?? currentParams.annualVolatility
    };

    const summary = computeBotSimulation('withdrawal', updatedParams, matchedCompany, rate);

    const text = `### 🛡️ Safe Withdrawal Analysis: ${matchedCompany.name}\n\n` +
      `Evaluated a **${formatPercent(rate)} annual withdrawal** on **${formatMoney(capital, targetCurrency)}** over **${horizon} years**:\n\n` +
      `• **Annual Income Extracted:** ${formatMoney(summary.annualWithdrawalAmount || 0, targetCurrency)}/year\n` +
      `• **Total Capital Withdrawn:** ${formatMoney(summary.totalWithdrawn || 0, targetCurrency)}\n` +
      `• **Terminal Portfolio Balance:** **${formatMoney(summary.terminalPortfolio || 0, targetCurrency)}**\n` +
      `• **Longevity Status:** ${summary.portfolioSurvival ? '✅ Portfolio Survived with surplus principal' : '⚠️ Depleted before horizon'}\n` +
      `• **Cumulative Opportunity Cost:** ${formatMoney(summary.netOpportunityCost || 0, targetCurrency)} (growth missed by spending rather than staying invested)\n` +
      `• **Growth Multiplier Lost:** ${(summary.opportunityCostMultiple || 1).toFixed(2)}x\n\n` +
      `Click below to load this directly into the interactive Withdrawal Tab:`;

    const actionPayload: BotActionPayload = {
      type: 'SIMULATE_WITHDRAWAL',
      title: `Apply to Withdrawal Tab (${formatPercent(rate)} on ${formatMoney(capital, targetCurrency)})`,
      description: `Loaded parameters into the live Withdrawal Calculator.`,
      targetTab: 'withdrawal',
      params: updatedParams,
      company: matchedCompany,
      currency: targetCurrency,
      withdrawalRate: rate,
      horizonYears: horizon,
      initialCapital: capital
    };

    return {
      text,
      simulationSummary: summary,
      actionPayload,
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  // ----------------------------------------------------
  // Intent 3: General Simulation / Monte Carlo Forecaster
  // ----------------------------------------------------
  const isSimulationRequest =
    lowerQ.includes('simulate') ||
    lowerQ.includes('forecast') ||
    lowerQ.includes('monte carlo') ||
    lowerQ.includes('project') ||
    lowerQ.includes('calculate investment') ||
    lowerQ.includes('model');

  if (isSimulationRequest) {
    const matchedCompany = findMatchingCompany(query) || currentCompany;
    const horizon = extractHorizon(query, currentParams.horizonYears);
    const capital = extractCapital(query, currentParams.initialCapital);
    const targetCurrency = extractCurrency(query) || currentParams.currency || 'USD';

    const updatedParams: SimulationParameters = {
      ...currentParams,
      initialCapital: capital,
      horizonYears: horizon,
      currency: targetCurrency,
      expectedRealReturn: matchedCompany.fiveYearCagr ?? currentParams.expectedRealReturn,
      annualVolatility: matchedCompany.annualVolatility ?? currentParams.annualVolatility,
      widenedConfidenceBand: matchedCompany.tier === 'Tier B' || matchedCompany.tier === 'Tier C' || horizon >= 80
    };

    const summary = computeBotSimulation('forecast', updatedParams, matchedCompany);

    const text = `### 🚀 Monte Carlo Simulation: ${matchedCompany.name}\n\n` +
      `Executed 5,000 statistical paths for **${matchedCompany.name}** over a **${horizon}-year horizon** with **${formatMoney(capital, targetCurrency)} starting capital**:\n\n` +
      `• **Median Expected Terminal Wealth:** **${formatMoney(summary.medianTerminalWealth || 0, targetCurrency)}**\n` +
      `• **Compound Wealth Multiple:** **${((summary.medianTerminalWealth || 0) / capital).toFixed(2)}x** starting capital\n` +
      `• **5th Percentile (Severe Bear Regime):** ${formatMoney(summary.p5TerminalWealth || 0, targetCurrency)}\n` +
      `• **95th Percentile (Bull Boom Regime):** ${formatMoney(summary.p95TerminalWealth || 0, targetCurrency)}\n` +
      `• **Real Geometric CAGR:** ${formatPercent(summary.medianCAGR || 0)} per annum\n` +
      `• **Probability of Doubling Capital:** ${formatPercent(summary.probGoodProfits || 0)}\n` +
      `• **Capital Preservation Probability:** ${formatPercent(1 - (summary.probFailure || 0))}\n\n` +
      (horizon >= 80 ? `*Note: Epistemic volatility widening has been automatically activated for this ${horizon}-year century horizon.*\n\n` : '') +
      `You can apply these exact parameters to the live interactive charts or test withdrawals:`;

    const actionPayload: BotActionPayload = {
      type: 'SIMULATE_FORECAST',
      title: `Apply to Forecaster: ${matchedCompany.name} (${horizon}Y)`,
      description: `Loaded ${matchedCompany.name} into the live Monte Carlo Forecaster.`,
      targetTab: 'forecast',
      params: updatedParams,
      company: matchedCompany,
      currency: targetCurrency,
      horizonYears: horizon,
      initialCapital: capital
    };

    return {
      text,
      simulationSummary: summary,
      actionPayload,
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  // ----------------------------------------------------
  // Intent 4: Currency Switching Command
  // ----------------------------------------------------
  const currencyMatch = extractCurrency(query);
  if (currencyMatch && (lowerQ.includes('switch') || lowerQ.includes('change') || lowerQ.includes('convert') || lowerQ.includes('currency'))) {
    const cfg = CURRENCY_CONFIGS[currencyMatch] || CURRENCY_CONFIGS['USD'];
    const text = `Switched application currency to **${cfg.name} (${cfg.code} - ${cfg.symbol})**.\n\nAll capital inputs, percentile paths, and live charts have been dynamically converted using real-time market exchange rates.`;
    return {
      text,
      actionPayload: {
        type: 'SWITCH_CURRENCY',
        title: `Switch Currency to ${cfg.code}`,
        description: `Updating base reporting currency to ${cfg.name}.`,
        currency: currencyMatch
      },
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  // ----------------------------------------------------
  // Intent 5: Stress Test Toggle
  // ----------------------------------------------------
  if (lowerQ.includes('stress test') || lowerQ.includes('1929 crash') || lowerQ.includes('2008 crash') || lowerQ.includes('crisis')) {
    const isEnable = !lowerQ.includes('disable') && !lowerQ.includes('off') && !lowerQ.includes('remove');
    return {
      text: isEnable
        ? `### ⚡ Historical Stress-Test Overlay Activated\n\n` +
          `Applied the empirical 1st-percentile historical market drawdown shift (**-37.0% annual sequence shock**) across early years.\n\n` +
          `This rigorously stress-tests your portfolio against catastrophic sequence-of-returns shocks (such as the 1929 Great Crash or 2008 GFC).`
        : `Historical stress test overlay has been disabled. Returning to unconstrained statistical distribution.`,
      actionPayload: {
        type: 'TOGGLE_STRESS_TEST',
        title: isEnable ? 'Activate Stress-Test Overlay' : 'Deactivate Stress-Test Overlay',
        description: isEnable ? 'Enabling 1st-percentile historical drawdown shift.' : 'Disabling stress-test.',
        enableStressTest: isEnable,
        targetTab: 'forecast'
      },
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  // ----------------------------------------------------
  // Intent 6: Tab Navigation Command
  // ----------------------------------------------------
  if (lowerQ.includes('tab') || lowerQ.includes('go to') || lowerQ.includes('open tab') || lowerQ.includes('show tab')) {
    let targetTab: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology' = 'forecast';
    if (lowerQ.includes('withdrawal') || lowerQ.includes('opportunity cost')) targetTab = 'withdrawal';
    else if (lowerQ.includes('investment') || lowerQ.includes('top') || lowerQ.includes('companies')) targetTab = 'investments';
    else if (lowerQ.includes('horizon') || lowerQ.includes('multi')) targetTab = 'horizons';
    else if (lowerQ.includes('historical') || lowerQ.includes('backtest') || lowerQ.includes('crisis')) targetTab = 'historical';
    else if (lowerQ.includes('methodology') || lowerQ.includes('math') || lowerQ.includes('formula')) targetTab = 'methodology';

    return {
      text: `Navigating to the **${targetTab.toUpperCase()}** tab.`,
      actionPayload: {
        type: 'SWITCH_TAB',
        title: `Open ${targetTab.toUpperCase()} Tab`,
        description: `Switching active workspace view to ${targetTab}.`,
        targetTab
      },
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  // ----------------------------------------------------
  // Intent 7: Download / Export Command
  // ----------------------------------------------------
  if (lowerQ.includes('download') || lowerQ.includes('pdf') || lowerQ.includes('export') || lowerQ.includes('report')) {
    const isPdf = lowerQ.includes('pdf') || lowerQ.includes('report');
    return {
      text: isPdf
        ? `Preparing the **Executive Investment Forecast PDF Summary Report** carrying the analyzed company name (**${currentCompany.name}**), percentile metrics, and opportunity cost charts.`
        : `Exporting complete JSON data archive with parameters, percentiles, and analyzed asset metadata.`,
      actionPayload: {
        type: isPdf ? 'DOWNLOAD_REPORT' : 'EXPORT_JSON',
        title: isPdf ? 'Download Executive PDF Report' : 'Export JSON Data',
        description: isPdf ? 'Generating verified multi-page executive summary PDF.' : 'Downloading full simulation JSON.'
      },
      quickActions: DEFAULT_QUICK_ACTIONS
    };
  }

  // ----------------------------------------------------
  // Intent 8: Compare Assets Command (e.g. Apple vs Dangote)
  // ----------------------------------------------------
  if (lowerQ.includes('compare') || lowerQ.includes(' versus ') || lowerQ.includes(' vs ')) {
    const parts = query.split(/\b(?:vs|versus|and|with)\b/i);
    let companyA: TopInvestment | null = null;
    let companyB: TopInvestment | null = null;

    if (parts.length >= 2) {
      companyA = findMatchingCompany(parts[0]);
      companyB = findMatchingCompany(parts[1]);
    }

    if (!companyA) companyA = TOP_INVESTMENTS.find(i => i.ticker === 'SPY') || TOP_INVESTMENTS[0];
    if (!companyB) companyB = TOP_INVESTMENTS.find(i => i.ticker === 'DANGCEM') || TOP_INVESTMENTS[1];

    const cagrA = formatPercent(companyA.fiveYearCagr);
    const volA = formatPercent(companyA.annualVolatility);
    const cagrB = formatPercent(companyB.fiveYearCagr);
    const volB = formatPercent(companyB.annualVolatility);

    const text = `### ⚖️ Side-by-Side Asset Comparison\n\n` +
      `| Metric | **${companyA.name}** (${companyA.ticker}) | **${companyB.name}** (${companyB.ticker}) |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **Region & Tier** | ${companyA.region} (${companyA.tier}) | ${companyB.region} (${companyB.tier}) |\n` +
      `| **5Y Real CAGR** | **${cagrA}** | **${cagrB}** |\n` +
      `| **Annual Volatility** | **${volA}** | **${volB}** |\n` +
      `| **Max Historical Drawdown** | ${formatPercent(companyA.maxDrawdown)} | ${formatPercent(companyB.maxDrawdown)} |\n` +
      `| **Data Confidence** | ${companyA.tier === 'Tier A' || companyA.tier === 'Developed' ? 'High' : 'Widened Confidence Band'} | ${companyB.tier === 'Tier A' || companyB.tier === 'Developed' ? 'High' : 'Widened Confidence Band'} |\n\n` +
      `Which one would you like to simulate? Click below to load **${companyA.name}** or ask me to simulate **${companyB.name}**:`;

    return {
      text,
      actionPayload: {
        type: 'SIMULATE_FORECAST',
        title: `Simulate ${companyA.name}`,
        description: `Load ${companyA.name} into the Monte Carlo Forecaster.`,
        targetTab: 'forecast',
        company: companyA,
        params: {
          expectedRealReturn: companyA.fiveYearCagr,
          annualVolatility: companyA.annualVolatility,
          widenedConfidenceBand: companyA.tier === 'Tier B' || companyA.tier === 'Tier C'
        }
      },
      quickActions: [
        {
          id: `sim_${companyA.ticker}`,
          label: `Simulate ${companyA.name}`,
          promptText: `Simulate ${companyA.name} for 30 years`,
          category: 'simulation'
        },
        {
          id: `sim_${companyB.ticker}`,
          label: `Simulate ${companyB.name}`,
          promptText: `Simulate ${companyB.name} for 30 years`,
          category: 'simulation'
        }
      ]
    };
  }

  // ----------------------------------------------------
  // Intent 9: Knowledge Base Lookup
  // ----------------------------------------------------
  for (const item of KNOWLEDGE_BASE) {
    const hasMatch = item.keywords.some(kw => lowerQ.includes(kw));
    if (hasMatch) {
      return {
        text: `### ${item.title}\n\n${item.answer}`,
        actionPayload: item.actionPayload,
        quickActions: DEFAULT_QUICK_ACTIONS
      };
    }
  }

  // ----------------------------------------------------
  // Intent 10: Company Info Lookup (e.g. "Tell me about Naspers")
  // ----------------------------------------------------
  const matchedCompany = findMatchingCompany(query);
  if (matchedCompany) {
    const text = `### 🏢 Company Profile: ${matchedCompany.name} (${matchedCompany.ticker || 'N/A'})\n\n` +
      `• **Region / Country:** ${matchedCompany.region} · ${matchedCompany.country}\n` +
      `• **Confidence Tier:** **${matchedCompany.tier}**\n` +
      `• **Sector:** ${matchedCompany.sector}\n` +
      `• **Market Cap:** $${matchedCompany.marketCapBillions.toFixed(1)} Billion\n` +
      `• **5-Year Real CAGR:** **${formatPercent(matchedCompany.fiveYearCagr)}**\n` +
      `• **Annual Volatility:** **${formatPercent(matchedCompany.annualVolatility)}**\n` +
      `• **Max Drawdown:** ${formatPercent(matchedCompany.maxDrawdown)}\n\n` +
      `**Description:** ${matchedCompany.description}\n\n` +
      `Would you like to simulate **${matchedCompany.name}** in the Wealth Forecaster, the Safe Withdrawal Calculator, or both?`;

    return {
      text,
      actionPayload: {
        type: 'SIMULATE_BOTH',
        title: `Simulate Both for ${matchedCompany.name}`,
        description: `Runs both Forecaster and Withdrawal calculators with ${matchedCompany.name}.`,
        targetTab: 'forecast',
        company: matchedCompany,
        params: {
          expectedRealReturn: matchedCompany.fiveYearCagr,
          annualVolatility: matchedCompany.annualVolatility,
          widenedConfidenceBand: matchedCompany.tier === 'Tier B' || matchedCompany.tier === 'Tier C'
        }
      },
      quickActions: [
        {
          id: `sim_fore_${matchedCompany.ticker}`,
          label: `Forecaster (${matchedCompany.name})`,
          promptText: `Simulate ${matchedCompany.name} for 30 years with $100,000`,
          category: 'simulation'
        },
        {
          id: `sim_with_${matchedCompany.ticker}`,
          label: `Withdrawal (${matchedCompany.name})`,
          promptText: `Test safe withdrawal for ${matchedCompany.name} on $1,000,000 at 4%`,
          category: 'withdrawal'
        },
        {
          id: `sim_both_${matchedCompany.ticker}`,
          label: `Simulate Both`,
          promptText: `Simulate both calculators for ${matchedCompany.name} for 50 years`,
          category: 'simulation'
        }
      ]
    };
  }

  // ----------------------------------------------------
  // Intent 11: Intelligent Financial Fallback
  // ----------------------------------------------------
  const fallbackText = `### 🤖 IFOC Financial Assistant\n\n` +
    `I can assist you with all functions of the **Investment Forecasting & Opportunity Cost Calculator**:\n\n` +
    `1. **Simulate Any Investment (1 to 200 Years):**\n` +
    `   • Ask: *"Simulate Apple for 50 years with $250k"*\n` +
    `   • Ask: *"Simulate Dangote Cement for 30 years"*\n` +
    `   • Ask: *"Simulate both calculators for S&P 500 for 100 years"*\n\n` +
    `2. **Retirement & Safe Withdrawal Stress-Testing:**\n` +
    `   • Ask: *"Test 4% withdrawal on $1,000,000 over 30 years"*\n` +
    `   • Ask: *"What is sequence of returns risk?"*\n\n` +
    `3. **Guided Decision Tree:**\n` +
    `   • Click **"🎯 Investment Decision Tree"** below or ask *"Guide me with decision tree"*\n\n` +
    `4. **Currency & Report Operations:**\n` +
    `   • Ask: *"Switch currency to EUR / NGN / GBP"*\n` +
    `   • Ask: *"Download executive PDF report"*\n\n` +
    `What would you like to model today?`;

  return {
    text: fallbackText,
    quickActions: DEFAULT_QUICK_ACTIONS
  };
}
