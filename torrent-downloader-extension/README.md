# Torrent File Downloader Extension

A Chrome and Edge browser extension that intercepts torrent links and downloads the `.torrent` files directly to your downloads folder. This allows you to collect torrent files without automatically opening them in your BitTorrent client.

## Features

- **Automatic Torrent Link Detection**: Automatically detects and highlights torrent links on any webpage
- **Direct Download**: Downloads `.torrent` files directly to your downloads folder
- **Customizable Download Location**: Specify a subfolder within your downloads directory
- **Managed Domains**: Add frequently-used torrent sites for optimized performance
- **Magnet Link Support**: Copies magnet links to clipboard for manual use
- **Visual Indicators**: Highlights torrent links with icons for easy identification
- **Context Menu Integration**: Right-click any link and download as torrent
- **Flexible Settings**:
  - Toggle extension on/off
  - Auto-save or show save dialog
  - Enable/disable link highlighting
  - Enable/disable notifications

## Installation

### Chrome

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the `torrent-downloader-extension` folder
6. The extension is now installed!

### Microsoft Edge

1. Download or clone this repository
2. Open Edge and navigate to `edge://extensions/`
3. Enable "Developer mode" in the left sidebar
4. Click "Load unpacked"
5. Select the `torrent-downloader-extension` folder
6. The extension is now installed!

## Setup

### Adding Icons

Before using the extension, you need to add icon files to the `icons` folder:

1. Create an `icons` folder in the extension directory
2. Add three PNG icon files:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

You can create simple icons using any image editor, or use free icon resources. The icons should represent a download or torrent symbol.

**Quick tip**: You can use online tools like [Favicon Generator](https://realfavicongenerator.net/) to create icons in multiple sizes.

## Usage

### Basic Usage

1. **Enable the Extension**: Click the extension icon in your browser toolbar and ensure it's toggled on
2. **Browse Torrent Sites**: Navigate to any website with torrent links
3. **Click Torrent Links**: The extension will automatically intercept clicks on `.torrent` files and download them
4. **Find Your Files**: Downloaded torrent files will be in your downloads folder (or the subfolder you specified)

### Managing Domains

Add domains where you frequently download torrents for optimized performance:

1. Click the extension icon
2. The current domain will be displayed
3. Click "Add to Managed Domains" to add it to your list
4. View and remove managed domains in the popup or settings page

### Configuring Download Location

1. Click the extension icon
2. Click "Open Full Settings"
3. Enter a relative path in the "Download Folder" field (e.g., `torrents` or `media/torrents`)
4. Click "Save Path"
5. Leave empty to use the default downloads folder

### Magnet Links

When you click a magnet link:
- The extension will copy it to your clipboard
- A notification will appear confirming the copy
- Paste the magnet link into your BitTorrent client manually

### Context Menu

Right-click any link and select "Download Torrent File" to force-download it as a torrent, even if it's not automatically detected.

## Settings

### Extension Settings

- **Enable Extension**: Turn the extension on or off
- **Highlight Torrent Links**: Visually highlight detected torrent links
- **Auto-Save Downloads**: Automatically save without showing the file picker
- **Show Notifications**: Display notifications when downloads complete

### Privacy & Permissions

This extension requires the following permissions:

- **downloads**: To download torrent files
- **storage**: To save your settings and managed domains
- **activeTab**: To detect torrent links on the current page
- **scripting**: To inject content scripts for link detection
- **host_permissions (all_urls)**: To work on any website you visit

**Privacy Note**: This extension does NOT collect, store, or transmit any personal data. All settings are stored locally in your browser.

## How It Works

1. **Content Script**: Scans pages for torrent links (`.torrent` files and common patterns)
2. **Link Detection**: Identifies links using:
   - `.torrent` file extension
   - Common torrent download URL patterns
   - Magnet links (`magnet:?xt=`)
3. **Click Interception**: When you click a torrent link, the extension prevents default behavior
4. **Download**: Uses Chrome's download API to save the file to your specified location
5. **Notification**: Displays a success or error message

## Supported Link Patterns

The extension detects these types of torrent links:

- Direct `.torrent` files: `https://example.com/file.torrent`
- Query parameter torrents: `https://example.com/download?file=name.torrent`
- Download scripts: `https://example.com/download.php?id=123`
- Magnet links: `magnet:?xt=urn:btih:...`

## Troubleshooting

### Links Not Being Detected

- Make sure the extension is enabled (check the popup)
- Verify that link highlighting is turned on in settings
- Try refreshing the page after enabling the extension
- Check if the link matches supported patterns

### Downloads Not Starting

- Check browser permissions for the extension
- Verify the download path is valid (no special characters)
- Check if your browser's download settings block automatic downloads
- Look for errors in the browser console (F12)

### Extension Not Working on Certain Sites

- Some sites may use JavaScript to generate links dynamically
- Try adding the domain to "Managed Domains"
- Refresh the page after adding to managed domains
- Check if the site uses non-standard link formats

## Development

### Project Structure

```
torrent-downloader-extension/
├── manifest.json           # Extension manifest
├── background.js           # Service worker for downloads
├── content.js              # Content script for link detection
├── content.css             # Styles for content script
├── popup.html              # Extension popup UI
├── popup.js                # Popup functionality
├── popup.css               # Popup styles
├── options.html            # Settings page
├── options.js              # Settings functionality
├── options.css             # Settings page styles
├── icons/                  # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md               # This file
```

### Modifying the Extension

1. Make changes to the source files
2. Go to `chrome://extensions/` or `edge://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Adding New Features

The extension is structured for easy modification:

- **Link Detection**: Edit patterns in `content.js` → `isTorrentLink()` function
- **Download Behavior**: Modify `background.js` → `handleTorrentDownload()` function
- **UI Changes**: Update HTML/CSS files and corresponding JS files
- **New Settings**: Add to `DEFAULT_SETTINGS` in `background.js` and update UI

## Best Practices

1. **Use Managed Domains**: Add your frequently-visited torrent sites for better performance
2. **Organize Downloads**: Set a dedicated subfolder for torrent files (e.g., `torrents`)
3. **Auto-Save**: Enable auto-save to skip the file picker dialog
4. **Regular Cleanup**: Periodically clean up downloaded `.torrent` files after adding them to your client

## Known Limitations

- Cannot download torrents from sites requiring authentication (session cookies not passed)
- Some sites with complex JavaScript may not work perfectly
- Magnet links are copied to clipboard only (cannot be automatically opened in your client)
- Download path is relative to browser's download folder (cannot use absolute paths)

## Future Enhancements

Potential features for future versions:

- [ ] Automatic torrent client integration
- [ ] Download queue management
- [ ] Statistics tracking (number of torrents downloaded)
- [ ] Custom link patterns via regex
- [ ] Export/import settings
- [ ] Dark mode UI

## License

This extension is provided as-is for personal use. Feel free to modify and distribute according to your needs.

## Support

If you encounter issues:

1. Check the Troubleshooting section
2. Review browser console for errors (F12 → Console)
3. Verify all permissions are granted
4. Try disabling and re-enabling the extension

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

---

**Note**: This extension only downloads `.torrent` files. You still need a BitTorrent client (like qBittorrent, Transmission, or uTorrent) to actually download the content referenced by the torrent files.
