import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { citizenAPI } from '../api/client';

// ── Types ─────────────────────────────────────────────────────

interface QueuedRequest {
  id:          string;
  type:        'SUBMIT_REQUEST' | 'SUBMIT_GRIEVANCE' | 'BOOK_QUEUE';
  payload:     any;
  createdAt:   string;
  retryCount:  number;
  maxRetries:  number;
}

const QUEUE_KEY = 'offline_queue';

// ── Queue Manager ─────────────────────────────────────────────

export const OfflineQueue = {

  // Add a request to the offline queue
  enqueue: async (type: QueuedRequest['type'], payload: any): Promise<string> => {
    const id = `OQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item: QueuedRequest = {
      id,
      type,
      payload,
      createdAt:  new Date().toISOString(),
      retryCount: 0,
      maxRetries: 5,
    };

    const existing = await OfflineQueue.getAll();
    existing.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
    console.log(`[OfflineQueue] Queued: ${type} → ${id}`);
    return id;
  },

  // Get all queued items
  getAll: async (): Promise<QueuedRequest[]> => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Remove a processed item
  remove: async (id: string): Promise<void> => {
    const existing = await OfflineQueue.getAll();
    const filtered = existing.filter(item => item.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  // Count pending items
  count: async (): Promise<number> => {
    const items = await OfflineQueue.getAll();
    return items.length;
  },

  // Process all queued items when back online
  flush: async (): Promise<{ success: number; failed: number }> => {
    const items = await OfflineQueue.getAll();
    if (items.length === 0) return { success: 0, failed: 0 };

    console.log(`[OfflineQueue] Flushing ${items.length} queued items...`);
    let success = 0;
    let failed  = 0;

    for (const item of items) {
      try {
        switch (item.type) {
          case 'SUBMIT_REQUEST':
            await citizenAPI.submitRequest(item.payload);
            break;
          case 'SUBMIT_GRIEVANCE':
            await citizenAPI.submitGrievance(item.payload);
            break;
          case 'BOOK_QUEUE':
            await citizenAPI.bookQueue(item.payload);
            break;
        }
        await OfflineQueue.remove(item.id);
        success++;
        console.log(`[OfflineQueue] Processed: ${item.id}`);
      } catch (e) {
        // Increment retry count
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          // Give up after max retries
          await OfflineQueue.remove(item.id);
          failed++;
          console.warn(`[OfflineQueue] Dropped after ${item.maxRetries} retries: ${item.id}`);
        } else {
          // Update retry count in storage
          const all = await OfflineQueue.getAll();
          const idx = all.findIndex(q => q.id === item.id);
          if (idx >= 0) {
            all[idx] = item;
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(all));
          }
          failed++;
        }
      }
    }

    console.log(`[OfflineQueue] Done. Success: ${success}, Failed: ${failed}`);
    return { success, failed };
  },
};

// ── Network Monitor ───────────────────────────────────────────
// Call this once in App.tsx to auto-flush when connectivity returns

export const startNetworkMonitor = (
  onOnline?: (result: { success: number; failed: number }) => void
) => {
  return NetInfo.addEventListener(async (state) => {
    if (state.isConnected && state.isInternetReachable) {
      const count = await OfflineQueue.count();
      if (count > 0) {
        console.log(`[NetworkMonitor] Back online. Flushing ${count} queued items.`);
        const result = await OfflineQueue.flush();
        if (onOnline) onOnline(result);
      }
    }
  });
};