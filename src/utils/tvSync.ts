// Ultra-reliable Multi-Cluster Cloud Relay for TV Menu Board
import type { TvBoardConfig } from './menuStore';
import { saveTvConfigLocal } from './menuStore';

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

// Publish full TV Menu & Photo Carousel Configuration (supports arbitrary custom photos)
export async function publishTvConfigToCloud(
  config: TvBoardConfig,
  onToast?: (msg: string) => void
): Promise<boolean> {
  const saved = saveTvConfigLocal(config);
  const cmdId = 'cfg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // 1. Broadcast locally on same device
  try {
    const channel = new BroadcastChannel('amika_tv_bus');
    channel.postMessage({ type: 'CONFIG_SYNC', config: saved, _cmdId: cmdId });
    channel.close();
  } catch {}

  const serializedPayload = JSON.stringify({
    type: 'CONFIG_SYNC',
    config: saved,
    _cmdId: cmdId,
  });

  let cloudSuccess = false;

  // 2. If small enough (< 3600 bytes), also send directly inline via POST
  if (serializedPayload.length < 3600) {
    try {
      await sendTvCommand({ type: 'CONFIG_SYNC', config: saved });
      cloudSuccess = true;
    } catch {}
  }

  // 3. Always upload full config package (including compressed Base64 photos) as file attachment to adminforge
  try {
    const putResp = await fetch(`https://ntfy.adminforge.de/${TV_SYNC_TOPIC}`, {
      method: 'PUT',
      headers: {
        Filename: 'amika_tv_config.json',
      },
      body: JSON.stringify(saved),
    });

    if (putResp.ok) {
      cloudSuccess = true;
      const putData = await putResp.json();
      if (putData?.attachment?.url) {
        // Broadcast the attachment URL across all other clusters so any TV stream picks it up
        await sendTvCommand({
          type: 'CONFIG_URL_SYNC',
          url: putData.attachment.url,
          updatedAt: saved.updatedAt,
        });
      }
    }
  } catch (err) {
    console.warn('Config attachment upload error:', err);
  }

  if (onToast) {
    onToast(
      cloudSuccess
        ? '✅ Меню и фото сохранены и отправлены на телевизор!'
        : '💾 Сохранено в памяти устройства'
    );
  }

  return cloudSuccess;
}
