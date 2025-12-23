/**
 * BTEazy - Content Script
 * Detects and handles torrent links on web pages
 */

import { isTorrentLink, isMagnetLink, log, logError } from '../utils/helpers.js';

// Settings cache
let settings = {
  enabled: true,
  highlightLinks: true,
  managedDomains: []
};

// Track processed links to avoid duplicate processing
const processedLinks = new WeakSet();

/**
 * Initialize content script
 */
async function initialize() {
  try {
    settings = await getSettings();
    log('Loaded settings:', settings);
    log('Extension enabled:', settings.enabled);

    if (settings.enabled) {
      log('Initializing link detection...');
      initTorrentLinkDetection();
    } else {
      log('Extension is disabled');
    }
  } catch (error) {
    logError('Initialization failed:', error);
  }
}

/**
 * Get settings from background
 */
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get({
      enabled: true,
      highlightLinks: true,
      managedDomains: []
    }, resolve);
  });
}

/**
 * Check if current domain is managed
 */
function isDomainManaged() {
  const currentDomain = window.location.hostname;
  return settings.managedDomains.some(domain =>
    currentDomain.includes(domain) || domain.includes(currentDomain)
  );
}

/**
 * Initialize torrent link detection
 */
function initTorrentLinkDetection() {
  // Process existing links
  processLinks();

  // Watch for new links
  observeDOM();

  log('Link detection initialized');
}

/**
 * Process all links on page
 */
function processLinks() {
  const links = document.querySelectorAll('a[href]');
  log('Found', links.length, 'links on page');

  let torrentCount = 0;

  links.forEach(link => {
    if (!processedLinks.has(link)) {
      const href = link.href;

      if (isTorrentLink(href) || isMagnetLink(href)) {
        processTorrentLink(link, href);
        torrentCount++;
      }

      processedLinks.add(link);
    }
  });

  if (torrentCount > 0) {
    log('Total torrent links detected:', torrentCount);
  }
}

/**
 * Process individual torrent link
 */
function processTorrentLink(link, href) {
  const isMagnet = isMagnetLink(href);

  log('Torrent link found:', { href, isMagnet });

  // Add visual indicator
  if (settings.highlightLinks) {
    addVisualIndicator(link, isMagnet);
  }

  // Add click handler
  link.addEventListener('click', (e) => handleLinkClick(e, href, isMagnet), {
    capture: true
  });
}

/**
 * Add visual indicator to torrent link
 */
function addVisualIndicator(link, isMagnet) {
  // Add class for highlighting
  link.classList.add('bteazy-torrent-link');

  // Add icon if not already present
  if (!link.querySelector('.bteazy-icon')) {
    const icon = document.createElement('span');
    icon.className = 'bteazy-icon';
    icon.innerHTML = isMagnet ? '🧲' : '⬇';
    icon.setAttribute('title', isMagnet ? 'Magnet link' : 'Torrent file');

    // Insert icon at the beginning
    link.insertBefore(icon, link.firstChild);
  }
}

/**
 * Handle torrent link click
 */
async function handleLinkClick(event, href, isMagnet) {
  // Check if extension is still enabled
  const currentSettings = await getSettings();

  if (!currentSettings.enabled) {
    log('Extension is disabled, allowing default behavior');
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  log('Torrent link clicked:', href);

  // Extract filename
  const filename = extractFilename(href, isMagnet);

  try {
    // Send download request to background
    const response = await chrome.runtime.sendMessage({
      action: 'downloadTorrent',
      url: href,
      filename,
      isMagnet
    });

    if (response && response.success) {
      const message = isMagnet
        ? 'Magnet link converted and downloading'
        : 'Torrent file download started';

      showNotification(message, 'success');
      log('Download initiated successfully');
    } else {
      throw new Error(response?.error || 'Unknown error');
    }
  } catch (error) {
    logError('Download failed:', error);
    showNotification('Download failed: ' + error.message, 'error');
  }
}

/**
 * Extract filename from URL
 */
function extractFilename(href, isMagnet) {
  if (isMagnet) {
    try {
      const url = new URL(href);
      const dn = url.searchParams.get('dn');
      return dn ? decodeURIComponent(dn) : 'magnet-download';
    } catch {
      return 'magnet-download';
    }
  }

  // Extract from URL path
  const urlPath = href.split('?')[0];
  const parts = urlPath.split('/');
  const filename = parts[parts.length - 1];

  return filename || 'download.torrent';
}

/**
 * Show in-page notification
 */
function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.bteazy-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `bteazy-notification bteazy-notification-${type}`;
  notification.textContent = message;

  // Add to page
  document.body.appendChild(notification);

  // Remove after delay
  setTimeout(() => {
    notification.classList.add('bteazy-notification-fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Observe DOM for new links
 */
function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    let hasNewLinks = false;

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'A' && node.href) {
            hasNewLinks = true;
          } else if (node.querySelectorAll) {
            const links = node.querySelectorAll('a[href]');
            if (links.length > 0) {
              hasNewLinks = true;
            }
          }
        }
      });
    });

    if (hasNewLinks) {
      processLinks();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  log('DOM observer started');
}

/**
 * Listen for settings updates
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    log('Settings updated from background');
    settings = { ...settings, ...request.settings };

    // Reprocess links if highlighting changed
    if (request.settings.highlightLinks !== undefined) {
      if (request.settings.highlightLinks) {
        processLinks();
      } else {
        removeVisualIndicators();
      }
    }
  }
});

/**
 * Remove all visual indicators
 */
function removeVisualIndicators() {
  document.querySelectorAll('.bteazy-torrent-link').forEach(link => {
    link.classList.remove('bteazy-torrent-link');
  });

  document.querySelectorAll('.bteazy-icon').forEach(icon => {
    icon.remove();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
