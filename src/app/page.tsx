'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Clapperboard, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { CharacterSection } from '@/components/CharacterSection';
import { BackgroundMusicSection } from '@/components/BackgroundMusicSection';
import { SceneCard } from '@/components/SceneCard';
import { ConsolePanel } from '@/components/ConsolePanel';
import {
  MainCharacter,
  SceneState,
  LogEntry,
  ProjectData,
  BackgroundMusicConfig,
  calculateEstimatedCost,
} from '@/types/cartoon';
import { runCartoonBuildPipeline } from '@/lib/orchestrator';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';

const INITIAL_CHARACTER: MainCharacter = {
  frontImage: null,
  backImage: null,
  name: 'Главный герой',
};

const INITIAL_BACKGROUND_MUSIC: BackgroundMusicConfig = {
  enabled: false,
  audioUrl: null,
  fileName: '',
  volume: 0.25,
  loop: true,
};

const INITIAL_SCENES: SceneState[] = [
  {
    id: 'scene-1',
    order: 0,
    title: 'Сцена 1: Знакомство на поляне',
    video: {
      model: 'grok-imagine-video-1.5-lite',
      generateVideo: true,
      duration: 5,
      resolution: '480p',
      videoPrompt:
        '3D cartoon animation style. The character stands in a vibrant enchanted forest, looking at the camera and warmly waving with a smile. Gentle sunlight filters through tall trees.',
      generateAudio: true,
      startImageMode: 'custom_generate',
      characterView: 'front',
      imageInstruction:
        '3D cartoon render of character standing on a sunny forest clearing, cheerful expression, looking forward at the camera.',
      templateImage: null,
      transition: {
        fadeIn: true,
        fadeInDuration: 1.0,
        fadeOut: false,
        fadeOutDuration: 1.0,
      },
    },
    audio: {
      useTts: true,
      tracks: [
        {
          id: 'track-1-1',
          phrase: 'Привет! Добро пожаловать в наше сказочное приключение!',
          voiceId: 'eve',
          speed: 1.0,
          normalizeText: true,
          audioOffset: 0.5,
        },
        {
          id: 'track-1-2',
          phrase: 'Сегодня мы отправимся на поиски древней тайны!',
          voiceId: 'leo',
          speed: 1.0,
          normalizeText: true,
          audioOffset: 3.2,
        },
      ],
    },
    status: 'idle',
  },
  {
    id: 'scene-2',
    order: 1,
    title: 'Сцена 2: Волшебная находка',
    video: {
      model: 'grok-imagine-video-1.5',
      generateVideo: true,
      duration: 5,
      resolution: '480p',
      videoPrompt:
        '3D cartoon animation style. The character approaches a glowing crystal on an ancient stone altar, reaches out and gasps with joyful excitement.',
      generateAudio: true,
      startImageMode: 'prev_scene_last_frame', // seamless transition from Scene 1
      characterView: 'front',
      templateImage: null,
      lastFrameMode: 'none',
      transition: {
        fadeIn: false,
        fadeInDuration: 1.0,
        fadeOut: true,
        fadeOutDuration: 1.0,
      },
    },
    audio: {
      useTts: true,
      tracks: [
        {
          id: 'track-2-1',
          phrase: 'Ого, посмотри, это же настоящий древний кристалл!',
          voiceId: 'eve',
          speed: 1.0,
          normalizeText: true,
          audioOffset: 1.0,
        },
      ],
    },
    status: 'idle',
  },
];

