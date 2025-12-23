/**
 * BTEazy - Utility Helper Functions
 */

import { INVALID_FILENAME_CHARS, MAX_FILENAME_LENGTH } from './constants.js';

/**
 * Sanitize filename to remove invalid characters
 * @param {string} filename - The filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'download';
  }

  // Remove invalid characters
  let sanitized = filename.replace(INVALID_FILENAME_CHARS, '_');

  // Replace multiple spaces/underscores with single underscore
  sanitized = sanitized.replace(/[\s_]+/g, '_');

  // Remove leading/trailing spaces, dots, and underscores
  sanitized = sanitized.trim().replace(/^[._]+|[._]+$/g, '');

  // Limit length
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
  }

  return sanitized || 'download';
}

/**
 * Extract BitTorrent info hash from magnet link
 * @param {string} magnetUrl - Magnet link URL
 * @returns {string|null} The info hash or null
 */
export function extractMagnetHash(magnetUrl) {
  const match = magnetUrl.match(/btih:([a-zA-Z0-9]+)/i);
  return match?.[1]?.toUpperCase() || null;
}

/**
 * Extract display name from magnet link
 * @param {string} magnetUrl - Magnet link URL
 * @returns {string} The display name or 'download'
 */
export function extractMagnetName(magnetUrl) {
  try {
    const url = new URL(magnetUrl);
    const dn = url.searchParams.get('dn');

    if (dn) {
      const name = decodeURIComponent(dn);
      return sanitizeFilename(name);
    }
  } catch (error) {
    console.error('Error extracting magnet name:', error);
  }

  return 'download';
}

/**
 * Format time ago string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Human-readable time ago string
 */
export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval}${unit.charAt(0)} ago`;
    }
  }

  return 'Just now';
}

/**
 * Check if a link is a torrent link
 * @param {string} href - The URL to check
 * @returns {boolean} True if it's a torrent link
 */
export function isTorrentLink(href) {
  if (!href) return false;

  // Direct .torrent extension
  if (href.toLowerCase().endsWith('.torrent')) return true;

  // Common torrent patterns
  const patterns = [
    /\.torrent(\?|$)/i,
    /download\.php.*torrent/i,
    /action=download/i,
    /\?download=/i
  ];

  return patterns.some(pattern => pattern.test(href));
}

/**
 * Check if a link is a magnet link
 * @param {string} href - The URL to check
 * @returns {boolean} True if it's a magnet link
 */
export function isMagnetLink(href) {
  return href?.toLowerCase().startsWith('magnet:?xt=') || false;
}

/**
 * Log message with app prefix
 * @param {...any} args - Arguments to log
 */
export function log(...args) {
  console.log('[BTEazy]', ...args);
}

/**
 * Log error with app prefix
 * @param {...any} args - Arguments to log
 */
export function logError(...args) {
  console.error('[BTEazy]', ...args);
}

/**
 * Log warning with app prefix
 * @param {...any} args - Arguments to log
 */
export function logWarn(...args) {
  console.warn('[BTEazy]', ...args);
}
