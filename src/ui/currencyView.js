/**
 * Monager Currency View
 * Live Foreign Exchange Rates & Multi-Currency Converter.
 * Provides transparent freshness badges: LIVE, CACHED LIVE, or FALLBACK.
 */

import { currencyService, CURRENCY_SYMBOLS } from '../services/currency.js';
import { storageService } from '../services/storage.js';

export function renderCurrency(container) {
  const state = storageService.getState();
  const primaryCurr = state.profile?.primaryCurrency || 'COP';
  const secondaryCurr = state.profile?.secondaryCurrency || 'KES';

  let currentStatus = currencyService.status;
  let statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (currentStatus === 'CACHED LIVE') {
    statusBadgeClass = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  } else if (currentStatus === 'FALLBACK') {
    statusBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  }

  container.innerHTML = `
    <div class="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in font-mono">
      
      <!-- Top Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Foreign Exchange Engine</span>
          <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight">Currency & Multi-FX</h1>
          <p class="text-xs text-slate-400 mt-0.5">Real-time conversion between Colombian Pesos, Kenyan Shillings, US Dollars, and more.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass} flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${currentStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
            <span>${currentStatus} RATES</span>
          </div>
          <button id="refresh-rates-btn" class="btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
            <span class="material-icons-outlined text-sm">refresh</span> Refresh
          </button>
        </div>
      </div>

      <!-- Main Converter Box -->
      <div class="glass-card p-6 md:p-8 rounded-2xl border border-white/10 space-y-6">
        <div class="flex items-center gap-2">
          <span class="material-icons-outlined text-emerald-400 text-lg">sync_alt</span>
          <h2 class="text-base font-bold text-white uppercase tracking-wide">Live FX Converter</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          <!-- From Amount & Currency (5 cols) -->
          <div class="md:col-span-5 space-y-2">
            <label class="text-xs text-slate-400 block">From Amount</label>
            <div class="flex gap-2">
              <input type="number" id="fx-amount" value="1000000" min="1" step="1000"
                class="flex-1 bg-slate-900 border border-white/15 rounded-xl px-3.5 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 font-mono" />
              <select id="fx-from-curr" class="bg-slate-900 border border-white/15 rounded-xl px-3 py-3 text-sm font-bold text-white">
                ${Object.keys(CURRENCY_SYMBOLS).map(c => `
                  <option value="${c}" ${c === primaryCurr ? 'selected' : ''}>${c}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Swap Button (2 cols) -->
          <div class="md:col-span-2 flex justify-center pt-4 md:pt-6">
            <button id="fx-swap-btn" class="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition">
              <span class="material-icons-outlined">swap_horiz</span>
            </button>
          </div>

          <!-- To Converted Amount & Currency (5 cols) -->
          <div class="md:col-span-5 space-y-2">
            <label class="text-xs text-slate-400 block">Converted Result</label>
            <div class="flex gap-2">
              <div id="fx-result" class="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-3.5 py-3 text-lg font-bold text-emerald-400 font-mono flex items-center">
                --
              </div>
              <select id="fx-to-curr" class="bg-slate-900 border border-white/15 rounded-xl px-3 py-3 text-sm font-bold text-white">
                ${Object.keys(CURRENCY_SYMBOLS).map(c => `
                  <option value="${c}" ${c === secondaryCurr ? 'selected' : ''}>${c}</option>
                `).join('')}
              </select>
            </div>
          </div>

        </div>

        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400">
          <div id="fx-rate-preview">1 COP = 0.0314 KES (USD Pivot)</div>
          <div class="text-[11px] text-slate-500 mt-1 sm:mt-0">Last updated: ${new Date(currencyService.lastUpdated).toLocaleTimeString()}</div>
        </div>
      </div>

      <!-- Quick Benchmark Rates Grid -->
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Core Gap-Year FX Matrix</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span class="text-[11px] text-slate-400">1 USD to COP</span>
            <div class="text-sm font-bold text-white mt-1">
              ${currencyService.format(currencyService.rates.COP || 4120.5, 'COP')}
            </div>
          </div>

          <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span class="text-[11px] text-slate-400">1 USD to KES</span>
            <div class="text-sm font-bold text-white mt-1">
              ${currencyService.format(currencyService.rates.KES || 129.5, 'KES')}
            </div>
          </div>

          <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span class="text-[11px] text-slate-400">100,000 COP in KES</span>
            <div class="text-sm font-bold text-emerald-400 mt-1">
              ${currencyService.format(currencyService.convert(100000, 'COP', 'KES'), 'KES')}
            </div>
          </div>

          <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span class="text-[11px] text-slate-400">1,000,000 COP in USD</span>
            <div class="text-sm font-bold text-blue-400 mt-1">
              ${currencyService.format(currencyService.convert(1000000, 'COP', 'USD'), 'USD')}
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  attachCurrencyEvents(container);
}

function attachCurrencyEvents(container) {
  const amountInput = container.querySelector('#fx-amount');
  const fromSelect = container.querySelector('#fx-from-curr');
  const toSelect = container.querySelector('#fx-to-curr');
  const resultDisplay = container.querySelector('#fx-result');
  const swapBtn = container.querySelector('#fx-swap-btn');
  const preview = container.querySelector('#fx-rate-preview');
  const refreshBtn = container.querySelector('#refresh-rates-btn');

  function calculate() {
    const amt = Number(amountInput?.value) || 0;
    const from = fromSelect?.value || 'COP';
    const to = toSelect?.value || 'KES';

    const converted = currencyService.convert(amt, from, to);
    if (resultDisplay) {
      resultDisplay.textContent = currencyService.format(converted, to);
    }

    const unitRate = currencyService.convert(1, from, to);
    if (preview) {
      preview.textContent = `1 ${from} = ${currencyService.format(unitRate, to)} (USD Pivot Calculation)`;
    }
  }

  calculate();

  amountInput?.addEventListener('input', calculate);
  fromSelect?.addEventListener('change', calculate);
  toSelect?.addEventListener('change', calculate);

  swapBtn?.addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    calculate();
  });

  refreshBtn?.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = `<span class="material-icons-outlined text-sm animate-spin">refresh</span> Updating...`;
    await currencyService.fetchRates(true);
    renderCurrency(container);
  });
}
