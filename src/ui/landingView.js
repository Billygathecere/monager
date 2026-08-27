/**
 * Monager Public Landing & Welcome Experience (V3.2)
 * Renders the public landing hero, 6 core feature highlights,
 * fictional demonstration product preview, and interactive 4-step onboarding wizard.
 * Zero private user financial data is exposed.
 */

import { authService } from '../services/auth.js';
import { navigation } from './navigation.js';
import { openAccountModal } from './accountModal.js';
import { CURRENCY_SYMBOLS } from '../services/currency.js';
import { DEFAULT_ALLOCATION_PERCENTAGES } from '../domain/finance.js';

export function renderLanding(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-16 md:space-y-24 animate-fade-in font-mono pb-12">
      
      <!-- HERO SECTION -->
      <section class="text-center max-w-4xl mx-auto pt-4 md:pt-10 space-y-6">
        <!-- Eyebrow Badge -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Next-Generation Personal Money Manager</span>
        </div>

        <!-- Main Title / Tagline -->
        <div class="space-y-3">
          <h1 class="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Your money. <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">Your plan.</span> Your future.
          </h1>
          <p class="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
            A smart personal money manager that helps you understand your spending, plan your goals, and make better decisions with your money.
          </p>
        </div>

        <!-- Hero CTAs -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button id="landing-hero-get-started-btn" class="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer">
            <span>Get Started</span>
            <span class="material-icons-outlined text-base">arrow_forward</span>
          </button>
          
          <button id="landing-hero-signin-btn" class="btn-secondary w-full sm:w-auto px-7 py-3.5 rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
            <span class="material-icons-outlined text-base text-slate-400">login</span>
            <span>Sign In</span>
          </button>
        </div>

        <!-- Privacy & Value Trust Badges -->
        <div class="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-slate-400 font-mono">
          <div class="flex items-center gap-1.5">
            <span class="material-icons-outlined text-emerald-400 text-sm">lock</span>
            <span>100% Local-First Privacy</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-icons-outlined text-emerald-400 text-sm">pie_chart</span>
            <span>Automated Percentage Buckets</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-icons-outlined text-emerald-400 text-sm">currency_exchange</span>
            <span>Global Multi-Currency FX</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-icons-outlined text-emerald-400 text-sm">smart_toy</span>
            <span>Intelligent AI Financial Assistant</span>
          </div>
        </div>
      </section>

      <!-- DEMONSTRATION PRODUCT PREVIEW (Zero Private User Data) -->
      <section class="max-w-5xl mx-auto">
        <div class="text-center mb-6 space-y-1">
          <span class="text-xs uppercase tracking-widest text-emerald-400 font-bold">Interactive Product Preview</span>
          <h2 class="text-xl md:text-2xl font-bold text-white tracking-tight">The Modern Command Center for Your Finances</h2>
        </div>

        <!-- Mock Dashboard Window Frame -->
        <div class="glass-card rounded-3xl border border-white/15 p-4 sm:p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <!-- Background Glow Accent -->
          <div class="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Mock Header Bar -->
          <div class="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500/70"></div>
              <div class="w-3 h-3 rounded-full bg-amber-500/70"></div>
              <div class="w-3 h-3 rounded-full bg-emerald-500/70"></div>
              <span class="ml-2 text-slate-400 text-[11px] hidden sm:inline font-mono">monager.app / dashboard / demonstration</span>
            </div>
            <div class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              DEMO PREVIEW • SAFE DATA
            </div>
          </div>

          <!-- Top Metric Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Health Score -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-1">
              <div class="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Financial Health</span>
                <span class="material-icons-outlined text-emerald-400 text-sm">favorite</span>
              </div>
              <div class="text-2xl font-black text-white">94<span class="text-xs text-slate-400 font-normal"> / 100</span></div>
              <div class="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span>●</span> Excellent Disciplined Plan
              </div>
            </div>

            <!-- Available Cash Balance -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-1">
              <div class="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Cash Balance</span>
                <span class="material-icons-outlined text-blue-400 text-sm">account_balance</span>
              </div>
              <div class="text-2xl font-black text-emerald-400">$3,450.00</div>
              <div class="text-[10px] text-slate-400">
                Inflow: $4,200.00 • Net: +$820
              </div>
            </div>

            <!-- Monthly Living Outflow -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-1">
              <div class="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Spent This Month</span>
                <span class="material-icons-outlined text-amber-400 text-sm">payments</span>
              </div>
              <div class="text-2xl font-black text-white">$1,630.00</div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div class="bg-amber-400 h-full rounded-full" style="width: 58%"></div>
              </div>
            </div>

            <!-- Goal Savings Pace -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-1">
              <div class="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Active Goals Pace</span>
                <span class="material-icons-outlined text-purple-400 text-sm">flag</span>
              </div>
              <div class="text-2xl font-black text-purple-300">88% Pace</div>
              <div class="text-[10px] text-emerald-400 font-bold">
                ✓ On Track for Target Dates
              </div>
            </div>

          </div>

          <!-- Middle Split: Allocation Buckets & AI Insight Preview -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            <!-- Allocation Buckets -->
            <div class="lg:col-span-2 p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-200">Automated Percentage Buckets</span>
                <span class="text-[10px] text-slate-400">Rule: 50 / 20 / 15 / 15</span>
              </div>

              <div class="space-y-2 text-xs">
                <div>
                  <div class="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Living & Essentials (50%)</span>
                    <span class="font-bold text-white">$1,250 / $2,100</span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-blue-400 h-full rounded-full" style="width: 60%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Savings & Growth (20%)</span>
                    <span class="font-bold text-emerald-400">$840 / $840 (100%)</span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-emerald-400 h-full rounded-full" style="width: 100%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Future Safety Buffer (15%)</span>
                    <span class="font-bold text-amber-300">$630 / $630</span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-amber-400 h-full rounded-full" style="width: 100%"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Financial Assistant Card -->
            <div class="p-4 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900/90 border border-blue-500/20 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase mb-2">
                  <span class="material-icons-outlined text-sm">smart_toy</span>
                  <span>Monager AI Copilot</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">
                  "You have <strong class="text-emerald-400">$380 surplus buffer</strong> remaining this month. Safe to allocate +$150 to your Emergency Fund without affecting upcoming rent."
                </p>
              </div>

              <button id="landing-preview-try-btn" class="btn-accent w-full py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Start Your Financial Plan</span>
                <span class="material-icons-outlined text-sm">arrow_forward</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      <!-- 6 CORE FEATURES INTRODUCTION -->
      <section class="max-w-6xl mx-auto space-y-8">
        <div class="text-center space-y-2">
          <span class="text-xs uppercase tracking-widest text-emerald-400 font-bold">Comprehensive Capabilities</span>
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Everything You Need to Master Your Money</h2>
          <p class="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-sans">
            Built with mathematical precision, instant currency conversion, and intelligent planning tools.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          <!-- 1. Money Management -->
          <div class="glass-card p-6 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition space-y-3 group">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-200">
              💰
            </div>
            <h3 class="text-base font-bold text-white group-hover:text-emerald-400 transition">Money Management</h3>
            <p class="text-xs text-slate-300 font-sans leading-relaxed">
              Organize income streams, automate percentage-based salary allocations across customizable buckets, and track daily spending with zero friction.
            </p>
          </div>

          <!-- 2. Goals -->
          <div class="glass-card p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition space-y-3 group">
            <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-200">
              🎯
            </div>
            <h3 class="text-base font-bold text-white group-hover:text-blue-400 transition">Goals & Target Velocity</h3>
            <p class="text-xs text-slate-300 font-sans leading-relaxed">
              Create financial milestones with target dates. Track your real savings velocity and receive proactive analysis if your pace falls behind.
            </p>
          </div>

          <!-- 3. Monager AI -->
          <div class="glass-card p-6 rounded-2xl border border-white/10 hover:border-purple-500/30 transition space-y-3 group">
            <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-200">
              🧠
            </div>
            <h3 class="text-base font-bold text-white group-hover:text-purple-400 transition">Monager AI</h3>
            <p class="text-xs text-slate-300 font-sans leading-relaxed">
              Ask questions about your finances in natural language. Get structured budget audits, expense reduction tips, and safe allocation advice.
            </p>
          </div>

          <!-- 4. Analytics -->
          <div class="glass-card p-6 rounded-2xl border border-white/10 hover:border-amber-500/30 transition space-y-3 group">
            <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-200">
              📊
            </div>
            <h3 class="text-base font-bold text-white group-hover:text-amber-400 transition">Analytics & Trends</h3>
            <p class="text-xs text-slate-300 font-sans leading-relaxed">
              Visualize spending trends, compare budget limits against actual consumption, and measure month-over-month cash flow health.
            </p>
          </div>

          <!-- 5. Can I Afford This? -->
          <div class="glass-card p-6 rounded-2xl border border-white/10 hover:border-teal-500/30 transition space-y-3 group">
            <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-200">
              🛒
            </div>
            <h3 class="text-base font-bold text-white group-hover:text-teal-400 transition">Can I Afford This?</h3>
            <p class="text-xs text-slate-300 font-sans leading-relaxed">
              Instantly test potential purchases against your liquid cash balance, emergency buffer, and upcoming goals before spending.
            </p>
          </div>

          <!-- 6. Multi-Currency -->
          <div class="glass-card p-6 rounded-2xl border border-white/10 hover:border-pink-500/30 transition space-y-3 group">
            <div class="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-200">
              💱
            </div>
            <h3 class="text-base font-bold text-white group-hover:text-pink-400 transition">Multi-Currency Engine</h3>
            <p class="text-xs text-slate-300 font-sans leading-relaxed">
              Operate in COP, KES, USD, EUR, GBP, CAD, or any global currency. Convert exchange values live with offline fallback resilience.
            </p>
          </div>

        </div>
      </section>

      <!-- BOTTOM CTA BANNER -->
      <section class="max-w-4xl mx-auto glass-card rounded-3xl border border-emerald-500/30 p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
        <div class="space-y-2">
          <h2 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Take Control of Your Financial Future?
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-sans">
            Set up your custom allocation buckets and initial goals in under 60 seconds. No credit card, no bank passwords.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button id="landing-footer-get-started-btn" class="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20">
            <span>Get Started Free</span>
            <span class="material-icons-outlined text-base">arrow_forward</span>
          </button>
          
          <button id="landing-footer-signin-btn" class="btn-secondary w-full sm:w-auto px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
            <span>Sign In to Existing Workspace</span>
          </button>
        </div>
      </section>

      <!-- ONBOARDING MODAL CONTAINER -->
      <div id="onboarding-modal-overlay" class="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
        <!-- Injected dynamically by openOnboardingModal -->
      </div>

    </div>
  `;

  attachLandingEventListeners(container);
}

function attachLandingEventListeners(container) {
  // Get Started triggers
  const getStartedBtns = [
    container.querySelector('#landing-hero-get-started-btn'),
    container.querySelector('#landing-preview-try-btn'),
    container.querySelector('#landing-footer-get-started-btn')
  ];

  getStartedBtns.forEach(btn => {
    btn?.addEventListener('click', () => {
      openOnboardingModal();
    });
  });

  // Sign In triggers
  const signInBtns = [
    container.querySelector('#landing-hero-signin-btn'),
    container.querySelector('#landing-footer-signin-btn')
  ];

  signInBtns.forEach(btn => {
    btn?.addEventListener('click', () => {
      openAccountModal('signin');
    });
  });
}

/**
 * Interactive 4-Step "Get Started" Onboarding Wizard
 */
export function openOnboardingModal() {
  const overlay = document.getElementById('onboarding-modal-overlay') || createOverlayElement();
  overlay.classList.remove('hidden');

  let currentStep = 1;
  const onboardingData = {
    name: '',
    email: '',
    primaryCurrency: 'COP',
    salary: 2300000,
    initialGoal: {
      name: 'Emergency Safety Net',
      targetAmount: 5000000,
      category: 'Emergency',
      deadline: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
    }
  };

  function renderStep() {
    overlay.innerHTML = `
      <div class="glass-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl font-mono space-y-6 relative animate-fade-in">
        
        <!-- Header & Step Indicator -->
        <div class="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span class="text-xs uppercase tracking-wider text-emerald-400 font-bold">Monager Setup Wizard</span>
            </div>
            <h3 class="text-lg sm:text-xl font-black text-white mt-0.5">
              ${getStepTitle(currentStep)}
            </h3>
          </div>
          
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold ${currentStep >= 1 ? 'text-emerald-400' : 'text-slate-600'}">1</span>
            <span class="text-slate-600">/</span>
            <span class="text-xs font-bold ${currentStep >= 2 ? 'text-emerald-400' : 'text-slate-600'}">2</span>
            <span class="text-slate-600">/</span>
            <span class="text-xs font-bold ${currentStep >= 3 ? 'text-emerald-400' : 'text-slate-600'}">3</span>
            <span class="text-slate-600">/</span>
            <span class="text-xs font-bold ${currentStep >= 4 ? 'text-emerald-400' : 'text-slate-600'}">4</span>
          </div>
        </div>

        <!-- Dynamic Step Content -->
        <div class="space-y-4 text-xs">
          ${renderStepContent(currentStep, onboardingData)}
        </div>

        <!-- Stepper Navigation Controls -->
        <div class="flex items-center justify-between pt-4 border-t border-white/10 gap-3">
          ${currentStep > 1 ? `
            <button id="onboarding-prev-btn" class="btn-secondary px-4 py-2.5 rounded-xl font-bold flex items-center gap-1">
              <span class="material-icons-outlined text-sm">arrow_back</span>
              <span>Back</span>
            </button>
          ` : `
            <button id="onboarding-cancel-btn" class="btn-secondary px-4 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white">
              Cancel
            </button>
          `}

          <div class="flex items-center gap-2">
            ${currentStep < 4 ? `
              <button id="onboarding-skip-btn" class="text-slate-400 hover:text-white text-xs px-3 py-2 font-mono">
                Skip Optional
              </button>
              <button id="onboarding-next-btn" class="btn-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <span>Continue</span>
                <span class="material-icons-outlined text-sm">arrow_forward</span>
              </button>
            ` : `
              <button id="onboarding-finish-btn" class="btn-primary px-7 py-3 rounded-xl font-black flex items-center gap-2 uppercase tracking-wider shadow-lg shadow-emerald-500/25">
                <span class="material-icons-outlined text-base">check_circle</span>
                <span>Build My Plan</span>
              </button>
            `}
          </div>
        </div>

      </div>
    `;

    attachStepEvents(overlay, currentStep, onboardingData, {
      goToStep: (s) => { currentStep = s; renderStep(); },
      close: () => overlay.classList.add('hidden'),
      finish: () => {
        authService.completeOnboarding(onboardingData);
        overlay.classList.add('hidden');
        navigation.navigate('dashboard');
      }
    });
  }

  renderStep();
}

function createOverlayElement() {
  let overlay = document.getElementById('onboarding-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'onboarding-modal-overlay';
    overlay.className = 'fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4';
    document.body.appendChild(overlay);
  }
  return overlay;
}

function getStepTitle(step) {
  switch (step) {
    case 1: return 'Welcome to Monager';
    case 2: return 'Primary App Currency';
    case 3: return 'Typical Monthly Income';
    case 4: return 'Initial Financial Goal';
    default: return 'Setup';
  }
}

function renderStepContent(step, data) {
  switch (step) {
    case 1:
      return `
        <div class="space-y-4">
          <p class="text-slate-300 font-sans leading-relaxed text-xs">
            Let's personalize your private workspace. Your credentials and ledger remain saved locally on your device.
          </p>

          <div class="space-y-3">
            <div>
              <label class="text-slate-300 block mb-1 font-bold">Your Name / Display Name</label>
              <input type="text" id="ob-name" value="${data.name || ''}" placeholder="e.g., Alex Kim"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono" />
            </div>

            <div>
              <label class="text-slate-300 block mb-1">Email Address <span class="text-slate-500 text-[10px] font-normal">(Optional, for workspace identity)</span></label>
              <input type="email" id="ob-email" value="${data.email || ''}" placeholder="e.g., alex@example.com"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono" />
            </div>
          </div>
        </div>
      `;

    case 2:
      return `
        <div class="space-y-4">
          <p class="text-slate-300 font-sans leading-relaxed text-xs">
            Choose your main base currency for income distribution, spending logs, and goals pacing.
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            ${[
              { code: 'COP', label: 'COP - Colombian Peso', icon: '🇨🇴' },
              { code: 'KES', label: 'KES - Kenyan Shilling', icon: '🇰🇪' },
              { code: 'USD', label: 'USD - US Dollar', icon: '🇺🇸' },
              { code: 'EUR', label: 'EUR - Euro', icon: '🇪🇺' },
              { code: 'GBP', label: 'GBP - British Pound', icon: '🇬🇧' },
              { code: 'CAD', label: 'CAD - Canadian Dollar', icon: '🇨🇦' }
            ].map(c => `
              <button type="button" class="ob-currency-opt p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                data.primaryCurrency === c.code 
                  ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                  : 'bg-slate-900 border-white/10 text-slate-300 hover:border-white/30'
              }" data-code="${c.code}">
                <div class="flex items-center justify-between">
                  <span class="text-lg">${c.icon}</span>
                  <span class="text-xs font-bold">${c.code}</span>
                </div>
                <span class="text-[10px] text-slate-400 mt-2 line-clamp-1">${c.label.split(' - ')[1]}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;

    case 3:
      const sym = CURRENCY_SYMBOLS[data.primaryCurrency] || '$';
      return `
        <div class="space-y-4">
          <p class="text-slate-300 font-sans leading-relaxed text-xs">
            What is your typical monthly income or salary? Monager will automatically calculate your initial 50 / 20 / 15 / 15 budget buckets.
          </p>

          <div class="p-4 rounded-2xl bg-slate-900 border border-white/15 space-y-3">
            <label class="text-slate-300 block font-bold">Monthly Inflow Amount (${data.primaryCurrency})</label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-emerald-400 font-bold text-sm">${sym}</span>
              <input type="number" id="ob-salary" value="${data.salary}" min="1" step="100"
                class="w-full bg-slate-950 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 font-mono" />
            </div>

            <!-- Quick Presets -->
            <div class="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span>Quick Presets:</span>
              ${data.primaryCurrency === 'COP' ? `
                <button type="button" class="ob-preset-btn px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200" data-val="1500000">1.5M</button>
                <button type="button" class="ob-preset-btn px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200" data-val="2300000">2.3M</button>
                <button type="button" class="ob-preset-btn px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200" data-val="3500000">3.5M</button>
              ` : `
                <button type="button" class="ob-preset-btn px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200" data-val="2500">2,500</button>
                <button type="button" class="ob-preset-btn px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200" data-val="4000">4,000</button>
                <button type="button" class="ob-preset-btn px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200" data-val="6000">6,000</button>
              `}
            </div>
          </div>
        </div>
      `;

    case 4:
      return `
        <div class="space-y-4">
          <p class="text-slate-300 font-sans leading-relaxed text-xs">
            Set your first financial milestone. Monager will calculate your monthly required contribution and savings pace.
          </p>

          <div class="space-y-3">
            <div>
              <label class="text-slate-300 block mb-1 font-bold">Goal Name</label>
              <input type="text" id="ob-goal-name" value="${data.initialGoal?.name || 'Emergency Safety Net'}"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-slate-300 block mb-1 font-bold">Target Amount (${data.primaryCurrency})</label>
                <input type="number" id="ob-goal-target" value="${data.initialGoal?.targetAmount || (data.primaryCurrency === 'COP' ? 5000000 : 5000)}" min="1"
                  class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono" />
              </div>
              <div>
                <label class="text-slate-300 block mb-1 font-bold">Target Horizon (Months)</label>
                <select id="ob-goal-horizon" class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white">
                  <option value="3">3 Months (Short-term)</option>
                  <option value="6" selected>6 Months (Medium-term)</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (Long-term)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `;
  }
}

function attachStepEvents(overlay, step, data, controller) {
  // Capture current step inputs before moving
  function saveCurrentStepData() {
    if (step === 1) {
      const nameInput = overlay.querySelector('#ob-name');
      const emailInput = overlay.querySelector('#ob-email');
      if (nameInput) data.name = nameInput.value.trim() || 'Free user';
      if (emailInput) data.email = emailInput.value.trim();
    } else if (step === 2) {
      // currency handled via button clicks
    } else if (step === 3) {
      const salInput = overlay.querySelector('#ob-salary');
      if (salInput) data.salary = Number(salInput.value) || 2300000;
    } else if (step === 4) {
      const gName = overlay.querySelector('#ob-goal-name')?.value;
      const gTarget = Number(overlay.querySelector('#ob-goal-target')?.value) || 5000000;
      const horizonMonths = Number(overlay.querySelector('#ob-goal-horizon')?.value) || 6;
      
      data.initialGoal = {
        name: gName || 'Emergency Safety Net',
        targetAmount: gTarget,
        currentAmount: 0,
        category: 'Emergency',
        deadline: new Date(Date.now() + horizonMonths * 30 * 86400000).toISOString().split('T')[0]
      };
    }
  }

  // Currency buttons in step 2
  overlay.querySelectorAll('.ob-currency-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      data.primaryCurrency = btn.dataset.code;
      // adjust default salary if switching between COP and major currencies
      if (data.primaryCurrency === 'COP') {
        data.salary = 2300000;
      } else if (['USD', 'EUR', 'GBP', 'CAD'].includes(data.primaryCurrency)) {
        data.salary = 3500;
      } else if (data.primaryCurrency === 'KES') {
        data.salary = 85000;
      }
      controller.goToStep(2);
    });
  });

  // Salary preset buttons in step 3
  overlay.querySelectorAll('.ob-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = Number(btn.dataset.val);
      const salInput = overlay.querySelector('#ob-salary');
      if (salInput) salInput.value = val;
      data.salary = val;
    });
  });

  // Buttons
  overlay.querySelector('#onboarding-cancel-btn')?.addEventListener('click', controller.close);
  
  overlay.querySelector('#onboarding-prev-btn')?.addEventListener('click', () => {
    saveCurrentStepData();
    controller.goToStep(step - 1);
  });

  overlay.querySelector('#onboarding-skip-btn')?.addEventListener('click', () => {
    saveCurrentStepData();
    if (step < 4) controller.goToStep(step + 1);
  });

  overlay.querySelector('#onboarding-next-btn')?.addEventListener('click', () => {
    saveCurrentStepData();
    controller.goToStep(step + 1);
  });

  overlay.querySelector('#onboarding-finish-btn')?.addEventListener('click', () => {
    saveCurrentStepData();
    controller.finish();
  });
}
