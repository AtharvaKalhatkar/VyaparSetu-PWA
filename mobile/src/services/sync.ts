import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from './api';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import type { SyncPayload, SyncResult } from '../types';

const QUEUE_KEY = 'vyaparsetu_sync_queue';
const LAST_SYNC_KEY = 'vyaparsetu_last_sync';

type ConflictStrategy = 'SERVER_WINS' | 'CLIENT_WINS' | 'MANUAL';

class QueueManager {
  async getQueue(): Promise<SyncPayload[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async addToQueue(payload: SyncPayload): Promise<void> {
    const queue = await this.getQueue();
    queue.push(payload);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    useSyncStore.getState().incrementPending();
  }

  async removeFromQueue(index: number): Promise<void> {
    const queue = await this.getQueue();
    queue.splice(index, 1);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    useSyncStore.getState().decrementPending();
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
    useSyncStore.getState().reset();
  }

  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
}

class NetworkMonitor {
  private unsubscribe: (() => void) | null = null;

  start(): void {
    this.unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = !!(state.isConnected && state.isInternetReachable !== false);
      useSyncStore.getState().setOnline(isOnline);
    });
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable !== false);
  }
}

class SyncManager {
  private queueManager: QueueManager;
  private networkMonitor: NetworkMonitor;
  private conflictStrategy: ConflictStrategy;
  private syncInterval: ReturnType<typeof setInterval> | null;
  private isSyncing: boolean;

  constructor(strategy: ConflictStrategy = 'SERVER_WINS') {
    this.queueManager = new QueueManager();
    this.networkMonitor = new NetworkMonitor();
    this.conflictStrategy = strategy;
    this.syncInterval = null;
    this.isSyncing = false;
  }

  start(intervalMs: number = 30000): void {
    this.networkMonitor.start();
    this.syncInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);
    this.processQueue();
  }

  stop(): void {
    this.networkMonitor.stop();
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  setConflictStrategy(strategy: ConflictStrategy): void {
    this.conflictStrategy = strategy;
  }

  async addToQueue(payload: SyncPayload): Promise<void> {
    await this.queueManager.addToQueue(payload);
    const online = await this.networkMonitor.isOnline();
    if (online) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    const online = await this.networkMonitor.isOnline();
    if (!online) return;

    this.isSyncing = true;
    useSyncStore.getState().setSyncing(true);

    try {
      const queue = await this.queueManager.getQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        useSyncStore.getState().setSyncing(false);
        return;
      }

      const authState = useAuthStore.getState();
      const businessId = authState.business?.id || 'unknown';
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);

      const batchRequest = {
        businessId,
        lastSyncTimestamp: lastSync || undefined,
        changes: queue,
      };

      const result: SyncResult = await ApiService.sync.syncBatch(batchRequest);

      if (result.success) {
        for (let i = queue.length - 1; i >= 0; i--) {
          if (result.processedIds.includes(queue[i].entityId)) {
            await this.queueManager.removeFromQueue(i);
          }
        }

        if (result.errors && result.errors.length > 0) {
          for (const error of result.errors) {
            if (error.retryCount >= 3) {
              const idx = queue.findIndex(p => p.entityId === error.entityId);
              if (idx >= 0) {
                await this.queueManager.removeFromQueue(idx);
              }
            }
          }
        }

        if (result.serverChanges && result.serverChanges.length > 0) {
          await this.applyServerChanges(result.serverChanges);
        }

        if (result.newSyncTimestamp) {
          await AsyncStorage.setItem(LAST_SYNC_KEY, result.newSyncTimestamp);
          useSyncStore.getState().setLastSynced(new Date().toISOString());
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
      useSyncStore.getState().setSyncing(false);
    }
  }

  private async applyServerChanges(changes: SyncPayload[]): Promise<void> {
    for (const change of changes) {
      try {
        switch (change.entityType) {
          case 'party':
            await AsyncStorage.setItem(`party_${change.entityId}`, JSON.stringify(change.data));
            break;
          case 'item':
            await AsyncStorage.setItem(`item_${change.entityId}`, JSON.stringify(change.data));
            break;
          case 'invoice':
            await AsyncStorage.setItem(`invoice_${change.entityId}`, JSON.stringify(change.data));
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Failed to apply server change for ${change.entityType}:${change.entityId}`, error);
      }
    }
  }

  async forceSync(): Promise<void> {
    await this.processQueue();
  }

  async getSyncStatus(): Promise<{
    isOnline: boolean;
    pendingCount: number;
    lastSyncedAt: string | null;
    isSyncing: boolean;
  }> {
    const isOnline = await this.networkMonitor.isOnline();
    const pendingCount = await this.queueManager.getQueueSize();
    const lastSyncedAt = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return {
      isOnline,
      pendingCount,
      lastSyncedAt,
      isSyncing: this.isSyncing,
    };
  }
}

export const syncManager = new SyncManager();
export const queueManager = new QueueManager();
export const networkMonitor = new NetworkMonitor();
export { QueueManager, NetworkMonitor, SyncManager };
export type { ConflictStrategy };
