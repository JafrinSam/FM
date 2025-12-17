// src/modules/mixer/mixer.service.js
const { sendToLiquidsoap } = require("../lib/liquidsoapClient");
const {
  DEFAULT_MUSIC_GAIN,
  DEFAULT_MIC_GAIN,
  DEFAULT_MASTER_GAIN
} = require("../config/liquidsoap.config");

// In-memory mixer state (you can move to Redis/DB later)
let mixerState = {
  music: DEFAULT_MUSIC_GAIN,
  mic: DEFAULT_MIC_GAIN,
  master: DEFAULT_MASTER_GAIN
};

// ----- Setters that talk to Liquidsoap -----

async function setMusicGain(value) {
  mixerState.music = value;
  await sendToLiquidsoap(`set_music_gain ${value}`);
  return mixerState;
}

async function setMicGain(value) {
  mixerState.mic = value;
  await sendToLiquidsoap(`set_mic_gain ${value}`);
  return mixerState;
}

async function setMasterGain(value) {
  mixerState.master = value;
  await sendToLiquidsoap(`set_master_gain ${value}`);
  return mixerState;
}

// ----- Fade logic (music) -----

async function fadeMusic(target, durationMs = 3000, steps = 10) {
  const start = mixerState.music;
  const delta = (target - start) / steps;
  const stepTime = durationMs / steps;

  for (let i = 1; i <= steps; i++) {
    const newVal = start + delta * i;
    mixerState.music = newVal;
    await sendToLiquidsoap(`set_music_gain ${newVal.toFixed(2)}`);
    await new Promise((res) => setTimeout(res, stepTime));
  }
  return mixerState;
}

// ----- Public service API -----

function getMixerState() {
  return mixerState;
}

async function setLevels({ music, mic, master }) {
  if (typeof music === "number") {
    await setMusicGain(music);
  }
  if (typeof mic === "number") {
    await setMicGain(mic);
  }
  if (typeof master === "number") {
    await setMasterGain(master);
  }
  return mixerState;
}

async function muteMic() {
  return setMicGain(0.0);
}

async function unmuteMic() {
  return setMicGain(1.0);
}

module.exports = {
  getMixerState,
  setLevels,
  setMusicGain,
  setMicGain,
  setMasterGain,
  fadeMusic,
  muteMic,
  unmuteMic
};
