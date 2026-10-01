# Investment Forecasting & Opportunity Cost Calculator

A quantitative wealth forecasting and financial decision engine built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. It combines multi-horizon Monte Carlo simulations, epistemic uncertainty modeling (including African market tiers), withdrawal opportunity cost analysis, and long-horizon terminal wealth stability analysis up to 200 years.

---

## 🚀 Key Features

### 1. Multi-Horizon Monte Carlo Simulation
- **Percentile Fan Charts (P5 to P95)**: Displays probabilistic trajectories over customizable horizons (1 to 200 years) with up to 10,000 simulated paths.
- **Stochastic Modeling**: Supports Geometric Brownian Motion (lognormal) as well as Merton Jump Diffusion (tail risk, sudden market crashes, and recoveries).
- **Inflation & Valuation Adjustments**: Real vs. nominal purchasing power toggling, plus adjustable starting valuation drags (PE/CAPE mean reversion).
- **Seedable PRNG**: Deterministic, reproducible simulation runs using a seedable Pseudo-Random Number Generator (`Mulberry32`).

### 2. Epistemic Uncertainty & Tiered African Benchmarks
- **Tiered Market Architecture**: Addresses data-rich vs. data-sparse regimes with explicit epistemic uncertainty widening:
  - **Tier A (High Confidence)**: South Africa (JSE) with continuous 120+ year series (DMS dataset).
  - **Tier B (Moderate Confidence)**: Nigeria (NGX), Kenya (NSE), Egypt (EGX), Morocco (CSE) with 25–35 year series.
  - **Tier C (High Uncertainty)**: Ghana (GSE), Zambia (LuSE), WAEMU (BRVM) with shorter track records; automatically widens fan chart percentile bands to reflect parameter estimation risk.
  - **Tier D (Frontier / High Tail Risk)**: Frontier markets subject to liquidity and structural regime shifts.
- **Global Benchmarks**: Pre-configured historical presets for World Equities (MSCI World), US S&P 500, Europe, Japan, Global Balanced 60/40, and Emerging Markets.

### 3. Withdrawal & Opportunity Cost Calculator (Tab 2)
- **Counterfactual Wealth Forecaster**: Calculates the true long-term compounding cost of withdrawing lump-sum capital or recurring income.
- **Missed Compounding Analysis**: Highlights the gap between actual withdrawals and what that capital would have generated if left invested.
- **Safe Withdrawal Rates**: Dynamic failure probability assessment across sequence-of-returns scenarios.

### 4. Multi-Horizon & Long-Term Stability Analysis
- **10, 30, 50, 100, and 200-Year Horizons**: Analyze structural compounding across generational timescales.
- **Stability Gauge**: Evaluates the probability of real purchasing power preservation and capital ruin across paths.
- **Terminal Distribution & Sensitivity Matrix**: Real-time cross-tabulation of expected real return vs. volatility.

### 5. Dynamic Currency Conversion & Relative Ratio Engine
- **Global USD Benchmark & Proportional Scaling**: Toggling currencies scales starting capital, monthly savings, and withdrawal figures by the exact relative foreign exchange ratio (e.g. `$600,000 USD` converts to `₦810,000,000 NGN` at `1 USD = ₦1,350 NGN`, and scales back cleanly without loss or distortion).
- **Dual Dollar Equivalents**: Immediate dollar equivalent badges displayed under every input field (Initial Capital, Annual Savings, Cashflows) and outcome cards so investors in Naira (or other currencies) instantly see dollar values without manual conversions.
- **Global Ratios & Converter Modal**: Interactive modal accessible from the Header and parameter consoles showing full matrix ratios vs. USD, custom rate calibration, and a two-way portfolio capital converter.
- **Multi-Currency Support**: Covers USD ($), NGN (₦), ZAR (R), KES (KSh), EGP (E£), GHS (GH₵), MAD (DH), TND (DT), XOF (CFA), EUR (€), GBP (£), JPY (¥), AUD (A$), and CAD (CA$).
- **Local vs. Common Purchasing Power**: Toggle between local-currency real returns and global base-currency equivalent real returns with currency depreciation overlays.

### 6. Curated Investment Universe & Search
- Screen top global and African companies (e.g., Apple, Microsoft, Dangote Cement, MTN Group, Standard Bank, Naspers, Safaricom).
- Instant metric lookup for P/E ratios, dividend yields, historical real CAGRs, and tier classifications.

