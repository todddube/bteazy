// Background service worker for handling downloads
'use strict';

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  downloadPath: '',  // Empty string means default downloads folder
  highlightLinks: true,
  managedDomains: [],
  autoSave: true,
  showNotifications: true,
  downloadHistory: []  // Last 10 downloads
};

// Initialize extension - ensure settings always exist
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Extension installed/updated:', details.reason);

  // Always ensure default settings exist
  chrome.storage.local.get(DEFAULT_SETTINGS, function(currentSettings) {
    // Merge with defaults to ensure all keys exist
    const mergedSettings = { ...DEFAULT_SETTINGS, ...currentSettings };
    chrome.storage.local.set(mergedSettings, function() {
      console.log('Settings initialized:', mergedSettings);
    });
  });
});

// Ensure settings exist on startup
chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.get(DEFAULT_SETTINGS, function(currentSettings) {
    const mergedSettings = { ...DEFAULT_SETTINGS, ...currentSettings };
    chrome.storage.local.set(mergedSettings, function() {
      console.log('Settings verified on startup:', mergedSettings);
    });
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'downloadTorrent') {
    handleTorrentDownload(request.url, request.filename, request.isMagnet)
      .then(downloadId => {
        sendResponse({ success: true, downloadId: downloadId });
      })
      .catch(error => {
        console.error('Download failed:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll send response asynchronously
    return true;
  }

  if (request.action === 'getSettings') {
    chrome.storage.local.get(DEFAULT_SETTINGS, function(settings) {
      console.log('Getting settings:', settings);
      sendResponse(settings);
    });
    return true;
  }

  if (request.action === 'saveSettings') {
    console.log('Saving settings:', request.settings);
    chrome.storage.local.set(request.settings, function() {
      console.log('Settings saved successfully');

      // Notify all tabs of settings update
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateSettings',
            settings: request.settings
          }).catch(() => {
            // Ignore errors for tabs that don't have content script
          });
        });
      });

      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'addManagedDomain') {
    chrome.storage.local.get(['managedDomains'], function(result) {
      const domains = result.managedDomains || [];
      if (!domains.includes(request.domain)) {
        domains.push(request.domain);
        chrome.storage.local.set({ managedDomains: domains }, function() {
          console.log('Domain added:', request.domain);
          sendResponse({ success: true, domains: domains });
        });
      } else {
        sendResponse({ success: false, message: 'Domain already exists' });
      }
    });
    return true;
  }

  if (request.action === 'removeManagedDomain') {
    chrome.storage.local.get(['managedDomains'], function(result) {
      let domains = result.managedDomains || [];
      domains = domains.filter(d => d !== request.domain);
      chrome.storage.local.set({ managedDomains: domains }, function() {
        console.log('Domain removed:', request.domain);
        sendResponse({ success: true, domains: domains });
      });
    });
    return true;
  }
});

// Extract hash from magnet link
function extractMagnetHash(magnetUrl) {
  const match = magnetUrl.match(/btih:([a-zA-Z0-9]+)/i);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return null;
}

// Sanitize filename to remove invalid characters
function sanitizeFilename(filename) {
  // Remove or replace characters that are invalid in Windows/Linux/Mac filenames
  // Invalid: < > : " / \ | ? * and control characters (0-31)
  let sanitized = filename.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '_');

  // Replace multiple spaces/underscores with single underscore
  sanitized = sanitized.replace(/[\s_]+/g, '_');

  // Remove leading/trailing spaces, dots, and underscores
  sanitized = sanitized.trim().replace(/^[._]+|[._]+$/g, '');

  // Limit length (Windows has 255 char limit, leave room for .torrent extension)
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  // If empty after sanitization, use default
  return sanitized || 'download';
}

