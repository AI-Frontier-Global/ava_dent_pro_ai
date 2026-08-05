// Offline Banner — shows when network is lost, offers retry when reconnected.

import { useEffect, useState } from "react";
import { WifiOff, Wifi, RotateCcw } from "lucide-react";
import { useOfflineRecovery } from "@/lib/reliability/offline-recovery";

export function OfflineBanner() {
  const { isOnline, pendingCount, retryAll } = useOfflineRecovery();
  const [retrying, setRetrying] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) setWasOffline(true);
    if (isOnline && wasOffline && pendingCount > 0) {
      void retryAll().finally(() => setWasOffline(false));
    }
  }, [isOnline, wasOffline, pendingCount, retryAll]);

  if (isOnline && pendingCount === 0) return null;

  const handleRetry = async () => {
    setRetrying(true);
    await retryAll();
    setRetrying(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[55] max-w-sm">
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-elev-2 ring-1 ${
        isOnline ? "bg-warning-50 ring-warning-200" : "bg-error-50 ring-error-200"
      }`}>
        {isOnline ? (
          <Wifi size={20} className="text-warning-600" />
        ) : (
          <WifiOff size={20} className="text-error-600" />
        )}
        <div className="flex-1">
          <p className={`text-sm font-bold ${isOnline ? "text-warning-800" : "text-error-800"}`}>
            {isOnline
              ? `عاد الاتصال — جاري إعادة ${pendingCount} طلب`
              : "أنت غير متصل بالإنترنت"}
          </p>
          <p className="text-xs text-slate-500">
            {isOnline ? "سيتم إرسال الطلبات المعلقة تلقائياً" : "سيتم إعادة المحاولة عند عودة الاتصال"}
          </p>
        </div>
        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1 rounded-lg bg-warning-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-warning-700 disabled:opacity-50"
          >
            <RotateCcw size={14} className={retrying ? "animate-spin" : ""} />
            إعادة المحاولة
          </button>
        )}
      </div>
    </div>
  );
}
