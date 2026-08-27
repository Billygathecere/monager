/**
 * Monager State Storage Service
 * Handles localStorage persistence, automatic migration to Schema V4,
 * state change broadcasting, and clean import/export.
 */

import { migrateState, getInitialState, SCHEMA_VERSION } from '../domain/migrate.js';

const STORAGE_KEY = 'gapflow_v3_state';
const LEGACY_STORAGE_KEYS = ['monager_state_v3', 'monager_state_v2', 'monager_state', 'monager_expenses'];

class StorageService {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
  }

  /**
   * Loads state from localStorage, trying current key then legacy keys, and applies migrations.
   * @returns {Object}
   */
  loadState() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return getInitialState();
      }

      // Check current storage key first
      const rawCurrent = localStorage.getItem(STORAGE_KEY);
      if (rawCurrent) {
        const parsed = JSON.parse(rawCurrent);
        const migrated = migrateState(parsed);
        return migrated;
      }

      // Check legacy keys for existing user data
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const rawLegacy = localStorage.getItem(legacyKey);
        if (rawLegacy) {
          try {
            const parsedLegacy = JSON.parse(rawLegacy);
            const migrated = migrateState(parsedLegacy);
            this.saveState(migrated);
            return migrated;
          } catch (e) {
            console.warn(`Could not parse legacy data from ${legacyKey}:`, e);
          }
        }
      }

      // If nothing found, return pristine initial state
      const pristine = getInitialState();
      this.saveState(pristine);
      return pristine;
    } catch (err) {
      console.error('StorageService loadState error:', err);
      return getInitialState();
    }
  }

  /**
   * Saves state to localStorage and notifies subscribers.
   * @param {Object} newState
   */
  saveState(newState) {
    try {
      this.state = {
        ...newState,
        schemaVersion: SCHEMA_VERSION,
        updatedAt: new Date().toISOString()
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }

      this.notify();
    } catch (err) {
      console.error('StorageService saveState error:', err);
    }
  }

  /**
   * Updates a specific slice of state.
   * @param {Function|Object} updater
   */
  update(updater) {
    if (typeof updater === 'function') {
      const next = updater(this.state);
      if (next && typeof next === 'object') {
        this.saveState(next);
      }
    } else if (updater && typeof updater === 'object') {
      this.saveState({ ...this.state, ...updater });
    }
  }

  /**
   * Returns the current state snapshot.
   * @returns {Object}
   */
  getState() {
    return this.state;
  }

  /**
   * Subscribes to state updates.
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    }
  }

  /**
   * Exports full state as a downloadable JSON file.
   */
  exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `monager_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Imports state from a JSON string or object, migrating schema safely.
   * @param {string|Object} rawData
   * @returns {{ success: boolean, error?: string }}
   */
  importData(rawData) {
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON file format' };
      }

      const migrated = migrateState(parsed);
      this.saveState(migrated);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Resets data to fresh initial state.
   */
  resetData() {
    const fresh = getInitialState();
    this.saveState(fresh);
  }
}

export const storageService = new StorageService();
