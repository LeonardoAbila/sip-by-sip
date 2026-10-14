import soundUrl from './assets/water-pour.mp3?url';

let context;
let bufferPromise;
let playback;
let playRequest = 0;

// Prepare and cache the water recording during a user gesture.
export async function prepareReminderSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context ||= new AudioContext();
    if (context.state !== 'running') await context.resume();
    bufferPromise ||= fetch(soundUrl)
      .then(response => {
        if (!response.ok) throw new Error('Sound unavailable');
        return response.arrayBuffer();
      })
      .then(data => context.decodeAudioData(data))
      .catch(() => { bufferPromise = undefined; return null; });
    return await bufferPromise;
  } catch {
    return null;
  }
}

export function stopReminderSound() {
  playRequest += 1;
  if (!playback) return;
  const active = playback;
  playback = undefined;
  try { active.source.stop(); } catch { /* Playback may have already ended. */ }
  active.source.disconnect();
  active.volume.disconnect();
}

export async function playReminderSound() {
  stopReminderSound();
  const request = playRequest;
  const buffer = await prepareReminderSound();
  if (!buffer || request !== playRequest || context.state !== 'running') return false;
  try {
    const source = context.createBufferSource();
    const volume = context.createGain();
    source.buffer = buffer;
    volume.gain.value = 0.65;
    source.connect(volume);
    volume.connect(context.destination);
    playback = { source, volume };
    source.onended = () => {
      source.disconnect();
      volume.disconnect();
      if (playback?.source === source) playback = undefined;
    };
    source.start();
    return true;
  } catch {
    stopReminderSound();
    return false;
  }
}
