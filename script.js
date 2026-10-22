/* ============================================================
   ABIYANGU / BUSE RADIO — FRONTEND SCRIPT
   Configure RADIO_CONFIG.streamUrl with the authorised audio stream.
   Add a YouTube URL to each podcast card's data-youtube attribute.
   ============================================================ */
const RADIO_CONFIG = {
  streamUrl: '',
  stationName: 'BUSE Radio Live'
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const radioAudio = $('#radioAudio');
const radioPlay = $('#radioPlay');
const radioPlayIcon = $('#radioPlayIcon');
const liveStatus = $('#liveStatus');
const connectionStatus = $('#connectionStatus');
const playerMessage = $('#playerMessage');
const waveform = $('#waveform');
const volumeSlider = $('#volumeSlider');
const streamDialog = $('#streamDialog');
const streamUrlInput = $('#streamUrl');
const toast = $('#toast');
let toastTimeout;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 3400);
}

function getSavedStreamUrl() {
  try { return localStorage.getItem('buseRadioStreamUrl') || RADIO_CONFIG.streamUrl; }
  catch { return RADIO_CONFIG.streamUrl; }
}

function setRadioState(isPlaying) {
  if (radioPlayIcon) radioPlayIcon.textContent = isPlaying ? 'Ⅱ' : '▶';
  if (radioPlay) radioPlay.setAttribute('aria-label', isPlaying ? 'Pause live radio' : 'Play live radio');
  if (waveform) waveform.classList.toggle('is-playing', isPlaying);
  if (isPlaying) {
    if (liveStatus) liveStatus.textContent = 'PLAYER CONNECTED';
    if (connectionStatus) connectionStatus.textContent = 'Audio playing';
    if (playerMessage) playerMessage.textContent = 'Now playing live';
  } else if (radioAudio?.error) {
    if (liveStatus) liveStatus.textContent = 'STREAM UNAVAILABLE';
    if (connectionStatus) connectionStatus.textContent = 'Check stream URL';
    if (playerMessage) playerMessage.textContent = 'Unable to connect';
  } else {
    if (liveStatus) liveStatus.textContent = 'LIVE STREAM PLAYER';
    if (connectionStatus) connectionStatus.textContent = 'Ready to connect';
    if (playerMessage) playerMessage.textContent = 'Press play to listen';
  }
}

// One decorative waveform generator; no duplicate animation code.
if (waveform && !waveform.childElementCount) {
  const bars = document.createDocumentFragment();
  for (let i = 0; i < 76; i += 1) {
    const bar = document.createElement('span');
    const height = 5 + Math.abs(Math.sin(i * 1.73) * Math.cos(i * 0.39)) * 31;
    bar.style.setProperty('--bar-height', `${height}px`);
    bar.style.setProperty('--delay', `${(i % 13) * 0.045}s`);
    bars.appendChild(bar);
  }
  waveform.appendChild(bars);
}

async function startRadio() {
  if (!radioAudio) return;
  const url = getSavedStreamUrl().trim();
  if (!url) {
    if (streamDialog?.showModal) streamDialog.showModal();
    showToast('Add the station’s authorised stream URL to start listening.');
    return;
  }
  if (radioAudio.src !== url) {
    radioAudio.src = url;
    radioAudio.load();
  }
  if (volumeSlider) radioAudio.volume = Number(volumeSlider.value);
  if (connectionStatus) connectionStatus.textContent = 'Connecting…';
  if (playerMessage) playerMessage.textContent = 'Connecting to stream…';
  try { await radioAudio.play(); }
  catch {
    setRadioState(false);
    if (connectionStatus) connectionStatus.textContent = 'Could not start playback';
    if (playerMessage) playerMessage.textContent = 'Check URL or stream access';
    showToast('Playback failed. Check the stream URL, network and browser compatibility.');
  }
}

if (radioPlay && radioAudio) {
  radioPlay.addEventListener('click', async () => {
    if (!radioAudio.paused) { radioAudio.pause(); return; }
    closeVideo();
    await startRadio();
  });
  radioAudio.addEventListener('playing', () => setRadioState(true));
  radioAudio.addEventListener('pause', () => setRadioState(false));
  radioAudio.addEventListener('waiting', () => {
    if (connectionStatus) connectionStatus.textContent = 'Buffering…';
    if (playerMessage) playerMessage.textContent = 'Buffering audio…';
  });
  radioAudio.addEventListener('error', () => {
    setRadioState(false);
    if (connectionStatus) connectionStatus.textContent = 'Stream unavailable';
    if (playerMessage) playerMessage.textContent = 'Check URL or try later';
  });
}
if (volumeSlider && radioAudio) volumeSlider.addEventListener('input', () => { radioAudio.volume = Number(volumeSlider.value); });

