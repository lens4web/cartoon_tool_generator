'use client';

import React, { useRef } from 'react';
import { User, Image as ImageIcon, Trash2, Upload, CheckCircle2 } from 'lucide-react';
import { MainCharacter } from '@/types/cartoon';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';

interface CharacterSectionProps {
  character: MainCharacter;
  onChange: (character: MainCharacter) => void;
}

export const CharacterSection: React.FC<CharacterSectionProps> = ({
  character,
  onChange,
}) => {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const { t } = useThemeLanguage();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, view: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения (JPEG, PNG или WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (view === 'front') {
        onChange({ ...character, frontImage: result });
      } else {
        onChange({ ...character, backImage: result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (view: 'front' | 'back') => {
    if (view === 'front') {
      onChange({ ...character, frontImage: null });
    } else {
      onChange({ ...character, backImage: null });
    }
  };

  const isConfigured = Boolean(character.frontImage || character.backImage);

  return (
    <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d] rounded-2xl p-6 shadow-sm dark:shadow-xl mb-8 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('characterSectionTitle')}
              </h2>
              {isConfigured && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t('characterUploaded')}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              {t('characterSectionSubtitle')}
            </p>
          </div>
        </div>

        {/* Character Name Input */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 dark:text-gray-400">
            {t('characterNameLabel')}
          </label>
          <input
            type="text"
            value={character.name}
            onChange={(e) => onChange({ ...character, name: e.target.value })}
            placeholder={t('characterNamePlaceholder')}
            className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 outline-none w-44 transition-colors"
          />
        </div>
      </div>

      {/* Two Columns: Front View & Back View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Front View */}
        <div className="bg-slate-50/70 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] rounded-xl p-4 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-gray-200">
                {t('frontViewTitle')}
              </span>
            </div>
            {character.frontImage && (
              <button
                onClick={() => handleRemoveImage('front')}
                className="text-slate-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded transition-colors"
                title={t('deletePhoto')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {character.frontImage ? (
            <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-[#1f293d] bg-slate-100 dark:bg-black/40 aspect-[9/12] max-h-56 flex items-center justify-center">
              <img
                src={character.frontImage}
                alt="Front View"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => frontInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t('replacePhoto')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => frontInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-[#1f293d] hover:border-blue-500/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-colors group aspect-[9/12] max-h-56"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center transition-colors">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                  {t('frontViewUpload')}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-gray-500">PNG, JPG, WebP</p>
              </div>
            </div>
          )}
          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'front')}
            className="hidden"
          />
        </div>

        {/* Back View */}
        <div className="bg-slate-50/70 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] rounded-xl p-4 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-gray-200">
                {t('backViewTitle')}
              </span>
            </div>
            {character.backImage && (
              <button
                onClick={() => handleRemoveImage('back')}
                className="text-slate-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded transition-colors"
                title={t('deletePhoto')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {character.backImage ? (
            <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-[#1f293d] bg-slate-100 dark:bg-black/40 aspect-[9/12] max-h-56 flex items-center justify-center">
              <img
                src={character.backImage}
                alt="Back View"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => backInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t('replacePhoto')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => backInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-[#1f293d] hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-colors group aspect-[9/12] max-h-56"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center transition-colors">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-gray-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                  {t('backViewUpload')}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-gray-500">PNG, JPG, WebP</p>
              </div>
            </div>
          )}
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'back')}
            className="hidden"
          />
        </div>
      </div>
    </section>
  );
};
