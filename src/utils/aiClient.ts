// Utility for client-side API Key synchronization with Vercel serverless and Local Storage

export interface StoredClientKey {
  provider: string;
  key: string;
  isActive?: boolean;
}

const STORAGE_KEY = 'astha_saved_api_keys';

export function getClientStoredKeys(): StoredClientKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to read stored API keys:', err);
  }
  return [];
}

export function saveClientStoredKeys(keys: StoredClientKey[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (err) {
    console.warn('Failed to save API keys in localStorage:', err);
  }
}

export function addOrUpdateClientKey(provider: string, key: string, isActive: boolean = true): StoredClientKey[] {
  const current = getClientStoredKeys();
  const existing = current.find((k) => k.key === key || (k.provider === provider && k.key === key));
  if (existing) {
    existing.isActive = isActive;
  } else {
    current.push({ provider, key, isActive });
  }
  saveClientStoredKeys(current);
  return current;
}

export function removeClientKey(provider: string, keyOrId?: string): StoredClientKey[] {
  let current = getClientStoredKeys();
  if (keyOrId) {
    current = current.filter((k) => k.key !== keyOrId && k.provider !== keyOrId);
  } else {
    current = current.filter((k) => k.provider !== provider);
  }
  saveClientStoredKeys(current);
  return current;
}

export function getAIHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const keys = getClientStoredKeys();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (keys.length > 0) {
    headers['x-astha-keys'] = JSON.stringify(keys);
  }
  return headers;
}
