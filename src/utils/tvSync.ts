// Ultra-reliable Multi-Cluster Cloud Relay & Supabase Cloud Storage for TV Menu Board
import type { TvBoardConfig } from './menuStore';
import { saveTvConfigLocal } from './menuStore';
import { saveMenuConfigToSupabase } from './supabaseClient';

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

  // 2. Primary long-term persistence: save to Supabase Cloud Database
  let supabaseSuccess = false;
  try {
    supabaseSuccess = await saveMenuConfigToSupabase(saved);
  } catch (err) {
    console.warn('Supabase sync error:', err);
  }

  // 3. Signal TV immediately via real-time commands
  const serializedPayload = JSON.stringify({
    type: 'CONFIG_SYNC',
    config: saved,
    _cmdId: cmdId,
  });

  let relaySuccess = false;

  // If small enough (< 3600 bytes), also send full config inline via POST
  if (serializedPayload.length < 3600) {
    try {
      await sendTvCommand({ type: 'CONFIG_SYNC', config: saved });
      relaySuccess = true;
    } catch {}
  } else {
    // If large (custom photos), notify TV to re-read latest from Supabase
    try {
      await sendTvCommand({
        type: 'CONFIG_SUPABASE_SYNC',
        updatedAt: saved.updatedAt,
      });
      relaySuccess = true;
    } catch {}
  }

  // 4. Also upload to ntfy attachment fallback as redundant delivery channel
  try {
    const putResp = await fetch(`https://ntfy.adminforge.de/${TV_SYNC_TOPIC}`, {
      method: 'PUT',
      headers: {
        Filename: 'amika_tv_config.json',
      },
      body: JSON.stringify(saved),
    });

    if (putResp.ok) {
      relaySuccess = true;
      const putData = await putResp.json();
      if (putData?.attachment?.url) {
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
    if (supabaseSuccess) {
      onToast('☁️ Меню сохранено в облаке Supabase и передано на телевизор!');
    } else if (relaySuccess) {
      onToast('✅ Меню передано на телевизор!');
    } else {
      onToast('💾 Сохранено локально в браузере');
    }
  }

  return supabaseSuccess || relaySuccess;
}
