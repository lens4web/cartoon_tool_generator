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
      const err = await res.json().catch(() => ({ error: 'Network failure while polling status' }));
      throw new Error(err.error || `Status polling error: HTTP ${res.status}`);
    }

    const data = await res.json();
    onStatusUpdate(data.status);

    if (data.status === 'done') {
      if (!data.videoUrl) throw new Error('xAI returned done status, but video URL is missing');
      return data.videoUrl;
    }

    if (data.status === 'failed' || data.status === 'expired') {
      throw new Error(`Video generation failed with status: ${data.status}`);
    }
  }

  throw new Error('Video generation timed out (15 min limit)');
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
  callbacks.onSceneUpdate(scene.id, { status: 'queued', statusText: 'Queued...' });

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
            statusText: `Synthesizing audio (replica #${tIdx + 1})...`,
          });
          callbacks.onLog({
            sceneIndex: scene.order,
            sceneTitle: scene.title,
            stage: 'TTS_AUDIO',
            stageLabel: `Scene ${scene.order + 1} • Replica #${tIdx + 1}`,
            message: `Voiceover [${track.voiceId}, ${track.speed}x, start: ${track.audioOffset}s]: "${track.phrase.slice(0, 45)}${track.phrase.length > 45 ? '...' : ''}"`,
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
            throw new Error(data.error || `Speech generation error for replica #${tIdx + 1}`);
          }

          callbacks.onLog({
            sceneIndex: scene.order,
            sceneTitle: scene.title,
            stage: 'TTS_AUDIO',
            stageLabel: `Scene ${scene.order + 1} • Replica #${tIdx + 1} ready`,
            message: `Audio track synthesized (${(data.bytes / 1024).toFixed(1)} KB, start: ${track.audioOffset}s)`,
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
        throw new Error(`Scene #${scene.order + 1} has AI video generation disabled, but no custom video was selected`);
      }
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'VIDEO',
        stageLabel: `Scene ${scene.order + 1} • Custom Video`,
        message: 'Using pre-uploaded custom video',
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
        throw new Error(`Scene #${scene.order + 1} cannot use the previous frame: this is the first scene`);
      }

      callbacks.onSceneUpdate(scene.id, {
        status: 'waiting_dependency',
        statusText: 'Waiting for previous scene video...',
      });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'EXTRACT_FRAME',
        stageLabel: `Scene ${scene.order + 1} • Waiting`,
        message: 'Waiting for previous scene rendering to finish for seamless transition...',
        level: 'info',
      });

      const prevVideoUrl = await getPrevSceneVideo();

      callbacks.onSceneUpdate(scene.id, {
        status: 'extracting_frame',
        statusText: 'Extracting last frame...',
      });

      const extractRes = await fetch(getApiPath('/api/video/extract-frame'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: prevVideoUrl }),
      });

      const extractData = await extractRes.json();
      if (!extractRes.ok || !extractData.success) {
        throw new Error(extractData.error || 'Failed to extract the last frame of the previous scene');
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
        stageLabel: `Scene ${scene.order + 1} • Transition Frame Extracted`,
        message: 'Previous scene last frame extracted and set as the starting frame',
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
            `Scene #${scene.order + 1} cannot use the previous scene frame as template: this is the first scene`
          );
        }

        callbacks.onSceneUpdate(scene.id, {
          status: 'waiting_dependency',
          statusText: 'Waiting for previous scene video for template...',
        });
        callbacks.onLog({
          sceneIndex: scene.order,
          sceneTitle: scene.title,
          stage: 'EXTRACT_FRAME',
          stageLabel: `Scene ${scene.order + 1} • Scene #${scene.order} Template`,
          message: 'Waiting for previous scene video to extract template frame...',
          level: 'info',
        });

        const prevVideoUrl = await getPrevSceneVideo();

        callbacks.onSceneUpdate(scene.id, {
          status: 'extracting_frame',
          statusText: 'Extracting template frame...',
        });

        const extractRes = await fetch(getApiPath('/api/video/extract-frame'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: prevVideoUrl }),
        });

        const extractData = await extractRes.json();
        if (!extractRes.ok || !extractData.success) {
          throw new Error(extractData.error || 'Failed to extract previous scene last frame for template');
        }

        extractedPrevFrame = extractData.frameUrl;
        callbacks.onLog({
          sceneIndex: scene.order,
          sceneTitle: scene.title,
          stage: 'EXTRACT_FRAME',
          stageLabel: `Scene ${scene.order + 1} • Template Ready`,
          message: 'Previous scene final frame extracted and will be used as environment/background reference',
          level: 'success',
          mediaUrl: extractedPrevFrame || undefined,
          mediaType: 'image',
        });
      }

      callbacks.onSceneUpdate(scene.id, {
        status: 'generating_image',
        statusText: 'Generating start frame...',
      });

      // Prepare custom reference images (from startImageReferences + templateImage)
      const customRefs = [
        ...(scene.video.startImageReferences || []),
        ...(scene.video.templateImage ? [scene.video.templateImage] : []),
      ];
      const uniqueCustomRefs = Array.from(new Set(customRefs));

      const refListDesc: string[] = [];
      if (shouldUsePrev) refListDesc.push(`scene #${scene.order} frame`);
      if (uniqueCustomRefs.length > 0) refListDesc.push(`${uniqueCustomRefs.length} custom photo(s)`);

      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'START_IMAGE',
        stageLabel: `Scene ${scene.order + 1} • Start Frame`,
        message: `Generating start frame from instruction: "${scene.video.imageInstruction || scene.video.videoPrompt}"${
          refListDesc.length > 0 ? ` [References: ${refListDesc.join(' + ')}]` : ''
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
        throw new Error(data.error || 'Failed to generate start image');
      }

      startImageUrl = data.url;
      callbacks.onSceneUpdate(scene.id, { generatedStartImageUrl: startImageUrl });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'START_IMAGE',
        stageLabel: `Scene ${scene.order + 1} • Start Frame Ready`,
        message: 'Start frame generated successfully',
        level: 'success',
        mediaUrl: startImageUrl || undefined,
        mediaType: 'image',
      });
    } else if (scene.video.startImageMode === 'custom_upload') {
      startImageUrl = scene.video.customStartImage || character.frontImage;
      if (!startImageUrl) {
        throw new Error(`No start image selected in scene #${scene.order + 1}`);
      }
    } else {
      // Use character reference directly
      startImageUrl =
        scene.video.characterView === 'back'
          ? character.backImage || character.frontImage
          : character.frontImage || character.backImage;

      if (!startImageUrl) {
        throw new Error(`No character reference image set for start frame in scene #${scene.order + 1}`);
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
          `Scene #${scene.order + 1} uses character profile for last frame (${
            charView === 'back' ? 'back view' : 'front view'
          }), but no image is uploaded`
        );
      }

      callbacks.onSceneUpdate(scene.id, { generatedLastFrameUrl: lastFrameUrl });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'LAST_FRAME',
        stageLabel: `Scene ${scene.order + 1} • Last Frame`,
        message: `Using character image (${
          charView === 'back' ? 'back view' : 'front view'
        }) as last frame`,
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
        statusText: 'Generating last frame...',
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
        stageLabel: `Scene ${scene.order + 1} • Last Frame`,
        message: `Generating last frame from instruction: "${promptToUse}"${
          characterImgToSend
            ? ` (included character reference: ${charView === 'back' ? 'back view' : 'front view'})`
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
        throw new Error(data.error || 'Failed to generate last frame');
      }

      lastFrameUrl = data.url;
      callbacks.onSceneUpdate(scene.id, { generatedLastFrameUrl: lastFrameUrl });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'LAST_FRAME',
        stageLabel: `Scene ${scene.order + 1} • Last Frame Ready`,
        message: 'Last frame generated successfully',
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
      statusText: `Generating video (${chosenModel})...`,
    });
    callbacks.onLog({
      sceneIndex: scene.order,
      sceneTitle: scene.title,
      stage: 'VIDEO',
      stageLabel: `Scene ${scene.order + 1} • Starting Video`,
      message: `Submitting to ${chosenModel} (${scene.video.duration}s, 480p${lastFrameUrl ? ', with locked end frame' : ''})`,
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
      throw new Error(videoReqData.error || 'Failed to submit video generation task');
    }

    const requestId = videoReqData.requestId;
    callbacks.onLog({
      sceneIndex: scene.order,
      sceneTitle: scene.title,
      stage: 'VIDEO',
      stageLabel: `Scene ${scene.order + 1} • xAI Processing`,
      message: `Task accepted [ID: ${requestId}]. Waiting for completion...`,
      level: 'info',
    });

    // Poll until video is done
    const finalVideoUrl = await pollVideoTask(apiKey, requestId, (status) => {
      callbacks.onSceneUpdate(scene.id, {
        statusText: `Rendering video (${status})...`,
      });
    });

    callbacks.onSceneUpdate(scene.id, { rawVideoUrl: finalVideoUrl });
    callbacks.onLog({
      sceneIndex: scene.order,
      sceneTitle: scene.title,
      stage: 'VIDEO',
      stageLabel: `Scene ${scene.order + 1} • Video Ready`,
      message: `Video clip generated by ${chosenModel}`,
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
    statusText: 'Scene ready to merge',
  });
  callbacks.onLog({
    sceneIndex: scene.order,
    sceneTitle: scene.title,
    stage: 'SCENE_MUX',
    stageLabel: `Scene ${scene.order + 1} • Ready`,
    message: `All assets generated: video + ${audioTracks.length} audio track(s)`,
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
    throw new Error('xAI API Key is not configured. Please set your key in project settings.');
  }

  const activeScenes = scenes.filter((s) => s.enabled !== false);

  if (activeScenes.length === 0) {
    throw new Error('No enabled scenes available for cartoon generation.');
  }

  callbacks.onLog({
    stage: 'START',
    stageLabel: 'Generation Started',
    message: `Starting pipeline for ${activeScenes.length} enabled scene(s)... Requests are sent in parallel!`,
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
        statusText: 'Generation error',
        error: errMsg,
      });
      callbacks.onLog({
        sceneIndex: scene.order,
        sceneTitle: scene.title,
        stage: 'ERROR',
        stageLabel: `Scene ${scene.order + 1} • Error`,
        message: `Scene error: ${errMsg}`,
        level: 'error',
      });
      throw err;
    });
  });

  const preparedScenes = await Promise.all(scenePipelines);

  // All active scenes ready -> Final FFmpeg Concatenation & Multi-track Audio Muxing
  callbacks.onLog({
    stage: 'FINAL_CONCAT',
    stageLabel: 'Final Assembly',
    message: 'All enabled scenes are ready! Running FFmpeg to merge clips and sync all dialogue tracks...',
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
      stageLabel: 'Background Music',
      message: `Mixing background soundtrack (${Math.round((backgroundMusic.volume ?? 0.25) * 100)}% volume)...`,
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
    const errData = await mergeRes.json().catch(() => ({ error: 'Server error while merging video' }));
    throw new Error(errData.error || `Cartoon merge error: HTTP ${mergeRes.status}`);
  }

  const finalVideoBlob = await mergeRes.blob();
  const finalVideoUrl = URL.createObjectURL(finalVideoBlob);

  callbacks.onLog({
    stage: 'FINAL_CONCAT',
    stageLabel: 'Cartoon Ready!',
    message: `Merge complete! Final file size: ${(finalVideoBlob.size / (1024 * 1024)).toFixed(2)} MB`,
    level: 'success',
    mediaUrl: finalVideoUrl,
    mediaType: 'video',
  });

  return finalVideoBlob;
}
