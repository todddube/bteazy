# BTEazy - Effortless Torrent Downloads

A modern Chrome and Edge browser extension that intercepts torrent links and downloads `.torrent` files directly to your downloads folder. Features a sleek dark cyberpunk theme with cyan and purple gradients, magnet link conversion, and download history tracking.

## Features

- **🎨 Modern Dark UI**: Sleek cyberpunk-inspired interface with gradient accents
- **📥 Direct Download**: Downloads `.torrent` files directly to your downloads folder
- **🧲 Magnet Link Conversion**: Automatically converts magnet links to `.torrent` files
- **📊 Download History**: Track your last 10 downloads with timestamps
- **🎯 Automatic Link Detection**: Detects and highlights torrent links on any webpage
- **💾 Customizable Download Location**: Specify a subfolder within your downloads directory
- **🔔 Visual Badge Indicators**: Shows yellow badge while processing, green when complete
- **🌐 Managed Domains**: Add frequently-used torrent sites for optimized performance
- **⚙️ Flexible Settings**:
  - Toggle extension on/off
  - Auto-save or show save dialog
  - Enable/disable link highlighting
  - Enable/disable notifications

## Installation

### Chrome

1. Download or clone this repository
2. Open the `generate-icons.html` file in your browser
3. Click "Download All Icons" and save them to the `icons/` folder
4. Navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top right corner
6. Click "Load unpacked"
7. Select the `torrent-downloader-extension` folder
8. The extension is now installed!

### Microsoft Edge

1. Download or clone this repository
2. Open the `generate-icons.html` file in your browser
3. Click "Download All Icons" and save them to the `icons/` folder
4. Navigate to `edge://extensions/`
5. Enable "Developer mode" in the left sidebar
6. Click "Load unpacked"
7. Select the `torrent-downloader-extension` folder
8. The extension is now installed!

## Usage

### Basic Usage

1. **Enable the Extension**: Click the extension icon in your browser toolbar - the toggle should be ON
2. **Browse Torrent Sites**: Navigate to any website with torrent links
3. **Click Torrent Links**: The extension will automatically intercept clicks and download files
4. **Watch the Badge**: Yellow "..." badge appears during processing, green "✓" when complete
5. **View History**: Click the extension icon to see your last 10 downloads
6. **Find Your Files**: Downloaded files are in your downloads folder (or specified subfolder)

### Magnet Link Conversion

When you click a magnet link:
- Extension shows yellow "..." badge (processing)
- Extracts the BitTorrent info hash from the magnet link
- Converts to `.torrent` file via itorrents.org service
- Downloads the `.torrent` file automatically
- Shows green "✓" badge when complete
- **Note**: Magnet must contain a valid hash that exists in the DHT network

### Download History

The popup shows your recent activity:
- **M** badge = Magnet link (converted to .torrent)
- **T** badge = Direct torrent file download
- Displays filename and time ago (e.g., "5m ago", "2h ago")
- Click "Clear" to remove all history
- Automatically keeps only the last 10 downloads

### Settings Configuration

Click "Settings" in the popup to access:

**General Settings:**
- Enable/disable extension
- Toggle link highlighting
- Auto-save without file picker dialog
- Show/hide notifications

**Download Location:**
- Set relative path within downloads folder (e.g., `torrents` or `media/torrents`)
- Leave empty for default downloads folder

**Managed Domains:**
- Add frequently-visited torrent sites
- Optimizes link detection for those domains
- Easily remove domains from the list

## How It Works

### Architecture

The extension uses Manifest V3 with three main components:

1. **Service Worker (background.js)**
   - Handles download operations
   - Converts magnet links to .torrent files via itorrents.org
   - Manages settings and download history
   - Shows notifications and badge indicators

2. **Content Script (content.js)**
   - Scans pages for torrent and magnet links
   - Adds visual indicators (highlighting + icons)
   - Intercepts clicks and sends to background
   - Uses MutationObserver for dynamic content

