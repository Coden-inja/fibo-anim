/**
 * Moot Spiral Studio — Client-side In-Browser Engine
 * Mathematically replicates spiral.c with 60 FPS Canvas rendering,
 * Web Audio synchronization, and client-side HD video recording.
 */

// Exact constants from spiral.c
const SQUARES = 32;
const DEFAULT_ZOOM_START = 0.001;
const DEFAULT_ZOOM_MAX = 0.0067;
const BASE_ZOOM_SPEED = 1.02;

// Default sample avatars
const DEFAULT_SAMPLES = [
  'moots/Astarista_.jpg',
  'moots/an0nzymandias.jpg',
  'moots/ankkala.jpg',
  'moots/antlionai.jpg',
  'moots/arthantyo.jpg',
  'moots/astraphiliaa.jpg',
  'moots/atkmywk.jpg'
];

// App State
const state = {
  textures: [],
  isPlaying: true,
  motionMode: 'forward', // 'forward', 'reverse', or 'bounce'
  zoomSpeed: BASE_ZOOM_SPEED,
  zoom: DEFAULT_ZOOM_START,
  bgColor: '#f5f5f5',
  resolution: { w: 1280, h: 720 },
  exportDuration: 60,
  
  // Audio state
  audioBuffer: null,
  audioSourceNode: null,
  audioContext: null,
  audioDestination: null,
  audioFile: null,
  audioDuration: 0,
  audioStartOffset: 0,
  
  // Recording state
  isRecording: false,
  mediaRecorder: null,
  recordedChunks: [],
  recordingStartTime: 0
};

// Compute Fibonacci sequence
const fibonacci = [1, 1];
for (let i = 2; i < SQUARES; i++) {
  fibonacci.push(fibonacci[i - 1] + fibonacci[i - 2]);
}

// Squares array
class Square {
  constructor(position, fibVal) {
    this.position = position;
    this.fibonacci = fibVal;
    this.size = 0;
    this.x = 0;
    this.y = 0;
  }
}

const squares = [];
for (let i = 0; i < SQUARES; i++) {
  squares.push(new Square(i, fibonacci[SQUARES - i - 1]));
}

