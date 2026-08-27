/**
 * Monager Main Frontend Entry Point (v3.2.0)
 * Mounts navigation, public landing page, interactive onboarding,
 * page views, 25th salary prompt modal, reactive state subscriptions,
 * and currency initialization.
 */

import { navigation, NAV_PAGES } from './ui/navigation.js';
import { storageService } from './services/storage.js';
import { currencyService } from './services/currency.js';
import { reminderService } from './services/reminders.js';
import { themeService } from './services/theme.js';
import { authService } from './services/auth.js';
import { openAccountModal } from './ui/accountModal.js';
import { renderLanding, openOnboardingModal } from './ui/landingView.js';

import { renderDashboard } from './ui/dashboardView.js';
import { renderMoney } from './ui/moneyView.js';
import { renderGoals } from './ui/goalsView.js';
import { renderAffordability } from './ui/affordabilityView.js';
import { renderAnalytics } from './ui/analyticsView.js';
import { renderCurrency } from './ui/currencyView.js';
import { renderAI } from './ui/aiView.js';
import { renderSettings } from './ui/settingsView.js';

class App {
  constructor() {
    this.container = document.getElementById('app-view-container');
    this.salaryModal = document.getElementById('salary-reminder-modal');
  }

  init() {
    navigation.init();

    // Apply active theme preferences
    const state = storageService.getState();
    themeService.apply(state.profile || {});
    this.updateHeaderProfileUI(state);

    // Subscribe to navigation changes
    navigation.subscribe((activePage) => {
      this.renderCurrentView(activePage);
      this.updateActiveNavUI(activePage);
    });

    // Subscribe to state updates to refresh views & header
    storageService.subscribe((updatedState) => {
      themeService.apply(updatedState.profile || {});
      this.updateHeaderProfileUI(updatedState);
      this.renderCurrentView(navigation.getActivePage());
    });

    // Initialize currency exchange rates in background
    currencyService.fetchRates().catch(e => console.warn('Background rate fetch:', e));

    // Check 25th salary reminder only if signed in
    const session = authService.getSession();
    if (session.isSignedIn) {
      this.checkSalaryReminder();
    }

    // Render initial active page
    this.renderCurrentView(navigation.getActivePage());
    this.updateActiveNavUI(navigation.getActivePage());

    // Setup navigation clicks & header profile/action buttons
    this.attachNavListeners();

    // Setup PWA Service Worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('SW registration note:', err.message);
      });
    }
  }

  updateHeaderProfileUI(state) {
    const session = authService.getSession();
    const profile = state?.profile || {};
    const name = profile.name || 'Free user';
    const initial = name.charAt(0).toUpperCase();

    const nameEl = document.getElementById('header-user-name');
    const initialEl = document.getElementById('header-user-initial');
    const authActions = document.getElementById('header-authenticated-actions');
    const publicActions = document.getElementById('header-public-actions');
    const desktopNav = document.getElementById('desktop-nav-menu');
    const mobileNav = document.getElementById('mobile-bottom-nav');

    if (nameEl) nameEl.textContent = name;
    if (initialEl) initialEl.textContent = initial;

    if (session.isSignedIn) {
      // Show Authenticated Controls
      authActions?.classList.remove('hidden');
      authActions?.classList.add('flex');
      publicActions?.classList.add('hidden');
      publicActions?.classList.remove('flex');
      
      desktopNav?.classList.remove('hidden');
      desktopNav?.classList.add('hidden', 'md:flex');

      mobileNav?.classList.remove('hidden');
    } else {
      // Show Public / Logged-Out Landing Controls
      authActions?.classList.add('hidden');
      authActions?.classList.remove('flex');
      publicActions?.classList.remove('hidden');
      publicActions?.classList.add('flex');

      desktopNav?.classList.add('hidden');
      desktopNav?.classList.remove('md:flex');

      mobileNav?.classList.add('hidden');
    }
  }

  renderCurrentView(pageId) {
    if (!this.container) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const session = authService.getSession();

    // Protection check: logged-out users always render landing view
    if (!session.isSignedIn || pageId === 'landing') {
      renderLanding(this.container);
      return;
    }

    switch (pageId) {
      case 'dashboard':
        renderDashboard(this.container);
        break;
      case 'money':
        renderMoney(this.container);
        break;
      case 'goals':
        renderGoals(this.container);
        break;
      case 'affordability':
        renderAffordability(this.container);
        break;
      case 'analytics':
        renderAnalytics(this.container);
        break;
      case 'currency':
        renderCurrency(this.container);
        break;
      case 'ai':
        renderAI(this.container);
        break;
      case 'settings':
        renderSettings(this.container);
        break;
      default:
        renderDashboard(this.container);
    }
  }

  updateActiveNavUI(pageId) {
    // Desktop Nav Items
    document.querySelectorAll('.desktop-nav-item').forEach(el => {
      const target = el.dataset.page;
      if (target === pageId) {
        el.className = 'desktop-nav-item px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer';
      } else {
        el.className = 'desktop-nav-item px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition cursor-pointer';
      }
    });

    // Mobile Bottom Nav Items
    document.querySelectorAll('.mobile-nav-item').forEach(el => {
      const target = el.dataset.page;
      if (target === pageId) {
        el.className = 'mobile-nav-item flex-1 flex flex-col items-center py-2 text-emerald-400 font-bold cursor-pointer';
      } else {
        el.className = 'mobile-nav-item flex-1 flex flex-col items-center py-2 text-slate-400 hover:text-slate-200 cursor-pointer';
      }
    });
  }

  attachNavListeners() {
    // Brand Button
    const brandBtn = document.getElementById('header-brand-btn');
    brandBtn?.addEventListener('click', () => {
      const session = authService.getSession();
      if (session.isSignedIn) {
        navigation.navigate('dashboard');
      } else {
        navigation.navigate('landing');
      }
    });

    // Navigation links
    document.querySelectorAll('.desktop-nav-item, .mobile-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.page;
        if (target) navigation.navigate(target);
      });
    });

    // Header Profile Button (Signed In)
    const headerProfileBtn = document.getElementById('header-profile-btn');
    headerProfileBtn?.addEventListener('click', () => {
      openAccountModal('profile');
    });

    // Header Public Buttons (Logged Out)
    const headerSignInBtn = document.getElementById('header-signin-btn');
    headerSignInBtn?.addEventListener('click', () => {
      openAccountModal('signin');
    });

    const headerGetStartedBtn = document.getElementById('header-get-started-btn');
    headerGetStartedBtn?.addEventListener('click', () => {
      openOnboardingModal();
    });
  }

  checkSalaryReminder() {
    const status = reminderService.checkSalaryPromptStatus();
    if (!status.shouldPrompt) return;

    const modal = document.getElementById('salary-reminder-modal');
    if (!modal) return;

    const state = storageService.getState();
    const curr = state.profile?.primaryCurrency || 'COP';

    modal.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 rounded-2xl border border-emerald-500/30 shadow-2xl animate-fade-in font-mono space-y-4">
        <div class="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs">
          <span class="material-icons-outlined text-lg">event_available</span>
          <span>Monthly Salary Inflow Check</span>
        </div>

        <div>
          <h3 class="text-lg font-bold text-white">Salary Received for ${status.currentMonth}?</h3>
          <p class="text-xs text-slate-300 mt-1 leading-relaxed">
            It is on or past the ${status.dayOfMonth}th. Would you like to allocate this month's salary into your target percentage buckets now?
          </p>
        </div>

        <div class="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2 text-xs">
          <label class="text-slate-400 block">Salary Amount (${curr})</label>
          <input type="number" id="modal-salary-amount" value="${state.salary || 2300000}" min="1" step="10000"
            class="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 font-mono" />
        </div>

        <div class="flex flex-col gap-2 pt-2">
          <button id="modal-record-salary-btn" class="btn-primary w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider">
            ✓ Allocate Salary Now
          </button>
          <div class="flex gap-2">
            <button id="modal-skip-month-btn" class="btn-secondary flex-1 py-2 rounded-xl text-xs text-slate-400">
              Skip This Month
            </button>
            <button id="modal-dismiss-btn" class="btn-secondary flex-1 py-2 rounded-xl text-xs text-slate-400">
              Later
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    modal.querySelector('#modal-record-salary-btn')?.addEventListener('click', () => {
      const amt = Number(modal.querySelector('#modal-salary-amount')?.value) || 0;
      reminderService.recordSalary(amt, status.currentMonth);
      modal.classList.add('hidden');
    });

    modal.querySelector('#modal-skip-month-btn')?.addEventListener('click', () => {
      reminderService.skipMonth(status.currentMonth);
      modal.classList.add('hidden');
    });

    modal.querySelector('#modal-dismiss-btn')?.addEventListener('click', () => {
      reminderService.dismissForSession(status.currentMonth);
      modal.classList.add('hidden');
    });
  }
}

// Bootstrapping
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
