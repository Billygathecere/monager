/**
 * Monager Account & Authentication Modal Controller
 * Provides Sign In, Create Account, Profile Management, and Session Status.
 */

import { authService } from '../services/auth.js';
import { storageService } from '../services/storage.js';
import { CURRENCY_SYMBOLS } from '../services/currency.js';
import { navigation } from './navigation.js';
import { showToast } from './toast.js';

export function openAccountModal(initialTab = 'profile') {
  let modalContainer = document.getElementById('account-auth-modal');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'account-auth-modal';
    modalContainer.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    document.body.appendChild(modalContainer);
  }

  renderModalContent(modalContainer, initialTab);
  modalContainer.classList.remove('hidden');
}

export function closeAccountModal() {
  const modalContainer = document.getElementById('account-auth-modal');
  if (modalContainer) {
    modalContainer.classList.add('hidden');
  }
}

function renderModalContent(container, activeTab = 'profile') {
  const session = authService.getSession();
  const state = storageService.getState();
  const profile = state.profile || {};
  const isSignedIn = session.isSignedIn;

  let tab = activeTab;
  if (!isSignedIn && tab === 'profile') {
    tab = 'signin';
  }

  container.innerHTML = `
    <div class="glass-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl animate-fade-in font-mono space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-black font-black text-lg">
            ${(session.name || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 class="text-lg font-bold text-white tracking-tight">
              ${isSignedIn ? session.name : 'Account & Session'}
            </h2>
            <p class="text-[11px] text-slate-400">
              ${isSignedIn ? (session.email || 'Local Workspace Session') : 'Sign in to sync preferences & identity'}
            </p>
          </div>
        </div>
        <button id="close-acc-modal-btn" class="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
          <span class="material-icons-outlined text-xl">close</span>
        </button>
      </div>

      <!-- Tab Navigation (if not signed in or switching) -->
      <div class="flex rounded-xl bg-white/[0.04] p-1 border border-white/10 text-xs">
        ${isSignedIn ? `
          <button class="acc-tab-btn flex-1 py-2 text-center rounded-lg font-bold transition ${tab === 'profile' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-tab="profile">
            Profile & Session
          </button>
          <button class="acc-tab-btn flex-1 py-2 text-center rounded-lg font-bold transition ${tab === 'settings' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-tab="settings">
            Quick Settings
          </button>
        ` : `
          <button class="acc-tab-btn flex-1 py-2 text-center rounded-lg font-bold transition ${tab === 'signin' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-tab="signin">
            Sign In
          </button>
          <button class="acc-tab-btn flex-1 py-2 text-center rounded-lg font-bold transition ${tab === 'create' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-tab="create">
            Create Account
          </button>
        `}
      </div>

      <!-- Tab 1: Signed In Profile -->
      ${isSignedIn && tab === 'profile' ? `
        <div class="space-y-5 text-xs">
          <!-- Session Badge -->
          <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Session
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                ${session.plan} MEMBER
              </span>
            </div>
            <div class="text-[11px] text-slate-300">
              Authentication Status: <strong class="text-white">${session.cloudAuthStatus}</strong>
            </div>
            <div class="text-[10px] text-slate-400">
              Last accessed: ${new Date(session.lastLogin || Date.now()).toLocaleDateString()}
            </div>
          </div>

          <!-- Edit Profile Form -->
          <form id="acc-edit-profile-form" class="space-y-4">
            <div>
              <label class="text-slate-300 block mb-1 text-[11px]">Display Name</label>
              <input type="text" id="acc-input-name" value="${session.name}"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" required />
            </div>

            <div>
              <label class="text-slate-300 block mb-1 text-[11px]">Email Address</label>
              <input type="email" id="acc-input-email" value="${session.email}"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="text-slate-300 block mb-1 text-[11px]">Location / Gap Year Base</label>
              <input type="text" id="acc-input-country" value="${session.country}"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div class="flex items-center justify-between pt-2">
              <button type="submit" class="btn-primary px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs">
                Save Profile
              </button>
              <button type="button" id="acc-sign-out-btn" class="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1">
                <span class="material-icons-outlined text-sm">logout</span> Sign Out
              </button>
            </div>
          </form>
        </div>
      ` : ''}

      <!-- Tab 2: Sign In -->
      ${!isSignedIn && tab === 'signin' ? `
        <form id="acc-signin-form" class="space-y-4 text-xs">
          <div>
            <label class="text-slate-300 block mb-1 text-[11px]">Your Email Address</label>
            <input type="email" id="signin-email" placeholder="e.g., alex@example.com"
              class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" required />
          </div>

          <div>
            <label class="text-slate-300 block mb-1 text-[11px]">Your Name / Nickname</label>
            <input type="text" id="signin-name" placeholder="e.g., Alex"
              class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div>
              <span class="text-white font-bold block text-[11px]">Remember Session</span>
              <span class="text-[10px] text-slate-400">Keep active on this browser</span>
            </div>
            <input type="checkbox" id="signin-remember" checked class="w-4 h-4 accent-emerald-500" />
          </div>

          <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200 leading-relaxed">
            <strong>🔒 Privacy First:</strong> Passwords are never stored unencrypted. Monager is currently operating in local workspace session mode with cloud authentication pending.
          </div>

          <button type="submit" class="btn-primary w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5">
            <span class="material-icons-outlined text-sm">login</span> Sign In to Workspace
          </button>
        </form>
      ` : ''}

      <!-- Tab 3: Create Account -->
      ${!isSignedIn && tab === 'create' ? `
        <form id="acc-create-form" class="space-y-4 text-xs">
          <div>
            <label class="text-slate-300 block mb-1 text-[11px]">Full Name</label>
            <input type="text" id="create-name" placeholder="e.g., Alex Kim"
              class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" required />
          </div>

          <div>
            <label class="text-slate-300 block mb-1 text-[11px]">Email Address</label>
            <input type="email" id="create-email" placeholder="e.g., alex@example.com"
              class="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-slate-300 block mb-1 text-[11px]">Base Currency</label>
              <select id="create-currency" class="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white">
                ${Object.keys(CURRENCY_SYMBOLS).map(c => `
                  <option value="${c}" ${c === (profile.primaryCurrency || 'COP') ? 'selected' : ''}>${c}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="text-slate-300 block mb-1 text-[11px]">Base Location</label>
              <input type="text" id="create-country" value="Colombia (Gap Year)"
                class="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white" />
            </div>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div>
              <span class="text-white font-bold block text-[11px]">Remember Account</span>
              <span class="text-[10px] text-slate-400">Save session locally</span>
            </div>
            <input type="checkbox" id="create-remember" checked class="w-4 h-4 accent-emerald-500" />
          </div>

          <button type="submit" class="btn-primary w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5">
            <span class="material-icons-outlined text-sm">person_add</span> Create Free Account
          </button>
        </form>
      ` : ''}

      <!-- Tab 4: Quick Settings Link (if signed in) -->
      ${isSignedIn && tab === 'settings' ? `
        <div class="space-y-4 text-xs">
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Customize your app theme, accent colors, currency pivots, and backup rules in the comprehensive Settings Center.
          </p>
          <button id="acc-go-to-settings-btn" class="btn-secondary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            <span class="material-icons-outlined text-sm">settings</span> Open Full Settings Center
          </button>
        </div>
      ` : ''}

    </div>
  `;

  attachModalEvents(container, tab);
}

function attachModalEvents(container, currentTab) {
  const closeBtn = container.querySelector('#close-acc-modal-btn');
  closeBtn?.addEventListener('click', closeAccountModal);

  // Tab switching
  container.querySelectorAll('.acc-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderModalContent(container, btn.dataset.tab);
    });
  });

  // Edit Profile Form
  const editForm = container.querySelector('#acc-edit-profile-form');
  editForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = container.querySelector('#acc-input-name').value;
    const email = container.querySelector('#acc-input-email').value;
    const country = container.querySelector('#acc-input-country').value;

    authService.updateProfile({ name, email, country });
    closeAccountModal();
    showToast('Profile updated successfully.', 'success');
  });

  // Sign In Form
  const signInForm = container.querySelector('#acc-signin-form');
  signInForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = container.querySelector('#signin-email').value;
    const name = container.querySelector('#signin-name').value;
    const rememberMe = container.querySelector('#signin-remember').checked;

    const res = authService.signIn({ email, name, rememberMe });
    if (res.success) {
      closeAccountModal();
      showToast(res.message, 'success');
      navigation.navigate('dashboard');
    } else {
      showToast(res.message, 'error');
    }
  });

  // Create Account Form
  const createForm = container.querySelector('#acc-create-form');
  createForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = container.querySelector('#create-name').value;
    const email = container.querySelector('#create-email').value;
    const primaryCurrency = container.querySelector('#create-currency').value;
    const country = container.querySelector('#create-country').value;
    const rememberMe = container.querySelector('#create-remember').checked;

    const res = authService.createAccount({ name, email, country, primaryCurrency, rememberMe });
    if (res.success) {
      closeAccountModal();
      showToast(res.message, 'success');
      navigation.navigate('dashboard');
    } else {
      showToast(res.message, 'error');
    }
  });

  // Sign Out
  const signOutBtn = container.querySelector('#acc-sign-out-btn');
  signOutBtn?.addEventListener('click', () => {
    authService.signOut();
    closeAccountModal();
    showToast('Signed out of workspace session.', 'info');
    navigation.navigate('landing');
  });

  // Go to Settings
  const goToSettingsBtn = container.querySelector('#acc-go-to-settings-btn');
  goToSettingsBtn?.addEventListener('click', () => {
    closeAccountModal();
    navigation.navigate('settings');
  });
}
