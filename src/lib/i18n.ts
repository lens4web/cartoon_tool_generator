export type Language = 'en';

export interface Translations {
  // Header
  appTitle: string;
  appSubtitle: string;
  versionBadge: string;
  apiKeyActive: string;
  setApiKey: string;
  apiKeyTooltip: string;
  exportJson: string;
  exportJsonTooltip: string;
  importJson: string;
  resetProject: string;
  resetProjectConfirm: string;
  generateCartoon: string;
  generatingCartoon: string;
  buildCartoon: string;
  lengthLabel: string;
  durationFormatSec: string;
  durationFormatMinSec: string;
  durationFormatMin: string;
  scenesCountOne: string;
  scenesCountFew: string;
  scenesCountMany: string;
  scenesOfTotal: string;
  themeToggleLight: string;
  themeToggleDark: string;
  languageToggle: string;

  // Character section
  characterSectionTitle: string;
  characterSectionSubtitle: string;
  characterUploaded: string;
  characterNotUploaded: string;
  characterNameLabel: string;
  characterNamePlaceholder: string;
  frontViewTitle: string;
  frontViewDesc: string;
  frontViewUpload: string;
  backViewTitle: string;
  backViewDesc: string;
  backViewUpload: string;
  replacePhoto: string;
  deletePhoto: string;
  characterTip: string;

  // Background music section
  bgMusicSectionTitle: string;
  bgMusicSectionSubtitle: string;
  bgMusicEnabled: string;
  bgMusicActiveBadge: string;
  bgMusicUploadTitle: string;
  bgMusicUploadDesc: string;
  bgMusicReplace: string;
  bgMusicVolumeLabel: string;
  bgMusicLoopLabel: string;
  bgMusicTip: string;

  // Scene constructor
  sceneConstructorTitle: string;
  sceneConstructorSubtitle: string;
  activeScenesCounter: string;
  timingLabel: string;
  addSceneButton: string;

  // Scene card
  sceneTitlePlaceholder: string;
  sceneEnabledToggle: string;
  sceneDisabledToggle: string;
  sceneDisabledAlert: string;
  enableSceneButton: string;
  moveUp: string;
  moveDown: string;
  duplicateScene: string;
  deleteScene: string;
  statusQueued: string;
  statusExtractingFrame: string;
  statusGeneratingImage: string;
  statusGeneratingVideo: string;
  statusRenderingVideo: string;
  statusGeneratingAudio: string;
  statusMuxing: string;
  statusCompleted: string;
  statusError: string;
  statusWaitingDependency: string;

  // Scene Card - Left Column (Video)
  videoColTitle: string;
  modelLabel: string;
  modelLiteDesc: string;
  modelProDesc: string;
  generateVideoToggle: string;
  customVideoSelected: string;
  replaceVideo: string;
  selectCustomVideo: string;
  videoDurationLabel: string;
  videoAudioToggle: string;
  videoAudioPlaysWithTts: string;
  startImageSectionLabel: string;
  startImageModeCharRef: string;
  startImageModeCharRefSub: string;
  startImageModeCustomGen: string;
  startImageModeCustomGenSub: string;
  startImageModePrevFrame: string;
  startImageModePrevFrameSub: string;
  startImageModePrevFrameDisabled: string;
  startImageModeUpload: string;
  startImageModeUploadSub: string;
  charViewTitle: string;
  charViewFront: string;
  charViewBack: string;
  charViewNone: string;
  seamlessPrevFrameTitle: string;
  seamlessPrevFrameDesc: string;
  customStartParamsTitle: string;
  multiRefsBadge: string;
  charInFrameTitle: string;
  usePrevFrameCheckbox: string;
  usePrevFrameActive: string;
  usePrevFrameDesc: string;
  customRefsTitle: string;
  addPhotoRefButton: string;
  customRefsDesc: string;
  startInstructionLabel: string;
  startInstructionPlaceholder: string;
  startInstructionHint: string;
  lastFrameSectionTitle: string;
  lastFrameNone: string;
  lastFrameCharRef: string;
  lastFrameCustomGen: string;
  lastFrameUpload: string;
  lastFrameCharViewTitle: string;
  lastFrameBoyFront: string;
  lastFrameBoyBack: string;
  lastFrameBoyNone: string;
  lastFrameCharViewDesc: string;
  lastFrameInstructionLabel: string;
  lastFrameInstructionPlaceholder: string;
  lastFrameRefsTitle: string;
  lastFrameRefsDesc: string;
  lastFrameUploadTitle: string;
  videoPromptLabel: string;
  videoPromptPlaceholder: string;
  transitionsTitle: string;
  transitionsActive: string;
  fadeInLabel: string;
  fadeInDesc: string;
  fadeOutLabel: string;
  fadeOutDesc: string;
  durationLabel: string;

