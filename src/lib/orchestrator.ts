import { SceneState, LogEntry, MainCharacter, SceneAudioTrack, BackgroundMusicConfig } from '@/types/cartoon';

// Support subpath deployment (e.g. /projects/grok-cartoon-builder)
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH !== undefined
  ? process.env.NEXT_PUBLIC_BASE_PATH
  : '/projects/grok-cartoon-builder';

export function getApiPath(endpoint: string): string {
  const cleanBase = (BASE_PATH || '').replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

export interface GenerationCallbacks {
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onSceneUpdate: (sceneId: string, updates: Partial<SceneState>) => void;
  onProgress: (stage: string, percent: number) => void;
}

export async function pollVideoTask(
  apiKey: string,
  requestId: string,
  onStatusUpdate: (status: string) => void,
  maxWaitMs = 15 * 60 * 1000,
  intervalMs = 4500
): Promise<string> {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    const res = await fetch(getApiPath(`/api/video/status?requestId=${encodeURIComponent(requestId)}`), {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Сетевой сбой при опросе статуса' }));
      throw new Error(err.error || `Ошибка опроса статуса: HTTP ${res.status}`);
    }

    const data = await res.json();
    onStatusUpdate(data.status);

    if (data.status === 'done') {
      if (!data.videoUrl) throw new Error('xAI вернул статус done, но отсутствует ссылка на видео');
      return data.videoUrl;
    }

    if (data.status === 'failed' || data.status === 'expired') {
      throw new Error(`Генерация видео завершилась ошибкой: ${data.status}`);
    }
  }

  throw new Error('Превышено время ожидания готовности видео (timeout 15 мин)');
}

export interface PreparedSceneResult {
  videoUrl: string;
  audioTracks: { audioUrl: string; audioOffset: number }[];
}

export async function generateScenePipeline(
  scene: SceneState,
  character: MainCharacter,
  apiKey: string,
  callbacks: GenerationCallbacks,
  getPrevSceneVideo?: () => Promise<string>,
  onVideoReady?: (videoUrl: string) => void
): Promise<PreparedSceneResult> {
  callbacks.onSceneUpdate(scene.id, { status: 'queued', statusText: 'В очереди...' });

  // 1. Concurrent Audio Generation (grok-tts) for all dialogue tracks in this scene
  let ttsPromise: Promise<{ audioUrl: string; audioOffset: number }[]> = Promise.resolve([]);

  if (scene.audio.useTts) {
    const rawTracks: SceneAudioTrack[] =
      Array.isArray(scene.audio.tracks) && scene.audio.tracks.length > 0
        ? scene.audio.tracks
        : scene.audio.phrase?.trim()
        ? [
            {
              id: 'track-default',
              phrase: scene.audio.phrase,
              voiceId: scene.audio.voiceId || 'eve',
              speed: scene.audio.speed || 1.0,
              normalizeText: scene.audio.normalizeText ?? true,
              audioOffset: scene.audio.audioOffset || 0,
            },
          ]
        : [];

    const activeTracks = rawTracks.filter((t) => t.phrase && t.phrase.trim());

    if (activeTracks.length > 0) {
      ttsPromise = Promise.all(
        activeTracks.map(async (track, tIdx) => {
          callbacks.onSceneUpdate(scene.id, {
            statusText: `Синтез аудио (реплика #${tIdx + 1})...`,
          });
          callbacks.onLog({
            sceneIndex: scene.order,
            sceneTitle: scene.title,
            stage: 'TTS_AUDIO',
            stageLabel: `Сцена ${scene.order + 1} • Реплика #${tIdx + 1}`,
            message: `Озвучка [${track.voiceId}, ${track.speed}x, старт: ${track.audioOffset}с]: «${track.phrase.slice(0, 45)}${track.phrase.length > 45 ? '...' : ''}»`,
            level: 'info',
          });

          const res = await fetch(getApiPath('/api/tts'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
            body: JSON.stringify({
              text: track.phrase,
              voiceId: track.voiceId,
              speed: track.speed,
              normalizeText: track.normalizeText,
            }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || `Ошибка генерации речи для реплики #${tIdx + 1}`);
          }

          callbacks.onLog({
            sceneIndex: scene.order,
            sceneTitle: scene.title,
            stage: 'TTS_AUDIO',
            stageLabel: `Сцена ${scene.order + 1} • Реплика #${tIdx + 1} готова`,
            message: `Синтезирована дорожка (${(data.bytes / 1024).toFixed(1)} КБ, старт: ${track.audioOffset}с)`,
            level: 'success',
            mediaUrl: data.audioUrl,
            mediaType: 'audio',
          });

          return {
            audioUrl: data.audioUrl as string,
            audioOffset: track.audioOffset,
          };
        })
      );
    }
  }

  // 2. Video Pipeline (Start Frame -> Last Frame -> Video Generation)
  const videoPromise: Promise<string> = (async () => {
    if (!scene.video.generateVideo) {
      if (!scene.video.readyVideoUrl) {
        throw new Error(`В сцене #${scene.order + 1} выключена генерация видео, но не выбрано готовое видео`);
      }
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'VIDEO',
        stageLabel: `Сцена ${scene.order + 1} • Готовое видео`,
        message: 'Используется предварительно загруженное видео',
        level: 'info',
        mediaUrl: scene.video.readyVideoUrl || undefined,
        mediaType: 'video',
      });
      callbacks.onSceneUpdate(scene.id, { rawVideoUrl: scene.video.readyVideoUrl });
      onVideoReady?.(scene.video.readyVideoUrl);
      return scene.video.readyVideoUrl;
    }

    // Determine start image
    let startImageUrl: string | null = null;

    if (scene.video.startImageMode === 'prev_scene_last_frame') {
      if (!getPrevSceneVideo) {
        throw new Error(`Сцена #${scene.order + 1} не может использовать предыдущий кадр: это первая сцена`);
      }

      callbacks.onSceneUpdate(scene.id, {
        status: 'waiting_dependency',
        statusText: 'Ожидание видео предыдущей сцены...',
      });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'EXTRACT_FRAME',
        stageLabel: `Сцена ${scene.order + 1} • Ожидание`,
        message: 'Ожидание завершения рендеринга предыдущей сцены для бесшовного перехода...',
        level: 'info',
      });

      const prevVideoUrl = await getPrevSceneVideo();

      callbacks.onSceneUpdate(scene.id, {
        status: 'extracting_frame',
        statusText: 'Извлечение последнего кадра...',
      });

      const extractRes = await fetch(getApiPath('/api/video/extract-frame'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: prevVideoUrl }),
      });

      const extractData = await extractRes.json();
      if (!extractRes.ok || !extractData.success) {
        throw new Error(extractData.error || 'Не удалось извлечь последний кадр предыдущей сцены');
      }

      startImageUrl = extractData.frameUrl;
      callbacks.onSceneUpdate(scene.id, {
        generatedStartImageUrl: startImageUrl,
        extractedLastFrameUrl: startImageUrl,
      });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'EXTRACT_FRAME',
        stageLabel: `Сцена ${scene.order + 1} • Кадр перехода извлечён`,
        message: 'Последний кадр предыдущей сцены успешно извлечён и установлен как начальный',
        level: 'success',
        mediaUrl: startImageUrl || undefined,
        mediaType: 'image',
      });
    } else if (scene.video.startImageMode === 'custom_generate') {
      let extractedPrevFrame: string | null = null;
      const shouldUsePrev =
        Boolean(scene.video.usePrevSceneLastFrame) ||
        scene.video.templateSource === 'prev_scene_last_frame';

      // If user selected previous scene's last frame as template
      if (shouldUsePrev) {
        if (!getPrevSceneVideo) {
          throw new Error(
            `Сцена #${scene.order + 1} не может использовать кадр предыдущей сцены как шаблон: это первая сцена`
          );
        }

        callbacks.onSceneUpdate(scene.id, {
          status: 'waiting_dependency',
          statusText: 'Ожидание видео предыдущей сцены для шаблона...',
        });
        callbacks.onLog({
          sceneIndex: scene.order,
          sceneTitle: scene.title,
          stage: 'EXTRACT_FRAME',
          stageLabel: `Сцена ${scene.order + 1} • Шаблон сцены #${scene.order}`,
          message: 'Ожидание видео предыдущей сцены для извлечения кадра-шаблона...',
          level: 'info',
        });

        const prevVideoUrl = await getPrevSceneVideo();

        callbacks.onSceneUpdate(scene.id, {
          status: 'extracting_frame',
          statusText: 'Извлечение кадра-шаблона...',
        });

        const extractRes = await fetch(getApiPath('/api/video/extract-frame'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: prevVideoUrl }),
        });

        const extractData = await extractRes.json();
        if (!extractRes.ok || !extractData.success) {
          throw new Error(extractData.error || 'Не удалось извлечь последний кадр предыдущей сцены для шаблона');
        }

        extractedPrevFrame = extractData.frameUrl;
        callbacks.onLog({
          sceneIndex: scene.order,
          sceneTitle: scene.title,
          stage: 'EXTRACT_FRAME',
          stageLabel: `Сцена ${scene.order + 1} • Шаблон получен`,
          message: 'Финальный кадр предыдущей сцены успешно извлечён и будет использован как шаблон/окружение для генерации',
          level: 'success',
          mediaUrl: extractedPrevFrame || undefined,
          mediaType: 'image',
        });
      }

      callbacks.onSceneUpdate(scene.id, {
        status: 'generating_image',
        statusText: 'Генерация стартового кадра...',
      });

      // Prepare custom reference images (from startImageReferences + templateImage)
      const customRefs = [
        ...(scene.video.startImageReferences || []),
        ...(scene.video.templateImage ? [scene.video.templateImage] : []),
      ];
      const uniqueCustomRefs = Array.from(new Set(customRefs));

      const refListDesc: string[] = [];
      if (shouldUsePrev) refListDesc.push(`кадр сцены #${scene.order}`);
      if (uniqueCustomRefs.length > 0) refListDesc.push(`${uniqueCustomRefs.length} своих фото`);

      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'START_IMAGE',
        stageLabel: `Сцена ${scene.order + 1} • Стартовый кадр`,
        message: `Создание начального кадра по инструкции: "${scene.video.imageInstruction || scene.video.videoPrompt}"${
          refListDesc.length > 0 ? ` [Образцы: ${refListDesc.join(' + ')}]` : ''
        }`,
        level: 'info',
      });

      let selectedCharImg: string | null = null;
      if (scene.video.characterView === 'back') {
        selectedCharImg = character.backImage || character.frontImage;
      } else if (scene.video.characterView === 'front') {
        selectedCharImg = character.frontImage || character.backImage;
      }

      const res = await fetch(getApiPath('/api/image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          prompt: scene.video.imageInstruction || scene.video.videoPrompt,
          characterImage: selectedCharImg,
          templateImage: extractedPrevFrame,
          referenceImages: uniqueCustomRefs,
          aspectRatio: '9:16',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка создания стартового изображения');
      }

      startImageUrl = data.url;
      callbacks.onSceneUpdate(scene.id, { generatedStartImageUrl: startImageUrl });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'START_IMAGE',
        stageLabel: `Сцена ${scene.order + 1} • Стартовый кадр готов`,
        message: 'Стартовый кадр успешно сгенерирован',
        level: 'success',
        mediaUrl: startImageUrl || undefined,
        mediaType: 'image',
      });
    } else if (scene.video.startImageMode === 'custom_upload') {
      startImageUrl = scene.video.customStartImage || character.frontImage;
      if (!startImageUrl) {
        throw new Error(`В сцене #${scene.order + 1} не выбрано начальное изображение`);
      }
    } else {
      // Use character reference directly
      startImageUrl =
        scene.video.characterView === 'back'
          ? character.backImage || character.frontImage
          : character.frontImage || character.backImage;

      if (!startImageUrl) {
        throw new Error(`В сцене #${scene.order + 1} не задано изображение персонажа для старта`);
      }
    }

    // Determine optional Last Frame (only for grok-imagine-video-1.5)
    let lastFrameUrl: string | undefined = undefined;
    const isModel15 = scene.video.model === 'grok-imagine-video-1.5';

    if (isModel15 && scene.video.lastFrameMode === 'character_ref') {
      const charView = scene.video.lastFrameCharacterView || 'front';
      lastFrameUrl =
        charView === 'back'
          ? character.backImage || character.frontImage || undefined
          : character.frontImage || character.backImage || undefined;

      if (!lastFrameUrl) {
        throw new Error(
          `В сцене #${scene.order + 1} выбран конечный кадр из профиля героя (${
            charView === 'back' ? 'вид сзади' : 'вид спереди'
          }), но изображение не загружено`
        );
      }

      callbacks.onSceneUpdate(scene.id, { generatedLastFrameUrl: lastFrameUrl });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'LAST_FRAME',
        stageLabel: `Сцена ${scene.order + 1} • Конечный кадр`,
        message: `Используется изображение героя (${
          charView === 'back' ? 'вид сзади' : 'вид спереди'
        }) как конечный кадр`,
        level: 'info',
        mediaUrl: lastFrameUrl,
        mediaType: 'image',
      });
    } else if (isModel15 && scene.video.lastFrameMode === 'custom_generate') {
      const promptToUse =
        scene.video.lastFrameInstruction?.trim() ||
        `Ending frame of scene: ${scene.video.videoPrompt}`;

      callbacks.onSceneUpdate(scene.id, {
        status: 'generating_last_frame',
        statusText: 'Генерация конечного кадра...',
      });

      // Determine character reference photo if chosen
      const charView = scene.video.lastFrameCharacterView || 'front';
      let characterImgToSend: string | null = null;
      if (charView === 'front') {
        characterImgToSend = character.frontImage || character.backImage || null;
      } else if (charView === 'back') {
        characterImgToSend = character.backImage || character.frontImage || null;
      }

      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'LAST_FRAME',
        stageLabel: `Сцена ${scene.order + 1} • Конечный кадр`,
        message: `Создание конечного кадра по инструкции: "${promptToUse}"${
          characterImgToSend
            ? ` (добавлено фото в запрос: ${charView === 'back' ? 'мальчик сзади' : 'мальчик спереди'})`
            : ''
        }`,
        level: 'info',
      });

      const res = await fetch(getApiPath('/api/image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          prompt: promptToUse,
          characterImage: characterImgToSend,
          referenceImages: scene.video.lastFrameReferences || [],
          aspectRatio: '9:16',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка генерации конечного кадра');
      }

      lastFrameUrl = data.url;
      callbacks.onSceneUpdate(scene.id, { generatedLastFrameUrl: lastFrameUrl });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'LAST_FRAME',
        stageLabel: `Сцена ${scene.order + 1} • Конечный кадр готов`,
        message: 'Конечный кадр успешно сформирован нейросетью',
        level: 'success',
        mediaUrl: lastFrameUrl || undefined,
        mediaType: 'image',
      });
    } else if (isModel15 && scene.video.lastFrameMode === 'custom_upload' && scene.video.lastFrameImage) {
      lastFrameUrl = scene.video.lastFrameImage;
    }

    // Submit video generation
    const chosenModel = scene.video.model || 'grok-imagine-video-1.5-lite';

    callbacks.onSceneUpdate(scene.id, {
      status: 'generating_video',
      statusText: `Генерация видео (${chosenModel})...`,
    });
    callbacks.onLog({
      sceneIndex: scene.order,
      sceneTitle: scene.title,
      stage: 'VIDEO',
      stageLabel: `Сцена ${scene.order + 1} • Запуск видео`,
      message: `Отправка в ${chosenModel} (${scene.video.duration} сек., 480p${lastFrameUrl ? ', с закреплением конечного кадра' : ''})`,
      level: 'info',
    });

    const videoReqRes = await fetch(getApiPath('/api/video/generate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: chosenModel,
        prompt: scene.video.videoPrompt,
        startImageUrl,
        lastFrameUrl,
        duration: scene.video.duration,
        generateAudio: scene.video.generateAudio,
      }),
    });

    const videoReqData = await videoReqRes.json();
    if (!videoReqRes.ok || !videoReqData.success) {
      throw new Error(videoReqData.error || 'Не удалось отправить задачу генерации видео');
    }

    const requestId = videoReqData.requestId;
    callbacks.onLog({
      sceneIndex: scene.order,
      sceneTitle: scene.title,
      stage: 'VIDEO',
      stageLabel: `Сцена ${scene.order + 1} • Обработка xAI`,
      message: `Задача принята нейросетью [ID: ${requestId}]. Ожидание завершения...`,
      level: 'info',
    });

    // Poll until video is done
    const finalVideoUrl = await pollVideoTask(apiKey, requestId, (status) => {
      callbacks.onSceneUpdate(scene.id, {
        statusText: `Рендеринг видео (${status})...`,
      });
    });

    callbacks.onSceneUpdate(scene.id, { rawVideoUrl: finalVideoUrl });
    callbacks.onLog({
      sceneIndex: scene.order,
      sceneTitle: scene.title,
      stage: 'VIDEO',
      stageLabel: `Сцена ${scene.order + 1} • Видео готово`,
      message: `Видеоклип успешно сгенерирован моделью ${chosenModel}`,
      level: 'success',
      mediaUrl: finalVideoUrl,
      mediaType: 'video',
    });

    // Notify dependents that this video is ready!
    onVideoReady?.(finalVideoUrl);

    // Extract this scene's last frame in the background for previews and chain
    fetch(getApiPath('/api/video/extract-frame'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: finalVideoUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.frameUrl) {
          callbacks.onSceneUpdate(scene.id, { extractedLastFrameUrl: data.frameUrl });
        }
      })
      .catch(() => {});

    return finalVideoUrl;
  })();

  // Wait for both video and TTS to complete
  const [videoUrl, audioTracks] = await Promise.all([videoPromise, ttsPromise]);

  callbacks.onSceneUpdate(scene.id, {
    status: 'completed',
    statusText: 'Сцена готова к сборке',
  });
  callbacks.onLog({
    sceneIndex: scene.order,
    sceneTitle: scene.title,
    stage: 'SCENE_MUX',
    stageLabel: `Сцена ${scene.order + 1} • Готова`,
    message: `Все ассеты сформированы: видео + ${audioTracks.length} аудио-реплик(и)`,
    level: 'success',
  });

  return {
    videoUrl,
    audioTracks,
  };
}

