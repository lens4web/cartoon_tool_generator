'use client';

import React, { useRef } from 'react';
import {
  Key,
  Play,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Clapperboard,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';

interface HeaderProps {
  apiKey: string;
  onOpenApiKeyModal: () => void;
  onExportProject: () => void;
  onImportProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetProject: () => void;
  onStartGeneration: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  scenesCount: number;
  totalScenesCount?: number;
  estimatedCost: {
    totalUsd: number;
    totalRub: number;
    videoCost: number;
    imageCost: number;
    inputImagesCost?: number;
    ttsCost: number;
    totalDurationSeconds?: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  apiKey,
  onOpenApiKeyModal,
  onExportProject,
  onImportProject,
  onResetProject,
  onStartGeneration,
  isGenerating,
  canGenerate,
  scenesCount,
  totalScenesCount,
  estimatedCost,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, toggleLanguage, theme, toggleTheme, t } = useThemeLanguage();

  const formatDuration = (totalSec: number = 0): string => {
    if (totalSec <= 0) return t('durationFormatSec', { count: 0 });
    if (totalSec < 60) return t('durationFormatSec', { count: totalSec });
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return s > 0
      ? t('durationFormatMinSec', { min: m, sec: s })
      : t('durationFormatMin', { min: m });
  };

  const scenesPluralText =
    scenesCount === 1
      ? t('scenesCountOne')
      : scenesCount < 5
      ? t('scenesCountFew')
      : t('scenesCountMany');

  const scenesLabel =
    totalScenesCount && totalScenesCount !== scenesCount
      ? `${scenesCount} ${t('scenesOfTotal', { total: totalScenesCount })}`
      : `${scenesCount} ${scenesPluralText}`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1f293d] px-6 py-3.5 transition-colors duration-200 shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                {t('appTitle')}
              </h1>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {t('versionBadge')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              {t('appSubtitle')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Theme & Language Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#141d2e] border border-slate-200 dark:border-[#1f293d] rounded-lg p-0.5">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-[#1c2940] transition-colors"
              title={t('languageToggle')}
            >
              <Globe className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className={language === 'ru' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-gray-500 font-normal'}>RU</span>
              <span className="text-slate-300 dark:text-gray-600 text-[10px]">/</span>
              <span className={language === 'en' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-gray-500 font-normal'}>EN</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-200 dark:bg-[#1f293d]" />

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-slate-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-200/70 dark:hover:bg-[#1c2940] transition-colors"
              title={theme === 'dark' ? t('themeToggleLight') : t('themeToggleDark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              )}
            </button>
          </div>

          {/* API Key Status / Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
              apiKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 animate-pulse'
            }`}
            title={t('apiKeyTooltip')}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? t('apiKeyActive') : t('setApiKey')}</span>
            {apiKey ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            )}
          </button>

          {/* Project JSON Export / Import */}
          <div className="flex items-center bg-slate-100 dark:bg-[#141d2e] border border-slate-200 dark:border-[#1f293d] rounded-lg p-0.5">
            <button
              onClick={onExportProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#1c2940] transition-colors"
              title={t('exportJsonTooltip')}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>{t('exportJson')}</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#1c2940] transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>{t('importJson')}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportProject}
                className="hidden"
              />
            </label>

            <button
              onClick={onResetProject}
              className="p-1.5 rounded-md text-slate-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-200/80 dark:hover:bg-[#1c2940] transition-colors"
              title={t('resetProject')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Master Generate Button with Dynamic Price and Total Duration */}
          <button
            onClick={onStartGeneration}
            disabled={!canGenerate || isGenerating}
            title={`${t('timingLabel')}: ${formatDuration(estimatedCost.totalDurationSeconds ?? 0)}\n${scenesLabel}\n\nUSD: ~$${estimatedCost.totalUsd} (~${estimatedCost.totalRub} ₽)`}
            className={`flex items-center gap-3 px-5 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              isGenerating
                ? 'bg-blue-600/50 text-blue-100 cursor-not-allowed border border-blue-400/30'
                : canGenerate
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-600/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-200 dark:bg-gray-800 text-slate-400 dark:text-gray-500 border border-slate-300 dark:border-gray-700 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('generatingCartoon')}</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-left">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                      <span>{t('buildCartoon')}</span>
                      <span className="text-[10px] font-medium bg-white/20 text-white px-1.5 py-0.5 rounded-md">
                        {scenesLabel} • {formatDuration(estimatedCost.totalDurationSeconds ?? 0)}
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-200 font-normal">
                      {t('lengthLabel')}: {formatDuration(estimatedCost.totalDurationSeconds ?? 0)} • ~${estimatedCost.totalUsd} (~{estimatedCost.totalRub} ₽)
                    </div>
                  </div>
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