// DOM Elements
const canvas = document.getElementById('spiral-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const canvasContainer = document.getElementById('canvas-container');

const btnPlayPause = document.getElementById('btn-play-pause');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const btnReverseToggle = document.getElementById('btn-reverse-toggle');
const lblReverseMode = document.getElementById('lbl-reverse-mode');
const btnFullscreen = document.getElementById('btn-fullscreen');

const statTextures = document.getElementById('stat-textures');
const statSpeed = document.getElementById('stat-speed');
const photoCountBadge = document.getElementById('photo-count-badge');
const thumbnailsContainer = document.getElementById('thumbnails-container');
const photoDropzone = document.getElementById('photo-dropzone');
const photoInput = document.getElementById('photo-input');
const btnUseSamples = document.getElementById('btn-use-samples');
const btnClearPhotos = document.getElementById('btn-clear-photos');

const btnChooseAudio = document.getElementById('btn-choose-audio');
const audioInput = document.getElementById('audio-input');
const lblAudioName = document.getElementById('lbl-audio-name');
const audioStatusBadge = document.getElementById('audio-status-badge');
const audioControlsGroup = document.getElementById('audio-controls-group');
const audioStartSlider = document.getElementById('audio-start-slider');
const valAudioStart = document.getElementById('val-audio-start');
const audioTotalDuration = document.getElementById('audio-total-duration');
const btnRemoveAudio = document.getElementById('btn-remove-audio');

const zoomSpeedSlider = document.getElementById('zoom-speed-slider');
const valZoomSpeed = document.getElementById('val-zoom-speed');
const btnModeForward = document.getElementById('btn-mode-forward');
const btnModeReverse = document.getElementById('btn-mode-reverse');
const btnModeBounce = document.getElementById('btn-mode-bounce');

const colorBtns = document.querySelectorAll('.color-btn');
const pillBtns = document.querySelectorAll('.pill-btn');
const resBtns = document.querySelectorAll('.segmented-control button[data-res]');
const btnExportVideo = document.getElementById('btn-export-video');

const recordingOverlay = document.getElementById('recording-overlay');
const recProgressFill = document.getElementById('rec-progress-fill');
const recTimeText = document.getElementById('rec-time-text');

const exportModal = document.getElementById('export-modal');
const exportPreviewVideo = document.getElementById('export-preview-video');
const exportMetaInfo = document.getElementById('export-meta-info');
const btnDownloadVideo = document.getElementById('btn-download-video');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnModalClose = document.getElementById('btn-modal-close');

// ========================
// Spiral Math & Rendering
// ========================

function updateSizes(z) {
  for (let i = 0; i < SQUARES; i++) {
    squares[i].size = squares[i].fibonacci * z;
  }
}

function positionSpiral() {
  let x = 0;
  let y = 0;
  let dir = 0;
  for (let i = 0; i < SQUARES - 1; i++) {
    squares[i].x = x;
    squares[i].y = y;
    switch ((dir++) % 4) {
      case 0: x += squares[i].size; break;
      case 1: x += squares[i].size - squares[i + 1].size; y += squares[i].size; break;
      case 2: x -= squares[i + 1].size; y += squares[i].size - squares[i + 1].size; break;
      case 3: y -= squares[i + 1].size; break;
    }
  }
  squares[SQUARES - 1].x = x;
  squares[SQUARES - 1].y = y;
}

function centerSpiral(w, h) {
  const targetX = w / 2.0;
  const targetY = h / 2.0;
  const last = squares[SQUARES - 1];
  const centerX = last.x + last.size / 2.0;
  const centerY = last.y + last.size / 2.0;
  const offsetX = targetX - centerX;
  const offsetY = targetY - centerY;

  for (let i = 0; i < SQUARES; i++) {
    squares[i].x += offsetX;
    squares[i].y += offsetY;
  }
}

function shiftSquares(step = 4) {
  for (let i = 0; i < SQUARES; i++) {
    squares[i].position += step;
  }
}

function drawSquares(w, h) {
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, w, h);

  if (state.textures.length === 0) return;

  const numTex = state.textures.length;

  for (let i = 0; i < SQUARES; i++) {
    const sq = squares[i];
    const size = sq.size;
    if (size <= 0.5) continue;

    // Check bounds
    if (sq.x + size <= 0 || sq.x >= w || sq.y + size <= 0 || sq.y >= h) {
      continue;
    }

    const texIndex = ((sq.position % numTex) + numTex) % numTex;
    const tex = state.textures[texIndex];

    try {
      ctx.drawImage(tex, sq.x, sq.y, size, size);
    } catch (e) {
      // Ignore transient draw errors
    }
  }
}

