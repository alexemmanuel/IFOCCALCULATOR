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

### 5. Multi-Currency & FX Overlay
- **Multi-Currency Support**: View calculations in **USD ($)**, **EUR (€)**, **GBP (£)**, **ZAR (R)**, **NGN (₦)**, and **KES (KSh)**.
- **Local vs. Common Purchasing Power**: Toggle between local-currency real returns and global base-currency equivalent real returns with currency depreciation overlays.

### 6. Curated Investment Universe & Search
- Screen top global and African companies (e.g., Apple, Microsoft, Dangote Cement, MTN Group, Standard Bank, Naspers, Safaricom).
- Instant metric lookup for P/E ratios, dividend yields, historical real CAGRs, and tier classifications.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
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