// Add download to history (keep last 10)
function addToDownloadHistory(filename, url, isMagnet) {
  chrome.storage.local.get(['downloadHistory'], function(result) {
    let history = result.downloadHistory || [];

    // Add new download at the beginning
    history.unshift({
      filename: filename,
      url: url,
      isMagnet: isMagnet,
      timestamp: Date.now()
    });

    // Keep only last 10
    if (history.length > 10) {
      history = history.slice(0, 10);
    }

    // Save back to storage
    chrome.storage.local.set({ downloadHistory: history }, function() {
      console.log('Download history updated:', history.length, 'items');
    });
  });
}

// Extract display name from magnet link
function extractMagnetName(magnetUrl) {
  try {
    const url = new URL(magnetUrl);
    const dn = url.searchParams.get('dn');
    if (dn) {
      // Decode the name
      let name = decodeURIComponent(dn);
      // Sanitize for filesystem
      return sanitizeFilename(name);
    }
  } catch (e) {
    console.error('Error extracting magnet name:', e);
  }
  return 'download';
}

// Validate that a file is a proper .torrent file
async function validateTorrentFile(downloadId) {
  return new Promise((resolve) => {
    chrome.downloads.search({ id: downloadId }, function(results) {
      if (!results || results.length === 0) {
        console.error('Download not found for validation');
        resolve(false);
        return;
      }

      const download = results[0];

      // Check if download completed successfully
      if (download.state === 'complete' && download.exists) {
        // Valid .torrent files are bencoded and should be at least a few hundred bytes
        // A typical small .torrent file is 5KB-50KB
        if (download.fileSize && download.fileSize < 100) {
          console.error('Downloaded file too small to be valid .torrent:', download.fileSize, 'bytes');
          console.error('File path:', download.filename);
          resolve(false);
          return;
        }

        // Check if it's an HTML error page (common when conversion fails)
        // HTML files typically start with <!DOCTYPE or <html
        if (download.mime && download.mime.includes('html')) {
          console.error('Downloaded file is HTML, not a .torrent file');
          resolve(false);
          return;
        }

        // .torrent files should have application/x-bittorrent mime type
        // or application/octet-stream
        const validMimeTypes = ['application/x-bittorrent', 'application/octet-stream', ''];
        if (download.mime && !validMimeTypes.includes(download.mime)) {
          console.warn('Unexpected MIME type for .torrent:', download.mime);
          // Don't fail, just warn - some servers return wrong MIME types
        }

        console.log('Torrent file validated:');
        console.log('  - Size:', download.fileSize, 'bytes');
        console.log('  - MIME:', download.mime || 'unknown');
        console.log('  - Path:', download.filename);
        resolve(true);
      } else if (download.state === 'interrupted') {
        console.error('Download interrupted during validation');
        resolve(false);
      } else {
        // Still in progress
        resolve(true);
      }
    });
  });
}

