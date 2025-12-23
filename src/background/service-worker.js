/**
 * BTEazy - Background Service Worker
 * Handles downloads, conversions, and notifications
 */

import { APP_NAME, BADGE, ITORRENTS_URL, FILE_VALIDATION } from '../utils/constants.js';
import {
  sanitizeFilename,
  extractMagnetHash,
  extractMagnetName,
  log,
  logError,
  logWarn
} from '../utils/helpers.js';
import {
  getSettings,
  saveSettings,
  addToDownloadHistory,
  initializeSettings
} from '../utils/storage.js';

// Initialize extension on install or update
chrome.runtime.onInstalled.addListener(async (details) => {
  log('Extension installed/updated:', details.reason);
  await initializeSettings();
  setupContextMenu();
});

// Ensure settings exist on startup
chrome.runtime.onStartup.addListener(async () => {
  await initializeSettings();
  log('Extension started');
});

// Setup context menu
function setupContextMenu() {
  chrome.contextMenus.create({
    id: 'downloadTorrent',
    title: 'Download Torrent File',
    contexts: ['link']
  }, () => {
    // Ignore errors if context menu already exists
    if (chrome.runtime.lastError) {
      logWarn('Context menu:', chrome.runtime.lastError.message);
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'downloadTorrent' && info.linkUrl) {
    const url = info.linkUrl;
    const filename = url.substring(url.lastIndexOf('/') + 1).split('?')[0] || 'download.torrent';

    try {
      await handleTorrentDownload(url, filename, false);
      log('Download started from context menu');
    } catch (error) {
      logError('Context menu download failed:', error);
    }
  }
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handlers = {
    downloadTorrent: handleDownloadMessage,
    getSettings: handleGetSettings,
    saveSettings: handleSaveSettings,
    addManagedDomain: handleAddDomain,
    removeManagedDomain: handleRemoveDomain
  };

  const handler = handlers[request.action];
  if (handler) {
    handler(request, sender, sendResponse);
    return true; // Async response
  }

  return false;
});

async function handleDownloadMessage(request, sender, sendResponse) {
  try {
    const downloadId = await handleTorrentDownload(
      request.url,
      request.filename,
      request.isMagnet
    );
    sendResponse({ success: true, downloadId });
  } catch (error) {
    logError('Download failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetSettings(request, sender, sendResponse) {
  const settings = await getSettings();
  log('Getting settings:', settings);
  sendResponse(settings);
}

async function handleSaveSettings(request, sender, sendResponse) {
  log('Saving settings:', request.settings);
  const success = await saveSettings(request.settings);

  if (success) {
    // Notify all tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        settings: request.settings
      }).catch(() => {
        // Ignore errors for tabs without content script
      });
    });
  }

  sendResponse({ success });
}

async function handleAddDomain(request, sender, sendResponse) {
  const settings = await getSettings();
  const domains = settings.managedDomains || [];

  if (!domains.includes(request.domain)) {
    domains.push(request.domain);
    await saveSettings({ ...settings, managedDomains: domains });
    log('Domain added:', request.domain);
    sendResponse({ success: true, domains });
  } else {
    sendResponse({ success: false, message: 'Domain already exists' });
  }
}

async function handleRemoveDomain(request, sender, sendResponse) {
  const settings = await getSettings();
  const domains = (settings.managedDomains || []).filter(d => d !== request.domain);

  await saveSettings({ ...settings, managedDomains: domains });
  log('Domain removed:', request.domain);
  sendResponse({ success: true, domains });
}

/**
 * Handle torrent file download
 * @param {string} url - Download URL
 * @param {string} filename - Filename
 * @param {boolean} isMagnet - Whether it's a magnet link
 * @returns {Promise<number>} Download ID
 */
