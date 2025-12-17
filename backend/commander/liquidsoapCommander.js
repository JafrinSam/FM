import { Telnet } from "telnet-client";

// Default configuration for the Liquidsoap command server.
// The default Liquidsoap telnet port is often 1234 or 5555.
const defaultTelnetConfig = {
  host: "127.0.0.1",
  port: 1234,
  timeout: 5000,           // 5-second timeout for connection/commands
  shellPrompt: "",         // Liquidsoap typically doesn't have a visible prompt
  initialContext: null,    // Do not send anything on connection
  negotiationMandatory: false, // Prevents hanging on negotiation issues
  // The 'telnet-client' library might automatically handle basic telnet negotiation.
  // Liquidsoap's command server is generally very simple.
};

/**
 * Sends a command to the Liquidsoap Telnet server.
 *
 * @param {string} cmd The Liquidsoap command to execute (e.g., "queue.push /path/to/file.mp3").
 * @param {object} [configOverrides] Optional overrides for the default telnet configuration.
 * @returns {Promise<string>} The response string from the Liquidsoap server.
 * @throws {Error} If the connection fails, times out, or the command returns an error indication.
 */
export async function sendCommand(cmd, configOverrides = {}) {
  const conn = new Telnet();
  const config = { ...defaultTelnetConfig, ...configOverrides };

  try {
    console.log(`Attempting to connect to Liquidsoap at ${config.host}:${config.port}...`);
    
    // 1. Connect to the server
    await conn.connect(config);
    console.log("Connection established. Sending command...");

    // 2. Send the command and wait for the response
    // Liquidsoap commands typically return a result followed by "END\n" or similar.
    // The telnet-client library's .send() is configured to handle this based on
    // your shellPrompt/delimiter settings (which we leave simple for Liquidsoap).
    let response = await conn.send(cmd);

    // 3. Basic Response Validation for Liquidsoap (often ends with "END" or "OK")
    response = response.trim();
    
    if (response.toUpperCase().startsWith("ERROR")) {
      throw new Error(`Liquidsoap command failed: ${response}`);
    } else if (response.toUpperCase() === "END" || response.toUpperCase() === "OK") {
        // Handle cases where the response is just an END marker after an action
        return response;
    } else {
        // Success response
        return response;
    }

  } catch (error) {
    // Re-throw the error with better context for troubleshooting
    if (error.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused. Is Liquidsoap running and its telnet server enabled on ${config.host}:${config.port}?`);
    } else if (error.name === 'Error' && error.message.includes('Timeout')) {
        throw new Error(`Connection or command timed out after ${config.timeout}ms. Check server load or network latency.`);
    } else {
        throw new Error(`Error executing Liquidsoap command "${cmd}": ${error.message}`);
    }
  } finally {
    // 4. Ensure the connection is properly closed, regardless of success or failure
    if (conn) {
      try {
        await conn.end(); // Gracefully close the connection
        console.log("Connection closed.");
      } catch (endError) {
        console.warn(`Warning: Error closing telnet connection: ${endError.message}`);
        // At this point, the main operation failed or succeeded, so we don't re-throw.
      }
    }
  }
}
