// Real-time Cloud + Local Relay for TV Menu Board

export const TV_SYNC_TOPIC = 'amika_cricova_tv_control';

export async function sendTvCommand(
  cmd: Record<string, unknown>,
  toastCallback?: ((msg: string) => void) | string,
  toastMessage?: string
) {
  // 1. Same-device BroadcastChannel (tabs / multi-window)
  try {
    const channel = new BroadcastChannel('amika_tv_bus');
    channel.postMessage(cmd);
    channel.close();
  } catch {}

  // 2. LocalStorage event fallback
  try {
    localStorage.setItem('amika_tv_command', JSON.stringify({ ...cmd, _ts: Date.now() }));
  } catch {}

  // 3. Cross-Device Cloud Real-Time Relay (ntfy.sh Server-Sent Events / POST)
  try {
    await fetch(`https://ntfy.sh/${TV_SYNC_TOPIC}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Title: 'Amika TV Control',
      },
      body: JSON.stringify(cmd),
    });
  } catch (err) {
    console.warn('TV Cloud Sync warning:', err);
  }

  if (typeof toastCallback === 'function' && toastMessage) {
    toastCallback(toastMessage);
  }
}