$('#streamInfo')?.addEventListener('click', () => {
  if (streamUrlInput) streamUrlInput.value = getSavedStreamUrl();
  if (streamDialog?.showModal) streamDialog.showModal();
  else showToast('Your browser does not support the stream settings dialog.');
});
function clearSavedStream() {
  try { localStorage.removeItem('buseRadioStreamUrl'); } catch { /* Storage may be disabled. */ }
  if (radioAudio) { radioAudio.pause(); radioAudio.removeAttribute('src'); radioAudio.load(); }
  setRadioState(false);
}
$('#saveStream')?.addEventListener('click', () => {
  const url = streamUrlInput?.value.trim() || '';
  if (url) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid protocol');
    } catch {
      showToast('Enter a valid http:// or https:// stream URL.');
      return;
    }
  }
  try {
    if (url) localStorage.setItem('buseRadioStreamUrl', url);
    else localStorage.removeItem('buseRadioStreamUrl');
  } catch {
    showToast('Could not save settings in this browser.');
    return;
  }
  if (radioAudio) { radioAudio.pause(); radioAudio.removeAttribute('src'); radioAudio.load(); }
  streamDialog?.close();
  setRadioState(false);
  showToast(url ? 'Stream URL saved in this browser.' : 'Stream URL cleared.');
});
$('#clearStream')?.addEventListener('click', () => {
  if (streamUrlInput) streamUrlInput.value = '';
  clearSavedStream();
  showToast('Stream URL cleared.');
});

// Responsive navigation.
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav?.classList.toggle('open') ?? false;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});
$$('#mainNav a').forEach(link => link.addEventListener('click', () => {
  mainNav?.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open navigation');
}));

// Podcast search and category filters.
const filterButtons = $$('.filter-tab');
const podcastCards = $$('.podcast-card');
const podcastSearch = $('#podcastSearch');
const emptyState = $('#emptyState');
let activeFilter = 'all';
function updatePodcastList() {
  const query = (podcastSearch?.value || '').trim().toLowerCase();
  let visibleCount = 0;
  podcastCards.forEach(card => {
    const matchesCategory = activeFilter === 'all' || card.dataset.category === activeFilter;
    const matchesSearch = (card.dataset.title || '').toLowerCase().includes(query) || card.textContent.toLowerCase().includes(query);
    card.hidden = !(matchesCategory && matchesSearch);
    if (!card.hidden) visibleCount += 1;
  });
  if (emptyState) emptyState.hidden = visibleCount !== 0;
}
filterButtons.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter || 'all';
  filterButtons.forEach(item => item.classList.toggle('active', item === button));
  updatePodcastList();
}));
podcastSearch?.addEventListener('input', updatePodcastList);

// Convert common YouTube URL formats to a video ID safely.
function getYouTubeId(input) {
  if (!input) return null;
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
    else if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
      id = url.searchParams.get('v') || '';
      if (!id) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) id = parts[1] || '';
      }
    }
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