// Animation Loop
let lastTime = performance.now();
let animationTime = 0;

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (state.isPlaying || state.isRecording) {
    animationTime += dt;
    const w = canvas.width;
    const h = canvas.height;

    let curSpeed = state.zoomSpeed;

    if (state.motionMode === 'reverse') {
      // Instant pure reverse zoom out
      curSpeed = 2.0 - state.zoomSpeed; // e.g. 2 - 1.02 = 0.98
    } else if (state.motionMode === 'bounce') {
      // Smooth 12-second in-and-out cycle
      const cycleTime = animationTime % 12.0;
      if (cycleTime < 5.0) {
        curSpeed = state.zoomSpeed;
      } else if (cycleTime < 6.0) {
        const t = (cycleTime - 5.0);
        curSpeed = state.zoomSpeed - (state.zoomSpeed - 1.0) * t;
      } else if (cycleTime < 11.0) {
        curSpeed = 2.0 - state.zoomSpeed;
      } else {
        const t = (cycleTime - 11.0);
        curSpeed = (2.0 - state.zoomSpeed) + (state.zoomSpeed - (2.0 - state.zoomSpeed)) * t;
      }
    } else {
      // Standard forward zoom in
      curSpeed = state.zoomSpeed;
    }

    if (curSpeed >= 1.0) {
      if (state.zoom >= DEFAULT_ZOOM_MAX) {
        state.zoom = DEFAULT_ZOOM_START;
        shiftSquares(4);
      }
    } else {
      if (state.zoom <= DEFAULT_ZOOM_START) {
        state.zoom = DEFAULT_ZOOM_MAX;
        shiftSquares(-4);
      }
    }

    state.zoom *= Math.pow(curSpeed, dt * 60.0);

    updateSizes(state.zoom);
    positionSpiral();
    centerSpiral(w, h);
    drawSquares(w, h);
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

// ========================
// Image Processing
// ========================

function createCroppedSquareCanvas(img) {
  const minDim = Math.min(img.width, img.height);
  const sx = (img.width - minDim) / 2;
  const sy = (img.height - minDim) / 2;

  const targetSize = 512;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = targetSize;
  offCanvas.height = targetSize;
  const offCtx = offCanvas.getContext('2d');
  offCtx.imageSmoothingQuality = 'high';

  offCtx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
  return offCanvas;
}

function createFallbackAvatar(index) {
  const c = document.createElement('canvas');
  c.width = 400;
  c.height = 400;
  const cx = c.getContext('2d');
  const hues = [190, 260, 330, 45, 160, 220, 280];
  const hue = hues[index % hues.length];

  const grad = cx.createLinearGradient(0, 0, 400, 400);
  grad.addColorStop(0, `hsl(${hue}, 85%, 60%)`);
  grad.addColorStop(1, `hsl(${(hue + 45) % 360}, 90%, 40%)`);
  cx.fillStyle = grad;
  cx.fillRect(0, 0, 400, 400);

  cx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  cx.beginPath();
  cx.arc(200, 200, 110, 0, Math.PI * 2);
  cx.fill();

  cx.fillStyle = '#fff';
  cx.font = 'bold 90px Outfit, sans-serif';
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.fillText(`#${index + 1}`, 200, 200);

  return c;
}

async function loadSampleAvatars() {
  state.textures = [];
  thumbnailsContainer.innerHTML = '';

  const loaded = await Promise.all(
    DEFAULT_SAMPLES.map(src => {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(createCroppedSquareCanvas(img));
        img.onerror = () => resolve(null);
        img.src = src;
      });
    })
  );

  let valid = loaded.filter(Boolean);
  if (valid.length === 0) {
    // If local files are not accessible, generate 7 colorful fallback avatars
    for (let i = 0; i < 7; i++) {
      valid.push(createFallbackAvatar(i));
    }
  }

  state.textures = valid;
  updateTextureCountUI();
}

function updateTextureCountUI() {
  const count = state.textures.length;
  statTextures.textContent = `${count} Photo${count === 1 ? '' : 's'}`;
  photoCountBadge.textContent = `${count} Loaded`;

  thumbnailsContainer.innerHTML = '';
  state.textures.slice(0, 30).forEach(c => {
    const thumb = document.createElement('div');
    thumb.className = 'thumb-item';
    const img = document.createElement('img');
    try {
      img.src = c.toDataURL('image/jpeg', 0.6);
    } catch (e) {
      // Fallback if canvas is tainted in certain file:// environments
      if (c instanceof HTMLCanvasElement) {
        thumb.style.background = '#222';
      }
    }
    thumb.appendChild(img);
    thumbnailsContainer.appendChild(thumb);
  });
}

function handleUploadedFiles(files) {
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) return;

  // If this is the first custom upload, clear existing sample textures
  if (state.textures.length === DEFAULT_SAMPLES.length) {
    state.textures = [];
  }

  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const croppedCanvas = createCroppedSquareCanvas(img);
        state.textures.push(croppedCanvas);
        updateTextureCountUI();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Dropzone Events
photoDropzone.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', e => handleUploadedFiles(e.target.files));

photoDropzone.addEventListener('dragover', e => {
  e.preventDefault();
  photoDropzone.classList.add('dragover');
});

photoDropzone.addEventListener('dragleave', () => {
  photoDropzone.classList.remove('dragover');
});

photoDropzone.addEventListener('drop', e => {
  e.preventDefault();
  photoDropzone.classList.remove('dragover');
  if (e.dataTransfer.files) {
    handleUploadedFiles(e.dataTransfer.files);
  }
});