### 7. Executive PDF Report Generation (Institutional Record-Keeping)
- **One-Click Download Report in Header**: Generates a high-density, multi-page quantitative forecast PDF document.
- **Embedded High-Resolution Fan Chart**: Print-ready rendered SVG/canvas chart with shaded percentile dispersion envelopes ($P_5-P_{95}$, $P_{25}-P_{75}$) and median trajectory.
- **Executive Metric Callouts**: Starting capital, median terminal wealth ($P_{50}$), $90\%$ dispersion span, probability of profit ($\ge 2\times$), ruin risk, and real CAGR.
- **Assumptions & Epistemic Governance**: Comprehensive tabulation of $\mu$, $\sigma$, distribution geometry, valuation drag, and market tiers.
- **Trajectory Milestones & 2D Sensitivity Grid**: Formatted tables across key milestone horizons and return-volatility scenarios.
- **Audit & Compliance Sign-off**: Formal review blocks (Prepared By, Portfolio Reviewer, Compliance Auditor) with unique document reference IDs and regulatory notices.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **PDF Engine**: [jsPDF](https://github.com/parallax/jsPDF) + HTML5 Canvas Vector Rendering
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)

---

## 📦 Project Structure

```text
├── index.html              # HTML entry point
├── metadata.json           # Application metadata and capabilities
├── package.json            # Dependencies and npm scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration with Tailwind CSS plugin
├── src/
│   ├── App.tsx             # Root component and navigation state
│   ├── main.tsx            # React application root mount
│   ├── index.css           # Global Tailwind CSS imports and themes
│   ├── components/         # Modular UI components
│   │   ├── Header.tsx              # Top bar, currency selector, theme toggle
│   │   ├── MarqueeTicker.tsx       # Live investment & asset class ticker
│   │   ├── ForecastTab.tsx         # Monte Carlo forecaster & presets
│   │   ├── FanChart.tsx            # SVG fan chart (P5, P25, Median, P75, P95)
│   │   ├── WithdrawalTab.tsx       # Tab 2: Profit & Opportunity Calculator
│   │   ├── MultiHorizonTab.tsx     # Horizon breakdown (10y to 200y)
│   │   ├── SensitivityTable.tsx    # 2D return vs. volatility grid
│   │   ├── StabilityGauge.tsx      # Radial & linear capital stability gauge
│   │   ├── TopInvestmentsTab.tsx   # Global & African equity screener
│   │   ├── HistoricalTab.tsx       # Historical returns & drawdowns
│   │   ├── MethodologyTab.tsx      # Mathematical formulations & documentation
│   │   └── DisclaimersModal.tsx    # Regulatory & risk disclaimers
│   ├── data/
│   │   ├── historicalData.ts       # Benchmark stats & currency configurations
│   │   └── topInvestments.ts       # Curated asset list and fundamentals
│   ├── types/
│   │   └── index.ts                # TypeScript domain models and interfaces
│   └── utils/
│       ├── financialEngine.ts      # Monte Carlo core and compounding logic
│       └── mathRandom.ts           # Box-Muller normal PRNG with seed support
```

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- `npm` or `pnpm` or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

### Available Scripts

- `npm run dev`: Runs the app in development mode on port 3000.
- `npm run build`: Compiles TypeScript and builds the production bundle with Vite into `dist/`.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Validates TypeScript types across the codebase with `tsc --noEmit`.

---

## 📈 Methodology & Simulation Details

The simulation uses discrete annual steps governed by the following real stochastic model:

$$S_{t+1} = S_t \times \exp\left( \left(\mu_{\text{real}} - \frac{1}{2}\sigma^2\right) \Delta t + \sigma \sqrt{\Delta t} Z_t + J_t \right)$$

Where:
- $\mu_{\text{real}}$: Annualized expected real return (adjusted for valuation drag if enabled)
- $\sigma$: Annual volatility standard deviation
- $Z_t \sim \mathcal{N}(0, 1)$: Standard Gaussian draw generated via Box-Muller transform
- $J_t$: Poisson jump compound process (for shock modeling)
- **Epistemic Uncertainty Expansion**: For Tier B and C emerging/frontier markets, standard error of the mean $\text{SE}(\mu) = \frac{\sigma}{\sqrt{T_{\text{history}}}}$ expands the distribution quantiles to prevent overconfidence from short sample histories.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