export default function CartoonStudioPage() {
  const { t } = useThemeLanguage();
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [character, setCharacter] = useState<MainCharacter>(INITIAL_CHARACTER);
  const [backgroundMusic, setBackgroundMusic] = useState<BackgroundMusicConfig>(INITIAL_BACKGROUND_MUSIC);
  const [scenes, setScenes] = useState<SceneState[]>(INITIAL_SCENES);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Load API Key and cached project from localStorage on mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('xai_api_key');
      if (savedKey) setApiKey(savedKey);

      const savedProject = localStorage.getItem('grok_cartoon_saved_project');
      if (savedProject) {
        const parsed: ProjectData = JSON.parse(savedProject);
        if (parsed.character) setCharacter(parsed.character);
        if (parsed.backgroundMusic) setBackgroundMusic(parsed.backgroundMusic);
        if (parsed.scenes && Array.isArray(parsed.scenes)) {
          setScenes(
            parsed.scenes.map((s, idx) => ({
              ...s,
              order: idx,
              status: 'idle',
              error: null,
              audio: {
                ...s.audio,
                tracks:
                  Array.isArray(s.audio.tracks) && s.audio.tracks.length > 0
                    ? s.audio.tracks
                    : [
                        {
                          id: `track-${Date.now()}-${idx}`,
                          phrase: s.audio.phrase || '',
                          voiceId: s.audio.voiceId || 'eve',
                          speed: s.audio.speed || 1.0,
                          normalizeText: s.audio.normalizeText ?? true,
                          audioOffset: s.audio.audioOffset || 0,
                        },
                      ],
              },
            }))
          );
        }
      }
    } catch (e) {
      console.warn('Failed to restore project from localStorage:', e);
    }
  }, []);

  // Save changes to localStorage
  const persistProject = (
    newChar: MainCharacter,
    newScenes: SceneState[],
    newMusic: BackgroundMusicConfig = backgroundMusic
  ) => {
    try {
      const data: ProjectData = {
        version: '2.0',
        title: 'Grok Cartoon Project',
        character: newChar,
        backgroundMusic: newMusic,
        scenes: newScenes,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('grok_cartoon_saved_project', JSON.stringify(data));
    } catch {}
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      localStorage.setItem('xai_api_key', key);
    } catch {}
  };

  const handleUpdateCharacter = (updated: MainCharacter) => {
    setCharacter(updated);
    persistProject(updated, scenes, backgroundMusic);
  };

  const handleUpdateBackgroundMusic = (updated: BackgroundMusicConfig) => {
    setBackgroundMusic(updated);
    persistProject(character, scenes, updated);
  };

  const handleUpdateScene = (id: string, updates: Partial<SceneState>) => {
    setScenes((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      persistProject(character, next);
      return next;
    });
  };

  const handleAddScene = () => {
    const newScene: SceneState = {
      id: `scene-${Date.now()}`,
      order: scenes.length,
      title: `Сцена ${scenes.length + 1}`,
      video: {
        model: scenes.length > 0 ? 'grok-imagine-video-1.5' : 'grok-imagine-video-1.5-lite',
        generateVideo: true,
        duration: 5,
        resolution: '480p',
        videoPrompt: '',
        generateAudio: true,
        startImageMode: scenes.length > 0 ? 'prev_scene_last_frame' : 'character_ref',
        characterView: 'front',
        templateImage: null,
        transition: {
          fadeIn: false,
          fadeInDuration: 1.0,
          fadeOut: false,
          fadeOutDuration: 1.0,
        },
      },
      audio: {
        useTts: true,
        tracks: [
          {
            id: `track-${Date.now()}-1`,
            phrase: '',
            voiceId: 'eve',
            speed: 1.0,
            normalizeText: true,
            audioOffset: 0.0,
          },
        ],
      },
      status: 'idle',
    };

    const next = [...scenes, newScene];
    setScenes(next);
    persistProject(character, next);
  };

  const handleDeleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    const next = scenes
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, order: idx }));
    setScenes(next);
    persistProject(character, next);
  };

  const handleDuplicateScene = (id: string) => {
    const sceneToDup = scenes.find((s) => s.id === id);
    if (!sceneToDup) return;

    const dupIndex = scenes.findIndex((s) => s.id === id);
    const newScene: SceneState = {
      ...sceneToDup,
      id: `scene-${Date.now()}`,
      title: `${sceneToDup.title} (Копия)`,
      status: 'idle',
      statusText: undefined,
      error: null,
      generatedStartImageUrl: null,
      extractedLastFrameUrl: null,
      generatedLastFrameUrl: null,
      rawVideoUrl: null,
      finalSceneVideoUrl: null,
      audio: {
        ...sceneToDup.audio,
        tracks: (sceneToDup.audio.tracks || []).map((t) => ({
          ...t,
          id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ttsAudioUrl: null,
        })),
      },
    };

    const next = [...scenes];
    next.splice(dupIndex + 1, 0, newScene);
    const reordered = next.map((s, idx) => ({ ...s, order: idx }));
    setScenes(reordered);
    persistProject(character, reordered);
  };

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;

    const next = [...scenes];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    const reordered = next.map((s, idx) => ({ ...s, order: idx }));
    setScenes(reordered);
    persistProject(character, reordered);
  };

  // Export full scenario to JSON (structured for bots or reuse)
  const handleExportProject = () => {
    const cost = calculateEstimatedCost(scenes, character);
    const exportData = {
      format: 'grok_cartoon_scenario_v2',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      title: 'Grok Cartoon Scenario',
      estimatedCost: cost,
      character: {
        name: character.name,
        frontImage: character.frontImage,
        backImage: character.backImage,
      },
      backgroundMusic: {
        enabled: backgroundMusic.enabled,
        audioUrl: backgroundMusic.audioUrl,
        fileName: backgroundMusic.fileName,
        volume: backgroundMusic.volume,
        loop: backgroundMusic.loop,
      },
      scenes: scenes.map((s, idx) => ({
        sceneNumber: idx + 1,
        id: s.id,
        title: s.title,
        enabled: s.enabled !== false,
        video: {
          model: s.video.model || 'grok-imagine-video-1.5-lite',
          duration: s.video.duration,
          resolution: '480p',
          generateAudio: s.video.generateAudio,
          generateVideo: s.video.generateVideo,
          prompt: s.video.videoPrompt,
          startImageMode: s.video.startImageMode,
          templateSource: s.video.templateSource || (s.video.templateImage ? 'upload' : 'none'),
          usePrevSceneLastFrame: Boolean(
            s.video.usePrevSceneLastFrame || s.video.templateSource === 'prev_scene_last_frame'
          ),
          characterView: s.video.characterView,
          imageInstruction: s.video.imageInstruction || '',
          templateImage: s.video.templateImage || null,
          startImageReferences: s.video.startImageReferences || [],
          lastFrameMode: s.video.lastFrameMode || 'none',
          lastFrameCharacterView: s.video.lastFrameCharacterView || 'front',
          lastFrameInstruction: s.video.lastFrameInstruction || '',
          lastFrameImage: s.video.lastFrameImage || null,
          lastFrameReferences: s.video.lastFrameReferences || [],
          transition: s.video.transition || {
            fadeIn: false,
            fadeInDuration: 1.0,
            fadeOut: false,
            fadeOutDuration: 1.0,
          },
        },
        audio: {
          useTts: s.audio.useTts,
          tracks: (s.audio.tracks || []).map((t) => ({
            id: t.id,
            voiceId: t.voiceId,
            phrase: t.phrase,
            speed: t.speed,
            audioOffset: t.audioOffset,
            normalizeText: t.normalizeText,
          })),
        },
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cartoon_scenario_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import project/scenario from JSON
  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);

        if (parsed.character) {
          setCharacter({
            name: parsed.character.name || 'Главный герой',
            frontImage: parsed.character.frontImage || null,
            backImage: parsed.character.backImage || null,
          });
        }

        let importedMusic = backgroundMusic;
        if (parsed.backgroundMusic) {
          importedMusic = {
            enabled: Boolean(parsed.backgroundMusic.enabled),
            audioUrl: parsed.backgroundMusic.audioUrl || null,
            fileName: parsed.backgroundMusic.fileName || '',
            volume: typeof parsed.backgroundMusic.volume === 'number' ? parsed.backgroundMusic.volume : 0.25,
            loop: parsed.backgroundMusic.loop !== false,
          };
          setBackgroundMusic(importedMusic);
        }

        if (Array.isArray(parsed.scenes)) {
          const loadedScenes: SceneState[] = parsed.scenes.map((s: any, idx: number) => {
            const rawAudio = s.audio || {};
            const rawVideo = s.video || {};

            // Normalize audio tracks (backward compatible with v1 single phrase)
            let tracks: any[] = [];
            if (Array.isArray(rawAudio.tracks) && rawAudio.tracks.length > 0) {
              tracks = rawAudio.tracks;
            } else if (rawAudio.phrase || s.audio?.phrase) {
              tracks = [
                {
                  id: `track-${Date.now()}-${idx}`,
                  phrase: rawAudio.phrase || s.audio?.phrase || '',
                  voiceId: rawAudio.voiceId || s.audio?.voiceId || 'eve',
                  speed: rawAudio.speed || s.audio?.speed || 1.0,
                  normalizeText: rawAudio.normalizeText ?? true,
                  audioOffset: rawAudio.audioOffset || s.audio?.audioOffset || 0,
                },
              ];
            } else {
              tracks = [
                {
                  id: `track-${Date.now()}-${idx}`,
                  phrase: '',
                  voiceId: 'eve',
                  speed: 1.0,
                  normalizeText: true,
                  audioOffset: 0.0,
                },
              ];
            }

            return {
              id: s.id || `scene-${Date.now()}-${idx}`,
              order: idx,
              title: s.title || `Сцена ${idx + 1}`,
              enabled: s.enabled !== false,
              video: {
                model: rawVideo.model || 'grok-imagine-video-1.5-lite',
                generateVideo: rawVideo.generateVideo !== false,
                duration: rawVideo.duration || 5,
                resolution: '480p',
                videoPrompt: rawVideo.prompt || rawVideo.videoPrompt || '',
                generateAudio: rawVideo.generateAudio !== false,
                startImageMode: rawVideo.startImageMode || 'character_ref',
                templateSource: rawVideo.templateSource || (rawVideo.templateImage ? 'upload' : 'none'),
                usePrevSceneLastFrame: Boolean(
                  rawVideo.usePrevSceneLastFrame || rawVideo.templateSource === 'prev_scene_last_frame'
                ),
                characterView: rawVideo.characterView || 'front',
                imageInstruction: rawVideo.imageInstruction || '',
                templateImage: rawVideo.templateImage || null,
                startImageReferences: Array.isArray(rawVideo.startImageReferences)
                  ? rawVideo.startImageReferences
                  : rawVideo.templateImage
                  ? [rawVideo.templateImage]
                  : [],
                lastFrameMode: rawVideo.lastFrameMode || 'none',
                lastFrameCharacterView: rawVideo.lastFrameCharacterView || 'front',
                lastFrameInstruction: rawVideo.lastFrameInstruction || '',
                lastFrameImage: rawVideo.lastFrameImage || null,
                lastFrameReferences: Array.isArray(rawVideo.lastFrameReferences)
                  ? rawVideo.lastFrameReferences
                  : [],
                transition: rawVideo.transition || {
                  fadeIn: false,
                  fadeInDuration: 1.0,
                  fadeOut: false,
                  fadeOutDuration: 1.0,
                },
              },
              audio: {
                useTts: rawAudio.useTts !== false,
                tracks,
              },
              status: 'idle',
              error: null,
            };
          });

          setScenes(loadedScenes);
          persistProject(parsed.character || character, loadedScenes, importedMusic);
          alert(t('importSuccessAlert', { count: loadedScenes.length }));
        } else {
          alert(t('noScenesInJsonAlert'));
        }
      } catch (err) {
        alert(t('importErrorAlert'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset project
  const handleResetProject = () => {
    if (confirm(t('resetProjectConfirm'))) {
      setCharacter(INITIAL_CHARACTER);
      setBackgroundMusic(INITIAL_BACKGROUND_MUSIC);
      setScenes(INITIAL_SCENES);
      setLogs([]);
      setFinalVideoUrl(null);
      persistProject(INITIAL_CHARACTER, INITIAL_SCENES, INITIAL_BACKGROUND_MUSIC);
    }
  };

  // Add Log Entry
  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: LogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeStr,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Start Generation
  const handleStartGeneration = async () => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    const activeScenes = scenes.filter((s) => s.enabled !== false);
    if (activeScenes.length === 0) {
      alert(t('noEnabledScenesAlert'));
      return;
    }

    setIsGenerating(true);
    setFinalVideoUrl(null);

    // Reset scene statuses only for active scenes
    setScenes((prev) =>
      prev.map((s) =>
        s.enabled !== false
          ? {
              ...s,
              status: 'queued',
              statusText: 'В очереди...',
              error: null,
            }
          : s
      )
    );

    try {
      const finalBlob = await runCartoonBuildPipeline(
        scenes,
        character,
        apiKey,
        {
          onLog: addLog,
          onSceneUpdate: (sceneId, updates) => {
            handleUpdateScene(sceneId, updates);
          },
          onProgress: () => {},
        },
        backgroundMusic
      );

      const url = URL.createObjectURL(finalBlob);
      setFinalVideoUrl(url);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      addLog({
        stage: 'ERROR',
        stageLabel: 'Ошибка пайплайна',
        message: msg,
        level: 'error',
      });
      alert(`Ошибка генерации: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const estimatedCost = calculateEstimatedCost(scenes, character);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-[#f3f4f6] pb-24 transition-colors duration-200">
      {/* Header */}
      <Header
        apiKey={apiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        onResetProject={handleResetProject}
        onStartGeneration={handleStartGeneration}
        isGenerating={isGenerating}
        canGenerate={Boolean(apiKey && scenes.some((s) => s.enabled !== false))}
        scenesCount={estimatedCost.enabledScenesCount}
        totalScenesCount={scenes.length}
        estimatedCost={estimatedCost}
      />

      {/* Main Studio Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        {/* Character Section */}
        <CharacterSection
          character={character}
          onChange={handleUpdateCharacter}
        />

        {/* Background Music Section */}
        <BackgroundMusicSection
          music={backgroundMusic}
          onChange={handleUpdateBackgroundMusic}
        />

        {/* Scene Constructor Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('sceneConstructorTitle')} ({estimatedCost.enabledScenesCount}{' '}
                  {t('scenesOfTotal', { total: scenes.length })})
                </h2>
                <span className="text-xs bg-slate-200 text-blue-700 dark:bg-[#1f293d] dark:text-blue-300 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-medium">
                  {t('timingLabel')}: {estimatedCost.totalDurationSeconds} сек
                </span>
                <span
                  className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium cursor-help"
                  title={`Видео: $${estimatedCost.videoCost} | Кадры: $${estimatedCost.imageCost} (входные референсы: $${estimatedCost.inputImagesCost}) | Озвучка: $${estimatedCost.ttsCost}`}
                >
                  ~${estimatedCost.totalUsd} (~{estimatedCost.totalRub} ₽)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {t('sceneConstructorSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={handleAddScene}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addSceneButton')}</span>
          </button>
        </div>

        {/* Scenes List */}
        <div className="space-y-6">
          {scenes.map((scene, idx) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              index={idx}
              totalScenes={scenes.length}
              onUpdate={(updates) => handleUpdateScene(scene.id, updates)}
              onDelete={() => handleDeleteScene(scene.id)}
              onDuplicate={() => handleDuplicateScene(scene.id)}
              onMoveUp={() => handleMoveScene(idx, 'up')}
              onMoveDown={() => handleMoveScene(idx, 'down')}
              hasCharacterFront={Boolean(character.frontImage)}
              hasCharacterBack={Boolean(character.backImage)}
            />
          ))}
        </div>

        {/* Add Scene Bottom Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleAddScene}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-gray-700 hover:border-blue-500 text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors bg-white/50 dark:bg-transparent"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addSceneButton')}</span>
          </button>
        </div>

        {/* Execution Console & Live Feed */}
        <ConsolePanel
          logs={logs}
          scenes={scenes}
          finalVideoUrl={finalVideoUrl}
          isGenerating={isGenerating}
          onClearLogs={() => setLogs([])}
        />
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
