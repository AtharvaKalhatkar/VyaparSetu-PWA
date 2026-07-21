import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'vyaparsetu_access_token',
  REFRESH_TOKEN: 'vyaparsetu_refresh_token',
  USER: 'vyaparsetu_user',
  BUSINESS: 'vyaparsetu_business',
};

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const isAvailable = await SecureStore.isAvailableAsync();
  return isAvailable;
}

async function safeGet(key: string): Promise<string | null> {
  try {
    if (await isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(key);
    }
    return null;
  } catch {
    return null;
  }
}

async function safeSet(key: string, value: string): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    // fallback silently
  }
}

async function safeDelete(key: string): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    // fallback silently
  }
}

export const AuthService = {
  async getAccessToken(): Promise<string | null> {
    return safeGet(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return safeGet(KEYS.REFRESH_TOKEN);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      safeSet(KEYS.ACCESS_TOKEN, accessToken),
      safeSet(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      safeDelete(KEYS.ACCESS_TOKEN),
      safeDelete(KEYS.REFRESH_TOKEN),
    ]);
  },

  async setUser(user: Record<string, unknown>): Promise<void> {
    await safeSet(KEYS.USER, JSON.stringify(user));
  },

  async getUser<T = Record<string, unknown>>(): Promise<T | null> {
    const data = await safeGet(KEYS.USER);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  async setBusiness(business: Record<string, unknown>): Promise<void> {
    await safeSet(KEYS.BUSINESS, JSON.stringify(business));
  },

  async getBusiness<T = Record<string, unknown>>(): Promise<T | null> {
    const data = await safeGet(KEYS.BUSINESS);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      safeDelete(KEYS.ACCESS_TOKEN),
      safeDelete(KEYS.REFRESH_TOKEN),
      safeDelete(KEYS.USER),
      safeDelete(KEYS.BUSINESS),
    ]);
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  },
};
