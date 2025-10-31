// Content script to detect and manage torrent links
(function() {
  'use strict';

  let settings = {
    enabled: true,
    highlightLinks: true,
    managedDomains: []
  };

  // Load settings from storage
  chrome.storage.local.get({
    enabled: true,
    highlightLinks: true,
    managedDomains: []
  }, function(result) {
    console.log('[Torrent Downloader] Loaded settings:', result);

    settings.enabled = result.enabled;
    settings.highlightLinks = result.highlightLinks;
    settings.managedDomains = result.managedDomains || [];

    console.log('[Torrent Downloader] Extension enabled:', settings.enabled);

    if (settings.enabled) {
      console.log('[Torrent Downloader] Initializing link detection...');
      initTorrentLinkDetection();
    } else {
      console.log('[Torrent Downloader] Extension is disabled');
    }
  });

  // Detect if current domain is managed
  function isDomainManaged() {
    const currentDomain = window.location.hostname;
    return settings.managedDomains.some(domain =>
      currentDomain.includes(domain) || domain.includes(currentDomain)
    );
  }

  // Check if a link is a torrent link
  function isTorrentLink(href) {
    if (!href) return false;

    // Check for .torrent extension
    if (href.toLowerCase().endsWith('.torrent')) return true;

    // Check for common torrent patterns
    const torrentPatterns = [
      /\.torrent(\?|$)/i,
      /download\.php.*torrent/i,
      /action=download/i,
      /magnet:\?xt=/i
    ];

    return torrentPatterns.some(pattern => pattern.test(href));
  }

  // Initialize torrent link detection
  function initTorrentLinkDetection() {
    const isManaged = isDomainManaged();
    console.log('[Torrent Downloader] Domain managed:', isManaged);

    // Find all links on the page
    const links = document.querySelectorAll('a[href]');
    console.log('[Torrent Downloader] Found', links.length, 'links on page');

    let torrentLinksFound = 0;

    links.forEach(link => {
      const href = link.getAttribute('href');

      if (isTorrentLink(href)) {
        torrentLinksFound++;
        console.log('[Torrent Downloader] Torrent link found:', href);

        // Add visual indicator
        if (settings.highlightLinks) {
          link.classList.add('torrent-link-detected');

          // Add icon indicator
          if (!link.querySelector('.torrent-icon')) {
            const icon = document.createElement('span');
            icon.className = 'torrent-icon';
            icon.textContent = '⬇️';
            icon.title = 'Torrent file - Click to download';
            link.insertBefore(icon, link.firstChild);
          }
        }

        // Add click handler
        link.addEventListener('click', handleTorrentClick, true);

        // Mark as processed
        link.dataset.torrentProcessed = 'true';
      }
    });

    console.log('[Torrent Downloader] Total torrent links detected:', torrentLinksFound);

    // Watch for dynamically added links
    observeDOMChanges();
  }

  // Handle torrent link clicks
  function handleTorrentClick(event) {
    console.log('[Torrent Downloader] Torrent link clicked!');
    console.log('[Torrent Downloader] Settings enabled:', settings.enabled);

    if (!settings.enabled) {
      console.log('[Torrent Downloader] Extension disabled, not handling click');
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const link = event.currentTarget;
    const href = link.href;

    console.log('[Torrent Downloader] Link URL:', href);

    // Check if it's a magnet link
    const isMagnet = href.startsWith('magnet:');
    if (isMagnet) {
      console.log('[Torrent Downloader] Magnet link detected, converting to .torrent');
    }

    // For both .torrent files and magnet links, send to background for download
    const filename = extractFilename(href, link.textContent);
    console.log('[Torrent Downloader] Sending download request for:', filename);

    chrome.runtime.sendMessage({
      action: 'downloadTorrent',
      url: href,
      filename: filename,
      isMagnet: isMagnet
    }, function(response) {
      console.log('[Torrent Downloader] Download response:', response);

      if (chrome.runtime.lastError) {
        console.error('[Torrent Downloader] Runtime error:', chrome.runtime.lastError);
        showNotification('Extension error: ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      if (response && response.success) {
        const message = isMagnet
          ? 'Magnet link converted and downloading!'
          : 'Torrent file download started!';
        showNotification(message, 'success');
      } else {
        const errorMsg = response && response.error ? response.error : 'Unknown error';
        console.error('[Torrent Downloader] Download failed:', errorMsg);
        showNotification('Failed to download: ' + errorMsg, 'error');
      }
    });
  }

  // Extract filename from URL or link text
  function extractFilename(url, linkText) {
    // Try to get filename from URL
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

      if (filename && filename.endsWith('.torrent')) {
        return filename;
      }
    } catch (e) {
      // Invalid URL
    }

    // Fallback to link text
    let filename = linkText.trim().substring(0, 50);
    filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return filename + '.torrent';
  }

  // Copy text to clipboard
  function copyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `torrent-notification torrent-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Observe DOM changes for dynamically added links
  function observeDOMChanges() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            // Check if the node itself is a link
            if (node.tagName === 'A' && !node.dataset.torrentProcessed) {
              const href = node.getAttribute('href');
              if (isTorrentLink(href)) {
                processLink(node);
              }
            }

            // Check for links within the node
            if (node.querySelectorAll) {
              const links = node.querySelectorAll('a[href]:not([data-torrent-processed])');
              links.forEach(link => {
                const href = link.getAttribute('href');
                if (isTorrentLink(href)) {
                  processLink(link);
                }
              });
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Process a single link
  function processLink(link) {
    if (settings.highlightLinks) {
      link.classList.add('torrent-link-detected');

      if (!link.querySelector('.torrent-icon')) {
        const icon = document.createElement('span');
        icon.className = 'torrent-icon';
        icon.textContent = '⬇️';
        icon.title = 'Torrent file - Click to download';
        link.insertBefore(icon, link.firstChild);
      }
    }

    link.addEventListener('click', handleTorrentClick, true);
    link.dataset.torrentProcessed = 'true';
  }

  // Listen for settings updates
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateSettings') {
      settings = { ...settings, ...request.settings };

      // Re-initialize if enabled
      if (settings.enabled) {
        initTorrentLinkDetection();
      }

      sendResponse({ success: true });
    }
  });

})();
