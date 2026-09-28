import React, { useState } from 'react';
import { FederalFilingStatus, PayFrequency, UtahTaxMethod } from '../types/payroll';
import { calculateUtahStateTax, formatCurrency, formatNumber, PAY_PERIODS_PER_YEAR, UTAH_TAX_RATES } from '../utils/taxCalculator';
import { Calculator, ExternalLink, ShieldCheck, CheckCircle } from 'lucide-react';

export const UtahTaxInspector: React.FC = () => {
  const [testGross, setTestGross] = useState<number>(3500);
  const [testFrequency, setTestFrequency] = useState<PayFrequency>('biweekly');
  const [testStatus, setTestStatus] = useState<FederalFilingStatus>('married_filing_jointly');
  const [testMethod, setTestMethod] = useState<UtahTaxMethod>('formula');
  const [testAllowances, setTestAllowances] = useState<number>(2);
  const [testExtra, setTestExtra] = useState<number>(0);

  const breakdown = calculateUtahStateTax(
    testGross,
    testFrequency,
    testStatus,
    testMethod,
    testAllowances,
    testExtra
  );

  const periods = PAY_PERIODS_PER_YEAR[testFrequency];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-neutral-900 to-neutral-900 text-white rounded-2xl p-6 sm:p-8 border border-emerald-900/40 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-emerald-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Utah State Tax Commission (Tax Code § 59-10-104)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Utah Automated State Tax Calculation Engine
          </h2>
          <p className="text-neutral-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Utah imposes a statutory flat individual income tax rate of <strong className="text-emerald-400">4.55%</strong> with a unique state <strong className="text-white">Taxpayer Tax Credit</strong> mechanism (Form TC-15). Our calculation engine computes both the exact Utah TC-15 percentage withholding formula and small-business flat withholding.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-800 text-xs">
          <div>
            <span className="text-neutral-400 block text-[11px]">Utah Flat Rate</span>
            <span className="font-mono font-bold text-lg text-emerald-400">4.55%</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px]">Taxpayer Credit Factor</span>
            <span className="font-mono font-bold text-lg text-white">6.00%</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px]">Phaseout Threshold (MFJ)</span>
            <span className="font-mono font-bold text-lg text-white">$33,120</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px]">Local County Tax</span>
            <span className="font-mono font-bold text-lg text-emerald-400">0.00% (None)</span>
          </div>
        </div>
      </div>

      {/* Interactive Simulator Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-neutral-900 text-sm">Utah Withholding Simulator</h3>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              Pay Period Taxable Gross ($)
            </label>
            <input
              type="number"
              step="50"
              value={testGross}
              onChange={(e) => setTestGross(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 font-mono text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Pay Frequency</label>
              <select
                value={testFrequency}
                onChange={(e) => setTestFrequency(e.target.value as PayFrequency)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-800"
              >
                <option value="biweekly">Bi-Weekly (26/yr)</option>
                <option value="semimonthly">Semi-Monthly (24/yr)</option>
                <option value="weekly">Weekly (52/yr)</option>
                <option value="monthly">Monthly (12/yr)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Filing Status</label>
              <select
                value={testStatus}
                onChange={(e) => setTestStatus(e.target.value as FederalFilingStatus)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-800"
              >
                <option value="married_filing_jointly">Married Jointly</option>
                <option value="single">Single / Separate</option>
                <option value="head_of_household">Head of Household</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Calculation Method</label>
              <select
                value={testMethod}
                onChange={(e) => setTestMethod(e.target.value as UtahTaxMethod)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-800"
              >
                <option value="formula">TC-15 Formula (Credit)</option>
                <option value="flat_455">Flat 4.55%</option>
                <option value="flat_465">Flat 4.65%</option>
                <option value="exempt">Exempt</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Utah Allowances</label>
              <input
                type="number"
                min="0"
                max="10"
                value={testAllowances}
                onChange={(e) => setTestAllowances(parseInt(e.target.value) || 0)}
                disabled={testMethod !== 'formula'}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-mono text-neutral-900 disabled:bg-neutral-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              Additional Voluntary State Withholding ($)
            </label>
            <input
              type="number"
              min="0"
              value={testExtra}
              onChange={(e) => setTestExtra(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-mono text-neutral-900"
            />
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-[11px] text-neutral-600 block">Annualized Taxable Wages:</span>
            <span className="font-mono font-bold text-neutral-900 text-sm">
              {formatCurrency(testGross * periods)} ({periods} periods × {formatCurrency(testGross)})
            </span>
          </div>
        </div>

        {/* Step-by-Step Mathematical Transparency */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4 text-xs">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm">Official Utah Withholding Breakdown</h3>
              <p className="text-[11px] text-neutral-500">{breakdown.methodDescription}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Period Withholding</span>
              <span className="font-mono font-extrabold text-xl text-emerald-700">
                {formatCurrency(breakdown.finalPeriodTax)}
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono">
            {/* Step 1 */}
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="flex justify-between font-sans text-neutral-800 font-semibold mb-1">
                <span>Step 1: Baseline Utah State Tax</span>
                <span>4.55% Statutory</span>
              </div>
              <p className="text-[11px] font-sans text-neutral-600 mb-1.5">
                Annual Taxable Wages (${formatNumber(breakdown.annualizedGross, 2)}) × 4.55%
              </p>
              <div className="flex justify-between text-neutral-900 font-bold border-t border-neutral-200 pt-1">
                <span>Initial Annual Utah Tax:</span>
                <span>{formatCurrency(breakdown.initialTaxAnnual)}</span>
              </div>
            </div>

            {/* Step 2 */}
            {testMethod === 'formula' && (
              <>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <div className="flex justify-between font-sans text-neutral-800 font-semibold mb-1">
                    <span>Step 2: Utah Taxpayer Credit (TC-15)</span>
                    <span>6.0% Credit Rate</span>
                  </div>
                  <p className="text-[11px] font-sans text-neutral-600 mb-1.5">
                    Standard Base (${formatNumber(UTAH_TAX_RATES.standardBase[testStatus])}) + Allowances ({testAllowances} × $2,040) = ${formatNumber(UTAH_TAX_RATES.standardBase[testStatus] + testAllowances * 2040)} × 6%
                  </p>
                  <div className="flex justify-between text-neutral-900 font-bold border-t border-neutral-200 pt-1">
                    <span>Base Taxpayer Credit:</span>
                    <span>{formatCurrency(breakdown.taxpayerCreditAnnual)}</span>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <div className="flex justify-between font-sans text-neutral-800 font-semibold mb-1">
                    <span>Step 3: Credit Phaseout Reduction</span>
                    <span>1.3¢ per $1 Excess</span>
                  </div>
                  <p className="text-[11px] font-sans text-neutral-600 mb-1.5">
                    Annual Gross over ${formatNumber(UTAH_TAX_RATES.phaseoutThresholds[testStatus])} threshold × 1.3% phaseout factor
                  </p>
                  <div className="flex justify-between text-rose-700 font-bold border-t border-neutral-200 pt-1">
                    <span>Phaseout Reduction:</span>
                    <span>-{formatCurrency(breakdown.creditPhaseoutAnnual)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                  <div className="flex justify-between font-sans text-emerald-950 font-semibold mb-1">
                    <span>Step 4: Net Annual Utah Tax</span>
                    <span>Final State Obligation</span>
                  </div>
                  <p className="text-[11px] font-sans text-emerald-800 mb-1.5">
                    Initial Tax ({formatCurrency(breakdown.initialTaxAnnual)}) - Net Credit ({formatCurrency(breakdown.netCreditAnnual)})
                  </p>
                  <div className="flex justify-between text-emerald-900 font-bold border-t border-emerald-200 pt-1">
                    <span>Annual Utah Tax Due:</span>
                    <span>{formatCurrency(breakdown.finalTaxAnnual)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Step 5 */}
            <div className="p-4 bg-neutral-900 text-white rounded-lg">
              <div className="flex justify-between items-center font-sans mb-1">
                <span className="text-neutral-300 font-semibold">Pay Period Withholding:</span>
                <span className="text-xs text-neutral-400 font-mono">÷ {periods} periods</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs text-neutral-400">Total Utah SIT to Withhold:</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {formatCurrency(breakdown.finalPeriodTax)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-neutral-500 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              100% compliant with 2026 Utah State Tax Commission rules
            </span>
            <a
              href="https://tax.utah.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-medium"
            >
              <span>tax.utah.gov</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
