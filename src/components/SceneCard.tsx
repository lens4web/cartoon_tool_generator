'use client';

import React, { useRef } from 'react';
import {
  Film,
  Mic,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Upload,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Video,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import {
  SceneState,
  XAI_VOICES,
  CharacterView,
  StartImageMode,
  LastFrameMode,
  VideoModelId,
  SceneAudioTrack,
} from '@/types/cartoon';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';

interface SceneCardProps {
  scene: SceneState;
  index: number;
  totalScenes: number;
  onUpdate: (updates: Partial<SceneState>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  hasCharacterFront: boolean;
  hasCharacterBack: boolean;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  index,
  totalScenes,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  hasCharacterFront,
  hasCharacterBack,
}) => {
  const readyVideoInputRef = useRef<HTMLInputElement>(null);
  const templateImageInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const multiLastFrameInputRef = useRef<HTMLInputElement>(null);
  const multiStartImageInputRef = useRef<HTMLInputElement>(null);

  const { t } = useThemeLanguage();

  // Helper updates for nested video & audio configs
  const updateVideo = (updates: Partial<SceneState['video']>) => {
    onUpdate({ video: { ...scene.video, ...updates } });
  };

  const updateAudio = (updates: Partial<SceneState['audio']>) => {
    onUpdate({ audio: { ...scene.audio, ...updates } });
  };

  // Manage multiple audio tracks
  const tracks: SceneAudioTrack[] =
    scene.audio.tracks && scene.audio.tracks.length > 0
      ? scene.audio.tracks
      : [
          {
            id: 'track-1',
            phrase: scene.audio.phrase || '',
            voiceId: scene.audio.voiceId || 'eve',
            speed: scene.audio.speed || 1.0,
            normalizeText: scene.audio.normalizeText ?? true,
            audioOffset: scene.audio.audioOffset || 0,
          },
        ];

  const handleUpdateTrack = (trackId: string, trackUpdates: Partial<SceneAudioTrack>) => {
    const updatedTracks = tracks.map((t) => (t.id === trackId ? { ...t, ...trackUpdates } : t));
    updateAudio({ tracks: updatedTracks });
  };

  const handleAddTrack = () => {
    const newTrack: SceneAudioTrack = {
      id: `track-${Date.now()}`,
      phrase: '',
      voiceId: 'eve',
      speed: 1.0,
      normalizeText: true,
      audioOffset: Math.min(scene.video.duration, tracks.length * 2),
    };
    updateAudio({ tracks: [...tracks, newTrack] });
  };

  const handleDeleteTrack = (trackId: string) => {
    if (tracks.length <= 1) return;
    const updatedTracks = tracks.filter((t) => t.id !== trackId);
    updateAudio({ tracks: updatedTracks });
  };

  // Handle ready-made video file upload
  const handleReadyVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Пожалуйста, выберите видеофайл (MP4/WebM)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateVideo({ readyVideoUrl: result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle template image upload
  const handleTemplateImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateVideo({ templateImage: result, templateSource: 'upload' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle last frame upload
  const handleLastFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateVideo({ lastFrameImage: result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle multiple reference photos for last frame generation
  const handleMultiLastFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const current = scene.video.lastFrameReferences || [];
    const remainingSlots = Math.max(0, 5 - current.length);
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        updateVideo({
          lastFrameReferences: [...(scene.video.lastFrameReferences || []), result].slice(0, 5),
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Handle multiple reference photos for start image generation
  const handleMultiStartImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const current = scene.video.startImageReferences || [];
    const remainingSlots = Math.max(0, 5 - current.length);
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        updateVideo({
          startImageReferences: [...(scene.video.startImageReferences || []), result].slice(0, 5),
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const isModel15 = scene.video.model === 'grok-imagine-video-1.5';
  const isCustomStartImage = scene.video.startImageMode === 'custom_generate';
  const isPrevSceneLastFrame = scene.video.startImageMode === 'prev_scene_last_frame';

  return (
    <div
      className={`rounded-2xl p-6 shadow-sm dark:shadow-xl relative transition-all duration-200 ${
        scene.enabled === false
          ? 'bg-slate-100/80 dark:bg-[#0f1420]/80 border border-dashed border-slate-300 dark:border-gray-700/80 opacity-80'
          : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d] hover:border-slate-300 dark:hover:border-[#2b3a55]'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-[#1f293d]">
        <div className="flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-xl border font-bold text-xs flex items-center justify-center transition-colors ${
              scene.enabled === false
                ? 'bg-slate-200 text-slate-400 border-slate-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}
          >
            #{index + 1}
          </span>
          <div>
            <input
              type="text"
              value={scene.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className={`text-sm font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-gray-600 focus:border-blue-500 outline-none px-1 py-0.5 transition-colors ${
                scene.enabled === false
                  ? 'text-slate-400 dark:text-gray-400 line-through'
                  : 'text-slate-900 dark:text-white'
              }`}
              placeholder={t('sceneTitlePlaceholder')}
            />
          </div>
        </div>

        {/* Enable / Disable Scene Toggle Switch */}
        <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
          <input
            type="checkbox"
            checked={scene.enabled !== false}
            onChange={(e) => onUpdate({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-8 h-4.5 bg-slate-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
          <span
            className={`text-xs font-semibold transition-colors ${
              scene.enabled !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-500'
            }`}
          >
            {scene.enabled !== false ? t('sceneEnabledToggle') : t('sceneDisabledToggle')}
          </span>
        </label>

        {/* Runtime Status Pill */}
        {scene.status !== 'idle' && (
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                scene.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : scene.status === 'error'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse'
              }`}
            >
              {scene.status === 'completed' ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : scene.status === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              )}
              <span>{scene.statusText || scene.status}</span>
            </span>
          </div>
        )}

        {/* Reordering and Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title={t('moveUp')}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalScenes - 1}
            className="p-1.5 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title={t('moveDown')}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1.5 rounded-lg text-slate-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors ml-1"
            title={t('duplicateScene')}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={totalScenes <= 1}
            className="p-1.5 rounded-lg text-slate-400 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title={t('deleteScene')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inactive scene alert */}
      {scene.enabled === false && (
        <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>{t('sceneDisabledAlert')}</span>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ enabled: true })}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 font-medium text-xs border border-amber-500/30 transition-colors shrink-0 ml-3"
          >
            {t('enableSceneButton')}
          </button>
        </div>
      )}

      {/* Main Grid: Video Configuration (Left) & Grok-TTS Configuration (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==================== LEFT COLUMN: VIDEO GENERATION ==================== */}
        <div className="space-y-5 bg-slate-50/70 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] rounded-xl p-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-gray-200">
                {t('videoColTitle')}
              </h3>
            </div>

            {/* Toggle: Generate Video vs Pick Ready-made Video */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-slate-600 dark:text-gray-400">
                {t('generateVideoToggle')}:
              </span>
              <input
                type="checkbox"
                checked={scene.video.generateVideo}
                onChange={(e) => updateVideo({ generateVideo: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative"></div>
            </label>
          </div>

          {!scene.video.generateVideo ? (
            /* Ready-made video picker */
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {t('selectCustomVideo')}
              </p>
              {scene.video.readyVideoUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#1f293d] bg-black/50 aspect-video relative group">
                  <video
                    src={scene.video.readyVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => updateVideo({ readyVideoUrl: null })}
                      className="p-1.5 rounded-lg bg-black/60 text-slate-300 dark:text-gray-400 hover:text-rose-400 backdrop-blur-sm"
                      title={t('deletePhoto')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => readyVideoInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-[#1f293d] hover:border-blue-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors"
                >
                  <Video className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-700 dark:text-gray-200">{t('selectCustomVideo')}</p>
                  <p className="text-[11px] text-slate-400 dark:text-gray-500">MP4, WebM</p>
                </div>
              )}
              <input
                ref={readyVideoInputRef}
                type="file"
                accept="video/*"
                onChange={handleReadyVideoUpload}
                className="hidden"
              />
            </div>
          ) : (
            /* Video Model Settings */
            <div className="space-y-4">
              {/* 1. Model Selector (1.5-lite vs 1.5 with First & Last Frame) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                  {t('modelLabel')}:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateVideo({ model: 'grok-imagine-video-1.5-lite' })}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      !isModel15
                        ? 'bg-blue-600/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'bg-white dark:bg-[#141d2e] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Video 1.5 Lite</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">$0.02</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">{t('modelLiteDesc')}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateVideo({ model: 'grok-imagine-video-1.5' })}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      isModel15
                        ? 'bg-purple-600/15 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                        : 'bg-white dark:bg-[#141d2e] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Video 1.5 (Full)</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-300 font-mono">$0.08</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">{t('modelProDesc')}</p>
                  </button>
                </div>
              </div>

              {/* Fixed Resolution info */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="bg-slate-200 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border border-slate-300 dark:border-gray-700 px-2 py-0.5 rounded-md">
                  480p
                </span>
                <span className="bg-slate-200 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border border-slate-300 dark:border-gray-700 px-2 py-0.5 rounded-md">
                  Ratio: 9:16 / 1:1
                </span>
              </div>

              {/* Duration Slider & Audio Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-600 dark:text-gray-400">{t('videoDurationLabel')}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{scene.video.duration} сек.</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={scene.video.duration}
                    onChange={(e) => updateVideo({ duration: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="flex flex-col items-end justify-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs text-slate-700 dark:text-gray-300">{t('videoAudioToggle')}:</span>
                    <input
                      type="checkbox"
                      checked={scene.video.generateAudio}
                      onChange={(e) => updateVideo({ generateAudio: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                  </label>
                  {scene.video.generateAudio && scene.audio.useTts && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 text-right">
                      {t('videoAudioPlaysWithTts')}
                    </span>
                  )}
                </div>
              </div>

              {/* ================= START IMAGE MODE ================= */}
              <div className="pt-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-2">
                  {t('startImageSectionLabel')}:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateVideo({ startImageMode: 'character_ref' })}
                    className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      scene.video.startImageMode === 'character_ref'
                        ? 'bg-blue-600/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'bg-white dark:bg-[#141d2e] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{t('startImageModeCharRef')}</span>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">{t('startImageModeCharRefSub')}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateVideo({ startImageMode: 'custom_generate' })}
                    className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      isCustomStartImage
                        ? 'bg-purple-600/15 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                        : 'bg-white dark:bg-[#141d2e] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{t('startImageModeCustomGen')}</span>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">{t('startImageModeCustomGenSub')}</p>
                  </button>

                  {/* Option: Last frame of previous scene */}
                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => updateVideo({ startImageMode: 'prev_scene_last_frame' })}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        isPrevSceneLastFrame
                          ? 'bg-emerald-600/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'bg-white dark:bg-[#141d2e] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{t('startImageModePrevFrame', { index })}</span>
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">{t('startImageModePrevFrameSub')}</p>
                    </button>
                  ) : (
                    <div className="px-2.5 py-2 rounded-xl text-xs border border-dashed border-slate-300 dark:border-[#1f293d] text-slate-400 dark:text-gray-600 opacity-60">
                      <span>{t('startImageModePrevFrameDisabled')}</span>
                      <p className="text-[10px] text-slate-400 dark:text-gray-600 mt-0.5">(Для сцен №2+)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* DIRECT CHARACTER REFERENCE VIEW PICKER */}
              {scene.video.startImageMode === 'character_ref' && (
                <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-[#141d2e]/60 border border-blue-500/20 space-y-2.5 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-gray-300">
                    {t('charViewTitle')}:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateVideo({ characterView: 'front' })}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        scene.video.characterView === 'front'
                          ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                          : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {t('charViewFront')} {hasCharacterFront ? '✓' : '(не загружен)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateVideo({ characterView: 'back' })}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        scene.video.characterView === 'back'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                          : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {t('charViewBack')} {hasCharacterBack ? '✓' : '(не загружен)'}
                    </button>
                  </div>
                </div>
              )}

              {/* PREVIOUS SCENE LAST FRAME INFO */}
              {isPrevSceneLastFrame && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 space-y-1 animate-in fade-in duration-150">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('seamlessPrevFrameTitle', { index })}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed">
                    {t('seamlessPrevFrameDesc', { index })}
                  </p>
                </div>
              )}

              {/* CONDITIONAL START IMAGE GENERATION FIELDS */}
              {isCustomStartImage && (
                <div className="p-4 rounded-xl bg-slate-100/90 dark:bg-[#141d2e]/80 border border-purple-200 dark:border-purple-500/30 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('customStartParamsTitle')}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-gray-400">
                      {t('multiRefsBadge')}
                    </span>
                  </div>

                  {/* 1. HERO VIEW */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-gray-300">
                        {t('charInFrameTitle')}:
                      </label>
                      <span className="text-[10px] text-purple-600 dark:text-purple-300 font-medium">
                        {(scene.video.characterView || 'front') === 'front'
                          ? t('charViewFront')
                          : scene.video.characterView === 'back'
                          ? t('charViewBack')
                          : t('charViewNone')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateVideo({ characterView: 'front' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                          (scene.video.characterView || 'front') === 'front'
                            ? 'bg-blue-600 border-blue-500 text-white shadow-sm ring-1 ring-blue-400'
                            : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{t('charViewFront')}</span>
                        <span className="text-[10px] opacity-80">{hasCharacterFront ? '✓' : '(не загружен)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateVideo({ characterView: 'back' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                          scene.video.characterView === 'back'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-400'
                            : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{t('charViewBack')}</span>
                        <span className="text-[10px] opacity-80">{hasCharacterBack ? '✓' : '(не загружен)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateVideo({ characterView: 'none' })}
                        className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                          scene.video.characterView === 'none'
                            ? 'bg-slate-700 dark:bg-gray-700 border-slate-600 dark:border-gray-500 text-white shadow-sm'
                            : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                        }`}
                        title="Не передавать фото персонажа в генерацию этого кадра"
                      >
                        {t('charViewNone')}
                      </button>
                    </div>
                  </div>

                  {/* 2. PREVIOUS SCENE LAST FRAME (FOR SCENES 2+) */}
                  {index > 0 && (
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        Boolean(
                          scene.video.usePrevSceneLastFrame ||
                            scene.video.templateSource === 'prev_scene_last_frame'
                        )
                          ? 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-500/40'
                          : 'bg-white/70 dark:bg-[#0b0f19]/70 border-slate-200 dark:border-[#1f293d]'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer select-none">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={Boolean(
                              scene.video.usePrevSceneLastFrame ||
                                scene.video.templateSource === 'prev_scene_last_frame'
                            )}
                            onChange={(e) =>
                              updateVideo({
                                usePrevSceneLastFrame: e.target.checked,
                                templateSource: e.target.checked ? 'prev_scene_last_frame' : 'none',
                              })
                            }
                            className="rounded bg-slate-100 dark:bg-[#141d2e] border-slate-300 dark:border-gray-600 text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {t('usePrevFrameCheckbox', { index })}
                          </span>
                        </div>
                        {Boolean(
                          scene.video.usePrevSceneLastFrame ||
                            scene.video.templateSource === 'prev_scene_last_frame'
                        ) && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                            {t('usePrevFrameActive')}
                          </span>
                        )}
                      </label>
                      {Boolean(
                        scene.video.usePrevSceneLastFrame ||
                          scene.video.templateSource === 'prev_scene_last_frame'
                      ) && (
                        <p className="text-[10px] text-slate-600 dark:text-gray-400 mt-2 pl-6 leading-relaxed">
                          {t('usePrevFrameDesc', { index })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. MULTIPLE CUSTOM REFERENCE PHOTOS UPLOAD */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-gray-300">
                        {t('customRefsTitle')}:
                      </label>
                      <span className="text-[10px] text-slate-400 dark:text-gray-500">
                        {(scene.video.startImageReferences || []).length}/5 фото
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(scene.video.startImageReferences || []).map((img, rIdx) => (
                        <div
                          key={rIdx}
                          className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-[#1f293d] bg-black shadow"
                        >
                          <img
                            src={img}
                            alt={`Ref ${rIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = (scene.video.startImageReferences || []).filter(
                                (_, i) => i !== rIdx
                              );
                              updateVideo({ startImageReferences: next });
                            }}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                            title={t('deletePhoto')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {(scene.video.startImageReferences || []).length < 5 && (
                        <div
                          onClick={() => multiStartImageInputRef.current?.click()}
                          className="w-12 h-12 rounded-lg border border-dashed border-slate-300 dark:border-gray-600 hover:border-purple-500 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 cursor-pointer transition-colors bg-white dark:bg-transparent"
                          title={t('addPhotoRefButton')}
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[8px] font-medium">+ Фото</span>
                        </div>
                      )}

                      <input
                        ref={multiStartImageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultiStartImageUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1.5">
                      {t('customRefsDesc')}
                    </p>
                  </div>

                  {/* 4. TEXT INSTRUCTION */}
                  <div>
                    <label className="block text-[11px] text-slate-700 dark:text-gray-300 mb-1">
                      {t('startInstructionLabel')}:
                    </label>
                    <textarea
                      rows={2}
                      value={scene.video.imageInstruction || ''}
                      onChange={(e) => updateVideo({ imageInstruction: e.target.value })}
                      placeholder={t('startInstructionPlaceholder')}
                      className="w-full bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 outline-none resize-none transition-colors"
                    />
                    <p className="text-[10px] text-purple-700 dark:text-purple-300/80 mt-1">
                      {t('startInstructionHint', { index })}
                    </p>
                  </div>
                </div>
              )}

              {/* ================= OPTIONAL LAST FRAME (for 1.5 model) ================= */}
              {isModel15 && (
                <div className="p-4 rounded-xl bg-slate-100/90 dark:bg-[#141d2e]/80 border border-purple-200 dark:border-purple-500/30 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                      {t('lastFrameSectionTitle')}:
                    </span>
                    <select
                      value={scene.video.lastFrameMode || 'none'}
                      onChange={(e) => updateVideo({ lastFrameMode: e.target.value as LastFrameMode })}
                      className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="none">{t('lastFrameNone')}</option>
                      <option value="character_ref">{t('lastFrameCharRef')}</option>
                      <option value="custom_generate">{t('lastFrameCustomGen')}</option>
                      <option value="custom_upload">{t('lastFrameUpload')}</option>
                    </select>
                  </div>

                  {/* DIRECT CHARACTER REFERENCE AS LAST FRAME */}
                  {scene.video.lastFrameMode === 'character_ref' && (
                    <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-[#141d2e]/60 border border-purple-200 dark:border-purple-500/20 space-y-2.5 animate-in fade-in duration-150">
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-gray-300">
                        {t('lastFrameCharViewTitle')}:
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateVideo({ lastFrameCharacterView: 'front' })}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                            (scene.video.lastFrameCharacterView || 'front') === 'front'
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                              : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span>{t('lastFrameBoyFront')}</span>
                          <span className="text-[10px] opacity-80">{hasCharacterFront ? '✓' : '(не загружен)'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateVideo({ lastFrameCharacterView: 'back' })}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                            scene.video.lastFrameCharacterView === 'back'
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                              : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span>{t('lastFrameBoyBack')}</span>
                          <span className="text-[10px] opacity-80">{hasCharacterBack ? '✓' : '(не загружен)'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {scene.video.lastFrameMode === 'custom_generate' && (
                    <div className="space-y-3 pt-1">
                      {/* CHARACTER VIEW BUTTONS TO ADD TO THE GENERATION REQUEST */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-gray-300">
                            {t('lastFrameBoyFront')} / {t('lastFrameBoyBack')}:
                          </label>
                          <span className="text-[10px] text-purple-600 dark:text-purple-300 font-medium">
                            {(scene.video.lastFrameCharacterView || 'front') === 'front'
                              ? t('lastFrameBoyFront')
                              : scene.video.lastFrameCharacterView === 'back'
                              ? t('lastFrameBoyBack')
                              : t('lastFrameBoyNone')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateVideo({ lastFrameCharacterView: 'front' })}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                              (scene.video.lastFrameCharacterView || 'front') === 'front'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-sm ring-1 ring-blue-400'
                                : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span>{t('lastFrameBoyFront')}</span>
                            <span className="text-[10px] opacity-80">{hasCharacterFront ? '✓' : '(не загружен)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateVideo({ lastFrameCharacterView: 'back' })}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                              scene.video.lastFrameCharacterView === 'back'
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-400'
                                : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span>{t('lastFrameBoyBack')}</span>
                            <span className="text-[10px] opacity-80">{hasCharacterBack ? '✓' : '(не загружен)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateVideo({ lastFrameCharacterView: 'none' })}
                            className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                              scene.video.lastFrameCharacterView === 'none'
                                ? 'bg-slate-700 dark:bg-gray-700 border-slate-600 dark:border-gray-500 text-white shadow-sm'
                                : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                            }`}
                            title="Не добавлять фото мальчика в запрос нейросети"
                          >
                            {t('lastFrameBoyNone')}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                          {t('lastFrameCharViewDesc')}
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-700 dark:text-gray-300 mb-1">
                          {t('lastFrameInstructionLabel')}:
                        </label>
                        <textarea
                          rows={2}
                          value={scene.video.lastFrameInstruction || ''}
                          onChange={(e) => updateVideo({ lastFrameInstruction: e.target.value })}
                          placeholder={t('lastFrameInstructionPlaceholder')}
                          className="w-full bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 outline-none resize-none transition-colors"
                        />
                      </div>

                      {/* MULTIPLE REFERENCE PHOTOS UPLOAD */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-medium text-slate-700 dark:text-gray-300">
                            {t('lastFrameRefsTitle')}:
                          </label>
                          <span className="text-[10px] text-slate-400 dark:text-gray-500">
                            {(scene.video.lastFrameReferences || []).length}/5 фото
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {(scene.video.lastFrameReferences || []).map((img, rIdx) => (
                            <div
                              key={rIdx}
                              className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-[#1f293d] bg-black shadow"
                            >
                              <img
                                src={img}
                                alt={`Ref ${rIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = (scene.video.lastFrameReferences || []).filter(
                                    (_, i) => i !== rIdx
                                  );
                                  updateVideo({ lastFrameReferences: next });
                                }}
                                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                                title={t('deletePhoto')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          {(scene.video.lastFrameReferences || []).length < 5 && (
                            <div
                              onClick={() => multiLastFrameInputRef.current?.click()}
                              className="w-12 h-12 rounded-lg border border-dashed border-slate-300 dark:border-gray-600 hover:border-purple-500 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 cursor-pointer transition-colors bg-white dark:bg-transparent"
                              title={t('lastFrameRefsTitle')}
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-[8px] font-medium">+ Фото</span>
                            </div>
                          )}
                        </div>

                        <input
                          ref={multiLastFrameInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleMultiLastFrameUpload}
                          className="hidden"
                        />
                        <p className="text-[10px] text-purple-700 dark:text-purple-300/80 mt-1.5">
                          {t('lastFrameRefsDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {scene.video.lastFrameMode === 'custom_upload' && (
                    <div className="flex items-center gap-3">
                      {scene.video.lastFrameImage ? (
                        <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-[#1f293d] bg-black">
                          <img
                            src={scene.video.lastFrameImage}
                            alt="Last Frame"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => updateVideo({ lastFrameImage: null })}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => lastFrameInputRef.current?.click()}
                          className="w-16 h-16 rounded-lg border border-dashed border-slate-300 dark:border-gray-600 hover:border-purple-500 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 cursor-pointer transition-colors bg-white dark:bg-transparent"
                        >
                          <Upload className="w-4 h-4 mb-0.5" />
                          <span className="text-[9px]">{t('lastFrameUploadTitle')}</span>
                        </div>
                      )}
                      <input
                        ref={lastFrameInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLastFrameUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Text Description of Scene Video */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                  {t('videoPromptLabel')}:
                </label>
                <textarea
                  rows={3}
                  value={scene.video.videoPrompt}
                  onChange={(e) => updateVideo({ videoPrompt: e.target.value })}
                  placeholder={t('videoPromptPlaceholder')}
                  className="w-full bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] focus:border-blue-500 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 outline-none resize-none leading-relaxed transition-colors"
                />
              </div>

              {/* TRANSITIONS: FADE IN FROM BLACK & FADE OUT TO BLACK */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-[#141d2e]/70 border border-slate-200 dark:border-[#1f293d] space-y-3 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-gray-200">
                      {t('transitionsTitle')}:
                    </span>
                  </div>
                  {(scene.video.transition?.fadeIn || scene.video.transition?.fadeOut) && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {t('transitionsActive')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* FADE IN FROM BLACK */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      scene.video.transition?.fadeIn
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-500/40 text-blue-900 dark:text-blue-200'
                        : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none mb-1.5">
                      <input
                        type="checkbox"
                        checked={Boolean(scene.video.transition?.fadeIn)}
                        onChange={(e) =>
                          updateVideo({
                            transition: {
                              fadeIn: e.target.checked,
                              fadeInDuration: scene.video.transition?.fadeInDuration ?? 1.0,
                              fadeOut: Boolean(scene.video.transition?.fadeOut),
                              fadeOutDuration: scene.video.transition?.fadeOutDuration ?? 1.0,
                            },
                          })
                        }
                        className="rounded bg-slate-100 dark:bg-[#141d2e] border-slate-300 dark:border-gray-600 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-gray-200">
                        {t('fadeInLabel')}
                      </span>
                    </label>

                    {scene.video.transition?.fadeIn ? (
                      <div className="space-y-1.5 pl-5.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 dark:text-gray-400">{t('durationLabel')}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-300">
                            {scene.video.transition.fadeInDuration ?? 1.0} сек.
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.3}
                          max={3.0}
                          step={0.1}
                          value={scene.video.transition.fadeInDuration ?? 1.0}
                          onChange={(e) =>
                            updateVideo({
                              transition: {
                                ...scene.video.transition!,
                                fadeIn: true,
                                fadeInDuration: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full h-1 bg-slate-300 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 pl-5.5">
                        {t('fadeInDesc')}
                      </p>
                    )}
                  </div>

                  {/* FADE OUT TO BLACK */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      scene.video.transition?.fadeOut
                        ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-500/40 text-purple-900 dark:text-purple-200'
                        : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-[#1f293d] text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none mb-1.5">
                      <input
                        type="checkbox"
                        checked={Boolean(scene.video.transition?.fadeOut)}
                        onChange={(e) =>
                          updateVideo({
                            transition: {
                              fadeIn: Boolean(scene.video.transition?.fadeIn),
                              fadeInDuration: scene.video.transition?.fadeInDuration ?? 1.0,
                              fadeOut: e.target.checked,
                              fadeOutDuration: scene.video.transition?.fadeOutDuration ?? 1.0,
                            },
                          })
                        }
                        className="rounded bg-slate-100 dark:bg-[#141d2e] border-slate-300 dark:border-gray-600 text-purple-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-gray-200">
                        {t('fadeOutLabel')}
                      </span>
                    </label>

                    {scene.video.transition?.fadeOut ? (
                      <div className="space-y-1.5 pl-5.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 dark:text-gray-400">{t('durationLabel')}</span>
                          <span className="font-bold text-purple-600 dark:text-purple-300">
                            {scene.video.transition.fadeOutDuration ?? 1.0} сек.
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.3}
                          max={3.0}
                          step={0.1}
                          value={scene.video.transition.fadeOutDuration ?? 1.0}
                          onChange={(e) =>
                            updateVideo({
                              transition: {
                                ...scene.video.transition!,
                                fadeOut: true,
                                fadeOutDuration: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full h-1 bg-slate-300 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 pl-5.5">
                        {t('fadeOutDesc')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==================== RIGHT COLUMN: AUDIO (grok-tts) ==================== */}
        <div className="space-y-5 bg-slate-50/70 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] rounded-xl p-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-gray-200">
                {t('audioColTitle')}
              </h3>
            </div>

            {/* Enable/Disable grok-tts audio */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-slate-600 dark:text-gray-400">
                {t('useTtsToggle')}:
              </span>
              <input
                type="checkbox"
                checked={scene.audio.useTts}
                onChange={(e) => updateAudio({ useTts: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
            </label>
          </div>

          {!scene.audio.useTts ? (
            <div className="p-8 text-center text-slate-400 dark:text-gray-500 border border-dashed border-slate-300 dark:border-[#1f293d] rounded-xl">
              <VolumeX className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">{t('ttsDisabledNotice')}</p>
              <p className="text-[11px] text-slate-400 dark:text-gray-600 mt-1">
                {t('ttsDisabledSub')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simultaneous audio notice */}
              {scene.video.generateAudio !== false && (
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <Volume2 className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900 dark:text-blue-200">
                      {t('parallelAudioNoticeTitle')}
                    </span>
                    <p className="text-slate-600 dark:text-gray-300 text-[10px] mt-0.5 leading-relaxed">
                      {t('parallelAudioNoticeDesc')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">
                  {t('replicasHeader', { count: tracks.length })}
                </span>
                <button
                  type="button"
                  onClick={handleAddTrack}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addReplicaButton')}</span>
                </button>
              </div>

              {/* LIST OF AUDIO TRACKS */}
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {tracks.map((track, tIdx) => (
                  <div
                    key={track.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#141d2e] border border-slate-200 dark:border-[#1f293d] space-y-3 relative group shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {t('replicaTitle', { number: tIdx + 1 })}
                      </span>
                      {tracks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTrack(track.id)}
                          className="text-slate-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 transition-colors"
                          title={t('deleteReplica')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Phrase textarea */}
                    <textarea
                      rows={2}
                      value={track.phrase}
                      onChange={(e) => handleUpdateTrack(track.id, { phrase: e.target.value })}
                      placeholder={t('replicaTextPlaceholder')}
                      className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] focus:border-emerald-500 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 outline-none resize-none leading-relaxed transition-colors"
                    />

                    {/* Voice and Offset grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-gray-400 mb-1">
                          {t('voiceLabel')}
                        </label>
                        <select
                          value={track.voiceId}
                          onChange={(e) => handleUpdateTrack(track.id, { voiceId: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white outline-none cursor-pointer transition-colors"
                        >
                          {XAI_VOICES.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.gender})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-gray-400 mb-1">
                          {t('offsetLabel')}:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                          <input
                            type="number"
                            min={0}
                            max={scene.video.duration}
                            step={0.5}
                            value={track.audioOffset}
                            onChange={(e) =>
                              handleUpdateTrack(track.id, { audioOffset: Math.max(0, Number(e.target.value)) })
                            }
                            className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Speed slider and normalize checkbox */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="text-slate-500 dark:text-gray-400">{t('speedLabel')}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{track.speed.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min={0.7}
                          max={1.5}
                          step={0.1}
                          value={track.speed}
                          onChange={(e) => handleUpdateTrack(track.id, { speed: Number(e.target.value) })}
                          className="w-full h-1 bg-slate-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <div className="flex items-center pt-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={track.normalizeText}
                            onChange={(e) => handleUpdateTrack(track.id, { normalizeText: e.target.checked })}
                            className="rounded bg-slate-100 dark:bg-[#0b0f19] border-slate-300 dark:border-gray-600 text-emerald-600 focus:ring-0 w-3.5 h-3.5"
                          />
                          <span className="text-[10px] text-slate-600 dark:text-gray-300">
                            {t('normalizeTextLabel')}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated Artifacts Preview on Card (if available) */}
      {(scene.generatedStartImageUrl ||
        scene.extractedLastFrameUrl ||
        scene.rawVideoUrl ||
        (scene.audio.tracks && scene.audio.tracks.some((t) => t.ttsAudioUrl))) && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-[#1f293d] flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-500 dark:text-gray-400 font-medium">Готовые ассеты сцены:</span>

          {scene.generatedStartImageUrl && (
            <a
              href={scene.generatedStartImageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/20"
            >
              <span>🖼️ Стартовый кадр</span>
            </a>
          )}

          {scene.extractedLastFrameUrl && (
            <a
              href={scene.extractedLastFrameUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20"
            >
              <span>🏁 Финальный кадр</span>
            </a>
          )}

          {scene.rawVideoUrl && (
            <a
              href={scene.rawVideoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20"
            >
              <span>🎬 Видеоролик</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
