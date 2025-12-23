/**
 * BTEazy - Storage Helper Functions
 */

import { DEFAULT_SETTINGS, HISTORY_LIMIT } from './constants.js';
import { log, logError } from './helpers.js';

/**
 * Get settings from storage
 * @returns {Promise<Object>} Settings object
 */
export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
      if (chrome.runtime.lastError) {
        logError('Failed to get settings:', chrome.runtime.lastError);
        resolve(DEFAULT_SETTINGS);
      } else {
        // Merge with defaults to ensure all keys exist
        resolve({ ...DEFAULT_SETTINGS, ...settings });
      }
    });
  });
}

/**
 * Save settings to storage
 * @param {Object} settings - Settings to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set(settings, () => {
      if (chrome.runtime.lastError) {
        logError('Failed to save settings:', chrome.runtime.lastError);
        resolve(false);
      } else {
        log('Settings saved successfully');
        resolve(true);
      }
    });
  });
}

/**
 * Get download history
 * @returns {Promise<Array>} Download history array
 */
export async function getDownloadHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['downloadHistory'], (result) => {
      if (chrome.runtime.lastError) {
        logError('Failed to get download history:', chrome.runtime.lastError);
        resolve([]);
      } else {
        resolve(result.downloadHistory || []);
      }
    });
  });
}

/**
 * Add item to download history
 * @param {string} filename - Downloaded filename
 * @param {string} url - Download URL
 * @param {boolean} isMagnet - Whether it was a magnet link
 * @returns {Promise<boolean>} Success status
 */
export async function addToDownloadHistory(filename, url, isMagnet = false) {
  try {
    const history = await getDownloadHistory();

    history.unshift({
      filename,
      url,
      isMagnet,
      timestamp: Date.now()
    });

    // Keep only last N items
    const trimmedHistory = history.slice(0, HISTORY_LIMIT);

    await chrome.storage.local.set({ downloadHistory: trimmedHistory });
    log('Added to download history:', filename);
    return true;
  } catch (error) {
    logError('Failed to add to download history:', error);
    return false;
  }
}

/**
 * Clear download history
 * @returns {Promise<boolean>} Success status
 */
export async function clearDownloadHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ downloadHistory: [] }, () => {
      if (chrome.runtime.lastError) {
        logError('Failed to clear download history:', chrome.runtime.lastError);
        resolve(false);
      } else {
        log('Download history cleared');
        resolve(true);
      }
    });
  });
}

/**
 * Initialize settings with defaults
 * @returns {Promise<boolean>} Success status
 */
export async function initializeSettings() {
  const currentSettings = await getSettings();
  const mergedSettings = { ...DEFAULT_SETTINGS, ...currentSettings };
  return await saveSettings(mergedSettings);
}
