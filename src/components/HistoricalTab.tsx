import React, { useState, useMemo } from 'react';
import { HistoricalYearRecord } from '../types';
import { formatPercent } from '../utils/financialEngine';
import { Database, Upload, CheckCircle2, AlertCircle, FileText, Search, Filter } from 'lucide-react';

interface HistoricalTabProps {
  historicalData: HistoricalYearRecord[];
  onCustomDataLoaded: (records: HistoricalYearRecord[]) => void;
}

export const HistoricalTab: React.FC<HistoricalTabProps> = ({
  historicalData,
  onCustomDataLoaded
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegimeFilter, setSelectedRegimeFilter] = useState('all');
  const [csvUploadStatus, setCsvUploadStatus] = useState<string | null>(null);

  // Summary statistics calculation
  const stats = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return null;

    let equityProd = 1;
    let bondProd = 1;
    let cashProd = 1;

    let maxEquity = -Infinity;
    let minEquity = Infinity;
    let maxYear = 1900;
    let minYear = 1900;

    historicalData.forEach(d => {
      equityProd *= (1 + d.equityRealReturn);
      bondProd *= (1 + d.bondRealReturn);
      cashProd *= (1 + d.cashRealReturn);

      if (d.equityRealReturn > maxEquity) {
        maxEquity = d.equityRealReturn;
        maxYear = d.year;
      }
      if (d.equityRealReturn < minEquity) {
        minEquity = d.equityRealReturn;
        minYear = d.year;
      }
    });

    const N = historicalData.length;
    const equityGeo = Math.pow(Math.max(0.0001, equityProd), 1 / N) - 1;
    const bondGeo = Math.pow(Math.max(0.0001, bondProd), 1 / N) - 1;
    const cashGeo = Math.pow(Math.max(0.0001, cashProd), 1 / N) - 1;

    // Volatility
    let sumSqDiff = 0;
    historicalData.forEach(d => {
      sumSqDiff += Math.pow(d.equityRealReturn - equityGeo, 2);
    });
    const equityVol = Math.sqrt(sumSqDiff / (N - 1));

    return {
      count: N,
      startYear: historicalData[0]?.year,
      endYear: historicalData[historicalData.length - 1]?.year,
      equityGeo,
      bondGeo,
      cashGeo,
      equityVol,
      maxEquity,
      maxYear,
      minEquity,
      minYear
    };
  }, [historicalData]);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setCsvUploadStatus('Error: CSV file must contain a header and at least one data row.');
          return;
        }

        const parsed: HistoricalYearRecord[] = [];
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(s => s.trim());
          if (parts.length >= 2) {
            const yr = parseInt(parts[0]);
            let ret = parseFloat(parts[1]);
            // If return is e.g. 8.5 instead of 0.085, normalize
            if (Math.abs(ret) > 1.0) ret = ret / 100;

            if (!isNaN(yr) && !isNaN(ret)) {
              parsed.push({
                year: yr,
                equityRealReturn: ret,
                bondRealReturn: parts[2] ? parseFloat(parts[2]) : 0.02,
                cashRealReturn: 0.008,
                cpiInflation: 0.025,
                regimeTag: parts[3] || 'User Custom Series'
              });
            }
          }
        }

        if (parsed.length > 0) {
          onCustomDataLoaded(parsed);
          setCsvUploadStatus(`Successfully loaded ${parsed.length} custom return observations!`);
        } else {
          setCsvUploadStatus('Error: No valid (Year, Return) rows parsed.');
        }
      } catch (err: any) {
        setCsvUploadStatus(`Parsing error: ${err?.message || 'Invalid CSV format'}`);
      }
    };
    reader.readAsText(file);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return historicalData.filter(d => {
      const matchSearch = searchTerm === '' || d.year.toString().includes(searchTerm) || (d.regimeTag && d.regimeTag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchFilter = selectedRegimeFilter === 'all' || (selectedRegimeFilter === 'crisis' && d.equityRealReturn < -0.15) || (selectedRegimeFilter === 'boom' && d.equityRealReturn > 0.25);
      return matchSearch && matchFilter;
    });
  }, [historicalData, searchTerm, selectedRegimeFilter]);

  return (
    <div className="space-y-6">
      {/* Intro & Pre-loaded Dataset Specs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <span>Historical Empirical Return Series (Shiller / DMS 1900–2025)</span>
        </h2>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-4xl">
          Specification Section 9: Long-run real returns are calibrated against empirical evidence from Dimson-Marsh-Staunton (DMS) and Robert Shiller total-return data across 126 years of market cycles, wars, inflations, and expansions.
        </p>
      </div>

      {/* Historical Summary Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 block mb-0.5">Equities Geometric Real Return</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-cyan-300 tabular-nums">
              {formatPercent(stats.equityGeo, 2)} p.a.
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Annual Volatility: {formatPercent(stats.equityVol, 1)}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 block mb-0.5">Gov Bonds Geometric Real</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-indigo-300 tabular-nums">
              {formatPercent(stats.bondGeo, 2)} p.a.
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Real Cash Proxy: {formatPercent(stats.cashGeo, 2)}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 block mb-0.5">Best Single Year</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tabular-nums">
              +{formatPercent(stats.maxEquity, 1)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Recorded in Year {stats.maxYear}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 block mb-0.5">Worst Single Year</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-400 tabular-nums">
              {formatPercent(stats.minEquity, 1)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Recorded in Year {stats.minYear}
            </span>
          </div>
        </div>
      )}

      {/* CSV Uploader & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload Custom Return Series (CSV)</span>
          </h3>
          <p className="text-slate-400 text-xs">
            Upload your own empirical series. Expected CSV columns:
            <code className="block mt-1 font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
              Year, RealReturn, BondReturn, Notes
              <br />
              2015, 0.008, -0.002, Flat market
              <br />
              2016, 0.098, -0.012, Recovery
            </code>
          </p>

          <label className="block mt-3">
            <span className="sr-only">Choose CSV file</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
            />
          </label>

          {csvUploadStatus && (
            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              csvUploadStatus.startsWith('Error')
                ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
            }`}>
              {csvUploadStatus.startsWith('Error') ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{csvUploadStatus}</span>
            </div>
          )}
        </div>

        {/* Historical Table Viewer */}
        <div className="md:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Time Series Records ({filteredRows.length} years)
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter year / era..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2.5 py-1 text-slate-200 text-xs focus:outline-hidden"
                />
              </div>

              {/* Filter */}
              <select
                value={selectedRegimeFilter}
                onChange={(e) => setSelectedRegimeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-300 text-xs"
              >
                <option value="all">All Years</option>
                <option value="crisis">Severe Drops (&lt; -15%)</option>
                <option value="boom">Major Booms (&gt; +25%)</option>
              </select>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto pr-1">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2 px-2 font-medium">Year</th>
                  <th className="py-2 px-2 font-medium text-right">Equities (Real)</th>
                  <th className="py-2 px-2 font-medium text-right">Bonds (Real)</th>
                  <th className="py-2 px-2 font-medium text-right">CPI Inflation</th>
                  <th className="py-2 px-3 font-medium">Historical Regime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                {filteredRows.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-800/40">
                    <td className="py-1.5 px-2 font-bold text-slate-200">{row.year}</td>
                    <td className={`py-1.5 px-2 text-right font-semibold ${
                      row.equityRealReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {row.equityRealReturn >= 0 ? '+' : ''}{formatPercent(row.equityRealReturn, 1)}
                    </td>
                    <td className={`py-1.5 px-2 text-right ${
                      row.bondRealReturn >= 0 ? 'text-indigo-300' : 'text-amber-400'
                    }`}>
                      {row.bondRealReturn >= 0 ? '+' : ''}{formatPercent(row.bondRealReturn, 1)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-400">
                      {formatPercent(row.cpiInflation, 1)}
                    </td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-300">
                      {row.regimeTag ? (
                        <span className="text-cyan-300 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded text-[10px]">
                          {row.regimeTag}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
