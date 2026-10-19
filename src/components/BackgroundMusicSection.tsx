'use client';

import React, { useRef } from 'react';
import { Music, Upload, Trash2, Volume2, CheckCircle2 } from 'lucide-react';
import { BackgroundMusicConfig } from '@/types/cartoon';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';

interface BackgroundMusicSectionProps {
  music: BackgroundMusicConfig;
  onChange: (music: BackgroundMusicConfig) => void;
}

export const BackgroundMusicSection: React.FC<BackgroundMusicSectionProps> = ({
  music,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useThemeLanguage();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Пожалуйста, выберите аудиофайл (MP3, WAV, M4A, AAC, OGG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onChange({
        ...music,
        enabled: true,
        audioUrl: result,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemove = () => {
    onChange({
      ...music,
      audioUrl: null,
      fileName: undefined,
    });
  };

  return (
    <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d] rounded-2xl p-6 shadow-sm dark:shadow-xl mb-8 transition-colors duration-200">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('bgMusicSectionTitle')}
              </h2>
              {music.enabled && music.audioUrl && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t('bgMusicActiveBadge')}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              {t('bgMusicSectionSubtitle')}
            </p>
          </div>
        </div>

        {/* Toggle Enable/Disable */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <span className="text-xs text-slate-700 dark:text-gray-300 font-medium">
            {t('bgMusicEnabled')}:
          </span>
          <input
            type="checkbox"
            checked={music.enabled}
            onChange={(e) => onChange({ ...music, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 relative"></div>
        </label>
      </div>

      {music.enabled ? (
        <div className="space-y-4 pt-2">
          {music.audioUrl ? (
            <div className="bg-slate-50/70 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] rounded-xl p-4 space-y-4 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-gray-300 font-medium">
                  <Music className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span className="truncate max-w-xs">{music.fileName || 'Audio Track'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 transition-colors"
                  title={t('deletePhoto')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('deletePhoto')}</span>
                </button>
              </div>

              {/* Audio Player */}
              <audio src={music.audioUrl} controls className="w-full h-8" />

              {/* Controls: Volume and Loop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-200 dark:border-[#1f293d]">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-600 dark:text-gray-400 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>{t('bgMusicVolumeLabel')}</span>
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {Math.round(music.volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={1.0}
                    step={0.05}
                    value={music.volume}
                    onChange={(e) => onChange({ ...music, volume: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">
                    {t('bgMusicTip')}
                  </p>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={music.loop}
                      onChange={(e) => onChange({ ...music, loop: e.target.checked })}
                      className="rounded bg-slate-100 dark:bg-[#141d2e] border-slate-300 dark:border-gray-600 text-amber-500 focus:ring-0 w-4 h-4"
                    />
                    <span className="text-xs text-slate-700 dark:text-gray-300">
                      {t('bgMusicLoopLabel')}
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 pl-6">
                    {t('bgMusicSectionSubtitle')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-[#1f293d] hover:border-amber-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors group bg-slate-50/70 dark:bg-[#0b0f19]"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto mb-2 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-gray-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                {t('bgMusicUploadTitle')}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">
                {t('bgMusicUploadDesc')}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="p-4 text-center text-slate-400 dark:text-gray-500 border border-dashed border-slate-200 dark:border-[#1f293d] rounded-xl text-xs bg-slate-50/50 dark:bg-[#0b0f19]/50">
          {t('bgMusicSectionSubtitle')}
        </div>
      )}
    </section>
  );
};