  // Scene Card - Right Column (Audio / Grok-TTS)
  audioColTitle: string;
  useTtsToggle: string;
  ttsDisabledNotice: string;
  ttsDisabledSub: string;
  parallelAudioNoticeTitle: string;
  parallelAudioNoticeDesc: string;
  replicasHeader: string;
  addReplicaButton: string;
  replicaTitle: string;
  deleteReplica: string;
  voiceLabel: string;
  speedLabel: string;
  offsetLabel: string;
  normalizeTextLabel: string;
  replicaTextLabel: string;
  replicaTextPlaceholder: string;

  // Final player & Logs
  finalPlayerTitle: string;
  downloadMp4Button: string;
  logsTitle: string;
  clearLogsButton: string;
  pipelineStartedLog: string;
  noEnabledScenesAlert: string;
  importSuccessAlert: string;
  importErrorAlert: string;
  noScenesInJsonAlert: string;

  // Api key modal
  apiKeyModalTitle: string;
  apiKeyModalSubtitle: string;
  apiKeyModalDesc: string;
  apiKeyModalInputLabel: string;
  apiKeyInputLabel: string;
  apiKeyModalPlaceholder: string;
  apiKeyModalConsoleLink: string;
  apiKeyModalTestButton: string;
  apiKeyModalTesting: string;
  apiKeyModalSaveButton: string;
  apiKeyModalCancelButton: string;
  apiKeyModalSuccess: string;
  apiKeyModalInvalid: string;
  apiKeySecureNote: string;
  apiKeyGetLink: string;
  apiKeyClear: string;
  apiKeyCancel: string;
  apiKeySave: string;
  apiKeySaved: string;

  // Console panel
  consoleTitle: string;
  consoleSubtitle: string;
  consoleGeneratingBadge: string;
  consoleFilterAll: string;
  consoleFilterImages: string;
  consoleFilterVideo: string;
  consoleFilterAudio: string;
  consoleFilterConcat: string;
  consoleFilterErrors: string;
  consoleAutoscroll: string;
  consoleClearTooltip: string;
  consoleFinalReady: string;
  consoleFinalReadyDesc: string;
  consoleDownloadMp4: string;
  consoleSceneStatusTrack: string;
  consoleEmptyLog: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    appTitle: 'Grok Cartoon Studio',
    appSubtitle: 'AI Cartoon Creator powered by Grok AI',
    versionBadge: '1.5 & TTS',
    apiKeyActive: 'API Key Active',
    setApiKey: 'Set xAI API Key',
    apiKeyTooltip: 'Configure xAI API Key',
    exportJson: 'Export JSON',
    exportJsonTooltip: 'Export scenario & scene configurations to JSON for bot or reuse',
    importJson: 'Import JSON',
    resetProject: 'Reset Project',
    resetProjectConfirm: 'Reset the entire project to default settings?',
    generateCartoon: 'Generating Cartoon...',
    generatingCartoon: 'Generating Cartoon...',
    buildCartoon: 'Build Cartoon',
    lengthLabel: 'duration',
    durationFormatSec: '{count}s',
    durationFormatMinSec: '{min}m {sec}s',
    durationFormatMin: '{min}m',
    scenesCountOne: 'scene',
    scenesCountFew: 'scenes',
    scenesCountMany: 'scenes',
    scenesOfTotal: 'of {total} scenes',
    themeToggleLight: 'Switch to light theme',
    themeToggleDark: 'Switch to dark theme',
    languageToggle: 'Interface language',

