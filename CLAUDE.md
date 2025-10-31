# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BTEazy is a modern Chrome/Edge browser extension that intercepts torrent links and downloads `.torrent` files directly to the user's downloads folder. Features magnet link conversion, download history tracking, and a sleek dark cyberpunk-inspired UI with cyan/purple gradients. The extension prevents torrent files from automatically opening in BitTorrent clients.

## Development Setup

### Initial Installation
1. Create an `icons` folder in `torrent-downloader-extension/` directory
2. Open `generate-icons.html` in browser and download all icons to the `icons/` folder
3. Load extension in Chrome via `chrome://extensions/` or Edge via `edge://extensions/`
4. Enable "Developer mode" and click "Load unpacked"
5. Select the `torrent-downloader-extension` folder

### Testing Changes
After modifying source files:
1. Navigate to `chrome://extensions/` or `edge://extensions/`
2. Click the refresh icon on the extension card
3. Refresh any webpage where you want to test the extension
4. Open Service Worker console (Extensions page → "service worker" link) for background script logs
5. Open Browser console (F12) on webpage for content script logs

### Testing Workflow
See the Testing section in [README.md](torrent-downloader-extension/README.md) for comprehensive testing procedures.

## Architecture

### Extension Components

The extension uses Manifest V3 architecture with three main components:

**1. Service Worker (background.js)**
- Handles download operations via Chrome Downloads API
- Manages extension settings in `chrome.storage.local`
- Monitors download progress and shows notifications
- Provides context menu integration
- Controls extension badge state (shows "OFF" when disabled)
- Message handler for communication with content scripts

**2. Content Script (content.js)**
- Injected into all pages (`<all_urls>`)
- Detects torrent links using URL patterns and `.torrent` extension
- Adds visual indicators (green highlight + download icon) to detected links
- Intercepts clicks on torrent links to trigger downloads
- Uses MutationObserver to detect dynamically-added links
- Handles magnet links by converting them to `.torrent` files

**3. UI Components**
- **popup.html/js**: Quick settings toggle and domain management
- **options.html/js**: Full settings page with path configuration
- **content.css**: Styling for link highlighting and notifications

### Settings Architecture

Settings are stored in `chrome.storage.local` (NOT `chrome.storage.sync`):
```javascript
{
  enabled: true,              // Master on/off switch
  downloadPath: '',           // Relative path within downloads folder
  highlightLinks: true,       // Show visual indicators
  managedDomains: [],         // Domains for optimized detection
  autoSave: true,            // Skip save dialog
  showNotifications: true     // Show download notifications
}
```

**Important**: Settings default initialization happens in:
- `chrome.runtime.onInstalled` - on extension install/update
- `chrome.runtime.onStartup` - on browser startup
- Both merge with `DEFAULT_SETTINGS` to ensure all keys exist

### Communication Flow

**Download Flow:**
1. Content script detects click on `.torrent` link or magnet link
2. Content script sends `downloadTorrent` message to background (includes `isMagnet` flag)
3. Background retrieves settings from storage
4. If magnet link:
   - Extracts hash from magnet URL using regex `/btih:([a-zA-Z0-9]+)/`
   - Extracts display name from `dn` parameter
   - Converts to `.torrent` URL via `https://itorrents.org/torrent/{HASH}.torrent`
5. Background calls `chrome.downloads.download()` with path and filename
6. Background monitors download via `chrome.downloads.onChanged`
7. Background shows notification on completion/failure

**Settings Update Flow:**
1. UI (popup/options) sends `saveSettings` message to background
2. Background saves to `chrome.storage.local`
3. Background broadcasts `updateSettings` to all content scripts
4. Content scripts update their local settings cache

### Link Detection Patterns

The `isTorrentLink()` function in content.js detects:
- Direct `.torrent` files: `https://example.com/file.torrent`
- Query parameter torrents: `https://example.com/download?file=name.torrent`
- Common download patterns: `/download.php.*torrent/`, `/action=download/`
- Magnet links: `magnet:?xt=`

To add new patterns, modify the `torrentPatterns` array in `content.js:49-54`.

### Managed Domains

Domains added to "Managed Domains" get optimized link detection. The content script checks if current domain matches any managed domain using substring matching (`domain.includes()`). This feature is for user organization but doesn't currently change detection behavior.

## Common Issues & Debugging

### Settings Not Persisting
- Ensure using `chrome.storage.local` (NOT `chrome.storage.sync`)
- Check Service Worker console for "Settings saved successfully"
- Verify default settings merge on startup

### Downloads Not Starting
- Check both Browser console (F12) and Service Worker console for errors
- Verify downloads permission is granted
- Look for `[Torrent Downloader]` prefixed logs
- Test with "Auto-save without prompt" enabled
- Verify download path doesn't contain invalid characters

### Links Not Detected
- Refresh page after enabling extension or changing settings
- Check browser console for "Torrent link found" messages
- Verify link matches patterns in `isTorrentLink()`
- Content script runs at `document_end` - dynamic links need MutationObserver

### Extension Context Invalidated
- Happens after reloading extension
- Solution: Refresh all webpages after extension reload
- Service Worker gets restarted on reload

## File Structure

```
torrent-downloader-extension/
├── manifest.json           # Manifest V3 configuration
├── background.js           # Service worker (downloads, settings, notifications)
├── content.js              # Link detection and click handling
├── content.css             # Link highlighting styles
├── popup.html/js/css       # Quick settings popup
├── options.html/js/css     # Full settings page
├── generate-icons.html     # Icon generator utility
└── icons/                  # Extension icons (16, 48, 128 px)
```

## Permissions Required

- `downloads`: Download .torrent files
- `storage`: Persist settings
- `activeTab`: Access current tab domain
- `scripting`: Inject content scripts
- `notifications`: Show download notifications
- `contextMenus`: Right-click context menu
- `host_permissions: <all_urls>`: Work on any website

## Magnet Link Conversion

The extension converts magnet links to `.torrent` files using the **itorrents.org** service:

1. Extracts the BitTorrent info hash from the magnet link (`btih:HASH`)
2. Downloads the .torrent file from `https://itorrents.org/torrent/HASH.torrent`
3. Uses the display name (`dn` parameter) from the magnet link as the filename
4. Falls back to "download.torrent" if no display name is available
5. Validates the downloaded file after 3 seconds to ensure it's a proper `.torrent` file

**Validation checks:**
- File size must be at least 100 bytes (typical .torrent files are 5KB-50KB)
- MIME type should be `application/x-bittorrent` or `application/octet-stream` (not HTML)
- If validation fails, shows a warning notification to the user

**Important**: This requires the itorrents.org service to be accessible. If the service is down or returns an error page (HTML), the extension will detect this and warn the user. The hash must be a valid BitTorrent info hash that exists in the DHT network.

## Known Limitations

- Cannot download from sites requiring authentication (session cookies not passed to download API)
- Magnet link conversion depends on itorrents.org service availability
- Magnet links must contain a valid info hash (`btih:`) that exists in the DHT network
- Download path must be relative to browser downloads folder (no absolute paths)
- MutationObserver may miss links added via complex JavaScript frameworks
