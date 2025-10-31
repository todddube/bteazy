#!/usr/bin/env node

/**
 * Build script for BTEazy extension
 * Creates a distributable zip file for Chrome/Edge Web Store
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Files to include in the extension package
const filesToInclude = [
  'manifest.json',
  'background.js',
  'content.js',
  'content.css',
  'popup.html',
  'popup.js',
  'popup.css',
  'options.html',
  'options.js',
  'options.css',
  'icons/'
];

// Get version from manifest
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const version = manifest.version;

// Output filename
const outputDir = 'dist';
const outputFile = `bteazy-v${version}.zip`;

// Create dist directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(outputDir, outputFile));
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen for archive events
output.on('close', function() {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\n✓ Build complete!`);
  console.log(`  Version: ${version}`);
  console.log(`  File: ${outputDir}/${outputFile}`);
  console.log(`  Size: ${sizeInMB} MB`);
  console.log(`\nReady to upload to Chrome/Edge Web Store!\n`);
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files to the archive
console.log('\nBuilding BTEazy extension...\n');

filesToInclude.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Add directory
      archive.directory(filePath, path.basename(filePath));
      console.log(`  + ${file}`);
    } else {
      // Add file
      archive.file(filePath, { name: file });
      console.log(`  + ${file}`);
    }
  } else {
    console.warn(`  ⚠ Warning: ${file} not found, skipping...`);
  }
});

// Finalize the archive
archive.finalize();