    // Character section
    characterSectionTitle: 'Main Character',
    characterSectionSubtitle:
      'Upload character references (front and back view) to maintain visual character consistency across all scenes',
    characterUploaded: 'Uploaded',
    characterNotUploaded: 'Not uploaded',
    characterNameLabel: 'Character Name:',
    characterNamePlaceholder: 'Main Hero',
    frontViewTitle: 'Front View',
    frontViewDesc: 'Main character angle for dialogue and portrait shots',
    frontViewUpload: 'Upload front view',
    backViewTitle: 'Back View',
    backViewDesc: 'Rear angle for walking away and camera follow shots',
    backViewUpload: 'Upload back view',
    replacePhoto: 'Replace photo',
    deletePhoto: 'Remove',
    characterTip:
      'Tip: Use clear character photos on a neutral background. Grok AI uses these frames as visual identity references.',

    // Background music section
    bgMusicSectionTitle: 'Cartoon Background Music',
    bgMusicSectionSubtitle:
      'The audio track will be overlayed across the entire cartoon during final merge on top of video audio and dialogue.',
    bgMusicEnabled: 'Overlay background music:',
    bgMusicActiveBadge: 'Active',
    bgMusicUploadTitle: 'Upload background music file (MP3, WAV, AAC)',
    bgMusicUploadDesc: 'Music will loop or seamlessly end when the cartoon finishes',
    bgMusicReplace: 'Replace music',
    bgMusicVolumeLabel: 'Music Volume:',
    bgMusicLoopLabel: 'Loop music track until end of cartoon',
    bgMusicTip:
      '💡 Music is automatically mixed in the background at the specified volume (20–30% recommended) so as not to overpower character speech.',

    // Scene constructor
    sceneConstructorTitle: 'Scene Constructor',
    sceneConstructorSubtitle:
      '1.5 Lite / 1.5 models with seamless last frame transition and independent dialogue timings',
    activeScenesCounter: '{enabled} of {total} enabled',
    timingLabel: 'Duration',
    addSceneButton: 'Add Scene',

    // Scene card
    sceneTitlePlaceholder: 'Scene title',
    sceneEnabledToggle: 'Enabled in generation',
    sceneDisabledToggle: 'Disabled (skipped)',
    sceneDisabledAlert:
      'Scene is disabled: it will be skipped during cartoon build and is excluded from total cost and duration.',
    enableSceneButton: 'Enable scene',
    moveUp: 'Move up',
    moveDown: 'Move down',
    duplicateScene: 'Duplicate scene',
    deleteScene: 'Delete scene',
    statusQueued: 'Queued...',
    statusExtractingFrame: 'Extracting frame...',
    statusGeneratingImage: 'Generating image...',
    statusGeneratingVideo: 'Generating video...',
    statusRenderingVideo: 'Rendering video...',
    statusGeneratingAudio: 'Generating voiceover...',
    statusMuxing: 'Muxing scene...',
    statusCompleted: 'Scene ready',
    statusError: 'Generation error',
    statusWaitingDependency: 'Waiting for dependency...',

