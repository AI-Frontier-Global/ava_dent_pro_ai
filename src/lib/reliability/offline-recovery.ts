// Offline Recovery — Detect offline mode, reconnect, and retry failed requests.
//
// Usage:
//   const { isOnline, pendingRetries, retryAll } = useOfflineRecovery();

import { useEffect, useState, useCallback, useRef } from "react";

interface PendingRetry {
  id: number;
  fn: () => Promise<void>;
  description: string;
}

const pendingRetries: PendingRetry[] = [];
let retryIdCounter = 0;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const l of listeners) l();
}

export function registerRetry(description: string, fn: () => Promise<void>): () => void {
  const id = ++retryIdCounter;
  pendingRetries.push({ id, fn, description });
  notifyListeners();
  return () => {
    const idx = pendingRetries.findIndex((r) => r.id === id);
    if (idx >= 0) pendingRetries.splice(idx, 1);
    notifyListeners();
  };
}

export function useOfflineRecovery() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const updatePending = () => {
      if (mountedRef.current) setPendingCount(pendingRetries.length);
    };

    const handleOnline = () => {
      setIsOnline(true);
      updatePending();
    };
    const handleOffline = () => {
      setIsOnline(false);
      updatePending();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    listeners.add(updatePending);
    updatePending();

    return () => {
      mountedRef.current = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      listeners.delete(updatePending);
    };
  }, []);

  const retryAll = useCallback(async () => {
    const items = [...pendingRetries];
    for (const item of items) {
      try {
        await item.fn();
        const idx = pendingRetries.findIndex((r) => r.id === item.id);
        if (idx >= 0) pendingRetries.splice(idx, 1);
      } catch {
        // keep in queue for next retry
      }
    }
    notifyListeners();
  }, []);

  return { isOnline, pendingCount, retryAll };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
