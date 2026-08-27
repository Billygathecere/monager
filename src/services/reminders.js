/**
 * Monager Salary Reminder & Notification Service
 * Handles the 25th of the month salary prompt, duplicate prevention, and skipped month logging.
 * Transparently distinguishes In-App Reminders from Browser Notifications and OS Push.
 */

import { storageService } from './storage.js';
import { calculateSalaryDistribution, createIncomeTransaction } from '../domain/finance.js';

class ReminderService {
  constructor() {
    this.listeners = new Set();
  }

  /**
   * Checks if the 25th salary prompt should be displayed right now.
   * @returns {{ shouldPrompt: boolean, currentMonth: string, isDue: boolean, alreadyRecorded: boolean, alreadySkipped: boolean }}
   */
  checkSalaryPromptStatus() {
    const state = storageService.getState();
    const config = state.salaryReminders || { enabled: true, dayOfMonth: 25, recordedMonths: [], skippedMonths: [] };
    
    if (!config.enabled) {
      return { shouldPrompt: false, reason: 'disabled' };
    }

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.toISOString().slice(0, 7); // e.g. "2026-08"

    const isDue = currentDay >= (config.dayOfMonth || 25);
    const alreadyRecorded = (config.recordedMonths || []).includes(currentMonth);
    const alreadySkipped = (config.skippedMonths || []).includes(currentMonth);
    const alreadyPrompted = config.lastPromptedMonth === currentMonth;

    const shouldPrompt = isDue && !alreadyRecorded && !alreadySkipped && !alreadyPrompted;

    return {
      shouldPrompt,
      currentMonth,
      isDue,
      alreadyRecorded,
      alreadySkipped,
      dayOfMonth: config.dayOfMonth || 25
    };
  }

  /**
   * Records a confirmed salary entry for the given month.
   * @param {number} amount
   * @param {string} [month]
   */
  recordSalary(amount, month) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const validAmount = Math.max(0, Number(amount) || 0);

    storageService.update(state => {
      const dist = calculateSalaryDistribution(validAmount, state.allocationPercentages);
      const newIncomeTx = createIncomeTransaction({
        amount: validAmount,
        source: `Monthly Salary (${targetMonth})`,
        currency: state.profile?.primaryCurrency || 'COP',
        date: new Date().toISOString().split('T')[0],
        note: `Allocated via 25th Salary Reminder`,
        allocationSnapshot: dist.allocations
      });

      const recordedMonths = Array.from(new Set([...(state.salaryReminders?.recordedMonths || []), targetMonth]));
      const skippedMonths = (state.salaryReminders?.skippedMonths || []).filter(m => m !== targetMonth);

      return {
        ...state,
        salary: validAmount,
        allocations: dist.allocations,
        unallocatedAmount: dist.unallocatedAmount,
        incomeTransactions: [newIncomeTx, ...(state.incomeTransactions || [])],
        salaryReminders: {
          ...(state.salaryReminders || {}),
          lastPromptedMonth: targetMonth,
          recordedMonths,
          skippedMonths
        }
      };
    });
  }

  /**
   * Skips salary entry for the specified month without prompting again.
   * @param {string} [month]
   */
  skipMonth(month) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    storageService.update(state => {
      const skippedMonths = Array.from(new Set([...(state.salaryReminders?.skippedMonths || []), targetMonth]));
      return {
        ...state,
        salaryReminders: {
          ...(state.salaryReminders || {}),
          lastPromptedMonth: targetMonth,
          skippedMonths
        }
      };
    });
  }

  /**
   * Dismisses prompt temporarily for this session.
   */
  dismissForSession(month) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    storageService.update(state => ({
      ...state,
      salaryReminders: {
        ...(state.salaryReminders || {}),
        lastPromptedMonth: targetMonth
      }
    }));
  }

  /**
   * Request browser Notification permission with clear tier distinction.
   */
  async requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { supported: false, permission: 'unsupported' };
    }

    try {
      const permission = await Notification.requestPermission();
      storageService.update(s => ({
        ...s,
        profile: { ...s.profile, notificationsEnabled: permission === 'granted' }
      }));
      return { supported: true, permission };
    } catch (e) {
      console.warn('Notification permission error:', e);
      return { supported: true, permission: 'denied' };
    }
  }

  getStatus() {
    return this.checkSalaryPromptStatus();
  }
}

export const reminderService = new ReminderService();