    // Scene Card - Left Column (Video)
    videoColTitle: 'Scene Video',
    modelLabel: 'Model:',
    modelLiteDesc: '1.5 Lite ($0.02/s)',
    modelProDesc: '1.5 ($0.08/s, Start & End Frame)',
    generateVideoToggle: 'AI Video Generation',
    customVideoSelected: 'Custom video selected',
    replaceVideo: 'Replace video',
    selectCustomVideo: 'Select custom video (MP4 / WebM)',
    videoDurationLabel: 'Scene duration:',
    videoAudioToggle: 'Video model audio:',
    videoAudioPlaysWithTts: 'plays alongside grok-tts voiceover',
    startImageSectionLabel: 'Starting video frame:',
    startImageModeCharRef: 'From Character',
    startImageModeCharRefSub: 'Profile angle',
    startImageModeCustomGen: 'By Instruction',
    startImageModeCustomGenSub: 'Generate',
    startImageModePrevFrame: 'End of scene #{idx}',
    startImageModePrevFrameSub: 'Seamless transition',
    startImageModePrevFrameDisabled: '(For scenes #2+)',
    startImageModeUpload: 'Custom Image',
    startImageModeUploadSub: 'Upload file',
    charViewTitle: 'Character angle for first frame:',
    charViewFront: 'Front view',
    charViewBack: 'Back view',
    charViewNone: 'No character',
    seamlessPrevFrameTitle: 'Seamless cut with scene #{idx}',
    seamlessPrevFrameDesc:
      'When scene #{idx} finishes, its final frame is extracted automatically and fed into this scene as the starting frame.',
    customStartParamsTitle: 'Starting Frame Generation Parameters',
    multiRefsBadge: 'grok-imagine-image-2.0 multi-references',
    charInFrameTitle: 'Main character in frame:',
    usePrevFrameCheckbox: 'Use scene #{idx} final frame as background / environment',
    usePrevFrameActive: 'Active',
    usePrevFrameDesc:
      'Scene #{idx} final frame is automatically extracted via FFmpeg and passed to the model as a location & lighting reference.',
    customRefsTitle: 'Custom photo references for start frame:',
    addPhotoRefButton: '+ Photo',
    customRefsDesc:
      'Upload any reference images (second character, objects, room background). All are passed to AI simultaneously.',
    startInstructionLabel: 'Text prompt for starting frame generation:',
    startInstructionPlaceholder:
      'Describe how to position the character and what should appear in the initial frame...',
    startInstructionHint:
      '💡 Grok-imagine-image-2.0 supports multi-image blending: you can combine the character, previous scene frame, and custom uploaded photos simultaneously.',
    lastFrameSectionTitle: 'Scene Last Frame:',
    lastFrameNone: 'No end frame',
    lastFrameCharRef: 'From character profile',
    lastFrameCustomGen: 'Generate from prompt',
    lastFrameUpload: 'Upload image',
    lastFrameCharViewTitle: 'Character angle for last video frame:',
    lastFrameBoyFront: 'Hero front',
    lastFrameBoyBack: 'Hero back',
    lastFrameBoyNone: 'No character',
    lastFrameCharViewDesc:
      'The selected character photo is sent to grok-imagine-image-2.0 as a visual reference for the final frame.',
    lastFrameInstructionLabel: 'Instruction for generating final frame:',
    lastFrameInstructionPlaceholder:
      'Describe the final state or pose the character should arrive at...',
    lastFrameRefsTitle: 'Photo references for final frame prompt:',
    lastFrameRefsDesc:
      '💡 Upload photos of characters, objects or location — grok-imagine-image-2.0 uses them as visual references.',
    lastFrameUploadTitle: 'Final frame',
    videoPromptLabel: 'Scene text description (video prompt):',
    videoPromptPlaceholder:
      'Describe action, camera movement, character animation...',
    transitionsTitle: 'Screen transitions (fade to black):',
    transitionsActive: 'Active',
    fadeInLabel: 'Fade in from black (start)',
    fadeInDesc: 'Smoothly reveals the scene from a deep black screen',
    fadeOutLabel: 'Fade out to black (end)',
    fadeOutDesc: 'Smoothly fades the scene into a deep black screen',
    durationLabel: 'Duration:',

