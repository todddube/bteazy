# Build and Release Guide

## Building the Extension

### Using the build script

**On Windows:**
```powershell
.\build.ps1
```

**On Linux/Mac:**
```bash
chmod +x build.sh
./build.sh
```

This will create a zip file in the `dist/` directory with the version number from `manifest.json`:
```
dist/bteazy-v1.0.0.zip
```

The zip file is ready to be uploaded to the Chrome Web Store or Edge Add-ons store.

## Creating a Release

### Automatic Release via GitHub Actions

The repository has a GitHub Action that automatically creates releases when you push a version tag:

1. **Update version** in `manifest.json`:
   ```json
   {
     "version": "1.0.0"
   }
   ```

2. **Commit and push** your changes:
   ```bash
   git add manifest.json
   git commit -m "Bump version to 1.0.0"
   git push
   ```

3. **Create and push a tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. The GitHub Action will automatically:
   - Build the extension zip file
   - Generate release notes
   - Create a GitHub release with the zip file attached

### Manual Release

If you prefer to create releases manually:

1. Run the build script:
   ```bash
   ./build.sh
   ```

2. Go to [GitHub Releases](../../releases)

3. Click "Create a new release"

4. Fill in:
   - **Tag**: `v1.0.0` (create new tag)
   - **Title**: `BTEazy v1.0.0`
   - **Description**: Brief release notes
   - **Attach**: Upload `dist/bteazy-v1.0.0.zip`

5. Click "Publish release"

## Release Notes Template

```markdown
## BTEazy vX.X.X

Modern Chrome/Edge extension for effortless torrent downloads.

### What's New
- Feature or fix description

### Features
- Download .torrent files directly
- Automatic magnet link conversion
- Download history tracking
- Modern dark UI
- Visual badge indicators
```

## Version Numbering

Follow semantic versioning:
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features (backwards compatible)
- **Patch** (1.0.1): Bug fixes

## Publishing to Web Stores

### Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click your extension or "New Item"
3. Upload `dist/bteazy-vX.X.X.zip`
4. Fill in store listing details
5. Submit for review

### Microsoft Edge Add-ons

1. Go to [Edge Add-ons Dashboard](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. Click your extension or "New submission"
3. Upload `dist/bteazy-vX.X.X.zip`
4. Fill in store listing details
5. Submit for review

## Files Included in Build

The build script packages these files:
- `manifest.json`
- `background.js`
- `content.js`
- `content.css`
- `popup.html`, `popup.js`, `popup.css`
- `options.html`, `options.js`, `options.css`
- `icons/` directory

Documentation files (README.md, etc.) are NOT included in the extension package.
