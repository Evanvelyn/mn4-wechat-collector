const SAVE_MODES = new Set(['ask', 'browser', 'subfolder']);

export function normalizeDownloadPreference(value = {}) {
  const mode = SAVE_MODES.has(value?.mode) ? value.mode : 'ask';
  if (mode !== 'subfolder') return { mode, folder: '' };

  const folder = normalizeDownloadFolder(value.folder);
  return folder ? { mode, folder } : { mode: 'ask', folder: '' };
}

export function buildDownloadTarget(filename, preference, options = {}) {
  const normalized = normalizeDownloadPreference(preference);
  const targetFilename = normalized.mode === 'subfolder'
    ? `${normalized.folder}/${filename}`
    : filename;

  return {
    filename: targetFilename,
    saveAs: options.forcePrompt === true || normalized.mode === 'ask',
  };
}

function normalizeDownloadFolder(value) {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
  if (!candidate || /^[\\/]/.test(candidate) || /^[a-z]:/i.test(candidate)) return '';

  const rawSegments = candidate.split(/[\\/]+/);
  if (rawSegments.some((segment) => ['.', '..'].includes(segment.trim()))) return '';

  const segments = rawSegments
    .map((segment) => segment
      .replace(/[\u0000-\u001f<>:"|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[. ]+$/g, '')
      .slice(0, 80))
    .filter(Boolean);

  const folder = segments.join('/');
  return folder.length <= 240 ? folder : '';
}