const videoModal = $('#videoModal');
const videoFrame = $('#videoFrame');
const videoModalTitle = $('#videoModalTitle');
function openVideo(card) {
  if (!videoModal || !videoFrame) return;
  const id = getYouTubeId(card.dataset.youtube);
  if (!id) { showToast(`Add a valid YouTube link for “${card.dataset.title || 'this episode'}” in index.html.`); return; }
  if (radioAudio) radioAudio.pause();
  if (videoModalTitle) videoModalTitle.textContent = card.dataset.title || 'BUSE Radio video';
  videoFrame.replaceChildren();
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
  iframe.title = card.dataset.title || 'YouTube video';
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';
  videoFrame.appendChild(iframe);
  videoModal.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeVideo() {
  if (!videoModal || videoModal.hidden) return;
  videoModal.hidden = true;
  if (videoFrame) videoFrame.replaceChildren();
  document.body.style.overflow = '';
}

// Add each card's own YouTube thumbnail exactly once, then wire its play buttons.
podcastCards.forEach(card => {
  const cover = $('.podcast-cover', card);
  const videoId = getYouTubeId(card.dataset.youtube);
  if (cover && videoId && !$('.youtube-preview', cover)) {
    const image = document.createElement('img');
    image.className = 'youtube-preview';
    image.alt = `Preview thumbnail for ${card.dataset.title || 'YouTube video'}`;
    image.loading = 'lazy';
    image.referrerPolicy = 'strict-origin-when-cross-origin';
    const candidates = [
      `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      `https://i.ytimg.com/vi/${videoId}/default.jpg`
    ];
    let candidateIndex = 0;
    image.addEventListener('error', () => {
      candidateIndex += 1;
      if (candidateIndex < candidates.length) image.src = candidates[candidateIndex];
      else { image.remove(); cover.classList.remove('has-thumb'); }
    });
    image.addEventListener('load', () => {
      // YouTube's max-resolution fallback can be a tiny placeholder; move to hqdefault.
      if (candidateIndex === 0 && image.naturalWidth <= 120) {
        candidateIndex = 1;
        image.src = candidates[candidateIndex];
        return;
      }
      cover.classList.add('has-thumb');
    });
    image.src = candidates[0];
    cover.prepend(image);
  }
  $$('[data-action="play"]', card).forEach(button => button.addEventListener('click', () => openVideo(card)));
});
videoModal?.addEventListener('click', event => { if (event.target.closest('[data-close]')) closeVideo(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeVideo(); });

// Voice carousel and biography dialog, consolidated here rather than a separate voice.js.
const voicesTrack = $('#voicesTrack');
$$('.voices-prev').forEach(button => button.addEventListener('click', () => {
  voicesTrack?.scrollBy({ left: -Math.max(220, voicesTrack.clientWidth * 0.75), behavior: 'smooth' });
}));
$$('.voices-next').forEach(button => button.addEventListener('click', () => {
  voicesTrack?.scrollBy({ left: Math.max(220, voicesTrack.clientWidth * 0.75), behavior: 'smooth' });
}));
const voiceDialog = $('#voiceDialog');
$$('.voice-card').forEach(card => $('.voice-bio-btn', card)?.addEventListener('click', () => {
  const name = card.dataset.name || '';
  const show = card.dataset.show || '';
  const bio = card.dataset.bio || '';
  const photo = $('.voice-dialog-photo');
  if ($('#voiceDialogName')) $('#voiceDialogName').textContent = name;
  if ($('#voiceDialogShow')) $('#voiceDialogShow').textContent = show;
  if ($('#voiceDialogBio')) $('#voiceDialogBio').textContent = bio;
  if (photo) photo.textContent = name.charAt(0).toUpperCase();
  if (voiceDialog?.showModal) voiceDialog.showModal();
}));
voiceDialog?.addEventListener('click', event => { if (event.target.closest('[data-close]')) voiceDialog.close(); });

const year = $('#year');
if (year) year.textContent = new Date().getFullYear();

// Optional hero typing effect; gracefully skips pages without the target elements.
function startTyping(elementId, messages, options = {}) {
  const element = document.getElementById(elementId);
  if (!element || !messages.length || element.dataset.typingStarted === 'true') return;
  element.dataset.typingStarted = 'true';
  const typeSpeed = options.typeSpeed ?? 90;
  const deleteSpeed = options.deleteSpeed ?? 50;
  const pause = options.pause ?? 1800;
  let messageIndex = 0, characterIndex = 0, deleting = false;
  function tick() {
    if (!element.isConnected) return;
    const message = messages[messageIndex];
    if (!deleting) {
      characterIndex += 1;
      element.textContent = message.substring(0, characterIndex);
      if (characterIndex >= message.length) { deleting = true; window.setTimeout(tick, pause); return; }
    } else {
      characterIndex -= 1;
      element.textContent = message.substring(0, characterIndex);
      if (characterIndex <= 0) { deleting = false; messageIndex = (messageIndex + 1) % messages.length; }
    }
    window.setTimeout(tick, deleting ? deleteSpeed : typeSpeed);
  }
  tick();
}
startTyping('typingText', ['More than music.', 'It’s a conversation.', 'Campus, culture & conversation.']);
startTyping('typngText', ['◉◉']);