3. **UI Components**
   - **Popup**: Quick toggle, download history, and status
   - **Settings**: Full configuration page
   - **Modern Dark Theme**: Cyan (#00d9ff) and purple (#7b2cbf) gradients

### Link Detection Patterns

Automatically detects:
- Direct `.torrent` files: `https://example.com/file.torrent`
- Query parameter torrents: `https://example.com/download?file=name.torrent`
- Download scripts: `https://example.com/download.php?id=123`
- Magnet links: `magnet:?xt=urn:btih:...`

### Magnet Link Conversion Process

1. Extracts BitTorrent info hash from magnet URL (`btih:HASH`)
2. Extracts display name from `dn` parameter (if available)
3. Downloads `.torrent` from `https://itorrents.org/torrent/HASH.torrent`
4. Validates file size (must be >100 bytes) and MIME type
5. Warns user if conversion fails (invalid hash or service unavailable)

## Testing

### Step 1: Reload Extension After Changes

1. Go to `chrome://extensions/` or `edge://extensions/`
2. Find "BTEazy"
3. Click the **Reload** button (circular arrow icon)
4. Open the **Service Worker** console: click "service worker" under the extension
5. Refresh any webpages where you want to test

### Step 2: Verify Settings Persistence

1. Click extension icon → Toggle settings ON
2. Enable all options (highlight, auto-save, notifications)
3. Close popup and **restart browser**
4. Click extension icon again
5. ✅ Verify all settings are still ON

### Step 3: Test with Sample Page

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head><title>Torrent Test Page</title></head>
<body>
  <h1>Test Torrent Links</h1>

  <h2>Direct .torrent links:</h2>
  <ul>
    <li><a href="https://example.com/test.torrent">Test Torrent 1</a></li>
    <li><a href="https://example.com/download.torrent?id=123">Test Torrent 2</a></li>
  </ul>

  <h2>Magnet link:</h2>
  <ul>
    <li><a href="magnet:?xt=urn:btih:1234567890abcdef&dn=TestFile">Test Magnet</a></li>
  </ul>
</body>
</html>
```

Save as `test-torrents.html` and open in browser.

### Step 4: Test Torrent Download

1. Open test page or visit a torrent site
2. Look for green highlighting on torrent links
3. Open browser console (F12)
4. Click a `.torrent` link
5. Check console for: `[BTEazy] Download started successfully`
6. Watch extension badge turn yellow, then green
7. Check downloads folder for the file

### Step 5: Test Magnet Conversion

1. Find or create a magnet link
2. Click the magnet link
3. Watch badge turn yellow ("..." processing)
4. Console should show: `Converting magnet to .torrent`
5. Badge turns green ("✓") when complete
6. Check downloads folder for converted `.torrent` file

### Expected Behavior

**When Enabled:**
- ✅ Torrent links have green highlight
- ✅ Download icon appears on links
- ✅ Clicking `.torrent` downloads file
- ✅ Clicking magnet converts and downloads
- ✅ Yellow badge during processing
- ✅ Green badge on completion
- ✅ History shows in popup

**When Disabled:**
- ❌ No highlighting or icons
- ❌ Links work normally
- 🔴 Badge shows "OFF" on extension icon

### Debugging

**Open Two Consoles:**
1. Page Console: F12 on the webpage
2. Service Worker Console: Extensions page → "service worker" link

**Common Commands:**
```javascript
// In Service Worker console - check settings:
chrome.storage.local.get(null, (data) => console.log(data));

// Test manual download:
chrome.downloads.download({
  url: 'https://example.com/test.torrent',
  filename: 'test.torrent'
}, (id) => console.log('Download ID:', id));
```

## Troubleshooting

### Links Not Being Detected

- Ensure extension is enabled (toggle ON in popup)
- Verify link highlighting is enabled in settings
- Refresh page after enabling extension
- Check browser console for detection logs

### Downloads Not Starting

- Check browser permissions for the extension
- Try enabling "Auto-save without prompt"
- Look for errors in both consoles
- Verify download path contains no special characters

### Magnet Conversion Fails

- Check console for validation errors
- Magnet link must contain valid `btih:` hash
- Hash must exist in DHT network (recently shared torrents)
- itorrents.org service must be accessible
- Check if file downloaded is >100 bytes (not an error page)

### Extension Context Invalidated

**Error**: "Extension context invalidated"
**Solution**:
1. Reload extension in `chrome://extensions/`
2. Refresh all webpages

### Settings Not Persisting

- Check Service Worker console for "Settings saved successfully"
- Clear browser cache: Settings → Privacy → Clear browsing data
- Verify browser storage permissions

## Permissions

This extension requires:

- **downloads**: Download .torrent files
- **storage**: Save settings and history locally
- **activeTab**: Access current tab for link detection
- **scripting**: Inject content scripts
- **notifications**: Show download notifications
- **contextMenus**: Right-click menu integration
- **host_permissions (<all_urls>)**: Work on any website

**Privacy**: This extension does NOT collect, store, or transmit any personal data. All settings and history are stored locally in your browser.

## Project Structure

```
torrent-downloader-extension/
├── manifest.json           # Manifest V3 configuration
├── background.js           # Service worker (downloads, conversion, history)
├── content.js              # Link detection and click handling
├── content.css             # Link highlighting styles
├── popup.html              # Extension popup UI
├── popup.js                # Popup functionality
├── popup.css               # Modern dark theme styles
├── options.html            # Full settings page
├── options.js              # Settings functionality
├── options.css             # Settings page dark theme
├── generate-icons.html     # Icon generator with theme colors
├── icons/                  # Extension icons (cyan/purple gradient)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── CLAUDE.md               # Development guide for AI assistants
└── README.md               # This file
```

## Known Limitations

- Cannot download from sites requiring authentication (session cookies not passed)
- Magnet conversion requires itorrents.org service availability
- Magnet links must contain valid hash that exists in DHT network
- Download path must be relative to browser downloads folder (no absolute paths)
- MutationObserver may miss links on complex JavaScript frameworks

## Development

### Modifying the Extension

1. Make changes to source files
2. Go to `chrome://extensions/` or `edge://extensions/`
3. Click refresh icon on extension card
4. Refresh any test webpages
5. Check both consoles for errors

### Adding Features

- **Link Detection**: Edit `content.js` → `isTorrentLink()` function
- **Download Behavior**: Modify `background.js` → `handleTorrentDownload()`
- **UI Changes**: Update HTML/CSS files and corresponding JS
- **New Settings**: Add to `DEFAULT_SETTINGS` in `background.js`

### Theme Colors

The extension uses a modern dark theme:
- **Background Dark**: `#0f0f23`
- **Background Darker**: `#08081a`
- **Card Background**: `#1a1a2e`
- **Accent Cyan**: `#00d9ff`
- **Accent Purple**: `#7b2cbf`
- **Success Green**: `#00ff88`
- **Warning Yellow**: `#ffbe0b`
- **Danger Red**: `#ff006e`

## License

This extension is provided as-is for personal use. Feel free to modify and distribute according to your needs.

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review browser console logs (F12 → Console)
3. Check Service Worker console for background errors
4. Verify all permissions are granted
5. Try disabling and re-enabling the extension

---

**Note**: This extension only downloads `.torrent` files. You still need a BitTorrent client (like qBittorrent, Transmission, or uTorrent) to download the actual content referenced by the torrent files.
