// Remote TV diagnostics: the TV screen reports its real state to a dedicated relay topic,
// the admin panel listens to it. Separate topic from TV_SYNC_TOPIC so the TV never
// receives its own reports and commands stay uncluttered.

// Must match `var TV_BUILD` in public/tv.html (enforced by scripts/verify_tv.cjs).
export const EXPECTED_TV_BUILD = '2026.11.03-telemetry-3';

export const TV_STATUS_TOPIC = 'amika_cricova_tv_status';

export const TV_STATUS_RELAYS = [
  `https://ntfy.adminforge.de/${TV_STATUS_TOPIC}`,
  `https://ntfy.tedomum.fr/${TV_STATUS_TOPIC}`,
];

export interface TvMusicStatus {
  enabled: boolean;
  videoId: string | null;
  configVolume: number | null;
  mode: 'none' | 'api' | 'iframe' | 'react-iframe';
  apiScript?: 'idle' | 'loading' | 'loaded' | 'error';
  apiReady?: boolean;
  state: number | null;
  stateName: string;
  muted: boolean | null;
  volume: number | null;
  error: number | null;
  userInteracted: boolean;
  unlockPromptVisible?: boolean;
}

export interface TvStatusReport {
  type: 'TV_STATUS';
  page: 'tv.html' | 'react-tv';
  build: string;
  deviceId: string;
  reason: string;
  ts: number;
  uptimeSec: number;
  ua: string;
  chrome: number | null;
  screen: string;
  online: boolean;
  visible: boolean;
  relayConnections?: number;
  cloudSynced?: boolean;
  configUpdatedAt?: number;
  theme?: string;
  lastCmd?: { type: string; at: string } | null;
  music: TvMusicStatus;
  log: string[];
  jsErrors: string[];
}

export function isTvStatusReport(x: unknown): x is TvStatusReport {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return r.type === 'TV_STATUS' && typeof r.deviceId === 'string' && typeof r.music === 'object';
}

/** Parses one ntfy JSON/SSE event and returns the embedded TV report, if any. */
export function parseRelayEvent(raw: string): TvStatusReport | null {
  try {
    const evt = JSON.parse(raw);
    if (evt?.event !== 'message' || typeof evt.message !== 'string') return null;
    const report = JSON.parse(evt.message);
    return isTvStatusReport(report) ? report : null;
  } catch {
    return null;
  }
}

/** Fetches recent reports (last `since`, e.g. '6h') from all relays, newest per device. */
export async function fetchRecentTvReports(since = '6h'): Promise<TvStatusReport[]> {
  const latest = new Map<string, TvStatusReport>();
  await Promise.allSettled(
    TV_STATUS_RELAYS.map(async (base) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      try {
        const resp = await fetch(`${base}/json?poll=1&since=${since}`, { signal: controller.signal });
        if (!resp.ok) return;
        const text = await resp.text();
        for (const line of text.split('\n')) {
          if (!line.trim()) continue;
          const rep = parseRelayEvent(line);
          if (!rep) continue;
          const prev = latest.get(rep.deviceId);
          if (!prev || rep.ts > prev.ts) latest.set(rep.deviceId, rep);
        }
      } finally {
        clearTimeout(t);
      }
    })
  );
  return [...latest.values()].sort((a, b) => b.ts - a.ts);
}

/** Publishes a report (used by the React TV screen). Text body avoids CORS preflight. */
export function publishTvStatus(report: TvStatusReport): void {
  const body = JSON.stringify(report);
  for (const url of TV_STATUS_RELAYS) {
    fetch(url, { method: 'POST', body }).catch(() => {});
  }
}

export function getOrCreateTvDeviceId(): string {
  try {
    let id = localStorage.getItem('amika_tv_device_id');
    if (!id) {
      id = 'tv-' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('amika_tv_device_id', id);
    }
    return id;
  } catch {
    return 'tv-nostorage';
  }
}

// ---------- Interpretation for humans (RU / RO) ----------

export type Severity = 'ok' | 'warn' | 'error';

export interface Diagnosis {
  severity: Severity;
  title: { ru: string; ro: string };
  action: { ru: string; ro: string };
}

const YT_ERRORS: Record<number, { ru: string; ro: string }> = {
  2: { ru: 'неверный ID видео в ссылке', ro: 'ID video invalid în link' },
  5: {
    ru: 'браузер телевизора не может воспроизвести YouTube (HTML5-плеер не поддерживается)',
    ro: 'browserul televizorului nu poate reda YouTube (player HTML5 nesuportat)',
  },
  100: { ru: 'видео удалено или приватное', ro: 'video șters sau privat' },
  101: { ru: 'автор запретил встраивание этого видео', ro: 'autorul a interzis încorporarea' },
  150: { ru: 'автор запретил встраивание этого видео', ro: 'autorul a interzis încorporarea' },
};

export function describeYtError(code: number | null): { ru: string; ro: string } | null {
  if (code === null || code === undefined) return null;
  return YT_ERRORS[code] ?? { ru: `код ошибки YouTube ${code}`, ro: `cod eroare YouTube ${code}` };
}

