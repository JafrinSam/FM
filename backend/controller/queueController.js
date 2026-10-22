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
// Queue and Control Commands
// ===================================

/**
 * POST /api/telnet/queue/add
 * Body: { filename: "song.mp3" }
 */
export async function queueAdd(req, res) {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ message: "Filename is required to queue a song." });
  }
  const cmd = `play_song ${filename}`;
  try {
    const response = await sendCommand(cmd);
    res.status(200).json({ command: cmd, result: response });
  } catch (error) {
    res.status(503).json(handleCommandError(cmd, error));
  }
}

/**
 * POST /api/telnet/queue/skip
 * Skips the current track in the music queue.
 */
export async function queueSkip(req, res) {
  const cmd = "next_song";
  try {
    const response = await sendCommand(cmd);
    res.status(200).json({ command: cmd, result: response });
  } catch (error) {
    res.status(503).json(handleCommandError(cmd, error));
  }
}

/**
 * GET /api/telnet/queue/status
 * Shows the current contents of the music queue.
 */
export async function queueStatus(req, res) {
  const cmd = "show_queue";
  try {
    const response = await sendCommand(cmd);
    // Liquidsoap returns a complex string/list; parse it if necessary, 
    // but here we return the raw response.
    res.status(200).json({ command: cmd, queue: response.trim().split('\n').filter(line => line.length > 0) });
  } catch (error) {
    res.status(503).json(handleCommandError(cmd, error));
  }
}
