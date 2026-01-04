import { sendCommand } from '../commander/liquidsoapCommander.js';

// Configuration matches your docker-compose & radio.liq
const TELNET_CONFIG = { host: "127.0.0.1", port: 1234 };

export const mixerController = {
  
  /**
   * Adjust Volume Gain
   * Route: POST /api/mixer/volume
   * Body: { "target": "music", "level": 0.8 }
   * * Targets: 'music', 'main', 'guest1', 'guest2', etc.
   */
  async setVolume(req, res) {
    const { target, level } = req.body;

    // 1. Validate Input
    if (!target || level === undefined) {
      return res.status(400).json({ error: "Missing 'target' or 'level' in request body." });
    }

    // Ensure level is a number between 0.0 and 1.5 (safety limits)
    let safeLevel = parseFloat(level);
    if (isNaN(safeLevel)) safeLevel = 1.0;
    if (safeLevel < 0) safeLevel = 0.0;
    if (safeLevel > 2.0) safeLevel = 2.0; // Cap max volume to avoid distortion

    // 2. Format Command
    // radio.liq defines: server.register("#{key}.vol", ...)
    // Example: "music.vol 0.8" or "guest1.vol 1.2"
    const command = `${target}.vol ${safeLevel.toFixed(2)}`;

    try {
      // 3. Send to Liquidsoap
      const response = await sendCommand(command, TELNET_CONFIG);
      console.log(`🎚️ Mixer Volume: ${command} -> Response: ${response}`);
      
      res.json({ 
        success: true, 
        target, 
        level: safeLevel, 
        message: response 
      });

    } catch (error) {
      console.error("❌ Mixer Error (Volume):", error.message);
      res.status(500).json({ error: "Failed to set volume", details: error.message });
    }
  },

  /**
   * Toggle Mute State
   * Route: POST /api/mixer/mute
   * Body: { "target": "main", "state": false }
   * * State: true (Muted), false (Live/Unmuted)
   */
  async setMute(req, res) {
    const { target, state } = req.body;

    // 1. Validate Input
    if (!target || state === undefined) {
      return res.status(400).json({ error: "Missing 'target' or 'state' in request body." });
    }

    // Ensure state is a boolean string for Liquidsoap
    const boolString = state ? "true" : "false";

    // 2. Format Command
    // radio.liq defines: server.register("#{key}.mute", ...)
    // Example: "main.mute true" or "guest2.mute false"
    const command = `${target}.mute ${boolString}`;

    try {
      // 3. Send to Liquidsoap
      const response = await sendCommand(command, TELNET_CONFIG);
      console.log(`🔇 Mixer Mute: ${command} -> Response: ${response}`);

      res.json({ 
        success: true, 
        target, 
        isMuted: state, 
        message: response 
      });

    } catch (error) {
      console.error("❌ Mixer Error (Mute):", error.message);
      res.status(500).json({ error: "Failed to set mute", details: error.message });
    }
  }
};