async function handleTorrentDownload(url, filename, isMagnet = false) {
  const settings = await getSettings();
  log('Starting download:', { url, filename, isMagnet });

  let downloadUrl = url;
  let downloadFilename = filename;

  // Convert magnet link
  if (isMagnet) {
    setBadge(BADGE.PROCESSING.text, BADGE.PROCESSING.color);

    const hash = extractMagnetHash(url);
    if (!hash) {
      clearBadge();
      throw new Error('Could not extract hash from magnet link');
    }

    log('Converting magnet to .torrent, hash:', hash);
    downloadUrl = `${ITORRENTS_URL}${hash}.torrent`;

    const magnetName = extractMagnetName(url);
    downloadFilename = `${magnetName}.torrent`;
    log('Converted magnet filename:', downloadFilename);
  } else {
    downloadFilename = sanitizeFilename(filename.replace('.torrent', '')) + '.torrent';
  }

  // Build download path
  let fullPath = downloadFilename;
  if (settings.downloadPath) {
    const sanitizedPath = settings.downloadPath.replace(/[<>:"\\|?*\x00-\x1F]/g, '_');
    fullPath = `${sanitizedPath}/${downloadFilename}`;
  }

  const downloadOptions = {
    url: downloadUrl,
    filename: fullPath,
    saveAs: !settings.autoSave,
    conflictAction: 'uniquify'
  };

  log('Download options:', downloadOptions);

  return new Promise((resolve, reject) => {
    chrome.downloads.download(downloadOptions, (downloadId) => {
      if (chrome.runtime.lastError) {
        clearBadge();
        logError('Download error:', chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      log('Download started successfully, ID:', downloadId);

      // Add to history
      addToDownloadHistory(downloadFilename, url, isMagnet);

      // Validate magnet conversions
      if (isMagnet) {
        setTimeout(() => validateTorrentFile(downloadId), FILE_VALIDATION.VALIDATION_DELAY);
      }

      resolve(downloadId);
    });
  });
}

/**
 * Validate downloaded torrent file
 * @param {number} downloadId - Download ID
 */
async function validateTorrentFile(downloadId) {
  const results = await chrome.downloads.search({ id: downloadId });

  if (!results || results.length === 0) {
    logError('Download not found for validation');
    return;
  }

  const download = results[0];

  if (download.state !== 'complete' || !download.exists) {
    return;
  }

  const isValid =
    download.fileSize >= FILE_VALIDATION.MIN_SIZE &&
    (!download.mime || FILE_VALIDATION.VALID_MIME_TYPES.includes(download.mime));

  if (!isValid) {
    logError('Downloaded file may not be valid .torrent:', {
      size: download.fileSize,
      mime: download.mime,
      path: download.filename
    });

    const settings = await getSettings();
    if (settings.showNotifications) {
      showNotification(
        `${APP_NAME} - Conversion Warning`,
        'The downloaded file may not be valid. The torrent might not exist in the DHT network yet, or the conversion service is unavailable.'
      );
    }
  } else {
    log('Torrent file validated:', {
      size: download.fileSize,
      mime: download.mime,
      path: download.filename
    });
  }
}

/**
 * Monitor download progress
 */
chrome.downloads.onChanged.addListener(async (downloadDelta) => {
  if (!downloadDelta.state) return;

  const settings = await getSettings();

  if (downloadDelta.state.current === 'complete') {
    setBadge(BADGE.SUCCESS.text, BADGE.SUCCESS.color);

    setTimeout(() => clearBadge(), BADGE.CLEAR_DELAY);

    if (settings.showNotifications) {
      showNotification(
        `${APP_NAME} - Download Complete`,
        'Your torrent file has been downloaded successfully.'
      );
    }
  } else if (downloadDelta.state.current === 'interrupted') {
    clearBadge();

    if (settings.showNotifications) {
      showNotification(
        `${APP_NAME} - Download Failed`,
        'The torrent file download was interrupted.'
      );
    }
  }
});

/**
 * Handle settings changes for badge
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.enabled && namespace === 'local') {
    const enabled = changes.enabled.newValue;
    if (!enabled) {
      setBadge(BADGE.DISABLED.text, BADGE.DISABLED.color);
    } else {
      clearBadge();
    }
  }
});

/**
 * Set initial badge state on startup
 */
getSettings().then(settings => {
  log('Initial badge state check - enabled:', settings.enabled);
  if (settings.enabled === false) {
    setBadge(BADGE.DISABLED.text, BADGE.DISABLED.color);
  }
});

/**
 * Helper: Set badge
 */
function setBadge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

/**
 * Helper: Clear badge
 */
function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

/**
 * Helper: Show notification
 */
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon48.png',
    title,
    message
  });
}
