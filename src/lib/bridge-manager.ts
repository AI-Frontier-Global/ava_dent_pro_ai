// مدير الجسر المحلي — يفحص الحالة، ينزّل الملفات، يشغّل الجسر، ويعيد الاتصال تلقائياً.

import { getStatus, type BridgeStatus } from './ollamaBridge';

export type BridgeState = 'online' | 'reconnecting' | 'offline';

export interface BridgeCheckResult {
  state: BridgeState;
  status: BridgeStatus | null;
  bridgeUrl: string;
}

const STORAGE_KEY = 'bridge_setup_complete';

export function isSetupComplete(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function markSetupComplete(): void {
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function resetSetup(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function checkBridgeStatus(bridgeUrl: string = 'http://localhost:3001'): Promise<BridgeCheckResult> {
  const status = await getStatus(bridgeUrl);
  if (status && status.bridge === 'online') {
    return { state: 'online', status, bridgeUrl };
  }
  return { state: 'offline', status: null, bridgeUrl };
}

// تنزيل ملفات الجسر (local-ollama-bridge.js و setup-bridge.bat) إلى مجلد Downloads
export async function downloadBridgeFiles(): Promise<{ success: boolean; message: string }> {
  try {
    const bridgeRes = await fetch('/bridge/local-ollama-bridge.js');
    const setupRes = await fetch('/bridge/setup-bridge.bat');
    if (!bridgeRes.ok || !setupRes.ok) {
      return { success: false, message: 'تعذر تحميل ملفات الجسر من الخادم' };
    }
    const bridgeText = await bridgeRes.text();
    const setupText = await setupRes.text();

    const bridgeBlob = new Blob([bridgeText], { type: 'application/javascript' });
    const setupBlob = new Blob([setupText], { type: 'application/octet-stream' });

    triggerDownload(bridgeBlob, 'local-ollama-bridge.js');
    setTimeout(() => triggerDownload(setupBlob, 'setup-bridge.bat'), 500);

    return { success: true, message: 'تم تحميل ملفات الجسر إلى مجلد التنزيلات' };
  } catch {
    return { success: false, message: 'فشل تحميل ملفات الجسر' };
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// launchBridge لم يعد يفتح نافذة خارجية — التعليمات تظهر داخل SetupWizard مباشرة.
// هذه الدالة محفوظة للتوافق مع الكود القديم لكنها لا تفعل شيئاً يخرج المستخدم من الصفحة.
export function launchBridge(): void {
  // لا شيء — التعليمات معروضة داخل الواجهة. المستخدم يفتح CMD يدوياً.
}

// إعادة الاتصال التلقائي كل 30 ثانية عند الانقطاع
export function autoReconnect(
  bridgeUrl: string,
  onStateChange: (state: BridgeState) => void,
  intervalMs = 30000,
): () => void {
  let active = true;
  let currentState: BridgeState = 'offline';

  const check = async () => {
    if (!active) return;
    const result = await checkBridgeStatus(bridgeUrl);
    if (result.state !== currentState) {
      currentState = result.state;
      onStateChange(currentState);
    }
  };

  check();
  const id = setInterval(check, intervalMs);

  return () => {
    active = false;
    clearInterval(id);
  };
}

// فحص شامل لكل المتطلبات (يستخدم في SetupWizard)
export interface SetupCheck {
  nodeInstalled: boolean;
  ollamaInstalled: boolean;
  bridgeRunning: boolean;
  modelsLoaded: boolean;
}

export async function runSetupChecks(bridgeUrl: string = 'http://localhost:3001'): Promise<SetupCheck> {
  const result = await checkBridgeStatus(bridgeUrl);
  if (result.state === 'online' && result.status) {
    return {
      nodeInstalled: true,
      ollamaInstalled: result.status.ollama,
      bridgeRunning: true,
      modelsLoaded: result.status.ollama, // إذا كان ollama متصلاً، فالنماذج متاحة
    };
  }
  // لا يمكن فحص Node/Ollama مباشرة من المتصفح — نعتمد على حالة الجسر
  return {
    nodeInstalled: false,
    ollamaInstalled: false,
    bridgeRunning: false,
    modelsLoaded: false,
  };
}
