// Popup script for download history and status
document.addEventListener('DOMContentLoaded', function() {
  const enabledToggle = document.getElementById('enabledToggle');
  const statusLabel = document.getElementById('statusLabel');
  const statusDot = document.getElementById('statusDot');
  const downloadCount = document.getElementById('downloadCount');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const openOptionsBtn = document.getElementById('openOptionsBtn');
  const versionElement = document.getElementById('version');

  let currentSettings = {};

  // Load version from manifest
  const manifest = chrome.runtime.getManifest();
  versionElement.textContent = manifest.version;

  // Load current settings
  loadSettings();

  // Event listeners
  enabledToggle.addEventListener('change', function() {
    saveSetting('enabled', this.checked);
    updateStatus(this.checked);
  });

  clearHistoryBtn.addEventListener('click', function() {
    clearDownloadHistory();
  });

  openOptionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Update status indicator
  function updateStatus(enabled) {
    statusLabel.textContent = enabled ? 'Active' : 'Inactive';
    statusDot.className = 'status-dot ' + (enabled ? 'active' : 'inactive');
  }

  // Load settings from storage
  function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, function(settings) {
      currentSettings = settings;

      // Update UI
      enabledToggle.checked = settings.enabled;
      updateStatus(settings.enabled);

      // Load download history
      const history = settings.downloadHistory || [];
      loadDownloadHistory(history);
      downloadCount.textContent = history.length;
    });
  }

  // Save a single setting
  function saveSetting(key, value) {
    currentSettings[key] = value;
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: currentSettings
    }, function(response) {
      if (response && response.success) {
        showToast('Settings saved');
      }
    });
  }

  // Load download history
  function loadDownloadHistory(history) {
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>No downloads yet</p>
        </div>
      `;
      return;
    }

    history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';

      const typeIndicator = document.createElement('div');
      typeIndicator.className = 'type-indicator ' + (item.isMagnet ? 'magnet' : 'torrent');
      typeIndicator.textContent = item.isMagnet ? 'M' : 'T';
      typeIndicator.title = item.isMagnet ? 'Magnet link' : 'Torrent file';

      const info = document.createElement('div');
      info.className = 'history-info';

      const filename = document.createElement('div');
      filename.className = 'history-filename';
      filename.textContent = item.filename;
      filename.title = item.filename;

      const meta = document.createElement('div');
      meta.className = 'history-meta';

      const time = document.createElement('span');
      time.className = 'history-time';
      time.textContent = formatTimestamp(item.timestamp);

      meta.appendChild(time);
      info.appendChild(filename);
      info.appendChild(meta);

      historyItem.appendChild(typeIndicator);
      historyItem.appendChild(info);

      historyList.appendChild(historyItem);
    });
  }

  // Format timestamp
  function formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  // Clear download history
  function clearDownloadHistory() {
    if (confirm('Clear all download history?')) {
      currentSettings.downloadHistory = [];
      chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: currentSettings
      }, function(response) {
        if (response && response.success) {
          loadDownloadHistory([]);
          downloadCount.textContent = '0';
          showToast('History cleared');
        }
      });
    }
  }

  // Show toast notification
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
});