/** Rule-based diagnosis, ordered from the most fundamental cause to the least. */
export function diagnose(r: TvStatusReport, now = Date.now()): Diagnosis[] {
  const out: Diagnosis[] = [];
  const m = r.music;
  const ageMin = (now - r.ts) / 60000;

  if (ageMin > 12) {
    out.push({
      severity: 'error',
      title: { ru: `ТВ молчит ${Math.round(ageMin)} мин`, ro: `TV nu raportează de ${Math.round(ageMin)} min` },
      action: {
        ru: 'Телевизор выключен, нет интернета или браузер закрыт. Отчёт приходит каждые 5 минут.',
        ro: 'TV oprit, fără internet sau browser închis. Raportul vine la fiecare 5 minute.',
      },
    });
  }
  if (r.page === 'react-tv') {
    out.push({
      severity: 'warn',
      title: { ru: 'На ТВ открыта React-версия экрана, а не tv.html', ro: 'Pe TV e deschisă versiunea React, nu tv.html' },
      action: {
        ru: 'Откройте на ТВ https://jeneaa81.github.io/amika-cafe/tv.html — только там есть полная диагностика и разблокировка звука.',
        ro: 'Deschideți pe TV https://jeneaa81.github.io/amika-cafe/tv.html.',
      },
    });
  } else if (r.build !== EXPECTED_TV_BUILD) {
    out.push({
      severity: 'error',
      title: { ru: `Старая версия страницы на ТВ (${r.build})`, ro: `Versiune veche pe TV (${r.build})` },
      action: {
        ru: 'Полностью закройте браузер на телевизоре и откройте tv.html заново.',
        ro: 'Închideți complet browserul pe TV și redeschideți tv.html.',
      },
    });
  }
  if (r.chrome !== null && r.chrome < 70) {
    out.push({
      severity: 'warn',
      title: { ru: `Старый браузер ТВ (Chromium ${r.chrome})`, ro: `Browser TV vechi (Chromium ${r.chrome})` },
      action: {
        ru: 'YouTube может не поддерживать этот браузер. Если ниже будет ошибка 5 или плеер не стартует — нужен другой источник звука (Bluetooth-колонка, ТВ-приложение YouTube, медиаприставка).',
        ro: 'YouTube poate să nu suporte acest browser. Dacă apare eroarea 5 — e nevoie de altă sursă audio.',
      },
    });
  }
  if (!m.enabled) {
    out.push({
      severity: 'ok',
      title: { ru: 'Музыка выключена в настройках', ro: 'Muzica este oprită în setări' },
      action: { ru: 'Включите переключатель музыки и нажмите «Применить на ТВ».', ro: 'Activați muzica și apăsați „Aplică pe TV”.' },
    });
    return out;
  }
  if (m.apiScript === 'error') {
    out.push({
      severity: 'error',
      title: { ru: 'Скрипт YouTube не загрузился на ТВ', ro: 'Scriptul YouTube nu s-a încărcat pe TV' },
      action: {
        ru: 'Сеть кафе или ТВ блокирует youtube.com. Проверьте, открывается ли YouTube в браузере телевизора.',
        ro: 'Rețeaua sau TV-ul blochează youtube.com.',
      },
    });
  }
  const err = describeYtError(m.error);
  if (err) {
    out.push({
      severity: 'error',
      title: { ru: `Ошибка плеера YouTube: ${err.ru}`, ro: `Eroare player YouTube: ${err.ro}` },
      action: {
        ru: m.error === 5
          ? 'Это ограничение самого браузера телевизора, кодом страницы его не обойти. Варианты: другой источник звука или более новый браузер / приставка.'
          : 'Выберите другой поток или пресет.',
        ro: m.error === 5 ? 'Limitare a browserului TV. Folosiți altă sursă audio.' : 'Alegeți alt stream.',
      },
    });
  }
  if (m.state === 1 && m.muted === true) {
    out.push({
      severity: 'warn',
      title: { ru: 'Плеер играет, но звук заглушён браузером', ro: 'Playerul rulează, dar sunetul e blocat de browser' },
      action: {
        ru: 'Нажмите любую кнопку на пульте телевизора (OK). Если после нажатия muted остаётся true — пульт не доходит до страницы.',
        ro: 'Apăsați orice tastă pe telecomandă (OK).',
      },
    });
  } else if (m.state === 1) {
    out.push({
      severity: 'ok',
      title: { ru: `Плеер играет со звуком (громкость ${m.volume ?? '?'}%)`, ro: `Playerul rulează cu sunet (volum ${m.volume ?? '?'}%)` },
      action: {
        ru: 'Со стороны страницы всё в порядке. Если в зале тихо — проверьте громкость и аудиовыход самого ТВ (динамики / ARC / Bluetooth).',
        ro: 'Pagina funcționează. Verificați volumul și ieșirea audio a TV-ului.',
      },
    });
  } else if (!err && m.apiScript !== 'error') {
    const stuck = r.uptimeSec > 30;
    out.push({
      severity: stuck ? 'warn' : 'ok',
      title: {
        ru: `Плеер не играет (состояние: ${m.stateName}, режим: ${m.mode})`,
        ro: `Playerul nu rulează (stare: ${m.stateName}, mod: ${m.mode})`,
      },
      action: {
        ru: !m.userInteracted
          ? 'Браузер, скорее всего, блокирует автозапуск. Нажмите любую кнопку на пульте, затем «Запросить статус».'
          : m.state === null
            ? 'YouTube не отвечает плееру. Если так остаётся — браузер ТВ, вероятно, не поддерживает встроенный плеер.'
            : 'Подождите 10–20 секунд и запросите статус ещё раз.',
        ro: !m.userInteracted ? 'Apăsați orice tastă pe telecomandă, apoi „Cere status”.' : 'Așteptați și cereți statusul din nou.',
      },
    });
  }
  if (r.jsErrors.length > 0) {
    out.push({
      severity: 'warn',
      title: { ru: `JS-ошибки на ТВ: ${r.jsErrors.length}`, ro: `Erori JS pe TV: ${r.jsErrors.length}` },
      action: { ru: 'Подробности в журнале ниже — пришлите их разработчику.', ro: 'Detalii în jurnal.' },
    });
  }
  return out;
}
