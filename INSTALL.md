# BTEazy - Quick Installation Guide

## Step 1: Generate Icons

1. Open `generate-icons.html` in your web browser
2. Click "Download All Icons" button
3. Create an `icons` folder in the extension directory
4. Move the three downloaded PNG files into the `icons` folder

## Step 2: Load Extension in Chrome

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" button
5. Select the `torrent-downloader-extension` folder
6. Done! The extension is now installed

## Step 3: Load Extension in Edge

1. Open Microsoft Edge browser
2. Go to `edge://extensions/`
3. Enable "Developer mode" (toggle in left sidebar)
4. Click "Load unpacked" button
5. Select the `torrent-downloader-extension` folder
6. Done! The extension is now installed

## Step 4: Configure Settings

1. Click the extension icon in your browser toolbar
2. Toggle "Extension Enabled" to ON
3. (Optional) Click "Open Full Settings" to customize:
   - Download folder location
   - Auto-save preferences
   - Notification settings
   - Add frequently-used domains to Managed Domains

## Step 5: Test It Out

1. Navigate to a website with torrent download links
2. Look for the download icon (⬇️) and green highlight on torrent links
3. Click a torrent or magnet link
4. Watch the extension badge turn yellow (processing), then green (complete)
5. Check your downloads folder for the .torrent file

## Troubleshooting

**Icons not showing:**
- Make sure the icons folder exists with all three PNG files
- Reload the extension in chrome://extensions/

**Extension not working:**
- Make sure "Extension Enabled" is toggled ON in the popup
- Refresh the webpage after enabling the extension
- Check browser console (F12) for any errors

**Links not detected:**
- Enable "Highlight Torrent Links" in settings
- Add the current domain to "Managed Domains"
- Some sites may use non-standard link formats

For more detailed information, see the full [README.md](README.md).
