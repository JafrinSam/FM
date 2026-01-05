import path from 'path'; 
import { MusicAsset } from '../../models/MusicAsset.js';
import { publishToQueue } from '../../config/rabbitmq.js'; // 🟢 Import Module

export const metaData = async (req, res) => {
     try {
        const rawBody = req.body;
        
        // Convert Liquidsoap's Array-of-Arrays to Object
        const meta = Array.isArray(rawBody) ? Object.fromEntries(rawBody) : rawBody;
        
        let trackData = {
          title: meta.title || "Unknown Title",
          artist: meta.artist || "Unknown Artist",
          is_live: meta.is_live === "true",
          filename: meta.filename || "", 
          type: "Music", 
          timestamp: new Date()
        };

        console.log(`📡 Incoming: ${trackData.filename}`);

        // 🔍 INTELLIGENT LOOKUP
        if (!trackData.is_live && trackData.filename) {
          try {
            const cleanFilename = path.basename(trackData.filename);
            const asset = await MusicAsset.findOne({ filename: cleanFilename });

            if (asset) {
              console.log(`✅ DB Match: "${asset.title}"`);
              trackData.title = asset.title || trackData.title;
              trackData.artist = asset.artist || trackData.artist;
              trackData.type = asset.type || trackData.type;
            }
          } catch (dbError) {
            console.error("❌ DB Lookup Failed:", dbError);
          }
        }

        // 🟢 1. SEND TO RABBITMQ
        // We do NOT update cache or websocket here anymore.
        // We let the Server Consumer handle that to ensure data flow via Queue.
        await publishToQueue(trackData);

        // Reply fast to Liquidsoap
        res.status(200).send("OK");
        
      } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Error processing metadata");
      }
}