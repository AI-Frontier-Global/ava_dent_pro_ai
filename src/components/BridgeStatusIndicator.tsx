import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import { autoReconnect, type BridgeState } from '../lib/bridge-manager';

interface Props {
  bridgeUrl?: string;
  onClick?: () => void;
}

export default function BridgeStatusIndicator({ bridgeUrl = 'http://localhost:3001', onClick }: Props) {
  const [state, setState] = useState<BridgeState>('offline');
  const [checking, setChecking] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setChecking(true);
    const cleanup = autoReconnect(
      bridgeUrl,
      (newState) => {
        setState(newState);
        setChecking(false);
      },
      30000,
    );
    cleanupRef.current = cleanup;
    return () => cleanup();
  }, [bridgeUrl]);

  const config = {
    online: {
      icon: <Wifi size={14} className="text-success-600" />,
      dot: 'bg-success-500',
      badge: 'bg-success-50 text-success-700 border-success-200',
      label: 'الجسر متصل',
    },
    reconnecting: {
      icon: <Loader2 size={14} className="animate-spin text-warning-600" />,
      dot: 'bg-warning-500',
      badge: 'bg-warning-50 text-warning-700 border-warning-200',
      label: 'إعادة الاتصال...',
    },
    offline: {
      icon: <WifiOff size={14} className="text-error-600" />,
      dot: 'bg-error-500',
      badge: 'bg-error-50 text-error-700 border-error-200',
      label: 'الجسر غير متصل',
    },
  }[state];

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm ${config.badge}`}
      title={state === 'offline' ? 'اضغط لتثبيت الجسر المحلي' : config.label}
    >
      <span className="relative flex h-2.5 w-2.5">
        {state === 'online' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.dot}`} />
      </span>
      {config.icon}
      <span className="hidden sm:inline">{config.label}</span>
      {state === 'offline' && <AlertTriangle size={12} className="text-error-500" />}
    </button>
  );
}
