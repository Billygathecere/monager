/**
 * Monager Account & Session Management Service (V3.2)
 * Manages local session state, profile credentials, remember-me persistence,
 * and transparently indicates Cloud Authentication readiness without mock server stubs.
 */

import { storageService } from './storage.js';
import { calculateSalaryDistribution, createIncomeTransaction, DEFAULT_ALLOCATION_PERCENTAGES } from '../domain/finance.js';

export const AUTH_STATUS = {
  LOCAL_ACTIVE: 'LOCAL_ACTIVE',
  GUEST: 'GUEST',
  CLOUD_PENDING: 'CLOUD_PENDING'
};

class AuthService {
  /**
   * Retrieves the current user session state.
   * @returns {Object}
   */
  getSession() {
    const state = storageService.getState();
    const profile = state.profile || {};
    const isSignedIn = Boolean(profile.isSignedIn);

    return {
      isSignedIn,
      onboardingCompleted: Boolean(profile.onboardingCompleted),
      name: profile.name || 'Free user',
      email: profile.email || '',
      plan: profile.plan || 'FREE',
      country: profile.country || 'Colombia (Gap Year)',
      primaryCurrency: profile.primaryCurrency || 'COP',
      secondaryCurrency: profile.secondaryCurrency || 'KES',
      rememberMe: profile.rememberMe ?? true,
      lastLogin: profile.lastLogin || '',
      cloudAuthStatus: 'Ready to Connect (Local Workspace Privacy Mode)',
      status: isSignedIn ? AUTH_STATUS.LOCAL_ACTIVE : AUTH_STATUS.GUEST
    };
  }

  /**
   * Completes the interactive 4-step onboarding flow and sets up the initial workspace.
   * @param {Object} data
   * @returns {{ success: boolean, message: string }}
   */
  completeOnboarding({ name, email, primaryCurrency, salary, initialGoal }) {
    const cleanName = String(name || '').trim() || 'Free user';
    const cleanEmail = String(email || '').trim().toLowerCase();
    const curr = primaryCurrency || 'COP';
    const cleanSalary = Math.max(1, Number(salary) || (curr === 'COP' ? 2300000 : 3500));

    storageService.update(state => {
      // 1. Calculate percentage buckets for initial salary
      const allocPercentages = state.allocationPercentages || DEFAULT_ALLOCATION_PERCENTAGES;
      const distribution = calculateSalaryDistribution(cleanSalary, allocPercentages);

      // 2. Create initial income transaction
      const initialIncomeTx = createIncomeTransaction({
        amount: cleanSalary,
        source: 'Initial Monthly Budget',
        currency: curr,
        date: new Date().toISOString().split('T')[0],
        note: 'Workspace onboarding income setup',
        allocationSnapshot: distribution.allocations
      });

      // 3. Prepare goals list
      let updatedGoals = Array.isArray(state.goals) ? [...state.goals] : [];
      if (initialGoal && initialGoal.name && initialGoal.targetAmount > 0) {
        const newGoal = {
          id: `goal_${Date.now().toString(36)}`,
          name: String(initialGoal.name).trim(),
          targetAmount: Number(initialGoal.targetAmount) || 5000000,
          currentAmount: 0,
          deadline: initialGoal.deadline || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          priority: 'high',
          category: initialGoal.category || 'Emergency',
          monthlyContribution: Math.round(Number(initialGoal.targetAmount) / 6),
          currency: curr,
          notes: 'Created during Monager onboarding setup',
          status: 'active'
        };
        // Add to front of goals list
        updatedGoals = [newGoal, ...updatedGoals.filter(g => g.name !== newGoal.name)];
      }

      return {
        ...state,
        salary: cleanSalary,
        allocations: { ...distribution.allocations },
        unallocatedAmount: distribution.unallocatedAmount,
        incomeTransactions: [initialIncomeTx, ...(state.incomeTransactions || [])],
        goals: updatedGoals,
        profile: {
          ...(state.profile || {}),
          name: cleanName,
          email: cleanEmail,
          primaryCurrency: curr,
          isSignedIn: true,
          onboardingCompleted: true,
          lastLogin: new Date().toISOString()
        }
      };
    });

    return { success: true, message: `Welcome to Monager, ${cleanName}!` };
  }

  /**
   * Signs in a user with local session validation.
   * @param {Object} credentials
   * @returns {{ success: boolean, message: string }}
   */
  signIn({ email, name, rememberMe = true }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const currentState = storageService.getState();
    const existingName = currentState.profile?.name && currentState.profile.name !== 'Free user' ? currentState.profile.name : '';
    const cleanName = String(name || '').trim() || existingName || (cleanEmail ? cleanEmail.split('@')[0] : 'Member');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    storageService.update(state => ({
      ...state,
      profile: {
        ...(state.profile || {}),
        name: cleanName,
        email: cleanEmail,
        isSignedIn: true,
        rememberMe: Boolean(rememberMe),
        lastLogin: new Date().toISOString()
      }
    }));

    return { success: true, message: `Welcome back, ${cleanName}!` };
  }

  /**
   * Registers a new account profile with local session persistence.
   * @param {Object} data
   * @returns {{ success: boolean, message: string }}
   */
  createAccount({ name, email, country, primaryCurrency, rememberMe = true }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();

    if (!cleanName) {
      return { success: false, message: 'Please enter your full name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    storageService.update(state => ({
      ...state,
      profile: {
        ...(state.profile || {}),
        name: cleanName,
        email: cleanEmail,
        country: country ? String(country).trim() : (state.profile?.country || 'Colombia (Gap Year)'),
        primaryCurrency: primaryCurrency || state.profile?.primaryCurrency || 'COP',
        isSignedIn: true,
        rememberMe: Boolean(rememberMe),
        lastLogin: new Date().toISOString()
      }
    }));

    return { success: true, message: `Account created successfully. Welcome, ${cleanName}!` };
  }

  /**
   * Signs out the user, switching to a guest session while preserving financial data.
   * @returns {{ success: boolean }}
   */
  signOut() {
    storageService.update(state => ({
      ...state,
      profile: {
        ...(state.profile || {}),
        isSignedIn: false,
        lastLogin: ''
      }
    }));

    return { success: true };
  }

  /**
   * Updates profile metadata.
   * @param {Object} updates
   */
  updateProfile(updates = {}) {
    storageService.update(state => ({
      ...state,
      profile: {
        ...(state.profile || {}),
        ...updates
      }
    }));
  }
}

export const authService = new AuthService();
