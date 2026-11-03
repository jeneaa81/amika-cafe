import React, { useState, useEffect, useCallback } from 'react';
import type { Language } from '../types';
import {
  type TvStatusReport,
  TV_STATUS_RELAYS,
  parseRelayEvent,
  fetchRecentTvReports,
  diagnose,
  EXPECTED_TV_BUILD,
} from '../utils/tvTelemetry';
import { sendTvCommand } from '../utils/tvSync';
import {
  Tv,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Clock,
  Terminal,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TvDiagnosticsPanelProps {
  language: Language;
}

export const TvDiagnosticsPanel: React.FC<TvDiagnosticsPanelProps> = ({ language }) => {
  const [reports, setReports] = useState<TvStatusReport[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [autoRefreshTime, setAutoRefreshTime] = useState<number>(Date.now());

  // Merge a newly received report into state
  const handleIncomingReport = useCallback((newRep: TvStatusReport) => {
    setReports((prev) => {
      const idx = prev.findIndex((r) => r.deviceId === newRep.deviceId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newRep;
        return next.sort((a, b) => b.ts - a.ts);
      }
      return [newRep, ...prev].sort((a, b) => b.ts - a.ts);
    });
  }, []);

  // Poll recent history on mount and every 30s
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await fetchRecentTvReports('48h');
        if (mounted && list.length > 0) {
          setReports(list);
          setSelectedDeviceId((cur) => cur || list[0].deviceId);
        }
      } catch {}
    };
    load();

    const interval = setInterval(() => {
      setAutoRefreshTime(Date.now());
      load();
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Listen to SSE live streams from relays
  useEffect(() => {
    const sseInstances: EventSource[] = [];
    TV_STATUS_RELAYS.forEach((base) => {
      try {
        const sse = new EventSource(`${base}/sse`);
        sseInstances.push(sse);
        sse.addEventListener('message', (ev) => {
          const rep = parseRelayEvent(ev.data);
          if (rep) {
            handleIncomingReport(rep);
            setSelectedDeviceId((cur) => cur || rep.deviceId);
          }
        });
      } catch {}
    });

    return () => {
      sseInstances.forEach((s) => s.close());
    };
  }, [handleIncomingReport]);

  const activeReport =
    reports.find((r) => r.deviceId === selectedDeviceId) || reports[0] || null;

  const handleRequestStatus = async () => {
    setIsRequesting(true);
    await sendTvCommand({ type: 'REQUEST_TV_STATUS' });
    setTimeout(async () => {
      try {
        const list = await fetchRecentTvReports('10m');
        if (list.length > 0) {
          setReports(list);
        }
      } catch {}
      setIsRequesting(false);
    }, 3000);
  };

  const isRo = language === 'ro';

  // Format relative time (e.g., "15 сек назад")
  const formatTimeAgo = (ts: number): string => {
    const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (diffSec < 10) return isRo ? 'Chiar acum' : 'Только что';
    if (diffSec < 60) return `${diffSec} ${isRo ? 'sec în urmă' : 'сек назад'}`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ${isRo ? 'min în urmă' : 'мин назад'}`;
    const diffHours = Math.round(diffMin / 60);
    return `${diffHours} ${isRo ? 'ore în urmă' : 'ч назад'}`;
  };

  const diagnoses = activeReport ? diagnose(activeReport, autoRefreshTime) : [];

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-4 shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white">
                {isRo ? 'Telemetrie & Diagnostic TV' : 'Диагностика телевизора (Телеметрия)'}
              </span>
              {activeReport && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-stone-800 text-stone-300">
                  {formatTimeAgo(activeReport.ts)}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400">
              {isRo
                ? 'Starea reală raportată direct de televizor prin cloud'
                : 'Реальное состояние, передаваемое телевизором из зала в реальном времени'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRequestStatus}
          disabled={isRequesting}
          className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-xs font-bold text-stone-200 hover:text-white flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{isRo ? 'Cere status acum' : 'Запросить статус ТВ'}</span>
        </button>
      </div>

      {/* Multiple device switcher if more than 1 TV report received */}
      {reports.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-500 text-[11px] shrink-0">
            {isRo ? 'Dispozitive:' : 'Экраны:'}
          </span>
          {reports.map((r) => (
            <button
              key={r.deviceId}
              type="button"
              onClick={() => setSelectedDeviceId(r.deviceId)}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs transition border cursor-pointer ${
                r.deviceId === selectedDeviceId
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {r.deviceId} ({r.page}) · {formatTimeAgo(r.ts)}
            </button>
          ))}
        </div>
      )}

      {/* If no report ever arrived yet */}
      {!activeReport && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              {isRo
                ? 'Niciun raport de stare primit de la TV'
                : 'Пока не получено ни одного отчёта от телевизора'}
            </span>
          </div>
          <p className="text-stone-300 leading-relaxed">
            {isRo
              ? 'Asigurați-vă că pe televizor este deschisă pagina tv.html cu noua versiune. Apăsați butonul «Cere status acum» mai sus.'
              : 'Убедитесь, что на телевизоре открыта страница tv.html с обновлением. Нажмите кнопку «Запросить статус ТВ» выше.'}
          </p>
        </div>
      )}

      {/* Rule-based diagnosis banner */}
      {activeReport && diagnoses.length > 0 && (
        <div className="space-y-2">
          {diagnoses.map((diag, i) => {
            const isErr = diag.severity === 'error';
            const isWarn = diag.severity === 'warn';
            const bg = isErr
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              : isWarn
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200';
            const Icon = isErr ? XCircle : isWarn ? AlertTriangle : CheckCircle2;
            const iconColor = isErr ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400';

            return (
              <div key={i} className={`p-3 rounded-2xl border text-xs space-y-1 ${bg}`}>
                <div className="flex items-center gap-2 font-bold">
                  <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                  <span>{isRo ? diag.title.ro : diag.title.ru}</span>
                </div>
                <div className="text-[11px] text-stone-300 pl-6 leading-relaxed">
                  {isRo ? diag.action.ro : diag.action.ru}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main metrics grid */}
      {activeReport && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Screen / Page Card */}
          <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1">
              <Tv className="w-3 h-3 text-stone-400" />
              <span>{isRo ? 'Ecran & Versiune' : 'Экран и сборка'}</span>
            </div>
            <div className="font-mono font-bold text-white text-xs truncate">
              {activeReport.page}
            </div>
            <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
              <span>{activeReport.build}</span>
              {activeReport.build === EXPECTED_TV_BUILD ? (
                <span className="text-emerald-400 font-bold text-[10px]">✓</span>
              ) : (
                <span className="text-rose-400 font-bold text-[10px]">✕ старая</span>
              )}
            </div>
            <div className="text-[10px] text-stone-500 truncate">
              {activeReport.screen}
            </div>
          </div>

          {/* Browser / Chromium Card */}
          <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1">
              <Terminal className="w-3 h-3 text-stone-400" />
              <span>{isRo ? 'Browser TV' : 'Браузер ТВ'}</span>
            </div>
            <div className="font-mono font-bold text-white text-xs">
              {activeReport.chrome ? `Chromium ${activeReport.chrome}` : 'WebOS Browser'}
            </div>
            <div className="text-[10px] text-stone-400">
              {activeReport.chrome && activeReport.chrome < 70
                ? (isRo ? '⚠️ Versiune veche' : '⚠️ Старый браузер')
                : (isRo ? 'Compatibil' : 'Совместим')}
            </div>
            <div className="text-[10px] text-stone-500 truncate" title={activeReport.ua}>
              {activeReport.ua.substring(0, 30)}...
            </div>
          </div>

          {/* Real Audio Status Card */}
          <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1">
              {activeReport.music.muted === true ? (
                <VolumeX className="w-3 h-3 text-rose-400" />
              ) : (
                <Volume2 className="w-3 h-3 text-emerald-400" />
              )}
              <span>{isRo ? 'Sunet TV real' : 'Реальный звук ТВ'}</span>
            </div>
            <div className="font-mono font-bold text-xs flex items-center gap-1.5">
              {activeReport.music.muted === true ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>MUTED</span>
                </span>
              ) : activeReport.music.state === 1 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{activeReport.music.volume ?? activeReport.music.configVolume ?? 50}%</span>
                </span>
              ) : (
                <span className="text-stone-400">Без звука</span>
              )}
            </div>
            <div className="text-[10px] text-stone-400 flex items-center gap-1">
              <span>{isRo ? 'Gest telecomandă:' : 'Кнопка пульта:'}</span>
              <span className={activeReport.music.userInteracted ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {activeReport.music.userInteracted ? '✓ была' : '✕ ждёт'}
              </span>
            </div>
            {activeReport.music.unlockPromptVisible && (
              <div className="text-[10px] text-amber-300 animate-pulse font-medium">
                {isRo ? 'Banner vizibil pe TV' : 'Баннер на экране ТВ'}
              </div>
            )}
          </div>

          {/* Real Player State Card */}
          <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1">
              {activeReport.music.state === 1 ? (
                <Play className="w-3 h-3 text-emerald-400" />
              ) : (
                <Pause className="w-3 h-3 text-stone-400" />
              )}
              <span>{isRo ? 'Stare YouTube' : 'Плеер YouTube'}</span>
            </div>
            <div className="font-mono font-bold text-xs flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeReport.music.state === 1
                    ? 'bg-emerald-400 animate-pulse'
                    : activeReport.music.state === 2
                    ? 'bg-amber-400'
                    : activeReport.music.error !== null
                    ? 'bg-rose-400'
                    : 'bg-stone-500'
                }`}
              />
              <span className={activeReport.music.state === 1 ? 'text-emerald-300 font-bold' : 'text-stone-300'}>
                {activeReport.music.stateName.toUpperCase()}
              </span>
            </div>
            <div className="text-[10px] text-stone-400">
              {isRo ? 'Mod:' : 'Режим:'} <span className="font-mono text-stone-300">{activeReport.music.mode}</span>
            </div>
            {activeReport.music.error !== null && (
              <div className="text-[10px] text-rose-400 font-bold">
                {isRo ? `Cod eroare: ${activeReport.music.error}` : `Код ошибки: ${activeReport.music.error}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last command received & Uptime */}
      {activeReport && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-stone-400 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800/80">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>
              {isRo ? 'Timp activ (uptime):' : 'Время работы:'}{' '}
              <span className="font-mono text-stone-300">
                {Math.floor(activeReport.uptimeSec / 60)} {isRo ? 'min' : 'мин'}
              </span>
            </span>
          </div>

          <div>
            {isRo ? 'Ultima comandă:' : 'Последняя команда:'}{' '}
            <span className="font-mono font-bold text-emerald-400">
              {activeReport.lastCmd ? `${activeReport.lastCmd.type} @ ${activeReport.lastCmd.at}` : '—'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowLogs((prev) => !prev)}
            className="text-stone-400 hover:text-stone-200 flex items-center gap-1 text-[11px] underline cursor-pointer"
          >
            <span>{isRo ? 'Jurnal evenimente TV' : 'Журнал событий ТВ'}</span>
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Collapsible log & JS errors console */}
      {activeReport && showLogs && (
        <div className="p-3 rounded-2xl bg-black border border-stone-800 space-y-2 text-xs font-mono">
          <div className="text-[11px] text-stone-400 font-bold uppercase">
            {isRo ? 'Ultimele evenimente din browserul TV:' : 'Последние события из браузера ТВ:'}
          </div>
          <div className="space-y-0.5 text-emerald-400 text-[11px] max-h-40 overflow-y-auto">
            {activeReport.log.length > 0 ? (
              activeReport.log.map((l, i) => <div key={i}>{l}</div>)
            ) : (
              <div className="text-stone-500">{isRo ? 'Niciun eveniment' : 'Журнал пуст'}</div>
            )}
          </div>

          {activeReport.jsErrors.length > 0 && (
            <div className="pt-2 border-t border-stone-900 space-y-0.5">
              <div className="text-[11px] text-rose-400 font-bold uppercase">
                {isRo ? 'Erori JavaScript pe TV:' : 'Ошибки JavaScript на ТВ:'}
              </div>
              <div className="space-y-0.5 text-rose-300 text-[11px]">
                {activeReport.jsErrors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