btnUseSamples.addEventListener('click', () => loadSampleAvatars());
btnClearPhotos.addEventListener('click', () => {
  state.textures = [];
  updateTextureCountUI();
});

// Audio Preview & Web Audio
const btnToggleAudioPreview = document.getElementById('btn-toggle-audio-preview');
const iconAudioPlay = document.getElementById('icon-audio-play');
const iconAudioPause = document.getElementById('icon-audio-pause');
const lblAudioPlay = document.getElementById('lbl-audio-play');

let isAudioPreviewing = false;

function initAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    state.audioDestination = state.audioContext.createMediaStreamDestination();
  }
  if (state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }
}

btnChooseAudio.addEventListener('click', () => audioInput.click());

audioInput.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;

  initAudioContext();
  state.audioFile = file;
  lblAudioName.textContent = file.name;
  audioStatusBadge.textContent = 'Loaded';
  audioStatusBadge.className = 'badge live-badge';

  const arrayBuffer = await file.arrayBuffer();
  state.audioBuffer = await state.audioContext.decodeAudioData(arrayBuffer);
  state.audioDuration = state.audioBuffer.duration;

  audioControlsGroup.style.display = 'flex';
  audioStartSlider.max = Math.max(0, Math.floor(state.audioDuration - 5));
  audioStartSlider.value = Math.min(32, audioStartSlider.max);
  valAudioStart.textContent = `${audioStartSlider.value}s`;
  state.audioStartOffset = parseFloat(audioStartSlider.value);

  const mins = Math.floor(state.audioDuration / 60);
  const secs = Math.floor(state.audioDuration % 60).toString().padStart(2, '0');
  audioTotalDuration.textContent = `Total: ${mins}:${secs}`;

  // Auto-start preview playback from the offset!
  startAudioPreview(state.audioStartOffset);
});

function startAudioPreview(offset = 0) {
  if (!state.audioBuffer) return;
  initAudioContext();
  stopAudioPreview();

  const src = state.audioContext.createBufferSource();
  src.buffer = state.audioBuffer;
  src.connect(state.audioContext.destination);
  src.start(0, offset);

  src.onended = () => {
    isAudioPreviewing = false;
    updateAudioPreviewUI();
  };

  state.audioSourceNode = src;
  isAudioPreviewing = true;
  updateAudioPreviewUI();
}

function stopAudioPreview() {
  if (state.audioSourceNode) {
    try { state.audioSourceNode.stop(); } catch (err) {}
    state.audioSourceNode = null;
  }
  isAudioPreviewing = false;
  updateAudioPreviewUI();
}

function updateAudioPreviewUI() {
  if (isAudioPreviewing) {
    iconAudioPlay.style.display = 'none';
    iconAudioPause.style.display = 'inline-block';
    lblAudioPlay.textContent = 'Pause Music';
    btnToggleAudioPreview.classList.add('playing');
  } else {
    iconAudioPlay.style.display = 'inline-block';
    iconAudioPause.style.display = 'none';
    lblAudioPlay.textContent = 'Play Music Preview';
    btnToggleAudioPreview.classList.remove('playing');
  }
}

btnToggleAudioPreview.addEventListener('click', () => {
  if (isAudioPreviewing) {
    stopAudioPreview();
  } else {
    startAudioPreview(state.audioStartOffset);
  }
});

audioStartSlider.addEventListener('input', e => {
  valAudioStart.textContent = `${e.target.value}s`;
  state.audioStartOffset = parseFloat(e.target.value);
  if (isAudioPreviewing) {
    startAudioPreview(state.audioStartOffset);
  }
});

btnRemoveAudio.addEventListener('click', () => {
  stopAudioPreview();
  state.audioBuffer = null;
  state.audioFile = null;
  lblAudioName.textContent = 'Upload Audio Track (MP3, M4A, WAV)';
  audioStatusBadge.textContent = 'No Music';
  audioStatusBadge.className = 'badge';
  audioControlsGroup.style.display = 'none';
  audioInput.value = '';
});