// Handle torrent file download
async function handleTorrentDownload(url, filename, isMagnet = false) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['downloadPath', 'autoSave'], function(settings) {
      console.log('Starting download:', url, filename, settings);

      let downloadUrl = url;
      let downloadFilename = filename;

      // If it's a magnet link, convert to .torrent via itorrents.org
      if (isMagnet) {
        // Show yellow badge while processing magnet link
        chrome.action.setBadgeText({ text: '...' });
        chrome.action.setBadgeBackgroundColor({ color: '#ffbe0b' }); // Warning yellow

        const hash = extractMagnetHash(url);
        if (!hash) {
          // Clear badge on error
          chrome.action.setBadgeText({ text: '' });
          reject(new Error('Could not extract hash from magnet link'));
          return;
        }

        console.log('Converting magnet to .torrent, hash:', hash);
        downloadUrl = `https://itorrents.org/torrent/${hash}.torrent`;

        // Use display name from magnet link if available
        const magnetName = extractMagnetName(url);
        downloadFilename = `${magnetName}.torrent`;
        console.log('Converted magnet filename:', downloadFilename);
      } else {
        // Sanitize regular torrent filenames too
        downloadFilename = sanitizeFilename(filename.replace('.torrent', '')) + '.torrent';
      }

      // Build the full path with sanitization
      let fullPath = downloadFilename;
      if (settings.downloadPath) {
        // Sanitize the download path as well
        const sanitizedPath = settings.downloadPath.replace(/[<>:"\\|?*\x00-\x1F]/g, '_');
        fullPath = `${sanitizedPath}/${downloadFilename}`;
      }

      const downloadOptions = {
        url: downloadUrl,
        filename: fullPath,
        saveAs: !settings.autoSave,
        conflictAction: 'uniquify'
      };

      console.log('Download options:', downloadOptions);
      console.log('  - URL:', downloadOptions.url);
      console.log('  - Filename:', downloadOptions.filename);
      console.log('  - SaveAs:', downloadOptions.saveAs);

      chrome.downloads.download(downloadOptions, function(downloadId) {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        console.log('Download started successfully, ID:', downloadId);

        // Add to download history
        addToDownloadHistory(downloadFilename, url, isMagnet);

        // For magnet links, validate the downloaded file after a short delay
        if (isMagnet) {
          setTimeout(async () => {
            const isValid = await validateTorrentFile(downloadId);
            if (!isValid) {
              console.error('Downloaded file may not be a valid .torrent file');
              // Show notification but don't reject - file was downloaded
              chrome.storage.local.get(['showNotifications'], function(notifSettings) {
                if (notifSettings.showNotifications) {
                  chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Torrent Conversion Warning',
                    message: 'The downloaded file may not be valid. The torrent might not exist in the DHT network yet, or the conversion service is unavailable.'
                  });
                }
              });

              // Optionally remove the invalid file
              chrome.downloads.search({ id: downloadId }, function(results) {
                if (results && results.length > 0 && results[0].state === 'complete') {
                  console.log('Consider removing invalid file manually:', results[0].filename);
                }
              });
            }
          }, 3000); // Wait 3 seconds for download to complete
        }

        resolve(downloadId);
      });
    });
  });
}

// Monitor download progress
chrome.downloads.onChanged.addListener(function(downloadDelta) {
  if (downloadDelta.state) {
    chrome.storage.local.get(['showNotifications'], function(settings) {
      if (downloadDelta.state.current === 'complete') {
        // Show green badge when download completes
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#00ff88' }); // Success green

        // Clear badge after 3 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 3000);

        if (settings.showNotifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Torrent Download Complete',
            message: 'Your torrent file has been downloaded successfully.'
          });
        }
      } else if (downloadDelta.state.current === 'interrupted') {
        // Clear badge on failure
        chrome.action.setBadgeText({ text: '' });

        if (settings.showNotifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Torrent Download Failed',
            message: 'The torrent file download was interrupted.'
          });
        }
      }
    });
  }
});

// Context menu for downloading torrents
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: 'downloadTorrent',
    title: 'Download Torrent File',
    contexts: ['link']
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'downloadTorrent' && info.linkUrl) {
    const url = info.linkUrl;

    // Check if it's a torrent link
    if (url.endsWith('.torrent') || url.includes('.torrent?') || url.includes('torrent')) {
      const filename = url.substring(url.lastIndexOf('/') + 1).split('?')[0];
      handleTorrentDownload(url, filename || 'downloaded.torrent')
        .then(() => {
          console.log('Download started from context menu');
        })
        .catch(error => {
          console.error('Download failed:', error);
        });
    }
  }
});

// Handle browser action badge
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes.enabled) {
    const enabled = changes.enabled.newValue;
    chrome.action.setBadgeText({
      text: enabled ? '' : 'OFF'
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#FF0000'
    });
  }
});

// Set initial badge state on startup
chrome.storage.local.get(['enabled'], function(result) {
  console.log('Initial badge state check - enabled:', result.enabled);
  if (result.enabled === false) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  }
});
