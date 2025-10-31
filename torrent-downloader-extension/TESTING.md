# Testing Guide - Torrent Downloader Extension

## Issues Fixed

1. **Settings Persistence**: Changed from `chrome.storage.sync` to `chrome.storage.local` for better reliability
2. **Settings Initialization**: Settings now properly initialize on install and startup
3. **Download Functionality**: Added extensive logging to debug download issues
4. **Permissions**: Added missing `notifications` and `contextMenus` permissions

## How to Test the Fixes

### Step 1: Reload the Extension

1. Go to `chrome://extensions/` or `edge://extensions/`
2. Find "Torrent File Downloader"
3. Click the **Reload** button (circular arrow icon)
4. Open the extension's **Service Worker** console by clicking "service worker" under "Inspect views"

### Step 2: Verify Settings Persistence

1. Click the extension icon in your toolbar
2. Toggle **Extension Enabled** to ON
3. Check these settings:
   - ✅ Highlight torrent links
   - ✅ Auto-save without prompt
   - ✅ Show download notifications
4. Close the popup
5. **Close and reopen your browser**
6. Click the extension icon again
7. **Verify all settings are still ON** ✓

### Step 3: Test Torrent Link Detection

1. Create a test HTML file or visit a torrent site
2. Open the browser console (F12 → Console tab)
3. Look for these log messages:
   ```
   [Torrent Downloader] Loaded settings: {...}
   [Torrent Downloader] Extension enabled: true
   [Torrent Downloader] Initializing link detection...
   [Torrent Downloader] Found X links on page
   [Torrent Downloader] Total torrent links detected: X
   ```

### Step 4: Test Torrent File Download

1. Navigate to a page with `.torrent` links
2. Look for links with the download icon (⬇️)
3. Open browser console (F12)
4. Click on a torrent link
5. Check console for these messages:
   ```
   [Torrent Downloader] Torrent link clicked!
   [Torrent Downloader] Settings enabled: true
   [Torrent Downloader] Link URL: [url]
   [Torrent Downloader] Sending download request for: [filename]
   [Torrent Downloader] Download response: {success: true, downloadId: X}
   ```
6. Check your downloads folder for the `.torrent` file

### Step 5: Test Magnet Links

1. Find a magnet link on a torrent site
2. Click the magnet link
3. You should see: "Magnet link copied to clipboard!"
4. Console should show:
   ```
   [Torrent Downloader] Magnet link detected, copying to clipboard
   ```

## Creating a Test Page

If you don't have access to a torrent site, create this test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Torrent Link Test Page</title>
</head>
<body>
  <h1>Test Torrent Links</h1>

  <h2>Direct .torrent links:</h2>
  <ul>
    <li><a href="https://example.com/test.torrent">Test Torrent 1</a></li>
    <li><a href="https://example.com/files/sample.torrent">Test Torrent 2</a></li>
    <li><a href="https://example.com/download.torrent?id=123">Test Torrent 3</a></li>
  </ul>

  <h2>Magnet link:</h2>
  <ul>
    <li><a href="magnet:?xt=urn:btih:1234567890abcdef&dn=Test">Test Magnet Link</a></li>
  </ul>

  <h2>Regular links (should NOT be detected):</h2>
  <ul>
    <li><a href="https://example.com">Regular Link 1</a></li>
    <li><a href="https://google.com">Regular Link 2</a></li>
  </ul>
</body>
</html>
```

Save this as `test-torrents.html` and open it in your browser.

## Expected Behavior

### When Extension is Enabled (ON):
- Torrent links should have a green background highlight
- Download icon (⬇️) should appear before each torrent link
- Clicking a `.torrent` link should **download the file**
- Clicking a magnet link should **copy to clipboard**
- A notification should appear after each action

### When Extension is Disabled (OFF):
- No highlighting
- No icons
- Links work normally (browser's default behavior)
- Badge shows "OFF" on extension icon

## Troubleshooting

### Settings Not Saving
1. Check Service Worker console for errors
2. Look for "Settings saved successfully" message
3. Verify browser has permission to use storage
4. Try clearing extension data: Settings → Privacy → Clear browsing data → Cached images and files

### Downloads Not Starting
1. Open browser console (F12)
2. Look for error messages in red
3. Check Service Worker console for "Download error" messages
4. Verify browser download permissions
5. Check if popup blocker is interfering
6. Try with "Auto-save without prompt" enabled

### Links Not Detected
1. Check console for "Torrent link found" messages
2. Verify the link actually ends with `.torrent` or matches patterns
3. Try refreshing the page after enabling extension
4. Add the domain to "Managed Domains"

### Common Error Messages

**"Extension context invalidated"**
- Solution: Reload the extension

**"Could not establish connection"**
- Solution: Refresh the webpage after reloading extension

**"Downloads permission has not been granted"**
- Solution: Remove and reinstall the extension, accepting all permissions

## Debugging Tips

1. **Always have two consoles open:**
   - Page Console (F12 on the webpage)
   - Service Worker Console (Extensions page → Inspect service worker)

2. **Check both consoles** for error messages

3. **Look for the prefix** `[Torrent Downloader]` in console logs

4. **Verify Settings:**
   ```javascript
   // Run in Service Worker console:
   chrome.storage.local.get(null, (data) => console.log(data));
   ```

5. **Manually trigger download:**
   ```javascript
   // Run in Service Worker console:
   chrome.downloads.download({
     url: 'https://example.com/test.torrent',
     filename: 'test.torrent'
   }, (id) => console.log('Download ID:', id));
   ```

## Success Criteria

✅ Settings persist after browser restart
✅ Extension toggle stays ON
✅ Torrent links are highlighted
✅ Clicking `.torrent` links downloads files (NOT copy to clipboard)
✅ Magnet links copy to clipboard
✅ Notifications appear
✅ Console shows detailed logging
✅ No errors in console

If all criteria are met, the extension is working correctly!

## Reporting Issues

If you still have issues, provide:
1. Browser and version
2. Console logs from both consoles
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots if applicable
