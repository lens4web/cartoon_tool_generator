'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Film,
  Mic,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { LogEntry, SceneState } from '@/types/cartoon';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';

interface ConsolePanelProps {
  logs: LogEntry[];
  scenes: SceneState[];
  finalVideoUrl: string | null;
  isGenerating: boolean;
  onClearLogs: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  logs,
  scenes,
  finalVideoUrl,
  isGenerating,
  onClearLogs,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useThemeLanguage();

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'IMAGE') return log.stage === 'START_IMAGE';
    if (activeFilter === 'VIDEO') return log.stage === 'VIDEO';
    if (activeFilter === 'AUDIO') return log.stage === 'TTS_AUDIO';
    if (activeFilter === 'CONCAT') return log.stage === 'FINAL_CONCAT' || log.stage === 'SCENE_MUX';
    if (activeFilter === 'ERROR') return log.stage === 'ERROR' || log.level === 'error';
    return true;
  });

  return (
    <section className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] rounded-2xl shadow-sm dark:shadow-2xl overflow-hidden mt-10 transition-colors duration-200">
      {/* Console Header */}
      <div className="bg-slate-50 dark:bg-[#111827] px-6 py-4 border-b border-slate-200 dark:border-[#1f293d] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                {t('consoleTitle')}
              </h2>
              {isGenerating && (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span>{t('consoleGeneratingBadge')}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              {t('consoleSubtitle')}
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center bg-slate-200/80 dark:bg-[#080e1a] border border-slate-300 dark:border-[#1f293d] rounded-lg p-0.5">
            {[
              { id: 'ALL', label: t('consoleFilterAll') },
              { id: 'IMAGE', label: `🖼️ ${t('consoleFilterImages')}` },
              { id: 'VIDEO', label: `🎬 ${t('consoleFilterVideo')}` },
              { id: 'AUDIO', label: `🎙️ ${t('consoleFilterAudio')}` },
              { id: 'CONCAT', label: `⚡ ${t('consoleFilterConcat')}` },
              { id: 'ERROR', label: `⚠️ ${t('consoleFilterErrors')}` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeFilter === f.id
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              autoScroll
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium'
                : 'bg-slate-100 dark:bg-[#141d2e] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Auto-scroll"
          >
            {t('consoleAutoscroll')}: {autoScroll ? 'On' : 'Off'}
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 rounded-lg text-slate-400 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-gray-800 transition-colors"
            title={t('consoleClearTooltip')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ==================== FINAL CONCATENATED CARTOON SHOWCASE ==================== */}
      {finalVideoUrl && (
        <div className="bg-gradient-to-b from-slate-100 to-slate-50 dark:from-[#141d2e] dark:to-[#0d1322] border-b border-slate-200 dark:border-[#1f293d] p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('consoleFinalReady')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {t('consoleFinalReadyDesc')}
                  </p>
                </div>
              </div>

              <a
                href={finalVideoUrl}
                download="grok_cartoon.mp4"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>{t('consoleDownloadMp4')}</span>
              </a>
            </div>

            {/* Video Player Showcase */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1f293d] bg-black shadow-2xl max-w-lg mx-auto aspect-[9/16] max-h-[560px] flex items-center justify-center relative group">
              <video
                src={finalVideoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scenes Status Overview Track */}
      {scenes.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#0d1322] border-b border-slate-200 dark:border-[#1f293d] flex items-center gap-3 overflow-x-auto text-xs">
          <span className="text-slate-500 dark:text-gray-500 text-[11px] font-semibold whitespace-nowrap">
            {t('consoleSceneStatusTrack')}
          </span>
          {scenes.map((s, idx) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border whitespace-nowrap ${
                s.status === 'completed'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                  : s.status === 'error'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300'
                  : s.status !== 'idle'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300 animate-pulse'
                  : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-[#1f293d] text-slate-500 dark:text-gray-400'
              }`}
            >
              <span className="font-bold">#{idx + 1}</span>
              <span className="text-[11px] truncate max-w-[120px]">{s.title}</span>
              {s.status === 'completed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              ) : s.status === 'error' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              ) : s.status !== 'idle' ? (
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Live Logs & Artifacts Feed */}
      <div
        ref={logContainerRef}
        className="p-6 max-h-[460px] min-h-[220px] overflow-y-auto space-y-4 font-sans text-xs bg-slate-50/50 dark:bg-[#0b0f19]"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-gray-500">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>{t('consoleEmptyLog')}</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const stageBadgeColors: Record<string, string> = {
              START: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
              START_IMAGE: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
              VIDEO: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
              TTS_AUDIO: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
              SCENE_MUX: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
              FINAL_CONCAT: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
              SYSTEM: 'bg-slate-500/10 text-slate-600 dark:text-gray-400 border-slate-500/20',
              ERROR: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
            };

            return (
              <div
                key={log.id}
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d] rounded-xl p-3.5 hover:border-blue-500/30 dark:hover:border-[#2b3a55] transition-colors space-y-2.5 shadow-sm dark:shadow-none"
              >
                {/* Event Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 dark:text-gray-500">
                      [{log.timestamp}]
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
                        stageBadgeColors[log.stage] || stageBadgeColors.SYSTEM
                      }`}
                    >
                      {log.stageLabel || log.stage}
                    </span>
                    {log.sceneTitle && (
                      <span className="text-slate-500 dark:text-gray-400 text-[11px] font-medium">
                        • {log.sceneTitle}
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Message */}
                <p
                  className={`leading-relaxed ${
                    log.level === 'error'
                      ? 'text-rose-600 dark:text-rose-400 font-medium'
                      : log.level === 'success'
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-gray-300'
                  }`}
                >
                  {log.message}
                </p>

                {/* Embedded Media Preview in Console */}
                {log.mediaUrl && (
                  <div className="pt-2">
                    {log.mediaType === 'image' && (
                      <div className="inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-[#1f293d] bg-black max-w-[200px] aspect-[9/12]">
                        <img
                          src={log.mediaUrl}
                          alt="Generated Frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {log.mediaType === 'audio' && (
                      <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#080e1a] p-2 rounded-xl border border-slate-200 dark:border-[#1f293d] max-w-md">
                        <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <audio
                          src={log.mediaUrl}
                          controls
                          className="h-7 w-full"
                        />
                      </div>
                    )}

                    {log.mediaType === 'video' && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#1f293d] bg-black max-w-xs aspect-[9/16] max-h-[300px]">
                        <video
                          src={log.mediaUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
