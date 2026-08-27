/**
 * Monager Settings View (V3.2)
 * Comprehensive, organized settings center with 7 structured sections:
 * 1. Account
 * 2. Appearance
 * 3. Currency
 * 4. Notifications
 * 5. Privacy & Data
 * 6. AI
 * 7. Application
 */

import { storageService } from '../services/storage.js';
import { reminderService } from '../services/reminders.js';
import { CURRENCY_SYMBOLS, currencyService } from '../services/currency.js';
import { themeService, THEMES, ACCENT_COLORS, FONTS, DENSITIES } from '../services/theme.js';
import { authService } from '../services/auth.js';
import { openAccountModal } from './accountModal.js';
import { navigation } from './navigation.js';

let activeSection = 'account';

export function renderSettings(container) {
  const state = storageService.getState();
  const profile = state.profile || {};
  const session = authService.getSession();
  const currencyStatus = currencyService.status;

  container.innerHTML = `
    <div class="space-y-8 max-w-6xl mx-auto pb-16 animate-fade-in font-mono">
      
      <!-- Top Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Preferences & Control</span>
          <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight">Settings & Workspace</h1>
          <p class="text-xs text-slate-400 mt-0.5">Manage your account, appearance, currencies, reminders, data safety, and AI preferences.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="quick-account-btn" class="btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <span class="material-icons-outlined text-sm">account_circle</span>
            <span>${session.isSignedIn ? session.name : 'Sign In'}</span>
          </button>
        </div>
      </div>

      <!-- Settings Layout (Navigation Tabs + Content Panel) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left Side: Section Navigation Menu (4 cols) -->
        <div class="lg:col-span-4 space-y-2">
          <div class="glass-card p-3 rounded-2xl border border-white/10 space-y-1">
            <button class="settings-nav-btn w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${activeSection === 'account' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}" data-sec="account">
              <span class="material-icons-outlined text-base">person</span>
              <div class="flex-1">
                <div>Account & Identity</div>
                <div class="text-[10px] text-slate-400 font-normal">Profile, session & membership</div>
              </div>
            </button>

            <button class="settings-nav-btn w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${activeSection === 'appearance' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}" data-sec="appearance">
              <span class="material-icons-outlined text-base">palette</span>
              <div class="flex-1">
                <div>Appearance & Theme</div>
                <div class="text-[10px] text-slate-400 font-normal">Theme, accents, fonts, density</div>
              </div>
            </button>

            <button class="settings-nav-btn w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${activeSection === 'currency' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}" data-sec="currency">
              <span class="material-icons-outlined text-base">payments</span>
              <div class="flex-1">
                <div>App Currency</div>
                <div class="text-[10px] text-slate-400 font-normal">App-wide base & FX pivot</div>
              </div>
            </button>

            <button class="settings-nav-btn w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${activeSection === 'notifications' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}" data-sec="notifications">
              <span class="material-icons-outlined text-base">notifications</span>
              <div class="flex-1">
                <div>Notifications & Reminders</div>
                <div class="text-[10px] text-slate-400 font-normal">25th salary prompt & alerts</div>
              </div>
            </button>

            <button class="settings-nav-btn w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${activeSection === 'privacy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}" data-sec="privacy">
              <span class="material-icons-outlined text-base">shield</span>
              <div class="flex-1">
                <div>Privacy & Data</div>
                <div class="text-[10px] text-slate-400 font-normal">Backup, restore, and reset</div>
              </div>
            </button>

            <button class="settings-nav-btn w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${activeSection === 'ai' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}" data-sec="ai">
              <span class="material-icons-outlined text-base">smart_toy</span>
              <div class="flex-1">
                <div>Monager AI</div>
                <div class="text-[10px] text-slate-400 font-normal">Safety guardrails & history</div>
              </div>
            </button>

            <button class="settings-nav-btn w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition ${activeSection === 'application' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}" data-sec="application">
              <span class="material-icons-outlined text-base">info</span>
              <div class="flex-1">
                <div>Application</div>
                <div class="text-[10px] text-slate-400 font-normal">Version, schema & PWA state</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Right Side: Active Section Panel (8 cols) -->
        <div class="lg:col-span-8">
          <div id="settings-content-panel" class="space-y-6">
            ${renderActiveSectionContent(activeSection, state, profile, session, currencyStatus)}
          </div>
        </div>

      </div>

    </div>
  `;

  attachSettingsEvents(container);
}

