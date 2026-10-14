let context;
let voices = [];
let playRequest = 0;

// Prepare audio during a user gesture for both mobile and desktop browsers.
export async function prepareReminderSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    context ||= new AudioContext();
    if (context.state !== 'running') await context.resume();
    return context.state === 'running';
  } catch {
    return false;
  }
}

export function stopReminderSound() {
  playRequest += 1;
  for (const voice of voices.splice(0)) {
    try { voice.stop(); } catch { /* A completed note is already stopped. */ }
  }
}

// A brief two-note chime avoids downloads and sounds like a notification.
export async function playReminderSound() {
  stopReminderSound();
  const request = playRequest;
  if (!await prepareReminderSound() || request !== playRequest) return false;
  try {
    [880, 1174.66].forEach((frequency, index) => {
      const voice = context.createOscillator();
      const volume = context.createGain();
      const start = context.currentTime + 0.01 + index * 0.18;
      voice.type = 'sine';
      voice.frequency.value = frequency;
      volume.gain.setValueAtTime(0, start);
      volume.gain.linearRampToValueAtTime(0.18, start + 0.015);
      volume.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      voice.connect(volume);
      volume.connect(context.destination);
      voice.onended = () => {
        voice.disconnect();
        volume.disconnect();
        voices = voices.filter(item => item !== voice);
      };
      voices.push(voice);
      voice.start(start);
      voice.stop(start + 0.23);
    });
    return true;
  } catch {
    stopReminderSound();
    return false;
  }
}
