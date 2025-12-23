# BTEazy - Effortless Torrent Downloads

A modern Chrome and Edge browser extension that intercepts torrent links and downloads `.torrent` files directly to your downloads folder. Features magnet link conversion, download history tracking, and a sleek dark UI.

## Features

- **Direct Download** - Downloads `.torrent` files directly to your downloads folder
- **Magnet Link Conversion** - Automatically converts magnet links to `.torrent` files
- **Download History** - Track your last 10 downloads with timestamps
- **Link Detection** - Detects and highlights torrent links on any webpage
- **Custom Download Location** - Specify a subfolder within your downloads directory
- **Visual Indicators** - Badge shows processing (yellow) and complete (green) states
- **Flexible Settings** - Toggle extension, auto-save, link highlighting, and notifications

## Installation

### Chrome

1. Download or clone this repository
2. Open `generate-icons.html` in your browser and save icons to the `icons/` folder
3. Navigate to `chrome://extensions/`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the project folder

### Microsoft Edge

1. Download or clone this repository
2. Open `generate-icons.html` in your browser and save icons to the `icons/` folder
3. Navigate to `edge://extensions/`
4. Enable **Developer mode** (left sidebar)
5. Click **Load unpacked** and select the project folder

## Usage

### Basic Usage

1. **Enable** - Click the extension icon and toggle ON
2. **Browse** - Navigate to any website with torrent links
3. **Download** - Click any torrent link to download automatically
4. **Monitor** - Watch the badge: yellow (processing) → green (complete)
5. **View History** - Click the extension icon to see recent downloads

### Magnet Links

When you click a magnet link:
1. Badge turns yellow (processing)
2. Hash is extracted and converted via itorrents.org
3. `.torrent` file downloads automatically
4. Badge turns green (complete)

**Note**: The magnet link must contain a valid hash that exists in the DHT network.

### Download History

The popup displays recent activity:
- **M** badge = Magnet link (converted)
- **T** badge = Direct torrent file
- Shows filename and relative time (e.g., "5m ago")

### Settings

Click **Settings** in the popup to configure:

| Setting | Description |
|---------|-------------|
| Enable/Disable | Master toggle for the extension |
| Link Highlighting | Show visual indicators on torrent links |
| Auto-save | Download without file picker dialog |
| Notifications | Show download completion alerts |
| Download Path | Subfolder within downloads (e.g., `torrents`) |
| Managed Domains | Add frequently-visited torrent sites |

## How It Works

### Architecture (Manifest V3)

| Component | File | Purpose |
|-----------|------|---------|
| Service Worker | `background.js` | Downloads, magnet conversion, history, notifications |
| Content Script | `content.js` | Link detection, click interception, visual indicators |
| Popup UI | `popup.*` | Quick toggle, history, status |
| Options UI | `options.*` | Full settings page |

### Link Detection

Automatically detects:
- Direct `.torrent` files: `https://example.com/file.torrent`
- Query parameters: `https://example.com/download?file=name.torrent`
- Download scripts: `https://example.com/download.php?id=123`
- Magnet links: `magnet:?xt=urn:btih:...`

### Magnet Conversion Process

1. Extracts BitTorrent info hash (`btih:HASH`)
2. Downloads from `https://itorrents.org/torrent/HASH.torrent`
3. Validates file size (>100 bytes) and MIME type
4. Warns if conversion fails

## Permissions

| Permission | Purpose |
|------------|---------|
| `downloads` | Download .torrent files |
| `storage` | Save settings and history locally |
| `activeTab` | Access current tab for link detection |
| `scripting` | Inject content scripts |
| `notifications` | Show download notifications |
| `contextMenus` | Right-click menu integration |
| `<all_urls>` | Work on any website |

**Privacy**: All data is stored locally. No data is collected or transmitted.

## Troubleshooting

### Links Not Detected
- Ensure extension is enabled (toggle ON)
- Enable link highlighting in settings
- Refresh page after enabling

### Downloads Not Starting
- Check browser permissions
- Enable "Auto-save without prompt"
- Verify download path has no special characters

### Magnet Conversion Fails
- Magnet must contain valid `btih:` hash
- Hash must exist in DHT network
- itorrents.org must be accessible
- Check if downloaded file is >100 bytes

### Extension Context Invalidated
1. Reload extension in `chrome://extensions/`
2. Refresh all webpages

## Development

### Testing Changes

1. Go to `chrome://extensions/` or `edge://extensions/`
2. Click **Reload** on the extension card
3. Open **Service Worker** console for background logs
4. Open browser console (F12) for content script logs
5. Refresh test pages

### Debug Commands

```javascript
// Check settings (in Service Worker console)
chrome.storage.local.get(null, (data) => console.log(data));

// Test download
chrome.downloads.download({
  url: 'https://example.com/test.torrent',
  filename: 'test.torrent'
}, (id) => console.log('Download ID:', id));
```

### Project Structure

```
bteazy/
├── manifest.json       # Manifest V3 configuration
├── background.js       # Service worker
├── content.js          # Link detection
├── content.css         # Link highlighting styles
├── popup.html/js/css   # Extension popup
├── options.html/js/css # Settings page
├── generate-icons.html # Icon generator
└── icons/              # Extension icons
```

### Modifying Features

| Feature | File | Function |
|---------|------|----------|
| Link detection | `content.js` | `isTorrentLink()` |
| Download behavior | `background.js` | `handleTorrentDownload()` |
| UI changes | HTML/CSS files | Various |
| New settings | `background.js` | `DEFAULT_SETTINGS` |

## Building for Release

### Using Build Scripts

**Windows:**
```powershell
.\build.ps1
```

**Linux/Mac:**
```bash
chmod +x build.sh
./build.sh
```

Creates `dist/bteazy-vX.X.X.zip` ready for store submission.

### GitHub Releases

Push a version tag to trigger automatic release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Publishing

- **Chrome Web Store**: [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- **Edge Add-ons**: [Partner Dashboard](https://partner.microsoft.com/dashboard/microsoftedge/overview)

## Known Limitations

- Cannot download from sites requiring authentication
- Magnet conversion depends on itorrents.org availability
- Download path must be relative (no absolute paths)
- Some JavaScript-heavy sites may not detect all links

## License

This extension is provided as-is for personal use.

---

**Note**: This extension downloads `.torrent` files only. You need a BitTorrent client (qBittorrent, Transmission, etc.) to download the actual content.