function renderActiveSectionContent(section, state, profile, session, currencyStatus) {
  switch (section) {
    case 'account':
      return `
        <!-- Section 1: Account -->
        <div class="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 animate-fade-in">
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-black font-black text-lg">
                ${(session.name || 'M').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 class="text-base font-bold text-white uppercase tracking-wide">Account & Identity</h2>
                <p class="text-xs text-slate-400">User profile, session credentials, and membership tier</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              ${session.plan} MEMBER
            </span>
          </div>

          <!-- Session Status Box -->
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-semibold">Authentication Layer:</span>
              <span class="text-emerald-400 font-bold">${session.cloudAuthStatus}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-semibold">Session Status:</span>
              <span class="text-slate-200">${session.isSignedIn ? 'Signed In (Local Workspace Session)' : 'Guest Mode'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-semibold">Privacy Guarantee:</span>
              <span class="text-slate-400">Data persists in client storage; no unencrypted passwords.</span>
            </div>
          </div>

          <!-- Account Form -->
          <form id="settings-account-form" class="space-y-4 text-xs">
            <div>
              <label class="text-slate-300 block mb-1">Display Name</label>
              <input type="text" id="set-acc-name" value="${profile.name || 'Free user'}"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" required />
            </div>

            <div>
              <label class="text-slate-300 block mb-1">Email Address</label>
              <input type="email" id="set-acc-email" value="${profile.email || ''}" placeholder="e.g., your.name@example.com"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="text-slate-300 block mb-1">Gap Year Base / Location</label>
              <input type="text" id="set-acc-country" value="${profile.country || 'Colombia (Gap Year)'}"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-white/10">
              <button type="submit" class="btn-primary px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs">
                Save Account Profile
              </button>
              ${session.isSignedIn ? `
                <button type="button" id="btn-sec-signout" class="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1.5">
                  <span class="material-icons-outlined text-sm">logout</span> Sign Out
                </button>
              ` : `
                <button type="button" id="btn-sec-signin" class="btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <span class="material-icons-outlined text-sm">login</span> Sign In
                </button>
              `}
            </div>
          </form>
        </div>
      `;

    case 'appearance':
      const currentTheme = profile.theme || THEMES.DARK;
      const currentAccent = profile.accentTheme || 'emerald';
      const currentFont = profile.fontFamily || 'sans';
      const currentDensity = profile.density || 'comfortable';

      return `
        <!-- Section 2: Appearance -->
        <div class="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 animate-fade-in text-xs">
          <div class="border-b border-white/10 pb-4">
            <h2 class="text-base font-bold text-white uppercase tracking-wide">Appearance & Styling</h2>
            <p class="text-xs text-slate-400">Customize theme mode, accent highlights, typography, density, and accessibility</p>
          </div>

          <form id="settings-appearance-form" class="space-y-6">
            <!-- Theme Selection -->
            <div>
              <label class="text-slate-300 block mb-2 font-bold uppercase text-[11px] tracking-wider">Color Theme</label>
              <div class="grid grid-cols-3 gap-3">
                <label class="cursor-pointer">
                  <input type="radio" name="app-theme" value="dark" class="hidden peer" ${currentTheme === 'dark' ? 'checked' : ''} />
                  <div class="p-3 rounded-2xl border border-white/10 bg-slate-950 text-center peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 transition">
                    <span class="material-icons-outlined text-base block mb-1 text-slate-200">dark_mode</span>
                    <span class="text-xs font-bold text-white">Dark</span>
                  </div>
                </label>

                <label class="cursor-pointer">
                  <input type="radio" name="app-theme" value="light" class="hidden peer" ${currentTheme === 'light' ? 'checked' : ''} />
                  <div class="p-3 rounded-2xl border border-white/10 bg-slate-900 text-center peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 transition">
                    <span class="material-icons-outlined text-base block mb-1 text-slate-200">light_mode</span>
                    <span class="text-xs font-bold text-white">Light</span>
                  </div>
                </label>

                <label class="cursor-pointer">
                  <input type="radio" name="app-theme" value="system" class="hidden peer" ${currentTheme === 'system' ? 'checked' : ''} />
                  <div class="p-3 rounded-2xl border border-white/10 bg-slate-900 text-center peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 transition">
                    <span class="material-icons-outlined text-base block mb-1 text-slate-200">settings_suggest</span>
                    <span class="text-xs font-bold text-white">System</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Accent Color Selection -->
            <div>
              <label class="text-slate-300 block mb-2 font-bold uppercase text-[11px] tracking-wider">Accent Color</label>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                ${Object.entries(ACCENT_COLORS).map(([key, item]) => `
                  <label class="cursor-pointer">
                    <input type="radio" name="app-accent" value="${key}" class="hidden peer" ${currentAccent === key ? 'checked' : ''} />
                    <div class="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col items-center gap-1.5 peer-checked:border-white peer-checked:bg-white/10 transition text-center">
                      <div class="w-5 h-5 rounded-full" style="background: ${item.hex}; box-shadow: 0 0 10px ${item.hex}40;"></div>
                      <span class="text-[10px] text-slate-300 truncate w-full">${item.name}</span>
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Font Family Selection -->
            <div>
              <label class="text-slate-300 block mb-2 font-bold uppercase text-[11px] tracking-wider">Typography Font</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                ${Object.entries(FONTS).map(([key, item]) => `
                  <label class="cursor-pointer">
                    <input type="radio" name="app-font" value="${key}" class="hidden peer" ${currentFont === key ? 'checked' : ''} />
                    <div class="p-3 rounded-2xl border border-white/10 bg-white/[0.02] peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 transition">
                      <span class="text-xs font-bold text-white block mb-0.5">${item.name}</span>
                      <span class="text-[10px] text-slate-400 font-mono">123.45 COP</span>
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Interface Density -->
            <div>
              <label class="text-slate-300 block mb-2 font-bold uppercase text-[11px] tracking-wider">Interface Density</label>
              <div class="grid grid-cols-3 gap-3">
                ${Object.entries(DENSITIES).map(([key, item]) => `
                  <label class="cursor-pointer">
                    <input type="radio" name="app-density" value="${key}" class="hidden peer" ${currentDensity === key ? 'checked' : ''} />
                    <div class="p-3 rounded-2xl border border-white/10 bg-white/[0.02] text-center peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 transition">
                      <span class="text-xs font-bold text-white block">${item.name}</span>
                      <span class="text-[10px] text-slate-400">${item.spacing} layout</span>
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Accessibility Toggles -->
            <div>
              <label class="text-slate-300 block mb-2 font-bold uppercase text-[11px] tracking-wider">Accessibility</label>
              <div class="space-y-2">
                <div class="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <span class="font-bold text-white block">Reduced Motion</span>
                    <span class="text-[10px] text-slate-400">Minimizes smooth animations and transitions</span>
                  </div>
                  <input type="checkbox" id="set-reduced-motion" ${profile.reducedMotion ? 'checked' : ''} class="w-4 h-4 accent-emerald-500" />
                </div>

                <div class="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <span class="font-bold text-white block">High Contrast Mode</span>
                    <span class="text-[10px] text-slate-400">Increases border definitions and visual separation</span>
                  </div>
                  <input type="checkbox" id="set-high-contrast" ${profile.highContrast ? 'checked' : ''} class="w-4 h-4 accent-emerald-500" />
                </div>
              </div>
            </div>

            <button type="submit" class="btn-primary px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs">
              Apply Appearance Settings
            </button>
          </form>
        </div>
      `;

    case 'currency':
      const primCurr = profile.primaryCurrency || 'COP';
      const secCurr = profile.secondaryCurrency || 'KES';

      return `
        <!-- Section 3: Currency -->
        <div class="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 animate-fade-in text-xs">
          <div class="border-b border-white/10 pb-4">
            <h2 class="text-base font-bold text-white uppercase tracking-wide">App-Wide Currency Engine</h2>
            <p class="text-xs text-slate-400">Sets the base currency across all ledgers, budgets, goals, and analytics</p>
          </div>

          <form id="settings-currency-form" class="space-y-6">
            
            <!-- App Base Currency -->
            <div class="space-y-2">
              <label class="text-slate-300 block font-bold uppercase text-[11px] tracking-wider">
                App Primary Currency
              </label>
              <p class="text-[11px] text-slate-400 leading-relaxed">
                Changing your primary currency updates monetary calculations and displays throughout the entire Monager interface.
              </p>
              <select id="set-app-currency" class="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold focus:border-emerald-500">
                ${Object.keys(CURRENCY_SYMBOLS).map(c => `
                  <option value="${c}" ${c === primCurr ? 'selected' : ''}>
                    ${c} (${CURRENCY_SYMBOLS[c]}) — ${getCurrencyFullName(c)}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Secondary FX Pivot Currency -->
            <div class="space-y-2">
              <label class="text-slate-300 block font-bold uppercase text-[11px] tracking-wider">
                Secondary FX Pivot Currency
              </label>
              <p class="text-[11px] text-slate-400 leading-relaxed">
                Used on the Dashboard and Currency tool to provide parallel exchange estimates.
              </p>
              <select id="set-pivot-currency" class="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold focus:border-emerald-500">
                ${Object.keys(CURRENCY_SYMBOLS).map(c => `
                  <option value="${c}" ${c === secCurr ? 'selected' : ''}>
                    ${c} (${CURRENCY_SYMBOLS[c]}) — ${getCurrencyFullName(c)}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Exchange Rate Engine Status -->
            <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white">Live Rate Freshness:</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${currencyStatus === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                  ${currencyStatus}
                </span>
              </div>
              <p class="text-[10px] text-slate-400 leading-relaxed">
                FX engine queries international rate providers with offline fallback cache.
              </p>
              <div class="flex gap-2">
                <button type="button" id="btn-force-fx-refresh" class="btn-secondary px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1">
                  <span class="material-icons-outlined text-xs">sync</span> Refresh Rates
                </button>
                <button type="button" id="btn-nav-to-converter" class="btn-secondary px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1">
                  <span class="material-icons-outlined text-xs">currency_exchange</span> Open Currency Page
                </button>
              </div>
            </div>

            <button type="submit" class="btn-primary px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs">
              Save Currency Configuration
            </button>
          </form>
        </div>
      `;

    case 'notifications':
      return `
        <!-- Section 4: Notifications & Reminders -->
        <div class="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 animate-fade-in text-xs">
          <div class="border-b border-white/10 pb-4">
            <h2 class="text-base font-bold text-white uppercase tracking-wide">Notifications & Reminders</h2>
            <p class="text-xs text-slate-400">Configure payday salary allocation prompts, browser permissions, and UI sounds</p>
          </div>

          <form id="settings-notif-form" class="space-y-4">
            <!-- 25th Salary Prompt -->
            <div class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <span class="font-bold text-white block">25th Salary Inflow Check</span>
                <span class="text-[10px] text-slate-400">Prompts you on app launch on or after the 25th to allocate salary</span>
              </div>
              <input type="checkbox" id="set-salary-prompt-active" ${state.salaryReminders?.enabled !== false ? 'checked' : ''} class="w-4 h-4 accent-emerald-500" />
            </div>

            <!-- Browser Notifications -->
            <div class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <span class="font-bold text-white block">Web Browser Push Permissions</span>
                <span class="text-[10px] text-slate-400">Enables in-browser notification alerts</span>
              </div>
              <button type="button" id="btn-enable-browser-notifs" class="btn-secondary px-3 py-1.5 rounded-xl text-[11px] font-bold">
                ${profile.notificationsEnabled ? 'Permission Granted ✓' : 'Request Permission'}
              </button>
            </div>

            <!-- UI Sounds -->
            <div class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <span class="font-bold text-white block">Sound Effects</span>
                <span class="text-[10px] text-slate-400">Audio feedback on goal completions and transactions</span>
              </div>
              <input type="checkbox" id="set-sound-enabled" ${profile.soundEnabled !== false ? 'checked' : ''} class="w-4 h-4 accent-emerald-500" />
            </div>

            <!-- Haptics -->
            <div class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <span class="font-bold text-white block">Haptic Feedback</span>
                <span class="text-[10px] text-slate-400">Tactile vibration on mobile devices</span>
              </div>
              <input type="checkbox" id="set-haptics-enabled" ${profile.hapticsEnabled !== false ? 'checked' : ''} class="w-4 h-4 accent-emerald-500" />
            </div>

            <button type="submit" class="btn-primary px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs">
              Save Notification Preferences
            </button>
          </form>
        </div>
      `;

    case 'privacy':
      return `
        <!-- Section 5: Privacy & Data Management -->
        <div class="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 animate-fade-in text-xs">
          <div class="border-b border-white/10 pb-4">
            <h2 class="text-base font-bold text-white uppercase tracking-wide">Privacy & Data Management</h2>
            <p class="text-xs text-slate-400">Full control over local storage backups, JSON migration, and factory reset</p>
          </div>

          <div class="space-y-4">
            <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
              <div class="font-bold flex items-center gap-1.5">
                <span class="material-icons-outlined text-sm">lock</span>
                <span>Local-First Data Sovereignty</span>
              </div>
              <p class="text-[11px] text-slate-300 leading-relaxed">
                Your financial transactions, percentage distributions, and goals remain stored securely in your browser.
              </p>
            </div>

            <!-- Backup & Export -->
            <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <h3 class="font-bold text-white">JSON State Backup & Restore</h3>
              <p class="text-[11px] text-slate-400">
                Export a snapshot of all ledger history, goals, and customized percentage models.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <button type="button" id="btn-export-json" class="btn-secondary flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">
                  <span class="material-icons-outlined text-sm">download</span> Export JSON Backup
                </button>
                <label for="input-restore-json" class="btn-secondary flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer text-center">
                  <span class="material-icons-outlined text-sm">upload</span> Restore from JSON
                </label>
                <input type="file" id="input-restore-json" accept="application/json" class="hidden" />
              </div>
            </div>

            <!-- Factory Reset -->
            <div class="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
              <h3 class="font-bold text-rose-300">Danger Zone: Reset Database</h3>
              <p class="text-[11px] text-slate-400">
                Clears all custom expenses and restores baseline schema V4 data defaults.
              </p>
              <button type="button" id="btn-factory-reset" class="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition">
                Reset to Clean Default State
              </button>
            </div>
          </div>
        </div>
      `;

    case 'ai':
      return `
        <!-- Section 6: Monager AI -->
        <div class="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 animate-fade-in text-xs">
          <div class="border-b border-white/10 pb-4">
            <h2 class="text-base font-bold text-white uppercase tracking-wide">Monager AI Configuration</h2>
            <p class="text-xs text-slate-400">AI copilot parameters, financial mutation guardrails, and conversation history</p>
          </div>

          <div class="space-y-4">
            <!-- Safety Protocol Discloser -->
            <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 space-y-2">
              <div class="flex items-center gap-1.5 font-bold uppercase text-[11px] text-blue-300">
                <span class="material-icons-outlined text-sm">verified_user</span>
                <span>Structured Mutation Protocol</span>
              </div>
              <p class="text-[11px] text-slate-300 leading-relaxed">
                Monager AI never silently mutates financial ledgers. Every suggested expense logging, category reallocation, or goal contribution is rendered as an explicit preview requiring your <strong>[APPLY]</strong> confirmation.
              </p>
            </div>

            <!-- Chat History Management -->
            <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-bold text-white block">Conversation History</span>
                  <span class="text-[10px] text-slate-400">${state.aiChatHistory?.length || 0} messages stored</span>
                </div>
                <button type="button" id="btn-clear-ai-history" class="btn-secondary px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-400">
                  Clear AI History
                </button>
              </div>
            </div>

            <!-- Navigation Button -->
            <button type="button" id="btn-nav-to-ai" class="btn-primary w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5">
              <span class="material-icons-outlined text-sm">smart_toy</span> Open Monager AI Copilot
            </button>
          </div>
        </div>
      `;

    case 'application':
      return `
        <!-- Section 7: Application -->
        <div class="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 animate-fade-in text-xs">
          <div class="border-b border-white/10 pb-4">
            <h2 class="text-base font-bold text-white uppercase tracking-wide">Application Metadata</h2>
            <p class="text-xs text-slate-400">System build info, schema migration status, and progressive web app details</p>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <span class="text-[10px] text-slate-400 block uppercase">Product Name</span>
                <span class="text-sm font-bold text-white font-mono">MONAGER</span>
              </div>
              <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <span class="text-[10px] text-slate-400 block uppercase">Release Version</span>
                <span class="text-sm font-bold text-emerald-400 font-mono">v3.2.0</span>
              </div>
              <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <span class="text-[10px] text-slate-400 block uppercase">Storage Schema</span>
                <span class="text-sm font-bold text-white font-mono">Version 4 (V3.2)</span>
              </div>
              <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <span class="text-[10px] text-slate-400 block uppercase">PWA Service Worker</span>
                <span class="text-sm font-bold text-emerald-400 font-mono">Active / Cached</span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-relaxed">
              Monager is an intelligent money command center designed with strict local-first data privacy and percentage allocation automation.
            </div>
          </div>
        </div>
      `;

    default:
      return '';
  }
}

function getCurrencyFullName(code) {
  const names = {
    COP: 'Colombian Peso',
    KES: 'Kenyan Shilling',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    JPY: 'Japanese Yen',
    INR: 'Indian Rupee',
    ZAR: 'South African Rand',
    AED: 'UAE Dirham',
    CHF: 'Swiss Franc',
    BRL: 'Brazilian Real',
    CNY: 'Chinese Yuan',
    MXN: 'Mexican Peso'
  };
  return names[code] || code;
}

function attachSettingsEvents(container) {
  // Quick Account Modal Button in header
  container.querySelector('#quick-account-btn')?.addEventListener('click', () => {
    openAccountModal('profile');
  });

  // Section Tab Navigation
  container.querySelectorAll('.settings-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSection = btn.dataset.sec;
      renderSettings(container);
    });
  });

  // 1. Account Form
  const accountForm = container.querySelector('#settings-account-form');
  accountForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = container.querySelector('#set-acc-name').value;
    const email = container.querySelector('#set-acc-email').value;
    const country = container.querySelector('#set-acc-country').value;

    authService.updateProfile({ name, email, country, isSignedIn: true });
    alert('Account profile saved successfully.');
    renderSettings(container);
  });

  container.querySelector('#btn-sec-signout')?.addEventListener('click', () => {
    if (confirm('Sign out of your active workspace session? Your budget data will remain securely saved on this device.')) {
      authService.signOut();
      navigation.navigate('landing');
    }
  });

  container.querySelector('#btn-sec-signin')?.addEventListener('click', () => {
    openAccountModal('signin');
  });

  // 2. Appearance Form
  const appearanceForm = container.querySelector('#settings-appearance-form');
  appearanceForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const theme = appearanceForm.querySelector('input[name="app-theme"]:checked')?.value || THEMES.DARK;
    const accentTheme = appearanceForm.querySelector('input[name="app-accent"]:checked')?.value || 'emerald';
    const fontFamily = appearanceForm.querySelector('input[name="app-font"]:checked')?.value || 'sans';
    const density = appearanceForm.querySelector('input[name="app-density"]:checked')?.value || 'comfortable';
    const reducedMotion = appearanceForm.querySelector('#set-reduced-motion')?.checked || false;
    const highContrast = appearanceForm.querySelector('#set-high-contrast')?.checked || false;

    const newProfile = {
      ...(storageService.getState().profile || {}),
      theme,
      accentTheme,
      fontFamily,
      density,
      reducedMotion,
      highContrast
    };

    storageService.update(state => ({
      ...state,
      profile: newProfile
    }));

    themeService.apply(newProfile);
    alert('Appearance settings applied!');
    renderSettings(container);
  });

  // 3. Currency Form
  const currencyForm = container.querySelector('#settings-currency-form');
  currencyForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const primaryCurrency = container.querySelector('#set-app-currency').value;
    const secondaryCurrency = container.querySelector('#set-pivot-currency').value;

    storageService.update(state => ({
      ...state,
      profile: {
        ...(state.profile || {}),
        primaryCurrency,
        secondaryCurrency
      }
    }));

    alert(`Primary app currency updated to ${primaryCurrency}. All ledgers & displays updated.`);
    renderSettings(container);
  });

  container.querySelector('#btn-force-fx-refresh')?.addEventListener('click', async () => {
    await currencyService.fetchRates(true);
    alert('Exchange rates refreshed!');
    renderSettings(container);
  });

  container.querySelector('#btn-nav-to-converter')?.addEventListener('click', () => {
    navigation.navigate('currency');
  });

  // 4. Notifications Form
  const notifForm = container.querySelector('#settings-notif-form');
  notifForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const promptEnabled = container.querySelector('#set-salary-prompt-active')?.checked;
    const soundEnabled = container.querySelector('#set-sound-enabled')?.checked;
    const hapticsEnabled = container.querySelector('#set-haptics-enabled')?.checked;

    storageService.update(state => ({
      ...state,
      salaryReminders: {
        ...(state.salaryReminders || {}),
        enabled: promptEnabled
      },
      profile: {
        ...(state.profile || {}),
        soundEnabled,
        hapticsEnabled
      }
    }));

    alert('Notification preferences saved.');
    renderSettings(container);
  });

  container.querySelector('#btn-enable-browser-notifs')?.addEventListener('click', async () => {
    const res = await reminderService.requestNotificationPermission();
    alert(`Browser notification status: ${res.permission}`);
    renderSettings(container);
  });

  // 5. Privacy & Data
  container.querySelector('#btn-export-json')?.addEventListener('click', () => {
    storageService.exportData();
  });

  container.querySelector('#input-restore-json')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = storageService.importData(event.target.result);
      if (res.success) {
        alert('Data imported and migrated successfully!');
        window.location.reload();
      } else {
        alert('Import error: ' + res.error);
      }
    };
    reader.readAsText(file);
  });

  container.querySelector('#btn-factory-reset')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all data to pristine default state? This cannot be undone.')) {
      storageService.resetData();
      window.location.reload();
    }
  });

  // 6. AI
  container.querySelector('#btn-clear-ai-history')?.addEventListener('click', () => {
    if (confirm('Clear Monager AI conversation history?')) {
      storageService.update(state => ({
        ...state,
        aiChatHistory: [
          {
            role: 'model',
            text: '👋 Welcome to **Monager v3.2**. Conversation history cleared. How can I help with your financial planning today?'
          }
        ]
      }));
      alert('Conversation history cleared.');
      renderSettings(container);
    }
  });

  container.querySelector('#btn-nav-to-ai')?.addEventListener('click', () => {
    navigation.navigate('ai');
  });
}
