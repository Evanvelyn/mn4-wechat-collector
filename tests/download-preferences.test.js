import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDownloadTarget,
  normalizeDownloadPreference,
} from '../src/lib/download-preferences.js';

test('defaults to asking for a save location', () => {
  assert.deepEqual(normalizeDownloadPreference(), {
    mode: 'ask',
    folder: '',
  });
  assert.deepEqual(buildDownloadTarget('文章.html'), {
    filename: '文章.html',
    saveAs: true,
  });
});

test('uses the browser default download location without prompting', () => {
  assert.deepEqual(buildDownloadTarget('文章.html', { mode: 'browser' }), {
    filename: '文章.html',
    saveAs: false,
  });
});

test('places files in a safe Downloads subfolder', () => {
  assert.deepEqual(buildDownloadTarget('文章.html', {
    mode: 'subfolder',
    folder: ' MarginNote / 微信文章 ',
  }), {
    filename: 'MarginNote/微信文章/文章.html',
    saveAs: false,
  });
});

test('rejects absolute paths and parent-directory traversal', () => {
  assert.deepEqual(normalizeDownloadPreference({
    mode: 'subfolder',
    folder: '/Users/example/../Documents',
  }), {
    mode: 'ask',
    folder: '',
  });
});

test('manual override always opens the save dialog', () => {
  assert.deepEqual(buildDownloadTarget('文章.html', {
    mode: 'subfolder',
    folder: 'MarginNote',
  }, { forcePrompt: true }), {
    filename: 'MarginNote/文章.html',
    saveAs: true,
  });
});
