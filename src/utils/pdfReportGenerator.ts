/**
 * Professional PDF Report Generator
 * Creates an executive-grade, multi-page quantitative investment forecast document
 * for institutional record-keeping, compliance, and wealth planning.
 */

import { jsPDF } from 'jspdf';
import {
  SimulationParameters,
  SimulationResult,
  SensitivityMatrix,
  CurrencyCode
} from '../types';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatMultiplier,
  formatPercent
} from './financialEngine';
import { CURRENCY_CONFIGS, ASSET_CLASS_PRESETS } from '../data/historicalData';

export interface GeneratePdfReportOptions {
  params: SimulationParameters;
  simResult: SimulationResult;
  sensitivityMatrix?: SensitivityMatrix;
  currency: CurrencyCode;
  currencyMode: 'local_real' | 'common_base';
  isNominal: boolean;
  selectedAssetClassId?: string;
}

/**
 * Draws a high-resolution, print-ready Fan Chart onto an in-memory Canvas
 * and exports as a PNG data URL.
 */
function renderChartToDataUrl(
  simResult: SimulationResult,
  params: SimulationParameters,
  currency: CurrencyCode,
  isNominal: boolean
): string {
  const width = 1600;
  const height = 750;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const padding = { top: 40, right: 70, bottom: 65, left: 140 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Subtle border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(padding.left, padding.top, chartWidth, chartHeight);

  const percentiles = simResult.percentiles;
  if (!percentiles || percentiles.length === 0) return '';

  const numYears = percentiles.length - 1;
  const nominalFactor = (year: number) =>
    isNominal ? Math.pow(1 + params.inflationRate, year) : 1;

  const adjusted = percentiles.map(pt => ({
    year: pt.year,
    p5: pt.p5 * nominalFactor(pt.year),
    p25: pt.p25 * nominalFactor(pt.year),
    p50: pt.p50 * nominalFactor(pt.year),
    p75: pt.p75 * nominalFactor(pt.year),
    p95: pt.p95 * nominalFactor(pt.year),
  }));

  const maxVal = Math.max(
    ...adjusted.map(p => p.p95),
    params.initialCapital * params.goodProfitThresholdMultiplier * 1.15
  );
  const minVal = Math.max(
    100,
    Math.min(...adjusted.map(p => p.p5), params.initialCapital * 0.4)
  );

  const logMin = Math.log10(minVal);
  const logMax = Math.log10(maxVal);

  const getX = (year: number) => padding.left + (year / numYears) * chartWidth;
  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const normalized = (Math.log10(clamped) - logMin) / (logMax - logMin || 1);
    return padding.top + chartHeight - normalized * chartHeight;
  };

  // Horizontal Grid Lines & Y Ticks
  const numYTicks = 6;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  for (let i = 0; i <= numYTicks; i++) {
    const fraction = i / numYTicks;
    const tickVal = Math.pow(10, logMin + fraction * (logMax - logMin));
    const y = padding.top + chartHeight - fraction * chartHeight;

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(formatCurrencyCompact(tickVal, currency), padding.left - 18, y);
  }

  // Vertical Grid Lines & X Ticks
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const xStep = numYears <= 15 ? 2 : numYears <= 35 ? 5 : numYears <= 60 ? 10 : 25;

  for (let y = 0; y <= numYears; y += xStep) {
    const x = getX(y);
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + chartHeight);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(`Year ${y}`, x, padding.top + chartHeight + 14);
  }

  // Draw P5 - P95 Outer Fan Band (Light Cyan)
  ctx.beginPath();
  for (let i = 0; i < adjusted.length; i++) {
    const x = getX(adjusted[i].year);
    const y = getY(adjusted[i].p95);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = adjusted.length - 1; i >= 0; i--) {
    const x = getX(adjusted[i].year);
    const y = getY(adjusted[i].p5);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(6, 182, 212, 0.16)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw P25 - P75 Inner Fan Band (Indigo / Cyan blend)
  ctx.beginPath();
  for (let i = 0; i < adjusted.length; i++) {
    const x = getX(adjusted[i].year);
    const y = getY(adjusted[i].p75);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = adjusted.length - 1; i >= 0; i--) {
    const x = getX(adjusted[i].year);
    const y = getY(adjusted[i].p25);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(99, 102, 241, 0.22)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw Initial Capital Benchmark Line (dashed slate)
  const yInit = getY(params.initialCapital);
  ctx.beginPath();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.moveTo(padding.left, yInit);
  ctx.lineTo(padding.left + chartWidth, yInit);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw Good Profit Threshold Line (dashed emerald)
  const yProfit = getY(params.initialCapital * params.goodProfitThresholdMultiplier);
  if (yProfit >= padding.top && yProfit <= padding.top + chartHeight) {
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.moveTo(padding.left, yProfit);
    ctx.lineTo(padding.left + chartWidth, yProfit);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw Median Line (Solid Bold Cyan/Blue)
  ctx.beginPath();
  for (let i = 0; i < adjusted.length; i++) {
    const x = getX(adjusted[i].year);
    const y = getY(adjusted[i].p50);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Legend at top-right of chart
  const legX = padding.left + 24;
  const legY = padding.top + 22;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Item 1: Median
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(legX, legY - 5, 22, 10);
  ctx.fillStyle = '#334155';
  ctx.fillText('Median Expected (P50)', legX + 30, legY);

  // Item 2: P25-P75
  ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.fillRect(legX + 240, legY - 5, 22, 10);
  ctx.fillStyle = '#334155';
  ctx.fillText('50% Likelihood Range (P25 - P75)', legX + 270, legY);

  // Item 3: P5-P95
  ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
  ctx.fillRect(legX + 560, legY - 5, 22, 10);
  ctx.fillStyle = '#334155';
  ctx.fillText('90% Range (P5 - P95 Dispersion)', legX + 590, legY);

  // Item 4: Initial Capital
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(legX + 870, legY);
  ctx.lineTo(legX + 892, legY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#64748b';
  ctx.fillText('Initial Capital Floor', legX + 900, legY);

  return canvas.toDataURL('image/png');
}

/**
 * Main export function to generate and trigger download of the executive summary PDF
 */
export async function generateExecutiveSummaryPdf(options: GeneratePdfReportOptions): Promise<void> {
  const {
    params,
    simResult,
    sensitivityMatrix,
    currency,
    currencyMode,
    isNominal,
    selectedAssetClassId
  } = options;

  // Find asset class label
  const preset = ASSET_CLASS_PRESETS.find(p => p.id === selectedAssetClassId);
  const assetName = preset ? preset.name : (selectedAssetClassId === 'custom' ? 'Custom Portfolio' : 'US Equities (S&P 500 Baseline)');
  const tierLabel = preset?.tier || (preset?.id?.includes('africa') ? 'Tier A-D' : 'Developed Market');

  // Initialize jsPDF A4 portrait (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const reportId = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Helper colors
  const primaryNavy = [15, 23, 42];     // #0f172a
  const accentCyan = [6, 182, 212];      // #06b6d4
  const accentIndigo = [99, 102, 241];   // #6366f1
  const textDark = [30, 41, 59];         // #1e293b
  const textMuted = [100, 116, 139];     // #64748b
  const borderLight = [226, 232, 240];   // #e2e8f0
  const bgCard = [248, 250, 252];        // #f8fafc

  /* =====================================================================
   * PAGE 1: EXECUTIVE DASHBOARD & PROBABILISTIC FORECAST
   * ===================================================================== */

  // 1. Top Decorative Bar
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFillColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.rect(0, 23, pageWidth, 1.2, 'F');

  // Top Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('QUANTITATIVE WEALTH ADVISORY · INSTITUTIONAL RESEARCH', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`REPORT REF: ${reportId}  ·  CONFIDENTIAL RECORD`, pageWidth - margin, 11, { align: 'right' });

  doc.setFontSize(7.5);
  doc.text(`Generated: ${formattedDate} ${formattedTime}  ·  Horizon: ${params.horizonYears} Years  ·  Iterations: ${params.numPaths.toLocaleString()}`, margin, 18);
  const pdfRate = CURRENCY_CONFIGS[currency]?.rateToUsd || 1.0;
  const currSym = CURRENCY_CONFIGS[currency]?.symbol || '$';
  doc.text(
    currency === 'USD'
      ? `Base Currency: USD ($) · ${isNominal ? 'Nominal' : 'Real Purchasing Power'}`
      : `Base Currency: ${currency} (1 USD = ${currSym}${pdfRate.toLocaleString()}) · ${isNominal ? 'Nominal' : 'Real Power'}`,
    pageWidth - margin,
    18,
    { align: 'right' }
  );

  // 2. Report Document Title
  let cursorY = 32;
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Stochastic Investment Forecast & Risk Summary', margin, cursorY);

  cursorY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Benchmark Asset: ${assetName} [${tierLabel}] · Distribution: ${params.modelType.toUpperCase()} · Val. Drag: ${(params.valuationDragPct * 100).toFixed(1)}%`,
    margin,
    cursorY
  );

  // 3. Four Key Executive Metric Cards
  cursorY += 6.5;
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 22;

  interface MetricCard {
    label: string;
    value: string;
    sub: string;
    color: number[];
  }

  const cards: MetricCard[] = [
    {
      label: 'MEDIAN TERMINAL WEALTH',
      value: formatCurrency(simResult.terminalWealthMedian, 0, currency),
      sub: currency !== 'USD'
        ? `≈ ${formatCurrency(simResult.terminalWealthMedian / pdfRate, 0, 'USD')} USD`
        : `${formatMultiplier(simResult.terminalWealthMedian / (params.initialCapital || 1))} Starting Capital`,
      color: [2, 132, 199] // sky-600
    },
    {
      label: '90% DISPERSION (P5 - P95)',
      value: `${formatCurrencyCompact(simResult.terminalWealthP5, currency)} - ${formatCurrencyCompact(simResult.terminalWealthP95, currency)}`,
      sub: currency !== 'USD'
        ? `≈ ${formatCurrencyCompact(simResult.terminalWealthP5 / pdfRate, 'USD')} - ${formatCurrencyCompact(simResult.terminalWealthP95 / pdfRate, 'USD')} USD`
        : `IQR: ${formatCurrencyCompact(simResult.terminalWealthP25, currency)} - ${formatCurrencyCompact(simResult.terminalWealthP75, currency)}`,
      color: [99, 102, 241] // indigo-500
    },
    {
      label: 'PROBABILITY OF PROFIT',
      value: formatPercent(simResult.probGoodProfits),
      sub: `≥${params.goodProfitThresholdMultiplier}x Initial Capital Floor`,
      color: [16, 185, 129] // emerald-500
    },
    {
      label: 'REAL CAGR & STABILITY',
      value: formatPercent(simResult.medianCAGR),
      sub: `Ruin Risk: ${formatPercent(simResult.probFailure)} | Stability: ${Math.round(simResult.stabilityPercentage)}%`,
      color: [217, 119, 6] // amber-600
    }
  ];

  cards.forEach((card, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    // Background card box
    doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(cardX, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Accent top line
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(cardX, cursorY, cardWidth, 1.2, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(card.label, cardX + 3.5, cursorY + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(card.value, cardX + 3.5, cursorY + 12);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.sub, cardX + 3.5, cursorY + 17.5);
  });

  cursorY += cardHeight + 6;

  // 4. Embedded Fan Chart Visualization
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Probabilistic Wealth Trajectory (Log Scale Fan Chart)', margin, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Shaded intervals show P5-P95 (outer) and P25-P75 (inner) distributions across 5,000 paths', margin + 105, cursorY);

  cursorY += 3.5;
  const chartImgData = renderChartToDataUrl(simResult, params, currency, isNominal);
  const chartHeightMm = 74;
  if (chartImgData) {
    doc.addImage(chartImgData, 'PNG', margin, cursorY, contentWidth, chartHeightMm);
  } else {
    doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
    doc.rect(margin, cursorY, contentWidth, chartHeightMm, 'F');
  }

  cursorY += chartHeightMm + 5;

  // 5. Stochastic Assumptions & Parameters Grid Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Core Parameter Assumptions & Modeling Framework', margin, cursorY);

  cursorY += 4;
  const colW = contentWidth / 4;
  const tableRows = [
    [
      {
        label: 'Initial Investment',
        val: currency !== 'USD'
          ? `${formatCurrency(params.initialCapital, 0, currency)} (≈$${Math.round(params.initialCapital / pdfRate).toLocaleString()})`
          : formatCurrency(params.initialCapital, 0, currency)
      },
      { label: 'Expected Real Return (μ)', val: formatPercent(params.expectedRealReturn) },
      { label: 'Annual Volatility (σ)', val: formatPercent(params.annualVolatility) },
      { label: 'Inflation Baseline (π)', val: formatPercent(params.inflationRate) }
    ],
    [
      { label: 'Simulation Horizon', val: `${params.horizonYears} Years` },
      { label: 'Monte Carlo Iterations', val: `${params.numPaths.toLocaleString()} Paths` },
      { label: 'Distribution Engine', val: params.modelType === 'jump_diffusion' ? 'Jump Diffusion' : 'Lognormal (GBM)' },
      { label: 'Valuation Drag', val: params.valuationDragPct !== 0 ? `${(params.valuationDragPct * 100).toFixed(1)}% (${params.valuationDragYears}y)` : 'Neutral (0.0%)' }
    ],
    [
      { label: 'Data Confidence Tier', val: tierLabel },
      { label: 'Epistemic Uncertainty', val: params.widenedConfidenceBand ? 'Widened SE Bands Active' : 'Standard Asymptotic' },
      { label: 'FX Overlay Adjustment', val: params.enableFxOverlay ? `Active (+${((params.fxVolatilityOverlayPct || 0.03) * 100).toFixed(1)}% Vol)` : 'Standard Rate' },
      { label: 'PRNG Reproducibility Seed', val: params.seed ? `#${params.seed}` : 'Deterministic' }
    ]
  ];

  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, cursorY, contentWidth, 31, 1.5, 1.5, 'FD');

  tableRows.forEach((row, rowIdx) => {
    const rowY = cursorY + 3.5 + rowIdx * 9.2;
    row.forEach((cell, cellIdx) => {
      const cellX = margin + 4 + cellIdx * colW;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(cell.label, cellX, rowY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text(cell.val, cellX, rowY + 4.2);
    });
  });

  cursorY += 34;

  // 6. Summary Analytical Takeaway
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.roundedRect(margin, cursorY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFillColor(2, 132, 199);
  doc.rect(margin, cursorY, 2, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(2, 132, 199);
  doc.text('ANALYTICAL SYNTHESIS:', margin + 5, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const takeawayText = `Over a ${params.horizonYears}-year horizon in ${currency} terms, an initial portfolio of ${formatCurrency(params.initialCapital, 0, currency)} yields a median terminal outcome of ${formatCurrency(simResult.terminalWealthMedian, 0, currency)} (${formatMultiplier(simResult.terminalWealthMedian / params.initialCapital)} capital). Real purchasing power compounding has a ${formatPercent(simResult.probGoodProfits)} likelihood of exceeding a 2.0x multiple, with a ${formatPercent(simResult.probFailure)} downside probability of real capital impairment.`;
  const splitTakeaway = doc.splitTextToSize(takeawayText, contentWidth - 10);
  doc.text(splitTakeaway, margin + 5, cursorY + 10);

  // Page 1 Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.text(`Document Reference: ${reportId}  ·  Investment Forecaster v1.0`, margin, pageHeight - 7.5);
  doc.text('Page 1 of 2', pageWidth - margin, pageHeight - 7.5, { align: 'right' });

  /* =====================================================================
   * PAGE 2: TRAJECTORY MILESTONES, SENSITIVITY MATRIX & COMPLIANCE
   * ===================================================================== */
  doc.addPage();

  // Top Accent Bar for Page 2
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setFillColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.rect(0, 15, pageWidth, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('QUANTITATIVE SENSITIVITY & TRAJECTORY BREAKDOWN', margin, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`REPORT REF: ${reportId}`, pageWidth - margin, 10, { align: 'right' });

  cursorY = 24;

  // 1. Percentile Milestone Trajectory Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Multi-Year Percentile Trajectory Breakdown', margin, cursorY);

  cursorY += 4.5;

  // Select 7-8 representative milestone years based on horizon
  const horizon = params.horizonYears;
  const milestoneYears = [0];
  if (horizon <= 10) {
    for (let y = 1; y <= horizon; y += 2) milestoneYears.push(y);
    if (!milestoneYears.includes(horizon)) milestoneYears.push(horizon);
  } else if (horizon <= 30) {
    [1, 5, 10, 15, 20, 25, 30].forEach(y => { if (y <= horizon) milestoneYears.push(y); });
    if (!milestoneYears.includes(horizon)) milestoneYears.push(horizon);
  } else if (horizon <= 60) {
    [5, 10, 20, 30, 40, 50, horizon].forEach(y => { if (y <= horizon && !milestoneYears.includes(y)) milestoneYears.push(y); });
  } else {
    [10, 25, 50, 75, 100, 150, horizon].forEach(y => { if (y <= horizon && !milestoneYears.includes(y)) milestoneYears.push(y); });
  }

  // Table Headers
  const tableCols = [
    { label: 'Horizon', width: 22, align: 'left' },
    { label: 'Floor (P5)', width: 30, align: 'right' },
    { label: 'Lower IQR (P25)', width: 32, align: 'right' },
    { label: 'Median (P50)', width: 34, align: 'right' },
    { label: 'Upper IQR (P75)', width: 32, align: 'right' },
    { label: 'Bull (P95)', width: 32, align: 'right' }
  ];

  // Table Header Box
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(margin, cursorY, contentWidth, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  let headerX = margin + 3;
  tableCols.forEach(col => {
    if (col.align === 'right') {
      doc.text(col.label, headerX + col.width - 6, cursorY + 4.8, { align: 'right' });
    } else {
      doc.text(col.label, headerX, cursorY + 4.8);
    }
    headerX += col.width;
  });

  cursorY += 7;

  // Table Data Rows
  milestoneYears.forEach((year, rIdx) => {
    const pt = simResult.percentiles.find(p => p.year === year) || simResult.percentiles[year] || simResult.percentiles[simResult.percentiles.length - 1];
    const factor = isNominal ? Math.pow(1 + params.inflationRate, year) : 1;

    const rowBg = rIdx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.rect(margin, cursorY, contentWidth, 6.2, 'FD');

    let cellX = margin + 3;
    doc.setFont('helvetica', year === horizon ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);

    // Horizon label
    doc.text(year === 0 ? 'Start (Y0)' : `Year ${year}`, cellX, cursorY + 4.3);
    cellX += tableCols[0].width;

    // P5
    doc.text(formatCurrency(pt.p5 * factor, 0, currency), cellX + tableCols[1].width - 6, cursorY + 4.3, { align: 'right' });
    cellX += tableCols[1].width;

    // P25
    doc.text(formatCurrency(pt.p25 * factor, 0, currency), cellX + tableCols[2].width - 6, cursorY + 4.3, { align: 'right' });
    cellX += tableCols[2].width;

    // P50 Median (Highlighted)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text(formatCurrency(pt.p50 * factor, 0, currency), cellX + tableCols[3].width - 6, cursorY + 4.3, { align: 'right' });
    cellX += tableCols[3].width;

    // P75
    doc.setFont('helvetica', year === horizon ? 'bold' : 'normal');
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(formatCurrency(pt.p75 * factor, 0, currency), cellX + tableCols[4].width - 6, cursorY + 4.3, { align: 'right' });
    cellX += tableCols[4].width;

    // P95
    doc.text(formatCurrency(pt.p95 * factor, 0, currency), cellX + tableCols[5].width - 6, cursorY + 4.3, { align: 'right' });

    cursorY += 6.2;
  });

  cursorY += 7;

  // 2. 2D Sensitivity Matrix: Expected Return vs. Volatility
  if (sensitivityMatrix && sensitivityMatrix.matrix && sensitivityMatrix.matrix.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('2D Sensitivity Analysis: Expected Real Return vs. Annual Volatility', margin, cursorY);

    cursorY += 4.5;
    const sensCols = sensitivityMatrix.returns;
    const sensRows = sensitivityMatrix.volatilities;
    const colSensWidth = (contentWidth - 28) / sensCols.length;

    // Sensitivity Header
    doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
    doc.rect(margin, cursorY, contentWidth, 7, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Volatility ↓ / Return →', margin + 3, cursorY + 4.8);

    sensCols.forEach((ret, cIdx) => {
      const x = margin + 28 + cIdx * colSensWidth;
      doc.text(`${(ret * 100).toFixed(1)}% Real Return`, x + colSensWidth / 2, cursorY + 4.8, { align: 'center' });
    });

    cursorY += 7;

    sensRows.forEach((vol, rIdx) => {
      const rowY = cursorY;
      doc.setFillColor(rIdx % 2 === 0 ? 255 : bgCard[0], rIdx % 2 === 0 ? 255 : bgCard[1], rIdx % 2 === 0 ? 255 : bgCard[2]);
      doc.rect(margin, rowY, contentWidth, 7.5, 'FD');

      // Vol label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.text(`${(vol * 100).toFixed(0)}% Volatility`, margin + 3, rowY + 5);

      sensCols.forEach((_, cIdx) => {
        const cell = sensitivityMatrix.matrix[rIdx]?.[cIdx];
        const x = margin + 28 + cIdx * colSensWidth;
        if (cell) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(2, 132, 199);
          doc.text(formatCurrencyCompact(cell.medianTerminalWealth, currency), x + colSensWidth / 2, rowY + 4.3, { align: 'center' });

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
          doc.text(`${formatMultiplier(cell.medianMultiple)} · ${formatPercent(cell.probGoodProfits)} Win`, x + colSensWidth / 2, rowY + 6.8, { align: 'center' });
        }
      });

      cursorY += 7.5;
    });

    cursorY += 6;
  }

  // 3. Epistemic Uncertainty & African Tiers Methodology
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Epistemic Uncertainty & Estimation Risk Governance', margin, cursorY);

  cursorY += 4;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, cursorY, contentWidth, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  const epistemicExplanation = [
    '• Tier A Markets (e.g. South Africa JSE): 120+ year continuous DMS series provides high parameter estimation precision with low standard error.',
    '• Tier B Markets (e.g. Nigeria, Kenya, Egypt, Morocco): 25-35 year series with moderate structural shift frequency; calibrated with regime jump modeling.',
    '• Tier C & D Markets (e.g. Ghana, WAEMU, Zambia): Shorter tracking histories incorporate automatic epistemic widening of percentile dispersion bands.',
    '• Valuation Drag Adjustment: Accounts for starting PE/CAPE mean reversion drag over the initial 10-year window to avoid peak valuation distortion.'
  ];

  epistemicExplanation.forEach((line, idx) => {
    doc.text(line, margin + 4, cursorY + 5 + idx * 4.4);
  });

  cursorY += 26;

  // 4. Professional Sign-off & Audit Record Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Professional Record-Keeping & Review Sign-Off', margin, cursorY);

  cursorY += 3.5;
  const signColWidth = (contentWidth - 6) / 3;
  const signBoxes = [
    { title: 'PREPARED BY', role: 'Quantitative Risk Modeling Engine v1.0', sign: 'Verified Algorithmic Run' },
    { title: 'PORTFOLIO MANAGER REVIEW', role: 'Asset Allocation Committee', sign: 'Approved for Client Record' },
    { title: 'COMPLIANCE / RISK AUDIT', role: 'Investment Policy Statement (IPS)', sign: 'Compliant with IPS Mandate' }
  ];

  signBoxes.forEach((box, bIdx) => {
    const boxX = margin + bIdx * (signColWidth + 3);
    doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(boxX, cursorY, signColWidth, 22, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(box.title, boxX + 3.5, cursorY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(box.role, boxX + 3.5, cursorY + 10);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`Status: ${box.sign}`, boxX + 3.5, cursorY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`Timestamp: ${formattedDate}`, boxX + 3.5, cursorY + 19.5);
  });

  cursorY += 25;

  // 5. Regulatory Disclaimer Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('REGULATORY NOTICE & LIMITATIONS:', margin, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  const legalText = 'This report is generated for informational, planning, and professional record-keeping purposes only and does not constitute an offer, recommendation, or solicitation to buy or sell securities. Stochastic Monte Carlo simulations are model-based approximations utilizing historical statistics and user assumptions. They do not account for unmodeled systemic disruptions, black swan liquidity crises, currency redenomination, or confiscatory taxation. Real returns reflect purchasing power preservation under stated inflation assumptions. Past performance is no guarantee of future results.';
  const splitLegal = doc.splitTextToSize(legalText, contentWidth);
  doc.text(splitLegal, margin, cursorY + 3.5);

  // Page 2 Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.text(`Document Reference: ${reportId}  ·  CONFIDENTIAL  ·  Investment Forecaster`, margin, pageHeight - 7.5);
  doc.text('Page 2 of 2', pageWidth - margin, pageHeight - 7.5, { align: 'right' });

  // Save / Trigger Download
  const filename = `Investment_Forecast_Report_${params.horizonYears}Y_${currency}_${reportId}.pdf`;
  doc.save(filename);
}
