// Options page script
document.addEventListener('DOMContentLoaded', function() {
  const enabledToggle = document.getElementById('enabledToggle');
  const highlightLinksToggle = document.getElementById('highlightLinksToggle');
  const autoSaveToggle = document.getElementById('autoSaveToggle');
  const showNotificationsToggle = document.getElementById('showNotificationsToggle');
  const downloadPathInput = document.getElementById('downloadPathInput');
  const savePathBtn = document.getElementById('savePathBtn');
  const newDomainInput = document.getElementById('newDomainInput');
  const addDomainBtn = document.getElementById('addDomainBtn');
  const domainList = document.getElementById('domainList');
  const resetBtn = document.getElementById('resetBtn');

  let currentSettings = {};

  // Load settings on page load
  loadSettings();

  // Event listeners for toggles
  enabledToggle.addEventListener('change', function() {
    saveSetting('enabled', this.checked);
  });

  highlightLinksToggle.addEventListener('change', function() {
    saveSetting('highlightLinks', this.checked);
  });

  autoSaveToggle.addEventListener('change', function() {
    saveSetting('autoSave', this.checked);
  });

  showNotificationsToggle.addEventListener('change', function() {
    saveSetting('showNotifications', this.checked);
  });

  // Download path
  savePathBtn.addEventListener('click', function() {
    const path = downloadPathInput.value.trim();
    saveSetting('downloadPath', path);
  });

  // Domain management
  addDomainBtn.addEventListener('click', function() {
    const domain = newDomainInput.value.trim().toLowerCase();
    if (domain) {
      addManagedDomain(domain);
      newDomainInput.value = '';
    }
  });

  newDomainInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addDomainBtn.click();
    }
  });

  // Reset settings
  resetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      resetSettings();
    }
  });

  // Load settings from storage
  function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, function(settings) {
      currentSettings = settings;

      // Update UI
      enabledToggle.checked = settings.enabled;
      highlightLinksToggle.checked = settings.highlightLinks;
      autoSaveToggle.checked = settings.autoSave;
      showNotificationsToggle.checked = settings.showNotifications;
      downloadPathInput.value = settings.downloadPath || '';

      // Load managed domains
      loadManagedDomains(settings.managedDomains || []);
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
        showToast('Settings saved successfully', 'success');
      }
    });
  }

  // Load managed domains list
  function loadManagedDomains(domains) {
    domainList.innerHTML = '';

    if (domains.length === 0) {
      domainList.innerHTML = '<p class="empty-message">No managed domains yet. Add domains where you frequently download torrents.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'domain-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Domain</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    domains.forEach(domain => {
      const row = document.createElement('tr');

      const domainCell = document.createElement('td');
      domainCell.textContent = domain;

      const actionsCell = document.createElement('td');
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-small btn-danger';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', function() {
        removeManagedDomain(domain);
      });
      actionsCell.appendChild(removeBtn);

      row.appendChild(domainCell);
      row.appendChild(actionsCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    domainList.appendChild(table);
  }

  // Add managed domain
  function addManagedDomain(domain) {
    // Validate domain format
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      showToast('Please enter a valid domain (e.g., example.com)', 'error');
      return;
    }

    chrome.runtime.sendMessage({
      action: 'addManagedDomain',
      domain: domain
    }, function(response) {
      if (response && response.success) {
        loadManagedDomains(response.domains);
        currentSettings.managedDomains = response.domains;
        showToast('Domain added successfully', 'success');
      } else {
        showToast(response.message || 'Failed to add domain', 'error');
      }
    });
  }

  // Remove managed domain
  function removeManagedDomain(domain) {
    chrome.runtime.sendMessage({
      action: 'removeManagedDomain',
      domain: domain
    }, function(response) {
      if (response && response.success) {
        loadManagedDomains(response.domains);
        currentSettings.managedDomains = response.domains;
        showToast('Domain removed successfully', 'success');
      }
    });
  }

  // Reset all settings
  function resetSettings() {
    const defaultSettings = {
      enabled: true,
      downloadPath: '',
      highlightLinks: true,
      managedDomains: [],
      autoSave: true,
      showNotifications: true
    };

    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: defaultSettings
    }, function(response) {
      if (response && response.success) {
        loadSettings();
        showToast('Settings reset to defaults', 'success');
      }
    });
  }

  // Show toast notification
  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
