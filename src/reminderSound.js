import soundUrl from './assets/water-pour.mp3?url';

let context;
let bufferPromise;
let source;
let playRequest = 0;

// Resume from a button click so later reminders can use browser audio.
export async function prepareReminderSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context ||= new AudioContext();
    await context.resume();
    bufferPromise ||= fetch(soundUrl)
      .then(response => {
        if (!response.ok) throw new Error('Sound unavailable');
        return response.arrayBuffer();
      })
      .then(data => context.decodeAudioData(data))
      .catch(() => { bufferPromise = undefined; return null; });
    return await bufferPromise;
  } catch {
    // Visual reminders still work if the browser blocks audio.
    return null;
  }
}

export function stopReminderSound() {
  playRequest += 1;
  if (source) {
    source.stop();
    source.disconnect();
    source = undefined;
  }
}

export async function playReminderSound() {
  stopReminderSound();
  const request = playRequest;
  const buffer = await prepareReminderSound();
  if (!buffer || request !== playRequest || context.state !== 'running') return;
  source = context.createBufferSource();
  source.buffer = buffer;
  const volume = context.createGain();
  volume.gain.value = 0.65;
  source.connect(volume);
  volume.connect(context.destination);
  source.onended = () => {
    volume.disconnect();
    if (request === playRequest) {
      source.disconnect();
      source = undefined;
    }
  };
  source.start();
}
