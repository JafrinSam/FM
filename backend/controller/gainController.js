import { sendCommand } from '../commander/liquidsoapCommander.js'; // Ensure the path is correct

/**
 * Handles error responses from the Telnet client/Liquidsoap server.
 * @param {string} command The command attempted.
 * @param {Error} error The error object.
 * @returns {object} Standardized error response.
 */
function handleCommandError(command, error) {
  console.error(`Telnet command failed: ${command}`, error.message);
  return { 
    message: `Failed to execute Liquidsoap command: ${command}`, 
    error: error.message 
  };
}



// ===================================
// Gain Commands
// ===================================

/**
 * POST /api/telnet/gain/set/:type
 * Params: type (music, mic, master), Body: { level: 0.5 }
 */
export async function setGain(req, res) {
  const { type } = req.params;
  const { level } = req.body;
  
  if (!['music', 'mic', 'master'].includes(type)) {
    return res.status(400).json({ message: "Invalid gain type. Must be music, mic, or master." });
  }
  if (level === undefined || isNaN(parseFloat(level))) {
    return res.status(400).json({ message: "Valid numeric 'level' is required." });
  }
  
  const cmd = `set_${type}_gain ${parseFloat(level).toFixed(2)}`;
  try {
    const response = await sendCommand(cmd);
    res.status(200).json({ command: cmd, result: response });
  } catch (error) {
    res.status(503).json(handleCommandError(cmd, error));
  }
}

/**
 * GET /api/telnet/gain/status
 */
export async function getGainStatus(req, res) {
  const cmd = "show_gains";
  try {
    const response = await sendCommand(cmd);
    
    // Parse the Liquidsoap string: "music=1.0 mic=1.0 master=1.0"
    const parsedGains = response.trim().split(' ').reduce((acc, part) => {
        const [key, value] = part.split('=');
        if (key && value) {
            acc[key] = parseFloat(value);
        }
        return acc;
    }, {});

    res.status(200).json({ command: cmd, gains: parsedGains });
  } catch (error) {
    res.status(503).json(handleCommandError(cmd, error));
  }
}

