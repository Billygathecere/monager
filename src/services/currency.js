/**
 * Monager Currency Exchange Service
 * Manages exchange rates between COP, KES, USD, EUR, GBP, and additional currencies.
 * Provides transparent freshness states: LIVE, CACHED LIVE, FALLBACK.
 */

export const CURRENCY_SYMBOLS = {
  COP: 'COP $',
  KES: 'KES ',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  JPY: '¥',
  INR: '₹',
  ZAR: 'R ',
  AED: 'AED ',
  CHF: 'CHF ',
  BRL: 'R$',
  CNY: '¥',
  MXN: 'MX$'
};

export const FALLBACK_EXCHANGE_RATES = {
  USD: 1.0,
  COP: 4120.50,
  KES: 129.50,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 154.20,
  INR: 83.45,
  ZAR: 18.20,
  AED: 3.6725,
  CHF: 0.89,
  BRL: 5.45,
  CNY: 7.23,
  MXN: 18.15
};

class CurrencyService {
  constructor() {
    this.rates = { ...FALLBACK_EXCHANGE_RATES };
    this.status = 'FALLBACK'; // 'LIVE' | 'CACHED LIVE' | 'FALLBACK'
    this.lastUpdated = new Date().toISOString();
    this.base = 'USD';
    this.listeners = new Set();
  }

  /**
   * Fetches the latest live exchange rates from the backend.
   * @param {boolean} [forceRefresh=false]
   * @returns {Promise<Object>}
   */
  async fetchRates(forceRefresh = false) {
    try {
      const url = forceRefresh ? '/api/rates?refresh=1' : '/api/rates';
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Rates API returned status ${res.status}`);
      }

      const data = await res.json();
      if (data && data.rates) {
        this.rates = { ...FALLBACK_EXCHANGE_RATES, ...data.rates };
        this.base = data.base || 'USD';
        this.lastUpdated = data.lastUpdated || new Date().toISOString();

        if (data.isFallback) {
          this.status = 'FALLBACK';
        } else if (data.cached) {
          this.status = 'CACHED LIVE';
        } else {
          this.status = 'LIVE';
        }

        this.notify();
      }
    } catch (err) {
      console.warn('CurrencyService fetchRates error, retaining cached/fallback rates:', err.message);
      this.status = 'FALLBACK';
      this.notify();
    }

    return {
      rates: this.rates,
      status: this.status,
      lastUpdated: this.lastUpdated,
      base: this.base
    };
  }

  /**
   * Converts an amount from one currency to another using the USD pivot rate.
   * @param {number} amount
   * @param {string} fromCurrency
   * @param {string} toCurrency
   * @returns {number}
   */
  convert(amount, fromCurrency = 'COP', toCurrency = 'KES') {
    const val = Number(amount) || 0;
    if (val === 0 || fromCurrency === toCurrency) {
      return val;
    }

    const fromRate = this.rates[fromCurrency] || FALLBACK_EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = this.rates[toCurrency] || FALLBACK_EXCHANGE_RATES[toCurrency] || 1;

    // Convert from -> USD -> to
    const amountInUSD = val / fromRate;
    const converted = amountInUSD * toRate;

    return Math.round(converted * 100) / 100;
  }

  /**
   * Formats a monetary value according to standard currency conventions.
   * @param {number} amount
   * @param {string} currency
   * @param {boolean} [includeCode=true]
   * @returns {string}
   */
  format(amount, currency = 'COP', includeCode = true) {
    const val = Number(amount) || 0;
    const curr = String(currency || 'COP').toUpperCase();
    const symbol = CURRENCY_SYMBOLS[curr] || `${curr} `;

    let formattedNumber = '';
    if (curr === 'COP' || curr === 'JPY' || curr === 'KES') {
      formattedNumber = Math.round(val).toLocaleString('es-CO');
    } else {
      formattedNumber = val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    if (includeCode) {
      return `${symbol}${formattedNumber}`;
    }
    return formattedNumber;
  }

  getStatus() {
    return {
      status: this.status,
      base: this.base,
      lastUpdated: this.lastUpdated,
      rates: { ...this.rates }
    };
  }

  getExchangeRate(fromCurrency, toCurrency) {
    const fromRate = this.rates[fromCurrency] || FALLBACK_EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = this.rates[toCurrency] || FALLBACK_EXCHANGE_RATES[toCurrency] || 1;
    return toRate / fromRate;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const l of this.listeners) {
      try {
        l({
          rates: this.rates,
          status: this.status,
          lastUpdated: this.lastUpdated
        });
      } catch (e) {
        console.error(e);
      }
    }
  }
}

export const currencyService = new CurrencyService();
