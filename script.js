// ===== Song data =====
// Replace `src` with your own audio file paths / URLs when ready.
// `color` drives the placeholder record-label art (swap for a real cover image if you like —
// just add a `cover: 'path/to/image.jpg'` field and use it in renderPlaylist()/loadTrack()).
const songs = [
  {
    title: "Late Night Drive",
    artist: "SoundHelix Collective",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "linear-gradient(135deg,#ff6b4a,#ff9166)"
  },
  {
    title: "Coastal Haze",
    artist: "SoundHelix Collective",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "linear-gradient(135deg,#55d6c2,#2fa89a)"
  },
  {
    title: "Neon Backstreets",
    artist: "SoundHelix Collective",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "linear-gradient(135deg,#8f7bff,#5f4bd6)"
  },
  {
    title: "Slow Static",
    artist: "SoundHelix Collective",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    color: "linear-gradient(135deg,#ffcf5c,#ff9166)"
  }
];

// ===== State =====
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0; // 0 = off, 1 = repeat all, 2 = repeat one
let isSeeking = false;

// ===== DOM refs =====
const audio = document.getElementById('audio');
const player = document.getElementById('player');
const record = document.getElementById('record');
const recordLabel = document.getElementById('recordLabel');
const labelInitial = document.getElementById('labelInitial');

const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');

const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');

const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const progressKnob = document.getElementById('progressKnob');
const currentTimeEl = document.getElementById('currentTime');
const durationTimeEl = document.getElementById('durationTime');

const volumeSlider = document.getElementById('volumeSlider');
const volValue = document.getElementById('volValue');
const volIcon = document.getElementById('volIcon');
const volWave1 = document.getElementById('volWave1');
const volWave2 = document.getElementById('volWave2');

const playlistEl = document.getElementById('playlist');
const trackCount = document.getElementById('trackCount');

// ===== Helpers =====
function formatTime(sec){
  if (!isFinite(sec) || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ===== Build playlist UI =====
function renderPlaylist(){
  playlistEl.innerHTML = "";
  trackCount.textContent = `${songs.length} track${songs.length !== 1 ? 's' : ''}`;

  songs.forEach((song, i) => {
    const li = document.createElement('li');
    li.className = 'playlist-item' + (i === currentIndex ? ' active' : '');
    li.dataset.index = i;

    li.innerHTML = `
      <span class="pl-index">${i === currentIndex ? '' : i + 1}</span>
      ${i === currentIndex ? `<span class="pl-eq"><span></span><span></span><span></span></span>` : ''}
      <div class="pl-thumb" style="background:${song.color}">${song.title.charAt(0)}</div>
      <div class="pl-meta">
        <div class="pl-title">${song.title}</div>
        <div class="pl-artist">${song.artist}</div>
      </div>
      <span class="pl-duration" data-duration-for="${i}">--:--</span>
    `;

    li.addEventListener('click', () => {
      currentIndex = i;
      loadTrack(currentIndex);
      playTrack();
    });

    playlistEl.appendChild(li);
  });
}

// Preload durations for playlist display (best-effort; some hosts may not expose this without full load)
function primeDurations(){
  songs.forEach((song, i) => {
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = song.src;
    probe.addEventListener('loadedmetadata', () => {
      const el = playlistEl.querySelector(`[data-duration-for="${i}"]`);
      if (el) el.textContent = formatTime(probe.duration);
    });
  });
}

// ===== Load / play / pause =====
function loadTrack(index){
  const song = songs[index];
  audio.src = song.src;
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  labelInitial.textContent = song.title.charAt(0);
  recordLabel.style.background = song.color;
  progressFill.style.width = '0%';
  progressKnob.style.left = '0%';
  currentTimeEl.textContent = '0:00';
  renderPlaylist();
}

function playTrack(){
  audio.play().catch(() => {});
  isPlaying = true;
  updatePlayUI();
}

function pauseTrack(){
  audio.pause();
  isPlaying = false;
  updatePlayUI();
}

function updatePlayUI(){
  player.classList.toggle('is-playing', isPlaying);
  playIcon.style.display = isPlaying ? 'none' : '';
  pauseIcon.style.display = isPlaying ? '' : 'none';
  playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
}

function togglePlay(){
  if (isPlaying) pauseTrack(); else playTrack();
}

function nextTrack(userInitiated = true){
  if (isShuffle && songs.length > 1) {
    let next;
    do { next = Math.floor(Math.random() * songs.length); } while (next === currentIndex);
    currentIndex = next;
  } else {
    currentIndex = (currentIndex + 1) % songs.length;
  }
  loadTrack(currentIndex);
  if (isPlaying || userInitiated) playTrack();
}

function prevTrack(){
  // If more than 3s into the song, restart it instead of going back a track
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  loadTrack(currentIndex);
  playTrack();
}

// ===== Progress bar =====
function updateProgress(){
  if (isSeeking) return;
  const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progressFill.style.width = pct + '%';
  progressKnob.style.left = pct + '%';
  currentTimeEl.textContent = formatTime(audio.currentTime);
}

function seekFromEvent(e){
  const rect = progressTrack.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  let pct = (clientX - rect.left) / rect.width;
  pct = Math.min(1, Math.max(0, pct));
  progressFill.style.width = (pct * 100) + '%';
  progressKnob.style.left = (pct * 100) + '%';
  if (audio.duration) {
    audio.currentTime = pct * audio.duration;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
}

progressTrack.addEventListener('mousedown', (e) => {
  isSeeking = true;
  seekFromEvent(e);
});
window.addEventListener('mousemove', (e) => {
  if (isSeeking) seekFromEvent(e);
});
window.addEventListener('mouseup', () => { isSeeking = false; });

progressTrack.addEventListener('touchstart', (e) => {
  isSeeking = true;
  seekFromEvent(e);
});
window.addEventListener('touchmove', (e) => {
  if (isSeeking) seekFromEvent(e);
});
window.addEventListener('touchend', () => { isSeeking = false; });

// ===== Volume =====
function updateVolumeIcon(vol){
  volWave1.style.opacity = vol > 0 ? 1 : 0.2;
  volWave2.style.opacity = vol > 50 ? 1 : 0.2;
}

volumeSlider.addEventListener('input', () => {
  const vol = Number(volumeSlider.value);
  audio.volume = vol / 100;
  volValue.textContent = vol + '%';
  updateVolumeIcon(vol);
});

// ===== Shuffle / repeat =====
shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', () => {
  repeatMode = (repeatMode + 1) % 3;
  repeatBtn.classList.toggle('active', repeatMode !== 0);
  repeatBtn.classList.toggle('repeat-one-active', repeatMode === 2);
  repeatBtn.title = repeatMode === 0 ? 'Repeat off' : repeatMode === 1 ? 'Repeat all' : 'Repeat one';
});

// ===== Events =====
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', () => nextTrack(true));
prevBtn.addEventListener('click', prevTrack);

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', () => {
  durationTimeEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  if (repeatMode === 2) {
    audio.currentTime = 0;
    playTrack();
    return;
  }
  if (!isShuffle && repeatMode === 0 && currentIndex === songs.length - 1) {
    // reached end of playlist, no repeat, no shuffle -> stop
    isPlaying = false;
    updatePlayUI();
    audio.currentTime = 0;
    return;
  }
  nextTrack(true);
});

// Keyboard: space to toggle play when not typing in an input
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    togglePlay();
  }
});

// ===== Init =====
audio.volume = volumeSlider.value / 100;
updateVolumeIcon(volumeSlider.value);
loadTrack(currentIndex);
primeDurations();