    // Scene Card - Right Column (Audio / Grok-TTS)
    audioColTitle: 'Scene Voiceover (grok-tts)',
    useTtsToggle: 'Use grok-tts:',
    ttsDisabledNotice: 'grok-tts voiceover is disabled for this scene.',
    ttsDisabledSub: 'Original video audio will be used (if enabled).',
    parallelAudioNoticeTitle: 'Simultaneous Audio Layering:',
    parallelAudioNoticeDesc:
      'Video audio track and grok-tts voice replicas are layered together and play simultaneously at full volume (without ducking).',
    replicasHeader: 'Dialogue Replicas in Scene ({count}):',
    addReplicaButton: 'Add Replica',
    replicaTitle: 'Replica #{number}',
    deleteReplica: 'Delete replica',
    voiceLabel: 'xAI Voice:',
    speedLabel: 'Speed:',
    offsetLabel: 'Start in video:',
    normalizeTextLabel: 'Normalize text (numbers to words)',
    replicaTextLabel: 'Speech phrase for character:',
    replicaTextPlaceholder: 'Enter dialogue line...',

    // Final player & Logs
    finalPlayerTitle: 'Final Result (Merged Cartoon)',
    downloadMp4Button: 'Download Cartoon (MP4)',
    logsTitle: 'Real-time Generation & Build Console',
    clearLogsButton: 'Clear logs',
    pipelineStartedLog: 'Starting cartoon build pipeline...',
    noEnabledScenesAlert: 'Please enable at least one scene to generate the cartoon',
    importSuccessAlert: 'Successfully imported scenario: {count} scene(s)!',
    importErrorAlert: 'Error parsing JSON file. Check format.',
    noScenesInJsonAlert: 'No scenes array found in JSON file.',

    // Api key modal
    apiKeyModalTitle: 'Configure xAI API Key',
    apiKeyModalSubtitle: 'Stored exclusively in your browser',
    apiKeyModalDesc:
      'An xAI API Key is required for video generation and TTS voicing. The key is saved locally in your browser (LocalStorage).',
    apiKeyModalInputLabel: 'xAI API Key (starts with xai-...):',
    apiKeyInputLabel: 'xAI API Key',
    apiKeyModalPlaceholder: 'xai-...',
    apiKeyModalConsoleLink: 'Get API Key in xAI Console (console.x.ai)',
    apiKeyModalTestButton: 'Test Key',
    apiKeyModalTesting: 'Testing...',
    apiKeyModalSaveButton: 'Save Key',
    apiKeyModalCancelButton: 'Cancel',
    apiKeyModalSuccess: 'API key successfully validated and working!',
    apiKeyModalInvalid: 'Invalid API key or network error',
    apiKeySecureNote: 'Secure: key is not shared with any third-party services',
    apiKeyGetLink: 'Get at xAI',
    apiKeyClear: 'Clear key',
    apiKeyCancel: 'Cancel',
    apiKeySave: 'Save key',
    apiKeySaved: 'Saved!',

    // Console panel
    consoleTitle: 'Execution Console & Results Stream',
    consoleSubtitle: 'Live streaming of generation stages, intermediate files and the merged cartoon',
    consoleGeneratingBadge: 'Parallel generation in xAI...',
    consoleFilterAll: 'All',
    consoleFilterImages: 'Frames',
    consoleFilterVideo: 'Video',
    consoleFilterAudio: 'Audio',
    consoleFilterConcat: 'Assembly',
    consoleFilterErrors: 'Errors',
    consoleAutoscroll: 'Auto-scroll',
    consoleClearTooltip: 'Clear logs',
    consoleFinalReady: 'Final Cartoon Ready!',
    consoleFinalReadyDesc:
      'All scenes were successfully generated, voiced and concatenated into a single video via FFmpeg',
    consoleDownloadMp4: 'Download final cartoon (.mp4)',
    consoleSceneStatusTrack: 'Scene Status:',
    consoleEmptyLog: 'Log is empty. Click «Build Cartoon» to start the process.',
  },
};
