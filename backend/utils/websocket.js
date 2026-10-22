import { WebSocketServer } from 'ws';
import { URLSearchParams } from 'url';

let wss;
// 💡 1. Create a variable to store the current track info
let currentTrackCache = { 
  title: "Waiting for stream...", 
  artist: "Station Idle", 
  type: "Offline" 
};

export const initWebSocket = (server) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    // --- 1. Identify User Role ---
    const urlParts = req.url.split('?');
    const params = new URLSearchParams(urlParts[1] || '');
    const role = params.get('role') || 'client';
    
    ws.userRole = role;
    console.log(`🔌 New Connection: Role = ${role}`);

    // --- 2. Send Initial Data Immediately ---
    // A. Welcome Message
    ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to Radio Stream' }));
    
    // B. Send the Cached Track (The missing piece!)
    if (currentTrackCache) {
      ws.send(JSON.stringify({ type: 'NOW_PLAYING', data: currentTrackCache }));
    }

    // C. Broadcast new Listener Count
    broadcastListenerCount();

    // --- 3. Handle Disconnects ---
    ws.on('close', () => {
      console.log(`❌ Disconnected: Role = ${role}`);
      broadcastListenerCount();
    });
  });

  return wss;
};

// --- Helper: Count & Broadcast Listeners ---
export const broadcastListenerCount = () => {
  if (!wss) return;

  const listenerCount = [...wss.clients].filter(client => 
    client.readyState === 1 && client.userRole === 'client'
  ).length;

  const payload = JSON.stringify({ 
    type: 'LISTENER_COUNT', 
    data: { count: listenerCount } 
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
};

// --- Helper: Broadcast General Data ---
export const broadcastToClients = (type, data) => {
  if (!wss) return;
  
  // 💡 3. Intercept 'NOW_PLAYING' updates to update our cache
  if (type === 'NOW_PLAYING') {
    currentTrackCache = data;
  }

  const payload = JSON.stringify({ type, data });
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
};