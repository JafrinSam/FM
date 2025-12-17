// src/config/liquidsoap.config.js

module.exports = {
  LIQUIDSOAP_HOST: "127.0.0.1", // or Docker service name, e.g. "liquidsoap"
  LIQUIDSOAP_PORT: 1234,        // must match server.telnet.port in radio.liq

  // Default mixer values (0.0 – 1.0)
  DEFAULT_MUSIC_GAIN: 1.0,
  DEFAULT_MIC_GAIN: 1.0,
  DEFAULT_MASTER_GAIN: 1.0
};
