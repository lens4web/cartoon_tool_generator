'use client';

import React, { useState } from 'react';
import { Key, Eye, EyeOff, ShieldCheck, X, CheckCircle, ExternalLink } from 'lucide-react';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { t } = useThemeLanguage();

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('apiKeyModalTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              {t('apiKeyModalSubtitle')}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-gray-300 mb-4 leading-relaxed">
          {t('apiKeyModalDesc')}
        </p>

        <div className="space-y-3 mb-5">
          <label className="block text-xs font-medium text-slate-700 dark:text-gray-300">
            {t('apiKeyInputLabel')}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="xai-..."
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 outline-none pr-10 font-mono transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('apiKeySecureNote')}</span>
            </div>
            <a
              href="https://console.x.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>{t('apiKeyGetLink')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-[#1f293d]">
          <button
            onClick={handleClear}
            className="px-3.5 py-2 text-xs font-medium text-slate-400 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
          >
            {t('apiKeyClear')}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t('apiKeyCancel')}
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all ${
                savedSuccess
                  ? 'bg-emerald-600'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20'
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('apiKeySaved')}</span>
                </>
              ) : (
                <span>{t('apiKeySave')}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
