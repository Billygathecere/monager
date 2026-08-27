/**
 * Monager Navigation Controller (V3.2)
 * Manages active page routing for public landing, mobile bottom nav, and desktop navigation.
 * Enforces session-aware route protection:
 * - Unauthenticated / logged-out users are strictly confined to 'landing'.
 * - Authenticated users are routed to 'dashboard' and protected views.
 */

import { authService } from '../services/auth.js';

export const NAV_PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', shortLabel: 'Home' },
  { id: 'money', label: 'Money', icon: 'account_balance_wallet', shortLabel: 'Money' },
  { id: 'goals', label: 'Goals', icon: 'flag', shortLabel: 'Goals' },
  { id: 'affordability', label: 'Affordability', icon: 'calculate', shortLabel: 'Afford' },
  { id: 'analytics', label: 'Analytics', icon: 'insights', shortLabel: 'Analytics' },
  { id: 'currency', label: 'Currency', icon: 'currency_exchange', shortLabel: 'Forex' },
  { id: 'ai', label: 'Monager AI', icon: 'smart_toy', shortLabel: 'AI' },
  { id: 'settings', label: 'Settings', icon: 'settings', shortLabel: 'Settings' }
];

export const PUBLIC_PAGES = ['landing'];

class NavigationController {
  constructor() {
    this.activePage = 'landing';
    this.listeners = new Set();
  }

  init() {
    const session = authService.getSession();
    const rawHash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '').trim() : '');

    if (!session.isSignedIn) {
      this.activePage = 'landing';
      if (typeof window !== 'undefined' && window.location.hash.replace('#', '') !== 'landing') {
        try {
          window.history.replaceState(null, '', '#landing');
        } catch (e) {
          window.location.hash = 'landing';
        }
      }
    } else {
      if (NAV_PAGES.some(p => p.id === rawHash)) {
        this.activePage = rawHash;
      } else {
        this.activePage = 'dashboard';
        if (typeof window !== 'undefined' && window.location.hash.replace('#', '') !== 'dashboard') {
          try {
            window.history.replaceState(null, '', '#dashboard');
          } catch (e) {
            window.location.hash = 'dashboard';
          }
        }
      }
    }

    // Hash routing support with route protection
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => {
        const raw = window.location.hash.replace('#', '').trim();
        this.handleHashChange(raw);
      });
    }
  }

  handleHashChange(rawHash) {
    const session = authService.getSession();
    let target = rawHash;

    if (!session.isSignedIn) {
      // Unauthenticated: Strictly enforce landing page
      target = 'landing';
      if (rawHash !== 'landing' && typeof window !== 'undefined') {
        try {
          window.history.replaceState(null, '', '#landing');
        } catch (e) {
          window.location.hash = 'landing';
        }
      }
    } else {
      // Authenticated: If requesting landing or unknown, route to dashboard
      if (target === 'landing' || !NAV_PAGES.some(p => p.id === target)) {
        target = 'dashboard';
        if (rawHash !== 'dashboard' && typeof window !== 'undefined') {
          try {
            window.history.replaceState(null, '', '#dashboard');
          } catch (e) {
            window.location.hash = 'dashboard';
          }
        }
      }
    }

    this.activePage = target;
    this.notify();
  }

  navigate(pageId, updateHash = true) {
    const session = authService.getSession();
    let target = pageId;

    if (!session.isSignedIn) {
      // Unauthenticated: Strictly enforce landing page
      target = 'landing';
    } else {
      // Authenticated: If requesting landing or unknown, route to dashboard
      if (target === 'landing' || !NAV_PAGES.some(p => p.id === target)) {
        target = 'dashboard';
      }
    }

    this.activePage = target;

    if (updateHash && typeof window !== 'undefined') {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== target) {
        window.location.hash = target;
      }
    }

    this.notify();
  }

  getActivePage() {
    return this.activePage;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const l of this.listeners) {
      try {
        l(this.activePage);
      } catch (e) {
        console.error('Nav listener error:', e);
      }
    }
  }
}

export const navigation = new NavigationController();
