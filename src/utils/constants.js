/**
 * BTEazy - Constants and Configuration
 */

export const APP_NAME = 'BTEazy';

export const DEFAULT_SETTINGS = {
  enabled: true,
  downloadPath: '',
  highlightLinks: true,
  managedDomains: [],
  autoSave: true,
  showNotifications: true,
  downloadHistory: []
};

export const BADGE = {
  PROCESSING: {
    text: '...',
    color: '#ffbe0b'
  },
  SUCCESS: {
    text: '✓',
    color: '#00ff88'
  },
  DISABLED: {
    text: 'OFF',
    color: '#ff0000'
  },
  CLEAR_DELAY: 3000
};

export const TORRENT_PATTERNS = [
  /\.torrent(\?|$)/i,
  /download\.php.*torrent/i,
  /action=download/i,
  /\?download=/i
];

export const MAGNET_HASH_REGEX = /btih:([a-zA-Z0-9]+)/i;

export const ITORRENTS_URL = 'https://itorrents.org/torrent/';

export const FILE_VALIDATION = {
  MIN_SIZE: 100, // bytes
  VALID_MIME_TYPES: ['application/x-bittorrent', 'application/octet-stream', ''],
  VALIDATION_DELAY: 3000 // ms
};

export const HISTORY_LIMIT = 10;

export const INVALID_FILENAME_CHARS = /[<>:"\/\\|?*\x00-\x1F]/g;
export const MAX_FILENAME_LENGTH = 200;

export const LOG_PREFIX = `[${APP_NAME}]`;
