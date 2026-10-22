import net from 'net';
import axios from 'axios';

// Configurations
const SERVICES = {
  liquidsoap: { host: '127.0.0.1', port: 1234, type: 'tcp' }, // Telnet
  icecast:    { url: 'http://127.0.0.1:8000/status-json.xsl', type: 'http' }, // HTTP Status
  srs:        { url: 'http://127.0.0.1:1985/api/v1/versions', type: 'http' }  // SRS API
};

/**
 * Checks a TCP port (for Liquidsoap)
 */
function checkTcp(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000); // 2 second timeout

    socket.on('connect', () => {
      socket.destroy();
      resolve(true); // Connection success
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Checks an HTTP endpoint (for Icecast & SRS)
 */
async function checkHttp(url) {
  try {
    await axios.get(url, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main function to get all statuses
 */
export async function getSystemStatus() {
  const [liquidsoap, icecast, srs] = await Promise.all([
    checkTcp(SERVICES.liquidsoap.host, SERVICES.liquidsoap.port),
    checkHttp(SERVICES.icecast.url),
    checkHttp(SERVICES.srs.url)
  ]);

  return {
    liquidsoap,
    icecast,
    srs,
    timestamp: new Date().toISOString()
  };
}