export async function runCartoonBuildPipeline(
  scenes: SceneState[],
  character: MainCharacter,
  apiKey: string,
  callbacks: GenerationCallbacks,
  backgroundMusic?: BackgroundMusicConfig
): Promise<Blob> {
  if (!apiKey) {
    throw new Error('xAI API Key не настроен. Укажите ключ в настройках проекта.');
  }

  const activeScenes = scenes.filter((s) => s.enabled !== false);

  if (activeScenes.length === 0) {
    throw new Error('Нет активных (включённых) сцен для генерации мультфильма.');
  }

  callbacks.onLog({
    stage: 'START',
    stageLabel: 'Старт генерации',
    message: `Запуск конвейера для ${activeScenes.length} включённых сцен(ы)... Запросы отправляются в нейросеть параллельно!`,
    level: 'info',
  });

  // Track video completion promises for each active scene index to resolve dependencies
  const videoResolvers = new Map<number, (url: string) => void>();
  const videoPromises = new Map<number, Promise<string>>();

  activeScenes.forEach((_, activeIdx) => {
    let resolver: (url: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolver = resolve;
    });
    videoResolvers.set(activeIdx, resolver!);
    videoPromises.set(activeIdx, promise);
  });

  const scenePipelines = activeScenes.map((scene, activeIdx) => {
    const getPrevSceneVideo = activeIdx > 0 ? () => videoPromises.get(activeIdx - 1)! : undefined;
    const onVideoReady = (url: string) => videoResolvers.get(activeIdx)?.(url);

    return generateScenePipeline(
      scene,
      character,
      apiKey,
      callbacks,
      getPrevSceneVideo,
      onVideoReady
    ).catch((err) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      callbacks.onSceneUpdate(scene.id, {
        status: 'error',
        statusText: 'Ошибка генерации',
        error: errMsg,
      });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'ERROR',
        stageLabel: `Сцена ${scene.order + 1} • Ошибка`,
        message: `Ошибка в сцене: ${errMsg}`,
        level: 'error',
      });
      throw err;
    });
  });

  const preparedScenes = await Promise.all(scenePipelines);

  // All active scenes ready -> Final FFmpeg Concatenation & Multi-track Audio Muxing
  callbacks.onLog({
    stage: 'FINAL_CONCAT',
    stageLabel: 'Финальная сборка',
    message: 'Все включённые сцены готовы! Запуск FFmpeg для объединения клипов и синхронизации всех реплик...',
    level: 'info',
  });

  const mergePayload: Record<string, unknown> = {
    scenes: preparedScenes.map((item, activeIdx) => ({
      index: activeIdx,
      videoUrl: item.videoUrl,
      audioTracks: item.audioTracks,
      keepVideoAudio: activeScenes[activeIdx].video.generateAudio !== false,
      transition: activeScenes[activeIdx].video.transition,
    })),
  };

  if (backgroundMusic && backgroundMusic.enabled && backgroundMusic.audioUrl) {
    mergePayload.backgroundMusic = {
      audioUrl: backgroundMusic.audioUrl,
      volume: backgroundMusic.volume ?? 0.25,
      loop: backgroundMusic.loop ?? true,
    };
    callbacks.onLog({
      stage: 'FINAL_CONCAT',
      stageLabel: 'Фоновая музыка',
      message: `Сведение фонового саундтрека (${Math.round((backgroundMusic.volume ?? 0.25) * 100)}% громкости)...`,
      level: 'info',
    });
  }

  const mergeRes = await fetch(getApiPath('/api/merge'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mergePayload),
  });

  if (!mergeRes.ok) {
    const errData = await mergeRes.json().catch(() => ({ error: 'Сбой склеивания видео на сервере' }));
    throw new Error(errData.error || `Ошибка сборки мультфильма: HTTP ${mergeRes.status}`);
  }

  const finalVideoBlob = await mergeRes.blob();
  const finalVideoUrl = URL.createObjectURL(finalVideoBlob);

  callbacks.onLog({
    stage: 'FINAL_CONCAT',
    stageLabel: 'Мультфильм готов!',
    message: `Склейка завершена! Итоговый размер: ${(finalVideoBlob.size / (1024 * 1024)).toFixed(2)} МБ`,
    level: 'success',
    mediaUrl: finalVideoUrl,
    mediaType: 'video',
  });

  return finalVideoBlob;
}