function playAudioSynchronized(offset = 0) {
  if (!state.audioContext || !state.audioBuffer) return null;

  if (state.audioSourceNode) {
    try { state.audioSourceNode.stop(); } catch (err) {}
  }

  const srcNode = state.audioContext.createBufferSource();
  srcNode.buffer = state.audioBuffer;

  // Route to both user speakers and media stream destination for video recording
  srcNode.connect(state.audioContext.destination);
  srcNode.connect(state.audioDestination);

  srcNode.start(0, offset);
  state.audioSourceNode = srcNode;
  return srcNode;
}

function stopAudioSynchronized() {
  if (state.audioSourceNode) {
    try { state.audioSourceNode.stop(); } catch (err) {}
    state.audioSourceNode = null;
  }
}

// ========================
// Controls & UI Listeners
// ========================

btnPlayPause.addEventListener('click', () => {
  state.isPlaying = !state.isPlaying;
  iconPlay.style.display = state.isPlaying ? 'none' : 'block';
  iconPause.style.display = state.isPlaying ? 'block' : 'none';
});

function setMotionMode(mode) {
  state.motionMode = mode;
  animationTime = 0; // Reset animation timer for clean transition

  if (mode === 'forward') {
    lblReverseMode.textContent = 'Zoom In';
  } else if (mode === 'reverse') {
    lblReverseMode.textContent = 'Zoom Out';
  } else {
    lblReverseMode.textContent = 'In & Out';
  }

  const allBtns = [btnModeForward, btnModeReverse, btnModeBounce];
  allBtns.forEach(btn => {
    if (btn) btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

// In HUD: toggle flips immediately between forward (zoom in) and reverse (zoom out)
btnReverseToggle.addEventListener('click', () => {
  if (state.motionMode === 'forward') {
    setMotionMode('reverse');
  } else {
    setMotionMode('forward');
  }
});

if (btnModeForward) btnModeForward.addEventListener('click', () => setMotionMode('forward'));
if (btnModeReverse) btnModeReverse.addEventListener('click', () => setMotionMode('reverse'));
if (btnModeBounce) btnModeBounce.addEventListener('click', () => setMotionMode('bounce'));

zoomSpeedSlider.addEventListener('input', e => {
  state.zoomSpeed = parseFloat(e.target.value);
  valZoomSpeed.textContent = `${state.zoomSpeed.toFixed(3)}x`;
  statSpeed.textContent = `Zoom: ${state.zoomSpeed.toFixed(2)}x`;
});

colorBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    colorBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.bgColor = btn.dataset.color;
  });
});

pillBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    pillBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const dur = btn.dataset.duration;
    if (dur === 'full') {
      if (state.audioDuration > state.audioStartOffset) {
        state.exportDuration = Math.round(state.audioDuration - state.audioStartOffset);
      } else {
        state.exportDuration = 60;
      }
    } else {
      state.exportDuration = parseInt(dur, 10);
    }
  });
});

resBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    resBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const res = btn.dataset.res;
    if (res === '720p') {
      canvas.width = 1280;
      canvas.height = 720;
      canvasContainer.style.aspectRatio = '16 / 9';
    } else if (res === '1080p') {
      canvas.width = 1920;
      canvas.height = 1080;
      canvasContainer.style.aspectRatio = '16 / 9';
    } else if (res === 'square') {
      canvas.width = 1080;
      canvas.height = 1080;
      canvasContainer.style.aspectRatio = '1 / 1';
    }
    state.resolution = { w: canvas.width, h: canvas.height };
  });
});

btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    canvasContainer.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Keyboard controls
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    btnPlayPause.click();
  } else if (e.code === 'ArrowRight') {
    zoomSpeedSlider.value = Math.min(1.05, parseFloat(zoomSpeedSlider.value) + 0.002);
    zoomSpeedSlider.dispatchEvent(new Event('input'));
  } else if (e.code === 'ArrowLeft') {
    zoomSpeedSlider.value = Math.max(1.005, parseFloat(zoomSpeedSlider.value) - 0.002);
    zoomSpeedSlider.dispatchEvent(new Event('input'));
  }
});

