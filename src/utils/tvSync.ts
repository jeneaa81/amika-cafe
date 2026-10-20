// Ultra-reliable Multi-Cluster Cloud Relay for TV Menu Board

export const TV_SYNC_TOPIC = 'amika_cricova_tv_control';

// 3 independent European high-speed relay clusters (France, Germany, Global)
export const CLOUD_RELAY_ENDPOINTS = [
  `https://ntfy.tedomum.fr/${TV_SYNC_TOPIC}`,
  `https://ntfy.adminforge.de/${TV_SYNC_TOPIC}`,
  `https://ntfy.sh/${TV_SYNC_TOPIC}`,
];

export async function sendTvCommand(
  cmd: Record<string, unknown>,
  toastCallback?: ((msg: string) => void) | string,
  toastMessage?: string
) {
  // Attach unique message ID to prevent duplicate executions across multi-cluster relays
  const cmdId = 'cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const payload = { ...cmd, _cmdId: cmdId, _ts: Date.now() };

  // 1. Same-device BroadcastChannel (tabs / multi-window on same device)
  try {
    const channel = new BroadcastChannel('amika_tv_bus');
    channel.postMessage(payload);
    channel.close();
  } catch {}

  // 2. LocalStorage event fallback
  try {
    localStorage.setItem('amika_tv_command', JSON.stringify(payload));
  } catch {}

  // 3. Multi-Cluster Cross-Device Cloud Real-Time Relay (Phone ➜ Smart TV in parallel)
  let successfulDeliveries = 0;
  try {
    const promises = CLOUD_RELAY_ENDPOINTS.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Title: 'Amika TV Control',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) successfulDeliveries++;
        return resp.ok;
      } catch {
        return false;
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.warn('TV Cloud Sync warning:', err);
  }

  // Visual feedback on phone
  if (typeof toastCallback === 'function' && toastMessage) {
    const statusNote = successfulDeliveries > 0 ? '' : ' (локально)';
    toastCallback(toastMessage + statusNote);
  }
}