// ========================
// Client-Side Video Export
// ========================

const btnJumpExport = document.getElementById('btn-jump-export');
const exportCard = document.getElementById('export-card');

if (btnJumpExport && exportCard) {
  btnJumpExport.addEventListener('click', () => {
    exportCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    exportCard.classList.add('pulse-highlight');
    setTimeout(() => exportCard.classList.remove('pulse-highlight'), 1400);
  });
}

btnExportVideo.addEventListener('click', async () => {
  if (state.isRecording) return;
  startVideoRecording();
});

function getSupportedMimeType() {
  const types = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
}

async function startVideoRecording() {
  initAudioContext();
  if (state.audioContext && state.audioContext.state === 'suspended') {
    await state.audioContext.resume();
  }

  state.isRecording = true;
  state.recordedChunks = [];
  animationTime = 0;
  state.zoom = DEFAULT_ZOOM_START;

  // Video track from canvas at 60 FPS
  const videoStream = canvas.captureStream(60);
  const combinedStream = new MediaStream();

  videoStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

  // Audio track from Web Audio destination node if available
  if (state.audioBuffer) {
    playAudioSynchronized(state.audioStartOffset);
    if (state.audioDestination && state.audioDestination.stream) {
      state.audioDestination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
    }
  }

  const mimeType = getSupportedMimeType();
  const options = mimeType ? { mimeType, videoBitsPerSecond: 8000000 } : {};

  try {
    state.mediaRecorder = new MediaRecorder(combinedStream, options);
  } catch (err) {
    state.mediaRecorder = new MediaRecorder(combinedStream);
  }

  state.mediaRecorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) {
      state.recordedChunks.push(e.data);
    }
  };

  state.mediaRecorder.onstop = () => {
    stopAudioSynchronized();
    state.isRecording = false;
    recordingOverlay.style.display = 'none';

    const isMp4 = (state.mediaRecorder.mimeType || '').includes('mp4');
    const extension = isMp4 ? 'mp4' : 'webm';
    const filename = `moot_spiral_${state.exportDuration}s.${extension}`;

    const recordedBlob = new Blob(state.recordedChunks, {
      type: state.mediaRecorder.mimeType || 'video/mp4'
    });
    const videoUrl = URL.createObjectURL(recordedBlob);

    exportPreviewVideo.src = videoUrl;
    btnDownloadVideo.href = videoUrl;
    btnDownloadVideo.download = filename;
    exportMetaInfo.textContent = `${state.exportDuration}s • ${state.resolution.w}×${state.resolution.h} @ 60 FPS • ${(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB`;

    exportModal.style.display = 'flex';

    // Automatically trigger the download
    const autoLink = document.createElement('a');
    autoLink.href = videoUrl;
    autoLink.download = filename;
    document.body.appendChild(autoLink);
    autoLink.click();
    document.body.removeChild(autoLink);
  };

  // UI state
  recordingOverlay.style.display = 'flex';
  recProgressFill.style.width = '0%';
  recTimeText.textContent = `0 / ${state.exportDuration}s`;
  state.recordingStartTime = performance.now();

  state.mediaRecorder.start(250); // Capture chunks every 250ms

  // Progress ticker
  const recordInterval = setInterval(() => {
    if (!state.isRecording) {
      clearInterval(recordInterval);
      return;
    }
    const elapsed = (performance.now() - state.recordingStartTime) / 1000;
    const pct = Math.min(100, (elapsed / state.exportDuration) * 100);
    recProgressFill.style.width = `${pct}%`;
    recTimeText.textContent = `${Math.floor(elapsed)} / ${state.exportDuration}s (${pct.toFixed(0)}%)`;

    if (elapsed >= state.exportDuration) {
      clearInterval(recordInterval);
      if (state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
      }
    }
  }, 100);
}

// Modal Listeners
btnCloseModal.addEventListener('click', () => {
  exportModal.style.display = 'none';
  exportPreviewVideo.pause();
});
btnModalClose.addEventListener('click', () => {
  exportModal.style.display = 'none';
  exportPreviewVideo.pause();
});

// Initialize on Load
loadSampleAvatars();
